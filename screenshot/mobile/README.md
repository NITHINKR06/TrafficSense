# TrafficSense Mobile (`apps/mobile`) — UI Reference & Redesign Guide

This folder contains screenshots of every screen and key interactive state in the React Native (Expo) mobile app (`apps/mobile/app/`), captured on a `Pixel_8` Android emulator (`1080×2400`) via `scripts/capture_mobile.py`.

> **Note on captures:**
> - The semi-transparent gear icon in the top-right corner of screenshots is Expo Go's dev-menu overlay, not part of the app UI.
> - Where the host's port `3000` was occupied by another service during capture, API-backed screens show their explicit error/fallback banners instead of live incident/route payloads.

---

## 1. Screenshot Index

| Screen / Route | Files | States Covered |
| --- | --- | --- |
| **Home** (`/`) | `01_home_01_top.png` – `01_home_04_bottom.png` | Top hero & map preview, quick actions, active incidents, high-tide alert, zero-retention privacy notice |
| **Live Traffic** (`/traffic`) | `02_traffic_map.png`, `03_traffic_list_01_top.png` | Map view, List view, search bar, simulated/live sync pill, error/empty state |
| **Route Planner** (`/planner`) | `04_planner_map.png`, `05_planner_sheet_01_top.png`, `05_planner_sheet_02_scroll_1.png`, `06_planner_place_picker.png` | Full-screen map, expanded planner sheet, place picker modal |
| **Report a Hazard** (`/report`) | `07_report_guest_01_top.png` – `07_report_guest_03_scroll_2.png`, `12_report_signed_in_01_top.png` – `12_report_signed_in_03_scroll_2.png` | Guest banner vs. signed-in state, 3-step progress, 2×3 hazard grid, note, camera/gallery, location & trust tier |
| **Sign In** (`/auth/login`) | `08_auth_login_01_top.png`, `08_auth_login_02_scroll_1.png` | Quick Judge Demo Sign-In cards, Guest button, email/password form |
| **Create Account** (`/auth/register`) | `09_auth_register_01_top.png` | Registration form, password policy hint, login redirect |
| **Commuter Workspace** (`/workspace`) | `10_workspace_commuter_01_top.png`, `10_workspace_commuter_02_scroll_1.png` | Commuter profile card, action links, Sign out |
| **Commuter Journeys** (`/journeys`) | `11_journeys_01_top.png`, `11_journeys_02_scroll_1.png` | Active journey card, employer share status, recent journeys |
| **Authority Dashboard** (`/authority`) | `13_authority_dashboard_01_top.png` | Authority header, L6 Municipal Ops badge, active incidents, recent actions |
| **Authority Workspace** (`/workspace`) | `14_workspace_authority_01_top.png`, `14_workspace_authority_02_scroll_1.png` | Authority role badge, Control Room card, moderation + commuter tools |

---

## 2. Navigation Architecture & Flow

### Root Stack (`apps/mobile/app/_layout.tsx`)
- `index` (`/`), `traffic` (`/traffic`), `planner` (`/planner`), `workspace` (`/workspace`) — `fade` animation
- `report` (`/report`) — `slide_from_bottom`
- `journeys` (`/journeys`), `auth/login`, `auth/register` — `slide_from_right`
- `authority` (`/authority`) — protected route

### Global Shell Components
1. **Top Header (`AppHeader`):**
   - App logo + `TrafficSense` title + `MANGALURU · <SUBTITLE>`
   - Back arrow (`canGoBack`) on child/auth screens
   - Pulsing `LIVE` status pill (hidden on auth/workspace/authority)
   - Profile avatar button (top-right) routing to `/workspace` (or `/auth/login` when signed out)
2. **Bottom Navigation (`BottomNav`, 64px height + safe area):**
   - 5 tabs: **Home** (`/`), **Map** (`/traffic`), elevated center **+** FAB **Report** (`/report`), **Plan** (`/planner`), **Me** (`/workspace`) — or **Authority** (`/authority`) when signed in with the authority role.

### Navigation & Auth Rules
- **No dead ends or duplicate routes:** One canonical screen per feature (`Home → Report → Traffic`, `Home → Plan route`, `Sign in → Workspace → Journeys/Authority`).
- **Auth redirects:**
  - Unauthenticated `/workspace`, `/journeys`, `/authority` redirect to `/auth/login` (with `?next=...`).
  - Successful sign-in replaces the auth screen (`router.replace`) so hardware/gesture Back never returns to login.
  - Authority accounts route to `/authority` on sign-in; sign-out clears private state and returns to `/`.
- **Guest browsing:** Public map (`/traffic`), route planner (`/planner`), and home (`/`) remain accessible without signing in.

---

## 3. Screen-by-Screen UI Content & Placeholders

### 1. Home (`/`)
- **Should contain:**
  - Live telemetry bar (`Live · updated ... · 30s auto-refresh`), `SIMULATED DATA` badge, greeting + weather/advisory subtitle, `Sync` button.
  - **Plan my route** hero card: `CORRIDOR MODEL` badge, embedded schematic/Leaflet map preview with zoom (`+`/`-`), recenter, and `Explore Full Map >` pill, Origin & Destination selector rows with swap button, and primary CTA (`Inspect Coastal Routes · ~18 min`).
  - **2×2 Quick Actions grid:** `Report issue` (`1-tap`), `Live map` (`LIVE`), `Plan route`, `My journeys`.
  - **Active near you** incident cards: Category icon & label, location title, freshness chip (`28m ago`), description, evidence tier badge (`L1` / `L2`), and `"Still there?"` confirmation (`Yes` / `Cleared`).
  - **High Tide Alert** banner (`Ullal & Bengre`) + **Zero-retention privacy notice** + OpenStreetMap attribution.

### 2. Live Traffic (`/traffic`)
- **Should contain:**
  - Segmented `Map` / `List` pill toggle (with active report count badge on `List`), sync status pill + `SIMULATED` badge.
  - Corridor search input + filter button.
  - **Map view:** Full-bleed map, recenter/bounds/layer floating buttons, floating route legend pill, OpenFreeMap/OSM attribution, and collapsible incident bottom sheet (`Update Status`, `Avoid Corridor`).
  - **List view:** Scrollable incident cards, or explicit empty state (`No active reports in this view`) and retryable error banner (`Update interrupted`).
- **Placeholder:**
  - Corridor search: `"Search corridor (e.g. Balmatta Rd, Kadri, Ladyhill)"`

### 3. Route Planner (`/planner`)
- **Should contain:**
  - Full-screen map with floating Origin → Destination bar + swap button + `Details` button, and bottom prompt bar (`Tap to choose places and calculate route >`).
  - Expanded planner sheet: `ORIGIN (START POINT)` and `DESTINATION (END POINT)` selectors, swap button, popular corridor preset chips, `Prefer public bus corridor` toggle (`KSRTC/City`), `Check corridor route` primary CTA, route summary card (with free-flow baseline label), community report warnings, and explicit `Avoid` / alternative route toggle (drawn in violet `#712ae2` only after user taps).
  - **Place Picker Modal:** Title (`Select Starting Point` / `Select Destination`), close (`×`) button, search input, list of Mangaluru junctions with coordinates and opposite-field disabled state.
- **Placeholder:**
  - Place picker search: `"Search landmarks or junctions…"`

### 4. Report a Hazard (`/report`)
- **Should contain:**
  - Guest sign-in prompt banner (`Sign in required to submit` → `Sign in now`) when unauthenticated.
  - 3-step progress indicator (`Step 1 of 3: Select category`) + `Civic Feed` tag.
  - **1. Observed Hazard:** 2×3 single-selection grid (`Accident`, `Road closed`, `Heavy volume`, `Flood / Rain`, `Road repair`, `Other hazard`) with active checkmark badge.
  - **Optional note** textarea (max 300 chars) + **Camera / Gallery** photo attachment buttons + EXIF-stripped privacy note.
  - **2. Report location:** `Use current location` (foreground GPS requested **only** on submit) and `Choose reference point` (opens approximate reference-point modal).
  - **3. Verification & Trust Tier** (`L1 Tier`) + **Honesty notice** + `Submit report` primary CTA + `Cancel`.
  - **Success Modal:** Server-assigned evidence tier confirmation + direct link to `/traffic`.
- **Placeholder:**
  - Observation note: `"e.g. Left lane submerged under railway bridge near Pumpwell Circle"`

### 5. Sign In (`/auth/login`) & Create Account (`/auth/register`)
- **Should contain:**
  - **Login:** `MANGALURU CORRIDOR` + `DEMO AUTH` badges, **Quick Judge Demo Sign-In** cards (`Commuter (Primary)`, `Commuter B`, `Traffic Authority`, `Employer A`), `Continue as Guest (Public Map & Routes)` button, password sign-in card, `Create a commuter account` link, and local demo privacy notice.
  - **Register:** `COMMUTER REGISTRATION` eyebrow, email + password inputs, `"Must be at least 12 characters long."` helper, `Create account` CTA, and `Sign in instead` button.
- **Placeholders:**
  - Login Email: `"commuter@demo.trafficsense.test"` | Password: `"••••••••••••"`
  - Register Email: `"commuter@example.com"` | Password: `"••••••••••••"`

### 6. Commuter Workspace (`/workspace`) & Journeys (`/journeys`)
- **Workspace should contain:** Role eyebrow, signed-in email, avatar + role badge (`Verified Commuter Account` or `Employee · <Org>`), quick action rows (`Report road obstacle`, `Plan my route`, `Live community traffic map`, `My journeys & employer sharing`), and `Sign out of account` button.
- **Journeys should contain:** `SIMULATED STATUS` badge, `Phase 7 Planned Extension` notice, **Active Journey** card (`ACTIVE COMMUTE`, start time, employer share list with `Stop sharing`, `End journey` CTA, and explicit privacy/membership notice), Consent Preview modal (when organisation-linked, with mandatory explicit consent checkbox), and **Recent Journeys** list.

### 7. Authority Dashboard (`/authority`) & Authority Workspace (`/workspace`)
- **Authority Workspace:** `CIVIC CONTROL ROOM ACCESS` eyebrow, `Traffic Authority · Mangaluru Operations` badge, highlighted `Authority Control Room (L6 REVIEW)` card, and `Active Incident Moderation` + commuter tools.
- **Authority Dashboard:** `L6 MUNICIPAL OPS` badge, `Commuter Workspace >` switcher, dismissible dispatch alert banner, `Active incidents` list with `Refresh` button and `Confirm as L6` / `Resolve` / `Reject` moderation actions, and `Recent authority actions` audit history.

---

## 4. UI Perfection & Redesign Standards

### Design Tokens (`apps/mobile/src/theme/tokens.ts`)
- **Background:** `#faf8ff` (pale lavender) | **Cards/Inputs:** `#ffffff` with `#e2e7ff` border
- **Primary Action:** `#005c55` (deep teal), pressed `#004741`, text `#ffffff`
- **Secondary / Simulation / Evidence:** `#712ae2` / `#6616d7` on `#f3edff`
- **Warning:** `#904d00` / `#fe932c` on `#fff4e5` | **Error:** `#ba1a1a` on `#fff0ed`
- **Text:** `#191c20` (primary), `#3f4947` (secondary), `#6f7977` (muted)
- **Radii:** Cards `14px`, Controls `12px`, Inputs `10px`, Pills `9999px`
- **Spacing:** `16px` phone gutter, `20px` section gap, `12px` card gap, `88px` bottom scroll padding to clear `BottomNav`

### Key Redesign & Polish Targets Observed in Current Captures
1. **Touch Targets & Accessibility:** Every interactive control must maintain at least `48×48px` (`minTouchTarget = 48`) with clear `accessibilityLabel` and `accessibilityRole`.
2. **Eliminate Text Truncation & Wrapping Issues:**
   - In `08_auth_login_01_top.png`, demo emails wrap awkwardly (`...trafficsense\n.test`) and descriptions truncate (`...`).
   - In `01_home_01_top.png`, quick-action subtitles (`Waterlog, pot, jam`) and incident titles (`Road Repair near Bejai Ch...`) truncate; `Coastal coastal skies overcast` has a duplicate word.
3. **Map & Floating Controls Clarity:**
   - Ensure Leaflet/map attribution and floating zoom/recenter pills never collide with route pills or bottom sheets (`01_home_01_top.png`, `02_traffic_map.png`, `04_planner_map.png`).
   - On `/planner`, make the transition between full-screen map mode and the expanded route-input sheet obvious and effortless.
4. **Honest Evidence & Privacy Indicators:**
   - Always keep `SIMULATED DATA` / `CORRIDOR MODEL` / `L1–L6` evidence tiers visually distinct from live verified facts.
   - Never imply continuous background GPS tracking; keep foreground-only GPS and zero-retention disclosures visible.
5. **Explicit Non-Happy States:**
   - Keep loading, empty (`No active reports in this view`), offline/API error (`Update interrupted`, `Route unavailable`), and permission-denied states clean, compact, and actionable with a single-tap `Try again` / fallback path.
