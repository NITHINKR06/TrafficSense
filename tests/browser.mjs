import assert from "node:assert/strict";
import { readFile, mkdir, writeFile } from "node:fs/promises";

const base = process.env.APP_URL || "http://127.0.0.1:3000";
const debuggerUrl = process.env.CHROMIUM_DEBUG_URL || "http://127.0.0.1:9333";
const setupOnly = process.env.BROWSER_SCENARIO === "setup";
const accounts = setupOnly ? [] : JSON.parse(await readFile("supabase/.temp/demo-accounts.json", "utf8"));
const endpoint = await (await fetch(`${debuggerUrl}/json/version`)).json();
const socket = new WebSocket(endpoint.webSocketDebuggerUrl);
await new Promise((resolve, reject) => { socket.onopen = resolve; socket.onerror = reject; });
let sequence = 0;
const pending = new Map();
const exceptions = [];
socket.onmessage = ({ data }) => {
  const message = JSON.parse(data);
  if (message.method === "Runtime.exceptionThrown") exceptions.push(message.params.exceptionDetails.text);
  const item = pending.get(message.id);
  if (!item) return;
  pending.delete(message.id);
  clearTimeout(item.timer);
  if (message.error) item.reject(new Error(JSON.stringify(message.error)));
  else item.resolve(message.result);
};
function send(method, params = {}, sessionId) {
  return new Promise((resolve, reject) => {
    const id = ++sequence;
    const timer = setTimeout(() => { pending.delete(id); reject(new Error(`${method} timed out`)); }, 30000);
    pending.set(id, { resolve, reject, timer });
    socket.send(JSON.stringify({ id, method, params, sessionId }));
  });
}
let context;
try {
  ({ browserContextId: context } = await send("Target.createBrowserContext"));
  const { targetId } = await send("Target.createTarget", { url: "about:blank", browserContextId: context });
  const { sessionId } = await send("Target.attachToTarget", { targetId, flatten: true });
  const call = (method, params) => send(method, params, sessionId);
  const evaluate = async (expression) => {
    const value = await call("Runtime.evaluate", { expression, returnByValue: true, awaitPromise: true });
    if (value.exceptionDetails) throw new Error(value.exceptionDetails.text);
    return value.result.value;
  };
  async function waitFor(expression, description = expression) {
    const end = Date.now() + 30000;
    while (Date.now() < end) {
      try { if (await evaluate(expression)) return; } catch { /* A navigation may replace the execution context. */ }
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
    await mkdir("supabase/.temp/browser", { recursive: true });
    const shot = await call("Page.captureScreenshot", { format: "png", captureBeyondViewport: true });
    await writeFile("supabase/.temp/browser/failure.png", Buffer.from(shot.data, "base64"));
    throw new Error(`Timed out: ${description}; route: ${await evaluate("location.pathname")}`);
  }
  const text = (value) => waitFor(`document.body?.innerText.includes(${JSON.stringify(value)})`, `page text: ${value}`);
  const route = (value) => waitFor(`location.pathname === ${JSON.stringify(value)}`, `route: ${value}`);
  const go = async (path) => { await call("Page.navigate", { url: `${base}${path}` }); };
  async function click(selector) {
    await waitFor(`!!document.querySelector(${JSON.stringify(selector)})`, `element: ${selector}`);
    const rect = await evaluate(`(() => { const el = document.querySelector(${JSON.stringify(selector)}); el.scrollIntoView({block:'center'}); const r = el.getBoundingClientRect(); return {x:r.x+r.width/2,y:r.y+r.height/2}; })()`);
    await call("Input.dispatchMouseEvent", { type: "mousePressed", ...rect, button: "left", clickCount: 1 });
    await call("Input.dispatchMouseEvent", { type: "mouseReleased", ...rect, button: "left", clickCount: 1 });
  }
  async function fill(selector, value) {
    await click(selector);
    await call("Input.dispatchKeyEvent", { type: "keyDown", key: "a", code: "KeyA", modifiers: 2, windowsVirtualKeyCode: 65 });
    await call("Input.dispatchKeyEvent", { type: "keyUp", key: "a", code: "KeyA", modifiers: 2, windowsVirtualKeyCode: 65 });
    await call("Input.insertText", { text: value });
  }
  async function login(label) {
    const account = accounts.find((item) => item.label === label);
    await go("/login"); await text("Welcome back");
    await fill("#email", account.email); await fill("#password", account.password);
    await click('button[type="submit"]');
    await route("/workspace"); await text(account.email);
    return account;
  }
  async function logout() {
    await go("/workspace"); await text("Account workspace");
    await click('button[type="submit"]');
    await route("/login"); await text("Welcome back");
  }
  async function layout() {
    assert.equal(await evaluate("document.documentElement.scrollWidth <= innerWidth"), true, "horizontal overflow");
  }
  const sessionCookies = async () => (await call("Network.getCookies", { urls: [base] })).cookies
    .filter((cookie) => /^trafficsense-auth(?:\.\d+)?$/.test(cookie.name))
    .sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true }));
  async function rewriteSession(change) {
    const cookies = await sessionCookies();
    const value = cookies.map((cookie) => cookie.value).join("");
    assert.ok(value.startsWith("base64-"));
    const session = JSON.parse(Buffer.from(value.slice(7), "base64url").toString());
    change(session);
    for (const cookie of cookies) await call("Network.deleteCookies", { name: cookie.name, url: base });
    const encoded = `base64-${Buffer.from(JSON.stringify(session)).toString("base64url")}`;
    for (let offset = 0; offset < encoded.length; offset += 3000) {
      const result = await call("Network.setCookie", { name: `trafficsense-auth.${offset / 3000}`, value: encoded.slice(offset, offset + 3000), url: base, path: "/", httpOnly: true, sameSite: "Lax" });
      assert.equal(result.success, true);
    }
  }
  await call("Page.enable"); await call("Runtime.enable"); await call("Network.enable");
  for (const [width, height, mobile] of [[1440, 1000, false], [390, 844, true]]) {
    await call("Emulation.setDeviceMetricsOverride", { width, height, mobile, deviceScaleFactor: 1 });
    await go("/"); await text("Understand the disruption"); await layout();
    await call("Input.dispatchKeyEvent", { type: "keyDown", key: "Tab", code: "Tab", windowsVirtualKeyCode: 9 });
    await call("Input.dispatchKeyEvent", { type: "keyUp", key: "Tab", code: "Tab", windowsVirtualKeyCode: 9 });
    assert.equal(await evaluate("document.activeElement.textContent"), "Skip to content");
    await click('main a[href="/login"]');
    if (setupOnly) {
      await text("Authentication is not configured"); await layout();
      assert.equal(await evaluate("document.querySelector('form') === null"), true);
      await click('main a[href="/"]'); await text("Understand the disruption");
      await click('main a[href="/register"]'); await text("Authentication is not configured"); await layout();
      console.log(`PASS ${base} ${width}px: home navigation and explicit unconfigured login/register states`);
      continue;
    }
    await text("Welcome back"); await layout();
    await mkdir("supabase/.temp/browser", { recursive: true });
    const loginShot = await call("Page.captureScreenshot", { format: "png", captureBeyondViewport: true });
    await writeFile(`supabase/.temp/browser/${new URL(base).port}-${width}-login.png`, Buffer.from(loginShot.data, "base64"));
    await fill("#email", "invalid"); await fill("#password", "incorrect-password");
    await click('button[type="submit"]');
    assert.equal(await evaluate("document.querySelector('#email').validity.valid"), false);
    await fill("#email", accounts[0].email);
    await click('button[type="submit"]'); await text("Email or password is incorrect.");
    for (const path of ["/workspace", "/employer", "/authority", "/admin", `/employer/${accounts.find((item) => item.orgId).orgId}`]) {
      await go(path); await route("/login"); await text("Welcome back");
    }
    await click('main a[href="/register"]'); await text("Create your account");
    await fill("#email", `browser-${crypto.randomUUID()}@example.test`);
    await fill("#password", crypto.randomUUID());
    await click('button[type="submit"]'); await route("/workspace"); await text("commuter"); await layout();
    await go("/admin"); await route("/access-denied"); await text("This page is not available"); await layout();
    await logout();

    const commuter = await login("commuter");
    const cookies = (await call("Network.getCookies", { urls: [base] })).cookies.filter((cookie) => cookie.name.startsWith("trafficsense-auth"));
    assert.ok(cookies.length > 0);
    assert.ok(cookies.every((cookie) => cookie.httpOnly && cookie.sameSite === "Lax"));
    assert.equal(await evaluate("document.cookie.includes('trafficsense-auth')"), false);
    for (const path of ["/employer", "/authority", "/admin"]) { await go(path); await route("/access-denied"); }
    await go("/workspace"); await text(commuter.email);
    await call("Page.reload"); await text(commuter.email);
    await rewriteSession((session) => { session.user.email = "forged@example.test"; session.user.user_metadata = { role: "admin" }; });
    await go("/workspace"); await text(commuter.email);
    assert.equal(await evaluate("document.body.innerText.includes('forged@example.test')"), false);
    await go("/admin"); await route("/access-denied");
    await rewriteSession((session) => { session.expires_at = 1; });
    await go("/workspace"); await text(commuter.email);
    const refreshed = (await sessionCookies()).map((cookie) => cookie.value).join("");
    assert.ok(JSON.parse(Buffer.from(refreshed.slice(7), "base64url").toString()).expires_at > Date.now() / 1000);
    await rewriteSession((session) => { session.expires_at = 1; session.refresh_token = "invalid-refresh-token"; });
    await go("/workspace"); await route("/login"); await text("Welcome back");
    await login("commuter");
    await rewriteSession((session) => { session.expires_at = 1; });
    await click('button[type="submit"]'); await route("/login"); await text("Welcome back");
    assert.equal((await sessionCookies()).length, 0, "expiry immediately before sign-out must not restore auth cookies");
    const history = await call("Page.getNavigationHistory");
    if (history.currentIndex > 0) {
      await call("Page.navigateToHistoryEntry", { entryId: history.entries[history.currentIndex - 1].id });
      await waitFor(`!document.body?.innerText.includes(${JSON.stringify(commuter.email)})`, "signed-out history hides account data");
    }
    await go("/workspace"); await route("/login");

    for (const label of ["employer-a", "employer-b"]) {
      const account = await login(label);
      const other = accounts.find((item) => item.label === (label === "employer-a" ? "employer-b" : "employer-a"));
      await click('a[href="/employer"]'); await text("Your organisations"); await layout();
      assert.equal(await evaluate(`!!document.querySelector('a[href="/employer/${other.orgId}"]')`), false);
      await click(`a[href="/employer/${account.orgId}"]`); await text("Organisation membership"); await layout();
      await call("Page.reload"); await text("Organisation membership");
      await go(`/employer/${other.orgId}`); await text("Page not found");
      await go("/employer/not-a-uuid"); await text("Page not found");
      for (const path of ["/authority", "/admin"]) { await go(path); await route("/access-denied"); }
      await go("/workspace"); await text(account.email);
      assert.equal(await evaluate(`document.body.innerText.includes(${JSON.stringify(other.email)})`), false);
      await logout();
    }
    await login("employer-unassigned"); await go("/employer"); await text("No organisation memberships"); await layout(); await logout();
    for (const [label, path, heading] of [["authority", "/authority", "Read-only authority account"], ["admin", "/admin", "Demo administration"]]) {
      await login(label); await click(`a[href="${path}"]`); await text(heading); await layout();
      for (const denied of ["/employer", label === "authority" ? "/admin" : "/authority"]) { await go(denied); await route("/access-denied"); }
      await logout();
    }
    await go("/not-a-route"); await text("Page not found"); await layout();
    await click('header a[href="/"]'); await text("Understand the disruption");
    await mkdir("supabase/.temp/browser", { recursive: true });
    const shot = await call("Page.captureScreenshot", { format: "png", captureBeyondViewport: true });
    await writeFile(`supabase/.temp/browser/${new URL(base).port}-${width}.png`, Buffer.from(shot.data, "base64"));
    console.log(`PASS ${base} ${width}px: registration, invalid login, all roles, organisation isolation, empty membership, cookie flags, logout/history, refresh, direct routes and layout`);
  }
  assert.deepEqual(exceptions, [], "unexpected browser runtime exceptions");
  console.log("PASS: no browser runtime exceptions");
} finally {
  if (context) await send("Target.disposeBrowserContext", { browserContextId: context });
  socket.close();
}
