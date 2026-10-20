# TrafficSense UI Review (current build)

Source: `screens.zip`, folders `public/`, `commuter/`, `employer-a/`, `authority/`, `admin/`.
Excluded: `old-ui/` (as requested).
Scope: 40 current screenshots (desktop and mobile).

Status key: [ ] = not fixed yet. Tick when fixed and rechecked in a browser at 1440px and 390px.

---

## 1. Bugs (fix first)

- [ ] **B1. Authority page contradicts itself.** `authority/authority-desktop` and `authority-mobile`.
  The "Active Incident Review" panel shows "Active incidents could not be loaded. Refresh to retry." and directly below it "No active incidents need authority review." Both cannot be true. Check the data-loading path and show one state only.

- [ ] **B2. Impossible recurrence sentence.** `authority/authority-desktop`.
  The heatmap says "Congested on 2 of the last 1 weekdays." The count is wrong: a number of days cannot exceed the number of days counted. Fix the counting logic in the recurrence statement.

- [ ] **B3. Unmeasured delay shown as zero.** `authority/authority-desktop` and `authority-mobile`.
  The hotspot table shows "0 hrs" and "~0 min" average delay. The cause table shows 0 hours. The summary card above says "Not measured." Live reports do not measure delay, so every table should show "Not measured", not 0.

- [ ] **B4. Planner warns about a single report, against its own rule.** `public/planner-desktop` and `planner-mobile`.
  The methodology box says warnings apply to L3+ incidents. The screen still shows a red warning and a yellow banner for one L1 road closure. The two messages repeat each other. Show one message, and only for incidents that meet the stated rule (or change the rule text).

- [ ] **B5. Blank button on the route card.** `public/planner-desktop` and `planner-mobile`.
  The green button under "Ready to commute?" has no visible label. Probably the "Track this journey" action with text the same colour as its background. Check contrast and add the label.

- [ ] **B6. Guest page contradicts the planner.** `public/demo-desktop`.
  The button "Try a simulated report" leads to the planner, which submits real reports. Change the wording or the destination so they match.

- [ ] **B7. Route comparison shows durations while saying traversals are missing.** `commuter/traffic-mobile` (segment "Primary west · outward", section "Fixed alternative comparison").
  The comparison bars show "Primary Corridor 13 min" and "Fixed Alternative 7 min," and in the same box it says "NO ALERT" and "Completed route traversals are missing." If no traversals exist, do not show durations or bars. Show "Not measured" instead.

---

## 2. Wording for developers (replace with plain words)

- [ ] **W1.** "Development preview" badge on every page (header). Remove it from the public build, or show it only in development.
- [ ] **W2.** "Demo auth" badge and "Email confirmation is disabled for local testing" on `public/login` and `public/register`. Hide from users.
- [ ] **W3.** "Traffic severity · simulated reader" in the map legend (`public/planner`). Use "Current reports" or similar.
- [ ] **W4.** "Role access navigation" on `commuter/workspace`. Use "Go to".
- [ ] **W5.** "Consent-enforced · No GPS tracking" on `commuter/workspace`. Use "You control who sees your status."
- [ ] **W6.** "Journey timing is not measured in this build" on `commuter/workspace` and `employer-a/employer-org-a`. Use "Delay is not measured yet."
- [ ] **W7.** "Corridor view … coming in later phases" on `public/home`. Remove the phase language.
- [ ] **W8.** "Guest reporting creates a temporary 24-hour token" on `public/demo`. Use "Your guest report stays visible for 24 hours."
- [ ] **W9.** "Unverified Incidents" as the primary cause on `authority`. Use "Cause not yet reported."
- [ ] **W10.** "Synthetic account setup is available only through local development tooling" on `admin`. Remove from user view.
- [ ] **W11.** "Verification Evidence Ladder (L1–L6)" on `public/traffic` and `public/about`. Use plain labels: "1 person reported," "3+ people confirmed," "Official action."

---

## 3. Layout problems

- [ ] **L1. Traffic page is too long.** `public/traffic-desktop` and `traffic-mobile`.
  The map sits below a long evidence ladder and many paragraphs. On a phone the map is far down the page. Move the map to the top and collapse the rest under "Details."

- [ ] **L2. About page is dense and written for developers.** `public/about-desktop`.
  It contains an SQL verification guide and a wide table whose right-hand column is cut off. Keep one short summary on the page and move the technical detail to a separate document.

  Mobile (`public/about-mobile`, part 2): the "Verification Matrix" table is cut off on the right. The "Status & Provenance" labels are truncated and the proof column is off-screen. Use stacked rows on mobile.

- [ ] **L3. Map legend covers the map on mobile.** `public/planner-mobile`.
  The legend sits over most of the small map. Collapse it into a button or put it below the map.

- [ ] **L4. Hotspot table is cramped on mobile.** `authority/authority-mobile`.
  The historical log wraps dates onto three lines and squeezes columns. Show fewer columns on mobile, or use stacked cards.

- [ ] **L5. Truncated labels on mobile.** `authority/authority-mobile`.
  "Ambedkar (Jyothi) …" and "Unverified I…" are cut off in summary cards.

- [ ] **L6. Next.js development badge.** Appears as a round "N" on most screenshots. It is a development-only indicator and will not appear in production. Confirm in the production build before the demo.

---

## 4. Missing or placeholder

- [ ] **M1. Admin page is a placeholder.** `admin/admin-desktop`.
  Shows one message and no user list, incident tools, or organisation management. The PDF requires these (section 14).

- [ ] **M2. Authority hotspot map is nearly empty.** `authority/authority-desktop`.
  Shows grey lines and one marker, so it gives little information. Either show the real junction positions with counts, or hide the map until there is data.

- [ ] **M3. Employer page is empty in the demo.** `employer-a/employer-org-a-desktop`.
  Shows "No active shared journeys." The employer part of the demo only works after a commuter shares a journey. Add this step to the demo script, and seed one shared journey for the demo.

- [ ] **M4. Organisation names include "SIMULATED ·".** `employer-a/employer-list-desktop` and `employer-org-a-desktop`.
  Useful for the demo, but it must be removed or made configurable before a real deployment.

- [ ] **M5. Admin is denied on the authority page.** `admin/authority` redirects to `/access-denied`.
  Confirm this is the intended rule. If admin should see authority data, change the access rule.

---

## 5. Working well (keep)

- [x] Home page: two clear actions, "Report a problem" and "Plan my route", on desktop and mobile.
- [x] Planner: live map with incident markers, route warning, and an explicit "Avoid this route" choice.
- [x] Access-denied page for commuters trying to open the authority page.
- [x] Employer: other organisations return "Page not found," which does not reveal that they exist.
- [x] Employer page explains consent and privacy clearly.
- [x] Login, register, and 404 pages are clean and easy to use.
- [x] Commuter workspace has a clear "Start New Journey" action.

---

## 6. Mobile review (all 15 checked)

Each file below was opened and reviewed. Findings are noted per file.

- [x] `public/about-mobile`: layout fine apart from the cut-off verification table (see L2). The content is a technical specification, not user guidance (see W11 and L2).
- [x] `public/login-mobile`: fine.
- [x] `public/register-mobile`: fine. The password hint "Use 12–128 characters" is partly covered by the development badge (development only, see L6).
- [x] `public/demo-mobile`: layout fine. Wording issues already listed (W8, B6).
- [x] `public/not-found-mobile`: fine. The footer text is partly covered by the development badge (development only, see L6).
- [x] `commuter/access-denied-authority-mobile`: fine.
- [x] `commuter/planner-mobile`: same as the public planner. Issues B4, B5, L3, W3.
- [x] `commuter/traffic-mobile`: map appears early on mobile, good. Problems: every segment repeats "Delay: —," every ladder step repeats "Threshold not reached," the route comparison contradiction (B7), and the long page below the map (L1).
- [x] `employer-a/employer-list-mobile`: fine.
- [x] `employer-a/employer-org-a-mobile`: fine. Empty state is clear. "Consented Employee Journeys (0)" heading wraps awkwardly beside the refresh note.
- [x] `employer-a/employer-org-b-denied-mobile`: fine. Shows "Page not found" by design.
- [x] `employer-a/workspace-mobile`: fine. The "View your organisations" button is partly covered by the development badge (development only, see L6).
- [x] `authority/planner-mobile`: same as the public planner. Issues B4, B5, L3, W3.
- [x] `admin/admin-mobile`: fine layout. Placeholder content (M1) and wording (W10).
- [x] `admin/authority-mobile`: fine. Access denied, as on desktop (M5).

Newly found mobile problems: B7 (route comparison contradiction) and the about-page table (L2).

---

## 7. Suggested order

1. B1–B7 (correctness bugs).
2. W1–W11 (wording).
3. L1, L3 (traffic and planner layout, the first two screens a judge sees).
4. M1, M3 (admin placeholder and the demo employer step).
5. Remaining layout items and the unchecked mobile screens.

Each fix should be rechecked in a browser at 1440px and 390px. Record the result in `docs/progress.md`.