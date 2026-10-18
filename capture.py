# capture.py
import asyncio, os
from playwright.async_api import async_playwright

BASE = "http://localhost:3000"
WIDTHS = {"desktop": (1440, 900), "mobile": (390, 844)}
OUT = "screens"
EMPLOYER_ORG = "10000000-0000-4000-8000-000000000001"

PUBLIC = [("home", "/"), ("traffic", "/traffic"), ("demo", "/demo"), ("reports", "/reports/new")]
ROLE_PAGES = {
    "authority": ("authority@demo.trafficsense.test", os.environ["PW_AUTHORITY"], [("authority", "/authority")]),
    "employer": ("employer-a@demo.trafficsense.test", os.environ["PW_EMPLOYER"], [("employer", f"/employer/{EMPLOYER_ORG}")]),
}

async def login(page, email, password):
    await page.goto(f"{BASE}/login")
    await page.get_by_label("Email address").fill(email)
    await page.get_by_label("Password").fill(password)
    await page.get_by_role("button", name="Sign in").click()
    await page.wait_for_load_state("networkidle")

async def shoot(browser, role, pages, login_as=None):
    for name, (w, h) in WIDTHS.items():
        ctx = await browser.new_context(viewport={"width": w, "height": h})
        page = await ctx.new_page()
        if login_as:
            await login(page, *login_as)
        for slug, path in pages:
            await page.goto(BASE + path)
            await page.wait_for_load_state("networkidle")
            await page.wait_for_timeout(1500)  # let the map tiles settle
            await page.screenshot(path=f"{OUT}/{slug}-{name}.png", full_page=True)
        await ctx.close()

async def main():
    os.makedirs(OUT, exist_ok=True)
    async with async_playwright() as p:
        browser = await p.chromium.launch()
        await shoot(browser, "public", PUBLIC)
        for role, (email, pw, pages) in ROLE_PAGES.items():
            await shoot(browser, role, pages, login_as=(email, pw))
        await browser.close()

asyncio.run(main())