"""Capture full-page screenshots of every TrafficSense web page (desktop & mobile viewports).

Usage (with Next.js web app running on http://127.0.0.1:3000):
    uv run --python 3.14 --with playwright python3 scripts/capture_web.py
"""

from __future__ import annotations

import asyncio
import json
import os
import sys
from pathlib import Path

from playwright.async_api import async_playwright, TimeoutError as PWTimeout

BASE = os.environ.get("APP_URL", "http://127.0.0.1:3000")
ACCOUNTS_FILE = Path("supabase/.temp/demo-accounts.json")
OUT = Path("screenshot/web")
CHROMIUM_PATH = os.environ.get("CHROMIUM_PATH", "/usr/bin/chromium-browser")

WIDTHS = {"desktop": (1440, 900), "mobile": (390, 844)}

# Organisation IDs from scripts/seed-demo.mjs
ORG_A = "10000000-0000-4000-8000-000000000001"  # Harbour employer
ORG_B = "10000000-0000-4000-8000-000000000002"  # Junction employer

PUBLIC_PAGES = [
    ("home", "/"),
    ("planner", "/planner"),
    ("traffic", "/traffic"),
    ("report", "/report"),
    ("reports-new", "/reports/new"),
    ("demo", "/demo"),
    ("about", "/about"),
    ("login", "/login"),
    ("register", "/register"),
    ("access-denied", "/access-denied"),
    ("not-found", "/this-page-does-not-exist"),
]

ROLE_PAGES = {
    "commuter": (
        "commuter",
        [
            ("workspace", "/workspace"),
            ("planner", "/planner"),
            ("traffic", "/traffic"),
            ("report", "/report"),
            ("reports-new", "/reports/new"),
            ("access-denied-authority", "/authority"),
        ],
    ),
    "employer-a": (
        "employer-a",
        [
            ("employer-list", "/employer"),
            ("employer-org-a", f"/employer/{ORG_A}"),
            ("employer-org-b-denied", f"/employer/{ORG_B}"),
            ("workspace", "/workspace"),
        ],
    ),
    "authority": (
        "authority",
        [
            ("authority", "/authority"),
            ("planner", "/planner"),
            ("traffic", "/traffic"),
        ],
    ),
    "admin": (
        "admin",
        [
            ("admin", "/admin"),
            ("authority", "/authority"),
            ("workspace", "/workspace"),
        ],
    ),
}


def load_accounts() -> dict[str, dict[str, str]]:
    if not ACCOUNTS_FILE.exists():
        sys.exit(f"Missing {ACCOUNTS_FILE}. Run `just db-seed` first.")
    raw = json.loads(ACCOUNTS_FILE.read_text())
    records = raw if isinstance(raw, list) else [{"label": k, **v} for k, v in raw.items()]
    accounts: dict[str, dict[str, str]] = {}
    for record in records:
        label = record.get("label") or record.get("name")
        email = record.get("email")
        password = record.get("password")
        if label and email and password:
            accounts[label] = {"email": email, "password": password}
    if not accounts:
        sys.exit(f"{ACCOUNTS_FILE} has no usable accounts.")
    return accounts


async def settle(page) -> None:
    try:
        await page.wait_for_load_state("networkidle", timeout=15000)
    except PWTimeout:
        pass
    await page.wait_for_timeout(1500)


async def login(page, account: dict[str, str]) -> None:
    await page.goto(f"{BASE}/login")
    await settle(page)
    await page.get_by_label("Email address").fill(account["email"])
    await page.get_by_label("Password").fill(account["password"])
    await page.get_by_role("button", name="Sign in").click()
    await settle(page)


async def capture(browser, role_dir: str, pages, account=None, results=None) -> None:
    for width_name, (w, h) in WIDTHS.items():
        ctx = await browser.new_context(viewport={"width": w, "height": h})
        page = await ctx.new_page()
        try:
            if account:
                await login(page, account)
            for slug, path in pages:
                target = OUT / role_dir / f"{slug}-{width_name}.png"
                target.parent.mkdir(parents=True, exist_ok=True)
                try:
                    resp = await page.goto(BASE + path)
                    await settle(page)
                    await page.screenshot(path=str(target), full_page=True)
                    http_status = resp.status if resp else "?"
                    final_path = page.url.replace(BASE, "") or "/"
                    status = f"ok ({http_status}) -> {final_path}"
                except Exception as exc:
                    status = f"FAILED: {exc.__class__.__name__}: {str(exc)[:120]}"
                if results is not None:
                    results.append((f"{role_dir}/{slug} [{width_name}]", status))
                print(f"  {role_dir}/{slug} [{width_name}]: {status}")
        finally:
            await ctx.close()


async def main() -> None:
    accounts = load_accounts()
    OUT.mkdir(parents=True, exist_ok=True)
    results: list[tuple[str, str]] = []

    launch_kwargs = {}
    if Path(CHROMIUM_PATH).exists():
        launch_kwargs["executable_path"] = CHROMIUM_PATH

    async with async_playwright() as p:
        browser = await p.chromium.launch(**launch_kwargs)
        print("Public pages")
        await capture(browser, "public", PUBLIC_PAGES, results=results)

        for role_key, (label, pages) in ROLE_PAGES.items():
            if label not in accounts:
                print(f"Skipping {role_key}: no account '{label}' in {ACCOUNTS_FILE}")
                continue
            print(f"Signed in as {role_key}")
            await capture(
                browser, role_key, pages, account=accounts[label], results=results
            )

        await browser.close()

    failed = [name for name, status in results if status.startswith("FAILED")]
    print(
        f"\nDone. {len(results) - len(failed)} captured, {len(failed)} failed. Output: {OUT.resolve()}"
    )
    for name in failed:
        print(f"  failed: {name}")
    if failed:
        sys.exit(1)


if __name__ == "__main__":
    asyncio.run(main())
