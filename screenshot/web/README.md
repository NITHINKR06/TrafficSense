# TrafficSense Web (`apps/web`) — UI Reference & Redesign Guide

This folder contains full-page screenshots of every Next.js web screen in `apps/web/src/app/`, captured in both **desktop (`1440×900`)** and **mobile (`390×844`)** viewports via `scripts/capture_web.py`.

> **Note on captures:**
> - The `1 Insight` / `1 Issue` pill in the top-right corner of some captures is the Next.js development overlay badge (not part of production UI).
> - All authenticated captures were taken with real seeded demo accounts from `supabase/.temp/demo-accounts.json` against the local Supabase backend.

---

## 1. Screenshot Index (54 files)

### `public/` (Unauthenticated / Guest)
- `home-{desktop,mobile}.png` (`/`)
- `planner-{desktop,mobile}.png` (`/planner`)
- `traffic-{desktop,mobile}.png` (`/traffic`)
- `report-{desktop,mobile}.png` (`/report`)
- `reports-new-{desktop,mobile}.png` (`/reports/new` → redirects/renders `/report`)
- `demo-{desktop,mobile}.png` (`/demo`)
- `about-{desktop,mobile}.png` (`/about`)
- `login-{desktop,mobile}.png` (`/login`)
- `register-{desktop,mobile}.png` (`/register`)
- `access-denied-{desktop,mobile}.png` (`/access-denied`)
- `not-found-{desktop,mobile}.png` (`/this-page-does-not-exist`, HTTP 404)

### `commuter/` (Signed in as `commuter@demo.trafficsense.test`)
- `workspace-{desktop,mobile}.png` (`/workspace`)
- `planner-{desktop,mobile}.png` (`/planner`)
- `traffic-{desktop,mobile}.png` (`/traffic`)
- `report-{desktop,mobile}.png` (`/report`)
- `reports-new-{desktop,mobile}.png` (`/reports/new`)
- `access-denied-authority-{desktop,mobile}.png` (`/authority` → `/access-denied`)

### `employer-a/` (Signed in as `employer-a@demo.trafficsense.test`)
- `employer-list-{desktop,mobile}.png` (`/employer`)
- `employer-org-a-{desktop,mobile}.png` (`/employer/10000000-0000-4000-8000-000000000001`)
- `employer-org-b-denied-{desktop,mobile}.png` (`/employer/10000000-0000-4000-8000-000000000002` — access denied)
- `workspace-{desktop,mobile}.png` (`/workspace`)

### `authority/` (Signed in as `authority@demo.trafficsense.test`)
- `authority-{desktop,mobile}.png` (`/authority`)
- `planner-{desktop,mobile}.png` (`/planner`)
- `traffic-{desktop,mobile}.png` (`/traffic`)

### `admin/` (Signed in as `admin@demo.trafficsense.test`)
- `admin-{desktop,mobile}.png` (`/admin`)
- `authority-{desktop,mobile}.png` (`/authority` → `/access-denied`)
- `workspace-{desktop,mobile}.png` (`/workspace`)

---

## 2. Web Navigation & Access Architecture

### Top Navigation Bar & Footer
- **Header:** Brand logo + `TrafficSense` + `MANGALURU` pill + `DEVELOPMENT PREVIEW` badge; primary links (`Home`, `Traffic`, `Planner`, `Report`, `Guest preview`, `My account` / `Sign in` or role links).
- **Footer:** `TrafficSense Mangaluru · REPORT → VERIFY → ALERT → ANALYSE` and `Demo with simulated data. Not an official traffic service.`

### Role & Access Rules
- **Public / Guest:** `/`, `/traffic`, `/planner`, `/report` (browse + sign-in prompt), `/demo`, `/about`, `/login`, `/register` require no credentials.
- **Commuter:** `/workspace` (active/past journeys, explicit employer sharing consent), `/report` submission. Blocked from `/authority`, `/employer`, `/admin` → `/access-denied`.
- **Employer (`employer-a`):** `/employer` directory and `/employer/<assigned-orgId>`. Cross-organisation access (`/employer/<other-orgId>`) is denied on the server.
- **Authority (`authority`):** `/authority` civic control room (hotspot map, rankings, L6 confirmation/resolution/rejection, recurrence heatmap, auditable incident log).
- **Admin (`admin`):** `/admin` platform oversight & verification queue (cannot execute authority L6 decisions; `/authority` redirects to `/access-denied`).

---

## 3. Screen-by-Screen UI Content & Placeholders

### 1. Home (`/`)
- **Should contain:** Hero headline (*"Report road problems and plan around them."*), `Report a problem →` & `Plan my route` CTAs, location-permission disclosure, right-hand `Corridor view` (`DESIGN PREVIEW`, `Illustration only · not a live map`), 3-column value cards (*1. Multi-source evidence L1–L5*, *2. Route intelligence ≥ 300s*, *3. Recurring hotspots*), `Choose how to explore` role cards (Commuters, Employers, Authorities), and `Delay receipts — planned extension` banner.

### 2. Live Traffic (`/traffic`)
- **Should contain:** Full-bleed OpenFreeMap/OSM interactive map with route polylines, numbered/clustered incident markers, zoom (`+`/`-`), `Recenter`, and attribution; floating left panel (`Mangaluru Live Traffic`, `6 REAL INCIDENTS` badge, filter pills `All`, `L3+ Verified`, `Accidents`, `Hazards`, clickable incident cards with `L1`–`L6` tier tags, `Plan Route In City Planner →` CTA, and `Corridor Segments & Analysis`).

### 3. Route Planner (`/planner`)
- **Should contain:** Origin & destination selectors, swap control, public bus / route options, primary route vs. explicit alternative route (drawn only after user opts in), incident warnings along corridor, free-flow vs. delay disclosures, and interactive route map.

### 4. Report a Road Problem (`/report` & `/reports/new`)
- **Should contain:** `Citizen Hazard Reporting` eyebrow + `COMMUNITY EVIDENCE` pill, `Report & Verification Workflow` info box, hazard category selection, optional description textarea, photo upload (with AI vision corroboration support), foreground location / reference point selection, and submit CTA (or sign-in prompt when guest).

### 5. Auth & Info Pages (`/login`, `/register`, `/demo`, `/about`, `/access-denied`, `not-found`)
- **`/login` & `/register`:** Email (`Email address`) & password (`Password`) inputs, role-agnostic login or commuter registration (`Create commuter account`), and cross-links.
- **`/demo` & `/about`:** Guided walkthrough of `REPORT → VERIFY → ALERT → ANALYSE`, synthetic data disclaimers, and system limits.
- **`/access-denied` & `404`:** Clear explanation of missing permissions or unknown route with safe navigation back to `/`, `/traffic`, or `/workspace`.

### 6. Commuter Workspace (`/workspace`)
- **Should contain:** `YOUR ACCOUNT` + `ROLE: COMMUTER` badge, assigned role & location privacy summary, `Commute & Journey Sharing` (`+ Start New Journey`), `Active Journeys` cards (`End Journey`, `Delay measurement: Not measured`, `EMPLOYER SHARING CONSENT` org dropdown + `Consent & Share` button + `Stop Sharing` + explicit privacy guarantee), `Past Journeys`, quick links (`City Route Planner`, `Public Traffic Map & Details`, `Submit Incident Report`), and `Sign out`.
- **Placeholder / Default select:** `"Select organisation to share journey status..."`

### 7. Employer Portal (`/employer`, `/employer/[orgId]`)
- **Should contain:** Assigned organisation list (`/employer`), `SIMULATED · <Org Name>` dashboard, `Privacy & Data Safeguards` callout (explicit consent required, no GPS/home address/device ID), `Consented Employee Journeys` list or `No active shared journeys` empty state, and `← Back to your organisations`. Unauthorized org IDs show explicit access-denied state.

### 8. Authority Dashboard (`/authority`)
- **Should contain:** `CIVIC AUTHORITY` badge, `Analysis Window` filter + `Refresh` + `Export CSV`, 4 KPI cards (`Total Incidents`, `Total Commuter Delay: Not measured`, `Top Congested Hotspot`, `Primary Trigger Cause`), `Corridor Hotspot Map` (`#1`–`#4` ranked markers, `Jump to` pills, `Big Screen Hero` / `Split View`), `Authority Problem Report`, `Corridor Hotspot Rankings`, `Active Incident Review` (L1–L5 cards with AI Vision photo evidence, `Confirm (L6)`, `Resolve Incident`, `Reject report`, `Check spread from Pumpwell`), `Recurrence Heatmap`, `Incident Cause Distribution`, `Delay by Incident Type`, and `Auditable Incident Log` table.

### 9. Admin Overview (`/admin`)
- **Should contain:** `ADMIN PLATFORM OVERSIGHT` + `DEMO ADMIN` badge, 4-column `TrafficSense Role Architecture` cards (Commuter & Employee, Employer, Traffic Authority, Platform Admin), `Active Report Verification Queue` table (`Pending Authority Review` / `Authority Confirmed (L6)` counts, tier badges, coordinates, status), and `Open Authority Civic Portal →` link.

---

## 4. UI Perfection & Redesign Checklist

1. **Responsive Consistency (Desktop `1440px` vs. Mobile `390px`):** Ensure map sidebars (`traffic-mobile.png`, `planner-mobile.png`), multi-column grids (`authority-mobile.png`, `admin-mobile.png`), and wide tables (`Auditable Incident Log`, `Active Report Verification Queue`) collapse or scroll cleanly without horizontal overflow.
2. **Header Navigation Overflow:** In `home-desktop.png` and `workspace-desktop.png`, verify right-side nav items (`Guest preview`, `My account`) maintain generous spacing and don't crowd on medium desktop widths.
3. **Clear Visual Hierarchy on Dense Dashboards:** `/authority` packs map, rankings, incident review, heatmap, cause breakdown, and audit log on one long page — consider tabbed/sectioned navigation (`Executive Dashboard Grid`, `Corridor Hotspot Map & Rankings`, `Incident Review & Verification`, `Recurrence Heatmap & Causes`, `Incident Audit Log`) so each view stays scannable.
4. **Honest Evidence & Privacy Framing:** Keep `SIMULATED`, `Not measured`, `L1`–`L6` tier pills, and zero-GPS-tracking disclosures prominent and visually distinct across every redesign iteration.
