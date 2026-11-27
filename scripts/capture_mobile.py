"""Capture screenshots of all React Native (apps/mobile) screens on Android emulator.

Usage (with Android emulator running and Expo Go + Metro on port 8081):
    python3 scripts/capture_mobile.py
"""

from __future__ import annotations

import hashlib
import json
import os
import re
import subprocess
import sys
import time
import xml.etree.ElementTree as ET
from pathlib import Path

ADB = os.environ.get("ADB", "adb")
SERIAL = os.environ.get("ANDROID_SERIAL", "emulator-5554")
EXPO_URL = os.environ.get("EXPO_URL", "exp://127.0.0.1:8081")
EXPO_PKG = "host.exp.exponent"
OUT_DIR = Path("screenshot")
ACCOUNTS_FILE = Path("supabase/.temp/demo-accounts.json")


def load_accounts() -> dict[str, dict[str, str]]:
    if not ACCOUNTS_FILE.exists():
        return {}
    raw = json.loads(ACCOUNTS_FILE.read_text())
    records = raw if isinstance(raw, list) else [{"label": k, **v} for k, v in raw.items()]
    out: dict[str, dict[str, str]] = {}
    for rec in records:
        label = rec.get("label") or rec.get("name")
        email = rec.get("email")
        password = rec.get("password")
        if label and email and password:
            out[label] = {"email": email, "password": password}
    return out


def run_adb(*args: str, check: bool = True) -> subprocess.CompletedProcess[bytes]:
    cmd = [ADB, "-s", SERIAL, *args]
    return subprocess.run(cmd, check=check, capture_output=True)


def screencap(filename: str) -> Path:
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    target = OUT_DIR / filename
    res = run_adb("exec-out", "screencap", "-p")
    target.write_bytes(res.stdout)
    print(f"  saved {target} ({len(res.stdout) // 1024} KB)")
    return target


def open_route(route: str, wait: float = 3.5) -> None:
    path = route.lstrip("/")
    uri = f"{EXPO_URL}/--/{path}" if path else EXPO_URL
    run_adb(
        "shell",
        "am",
        "start",
        "-a",
        "android.intent.action.VIEW",
        "-d",
        uri,
        "-p",
        EXPO_PKG,
    )
    time.sleep(wait)


def dump_ui() -> ET.Element | None:
    try:
        run_adb("shell", "uiautomator", "dump", "/sdcard/ui_capture.xml")
        res = run_adb("shell", "cat", "/sdcard/ui_capture.xml")
        return ET.fromstring(res.stdout.decode("utf-8", errors="replace"))
    except Exception as exc:
        print(f"  [warn] uiautomator dump failed: {exc}", file=sys.stderr)
        return None


def parse_bounds(bounds: str) -> tuple[int, int] | None:
    m = re.match(r"\[(\d+),(\d+)\]\[(\d+),(\d+)\]", bounds or "")
    if not m:
        return None
    x1, y1, x2, y2 = map(int, m.groups())
    return ((x1 + x2) // 2, (y1 + y2) // 2)


def find_node(
    *,
    desc_contains: str | None = None,
    desc_exact: str | None = None,
    text_contains: str | None = None,
    text_exact: str | None = None,
) -> ET.Element | None:
    root = dump_ui()
    if root is None:
        return None
    for node in root.iter("node"):
        desc = node.attrib.get("content-desc", "")
        text = node.attrib.get("text", "")
        if desc_exact and desc == desc_exact:
            return node
        if desc_contains and desc_contains.lower() in desc.lower():
            return node
        if text_exact and text == text_exact:
            return node
        if text_contains and text_contains.lower() in text.lower():
            return node
    return None


def find_and_tap(
    *,
    desc_contains: str | None = None,
    desc_exact: str | None = None,
    text_contains: str | None = None,
    text_exact: str | None = None,
    wait: float = 1.5,
) -> bool:
    node = find_node(
        desc_contains=desc_contains,
        desc_exact=desc_exact,
        text_contains=text_contains,
        text_exact=text_exact,
    )
    if node is None:
        return False
    center = parse_bounds(node.attrib.get("bounds", ""))
    if not center:
        return False
    run_adb("shell", "input", "tap", str(center[0]), str(center[1]))
    time.sleep(wait)
    return True


def type_into_field(desc_exact: str, value: str) -> bool:
    if not find_and_tap(desc_exact=desc_exact, wait=0.6):
        return False
    # Select all and delete in case field has prior text
    run_adb("shell", "input", "keycombination", "113", "29")  # Ctrl+A
    run_adb("shell", "input", "keyevent", "67")  # KEYCODE_DEL
    # Escape characters for adb shell input text
    escaped = value.replace(" ", "%s")
    for ch in ['"', "'", "&", ";", "(", ")", "|", "<", ">", "$", "`", "\\"]:
        escaped = escaped.replace(ch, "\\" + ch)
    run_adb("shell", "input", "text", escaped)
    time.sleep(0.5)
    # Hide keyboard
    run_adb("shell", "input", "keyevent", "111")  # ESC / back
    time.sleep(0.5)
    return True


def swipe_down_page() -> None:
    run_adb("shell", "input", "swipe", "540", "1750", "540", "650", "450")
    time.sleep(1.0)


def swipe_up_page() -> None:
    run_adb("shell", "input", "swipe", "540", "650", "540", "1750", "450")
    time.sleep(1.0)


def capture_scrollable(prefix: str, max_scrolls: int = 3) -> None:
    first = screencap(f"{prefix}_01_top.png")
    prev_hash = hashlib.sha256(first.read_bytes()).hexdigest()
    for idx in range(1, max_scrolls + 1):
        swipe_down_page()
        res = run_adb("exec-out", "screencap", "-p")
        cur_hash = hashlib.sha256(res.stdout).hexdigest()
        if cur_hash == prev_hash:
            break
        label = "bottom" if idx == max_scrolls else f"scroll_{idx}"
        target = OUT_DIR / f"{prefix}_{idx + 1:02d}_{label}.png"
        target.write_bytes(res.stdout)
        print(f"  saved {target} ({len(res.stdout) // 1024} KB)")
        prev_hash = cur_hash


def sign_in_with_account(email: str, password: str) -> bool:
    open_route("/auth/login", wait=3.5)
    swipe_down_page()
    time.sleep(0.5)
    if not type_into_field("Email address", email):
        print(f"  [warn] Email field not found for {email}")
        return False
    if not type_into_field("Password", password):
        print(f"  [warn] Password field not found for {email}")
        return False
    if not find_and_tap(desc_exact="Sign in with credentials", wait=4.5):
        print("  [warn] Sign in with credentials button not found")
        return False
    return True


def main() -> None:
    accounts = load_accounts()

    # Clean previous screenshots so output is fresh
    if OUT_DIR.exists():
        for old in OUT_DIR.glob("*.png"):
            old.unlink()

    print("1. Capturing Home (/)")
    open_route("/traffic", wait=3.5)
    find_and_tap(text_exact="Home", wait=2.5)
    capture_scrollable("01_home", max_scrolls=3)

    print("2. Capturing Live Traffic Map (/traffic - Map view)")
    open_route("/traffic", wait=4.0)
    screencap("02_traffic_map.png")

    print("3. Capturing Live Traffic List (/traffic - List view)")
    if find_and_tap(desc_contains="Switch to List view", wait=2.0) or find_and_tap(
        text_contains="List", wait=2.0
    ):
        capture_scrollable("03_traffic_list", max_scrolls=3)
    else:
        print("  [warn] Could not switch to List view")

    print("4. Capturing Route Planner (/planner - Map view)")
    open_route("/planner", wait=3.5)
    screencap("04_planner_map.png")

    print("5. Capturing Route Planner Details Sheet (/planner - expanded)")
    if find_and_tap(text_contains="Tap to choose places", wait=1.5) or find_and_tap(
        text_contains="Details", wait=1.5
    ):
        capture_scrollable("05_planner_sheet", max_scrolls=3)
    else:
        print("  [warn] Could not expand planner sheet")

    print("6. Capturing Route Planner Place Picker modal")
    open_route("/planner", wait=3.0)
    if find_and_tap(text_contains="Tap to choose places", wait=1.5) or find_and_tap(
        text_contains="Details", wait=1.5
    ):
        if find_and_tap(text_contains="Hampankatta Junction", wait=1.5):
            screencap("06_planner_place_picker.png")
            find_and_tap(desc_contains="Close picker", wait=1.0)

    print("7. Capturing Report a Hazard (/report - guest)")
    open_route("/report", wait=3.5)
    capture_scrollable("07_report_guest", max_scrolls=3)

    print("8. Capturing Auth Login (/auth/login)")
    open_route("/auth/login", wait=3.5)
    capture_scrollable("08_auth_login", max_scrolls=2)

    print("9. Capturing Auth Register (/auth/register)")
    open_route("/auth/register", wait=3.5)
    capture_scrollable("09_auth_register", max_scrolls=2)

    commuter = accounts.get("commuter")
    if commuter:
        print("10. Signing in as Commuter")
        if sign_in_with_account(commuter["email"], commuter["password"]):
            print("11. Capturing Commuter Workspace (/workspace)")
            open_route("/workspace", wait=3.5)
            capture_scrollable("10_workspace_commuter", max_scrolls=2)

            print("12. Capturing Commuter Journeys (/journeys)")
            open_route("/journeys", wait=3.5)
            capture_scrollable("11_journeys", max_scrolls=3)

            print("13. Capturing Report a Hazard (/report - signed in)")
            open_route("/report", wait=3.5)
            capture_scrollable("12_report_signed_in", max_scrolls=3)

            # Sign out
            open_route("/workspace", wait=3.0)
            swipe_down_page()
            find_and_tap(text_contains="Sign out", wait=3.0)
    else:
        print("  [warn] No 'commuter' account in demo-accounts.json")

    authority = accounts.get("authority")
    if authority:
        print("14. Signing in as Traffic Authority")
        if sign_in_with_account(authority["email"], authority["password"]):
            print("15. Capturing Authority Dashboard (/authority)")
            open_route("/authority", wait=4.0)
            capture_scrollable("13_authority_dashboard", max_scrolls=3)

            print("16. Capturing Authority Workspace (/workspace)")
            open_route("/workspace", wait=3.5)
            capture_scrollable("14_workspace_authority", max_scrolls=2)
    else:
        print("  [warn] No 'authority' account in demo-accounts.json")

    print(f"\nDone! Screenshots saved in {OUT_DIR.resolve()}")


if __name__ == "__main__":
    main()
