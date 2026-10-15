import assert from "node:assert/strict";
import { after, test } from "node:test";
import { registerHooks } from "node:module";
import { createTrafficFixture, DEFAULT_DEMO_ANCHOR } from "../src/lib/traffic/simulator.ts";

const state = { events: [], response: { data: null, error: null, status: 200 } };
globalThis.__trafficReaderTest = state;
const hooks = registerHooks({
  resolve(specifier, context, nextResolve) {
    if (context.parentURL?.includes("/src/lib/traffic/")) {
      const mocks = {
        "server-only": "export {};",
        "next/server": "export async function connection() { globalThis.__trafficReaderTest.events.push('connection'); }",
        "@supabase/supabase-js": `export function createClient(url, key, options) {
          const state = globalThis.__trafficReaderTest;
          state.events.push('sdk'); state.options = options; state.url = url; state.key = key;
          if (state.constructError) throw new Error('private provider diagnostic');
          return { rpc: async (name) => {
            state.rpc = name;
            if (state.fetch) await options.global.fetch(url, state.init);
            if (state.requestError) throw new Error('private provider diagnostic');
            return state.response;
          } };
        }`,
      };
      if (specifier in mocks) return { url: `data:text/javascript,${encodeURIComponent(mocks[specifier])}`, shortCircuit: true };
      if (specifier.startsWith("./") && !specifier.endsWith(".ts")) return nextResolve(`${specifier}.ts`, context);
    }
    return nextResolve(specifier, context);
  },
});
after(() => { hooks.deregister(); delete globalThis.__trafficReaderTest; });
const { parseTrafficSnapshot, sampleFreshness } = await import("../src/lib/traffic/snapshot.ts");
const { readTrafficSnapshot } = await import("../src/lib/traffic/server.ts");
const snapshot = () => ({ read_at: DEFAULT_DEMO_ANCHOR, fixture: createTrafficFixture("slowdown", DEFAULT_DEMO_ANCHOR), reports: [], reporting_enabled: false });

test("snapshot parser preserves the fixture contract and canonicalizes PostgreSQL timestamps", () => {
  const input = snapshot();
  input.read_at = "2026-10-15T09:30:00.123456+05:30";
  input.fixture.corridor.anchor_at = "2026-10-15 04:00:00+00";
  input.fixture.observations[0].observed_at = "2026-10-15T03:49:00+00:00";
  const expected = snapshot();
  expected.read_at = "2026-10-15T04:00:00.123Z";
  assert.deepEqual(parseTrafficSnapshot(input), expected);
  assert.notEqual(parseTrafficSnapshot(input).fixture, input.fixture);
  assert.equal(input.fixture.corridor.anchor_at, "2026-10-15 04:00:00+00");
  assert.deepEqual(parseTrafficSnapshot({ read_at: DEFAULT_DEMO_ANCHOR, fixture: null, reports: [], reporting_enabled: false }), { read_at: DEFAULT_DEMO_ANCHOR, fixture: null, reports: [], reporting_enabled: false });
});

test("public reports share the snapshot but never expose source identity or unsupported segments", () => {
  const input = snapshot();
  const report = { id: "a0866416-8ea3-4f6a-81f9-6f855cd73947", segment_id: "primary-west", direction: "outbound", category: "unknown", observed_at: DEFAULT_DEMO_ANCHOR, received_at: DEFAULT_DEMO_ANCHOR, provenance: "simulated", location_provenance: "manual" };
  input.reports = [report];
  input.reporting_enabled = true;
  assert.deepEqual(parseTrafficSnapshot(input), input);
  for (const mutate of [
    value => { value.reports[0].source_id = "private"; },
    value => { value.reports[0].direction = "inbound"; },
    value => { value.reports.push(value.reports[0]); },
    value => { value.fixture = null; },
    value => { value.reporting_enabled = "true"; },
    value => { value.reports = Array(2001).fill(report); },
  ]) {
    const invalid = structuredClone(input); mutate(invalid);
    assert.throws(() => parseTrafficSnapshot(invalid));
  }
});

test("snapshot geometry stays inside the map corridor, including bounds and all generated scenarios", () => {
  for (const scenario of ["normal", "slowdown", "recovery"]) {
    const input = { ...snapshot(), fixture: createTrafficFixture(scenario, DEFAULT_DEMO_ANCHOR) };
    assert.deepEqual(parseTrafficSnapshot(input), input);
  }
  const boundary = snapshot();
  boundary.fixture.segments[0].geometry.coordinates = [[74.79, 12.82], [74.92, 12.94]];
  assert.deepEqual(parseTrafficSnapshot(boundary), boundary);
  for (const point of [[74.789999, 12.88], [74.920001, 12.88], [74.85, 12.819999], [74.85, 12.940001], [0, 0], [12.88, 74.85]]) {
    const input = snapshot();
    input.fixture.segments.at(-1).geometry.coordinates[1] = point;
    assert.throws(() => parseTrafficSnapshot(input), /Invalid traffic snapshot/, JSON.stringify(point));
  }
});

test("missing segment samples and an empty observation collection remain explicit, not fabricated", () => {
  const input = snapshot();
  input.fixture.observations = input.fixture.observations.filter(row => row.segment_id !== "primary-west");
  assert.deepEqual(parseTrafficSnapshot(input), input);
  input.fixture.observations = [];
  assert.deepEqual(parseTrafficSnapshot(input), input);
});

test("snapshot parser rejects malformed envelopes, timestamps, provenance and extra fields", () => {
  for (const value of [null, [], {}, { read_at: DEFAULT_DEMO_ANCHOR }, { read_at: DEFAULT_DEMO_ANCHOR, fixture: false }]) {
    assert.throws(() => parseTrafficSnapshot(value));
  }
  for (const timestamp of [null, 0, "", "2026-10-15", "2026-02-30T04:00:00Z", "2026-10-15T24:00:00Z", "2026-10-15T04:00:00", "2026-10-15T04:00:60Z", "2026-10-15T04:00:00+99:00", "infinity"]) {
    const input = snapshot();
    input.read_at = timestamp;
    assert.throws(() => parseTrafficSnapshot(input));
  }
  for (const mutate of [
    value => { value.private = "unexpected"; },
    value => { value.fixture.corridor.id = "unrelated"; },
    value => { value.fixture.corridor.provenance = "gps"; },
    value => { value.fixture.corridor.scenario = "live"; },
    value => { value.fixture.corridor.anchor_at = "2100-01-01T00:00:00Z"; },
    value => { value.fixture.corridor.geometry_note = ""; },
    value => { value.fixture.segments[0].owner_id = "private"; },
    value => { value.fixture.observations[0].provenance = "gps"; },
    value => { value.fixture.observations[0].observed_at = "2026-02-30T04:00:00Z"; },
    value => { value.fixture.observations[0].observed_at = "2026-10-15T04:00:01Z"; },
    value => { value.fixture.observations[0].observed_at = "2026-10-15T03:48:59Z"; },
  ]) {
    const input = snapshot(); mutate(input);
    assert.throws(() => parseTrafficSnapshot(input));
  }
});

test("snapshot parser rejects invalid geometry, numeric values, enums and relational references", () => {
  const mutations = [
    value => { value.segments = []; },
    value => { value.segments.push(value.segments[0]); },
    value => { value.segments[0].id = "invalid id"; },
    value => { value.segments[0].direction = "sideways"; },
    value => { value.segments[0].geometry.type = "Point"; },
    value => { value.segments[0].geometry.coordinates = [[74, 12]]; },
    value => { value.segments[0].geometry.coordinates[0] = [74, 12, 0]; },
    value => { value.segments[0].geometry.coordinates[0][0] = 181; },
    value => { value.segments[0].geometry.coordinates[0][1] = -91; },
    value => { value.segments[0].geometry.coordinates[0][0] = NaN; },
    value => { value.segments[0].length_m = 0; },
    value => { value.segments[0].length_m = 1.5; },
    value => { value.segments[0].baseline_seconds = "180"; },
    value => { value.segments[0].baseline_seconds = 86401; },
    value => { value.routes[0].kind = "recommended"; },
    value => { value.routes[1].kind = "primary"; },
    value => { value.routes.pop(); },
    value => { value.route_segments[0].route_id = "missing"; },
    value => { value.route_segments[0].segment_id = "missing"; },
    value => { value.route_segments[0].direction = "inbound"; },
    value => { value.route_segments[0].position = 2; },
    value => { value.route_segments.pop(); value.route_segments.pop(); },
    value => { value.route_segments[1].segment_id = value.route_segments[0].segment_id; },
    value => { value.sources[0].segment_id = "missing"; },
    value => { value.sources.push(value.sources[0]); },
    value => { value.observations[0].source_id = "missing"; },
    value => { value.observations[0].segment_id = "alternative-west"; },
    value => { value.observations.push(value.observations[0]); },
    ...[-1, 161, Infinity, NaN, "8", null].map(speed => value => { value.observations[0].speed_kph = speed; }),
  ];
  for (const mutate of mutations) {
    const input = snapshot(); mutate(input.fixture);
    assert.throws(() => parseTrafficSnapshot(input), undefined, mutate.toString());
  }
});

test("sample freshness uses the read clock and exact twenty-minute/future boundaries", () => {
  const readAt = "2026-10-15T04:20:00.000Z";
  assert.equal(sampleFreshness(null, readAt), "missing");
  assert.equal(sampleFreshness(readAt, readAt), "recent");
  assert.equal(sampleFreshness("2026-10-15T04:00:00.001Z", readAt), "recent");
  assert.equal(sampleFreshness(DEFAULT_DEMO_ANCHOR, readAt), "stale");
  assert.equal(sampleFreshness("2026-10-15T03:59:59.999Z", readAt), "stale");
  assert.equal(sampleFreshness("2026-10-15T04:20:00.001Z", readAt), "future");
  assert.throws(() => sampleFreshness("bad", readAt));
  assert.throws(() => sampleFreshness(null, "bad"));
});

test("server snapshot reader is public, request-time, bounded, uncached and safe on every failure", async () => {
  const originalUrl = process.env.SUPABASE_URL;
  const originalKey = process.env.SUPABASE_ANON_KEY;
  const originalFetch = globalThis.fetch;
  const originalTimeout = AbortSignal.timeout;
  try {
    delete process.env.SUPABASE_URL; delete process.env.SUPABASE_ANON_KEY;
    assert.deepEqual(await readTrafficSnapshot(), { status: "unconfigured" });
    assert.ok(!state.events.includes("sdk"));
    process.env.SUPABASE_URL = "http://synthetic.invalid";
    process.env.SUPABASE_ANON_KEY = "synthetic-public-key";
    state.events = [];
    state.response = { data: snapshot(), error: null, status: 200 };
    state.fetch = true;
    const requestController = new AbortController();
    state.init = { cache: "force-cache", signal: requestController.signal };
    let received;
    const timeouts = [];
    AbortSignal.timeout = milliseconds => { timeouts.push(milliseconds); return originalTimeout(milliseconds); };
    globalThis.fetch = async (_input, init) => { received = init; return new Response("{}"); };
    assert.deepEqual(await readTrafficSnapshot(), { status: "ready", snapshot: snapshot() });
    assert.deepEqual(state.events, ["connection", "sdk"]);
    assert.equal(state.rpc, "read_traffic_demo");
    assert.equal(state.url, process.env.SUPABASE_URL);
    assert.equal(state.key, process.env.SUPABASE_ANON_KEY);
    assert.deepEqual(state.options.auth, { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false });
    assert.equal(received.cache, "no-store");
    assert.deepEqual(timeouts, [8000]);
    assert.ok(received.signal instanceof AbortSignal);
    requestController.abort();
    assert.equal(received.signal.aborted, true);
    state.init = undefined;
    assert.equal((await readTrafficSnapshot()).status, "ready");
    assert.deepEqual(timeouts, [8000, 8000]);
    state.fetch = false;
    for (const response of [
      { data: null, error: { code: "42501", message: "private diagnostic" }, status: 400 },
      { data: null, error: { message: "private diagnostic" }, status: 401 },
      { data: null, error: { message: "private diagnostic" }, status: 403 },
    ]) {
      state.response = response;
      assert.deepEqual(await readTrafficSnapshot(), { status: "denied" });
    }
    state.response = { data: null, error: { code: "PGRST202", message: "private diagnostic" }, status: 404 };
    assert.deepEqual(await readTrafficSnapshot(), { status: "unavailable" });
    state.response = { data: {}, error: null, status: 200 };
    assert.deepEqual(await readTrafficSnapshot(), { status: "invalid" });
    state.response = { data: { read_at: DEFAULT_DEMO_ANCHOR, fixture: null, reports: [], reporting_enabled: false }, error: null, status: 200 };
    assert.deepEqual(await readTrafficSnapshot(), { status: "ready", snapshot: state.response.data });
    state.requestError = true;
    assert.deepEqual(await readTrafficSnapshot(), { status: "unavailable" });
    state.requestError = false;
    state.constructError = true;
    assert.deepEqual(await readTrafficSnapshot(), { status: "unavailable" });
  } finally {
    if (originalUrl === undefined) delete process.env.SUPABASE_URL; else process.env.SUPABASE_URL = originalUrl;
    if (originalKey === undefined) delete process.env.SUPABASE_ANON_KEY; else process.env.SUPABASE_ANON_KEY = originalKey;
    globalThis.fetch = originalFetch; AbortSignal.timeout = originalTimeout;
  }
});
