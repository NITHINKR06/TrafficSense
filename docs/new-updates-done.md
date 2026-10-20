# TrafficSense: Final Hackathon Plan

This replaces UPDATES_CHECKLIST.md. Work only from this file.

## Decisions (made, not open)

- **D1 Delay:** No live delay numbers. Show reported incidents and free-flow time, labelled "free-flow time, live delay not measured". Reason: the app does not measure live speed, and a made-up number would break the project's honesty rule.
- **D2 Area:** Mangaluru city only, using the existing place presets. Mangaluru to Udupi is a later extension.
- **D3 Order:** Citizen reporting first. It is the source of all real data, so everything else depends on it.

## What the code actually does (verified)

- `/reports/new` picks from simulated road segments. No GPS. **Must change.**
- `/api/incidents` and `submit_live_incident_report` accept GPS reports from signed-in users, with clustering and levels. **Keep.** It is the real engine.
- Route planner (`/planner`) picks start and destination from a dropdown of fixed presets. There is no search box. It can use GPS for the start. It already shows live incidents on the route. **Keep, simplify.**
- Authority dashboard shows built-in historical data by default. The toggle turns on "synthetic history". Live reports are real. **Keep live counts, remove the default fake view.**
- Landing and About pages use developer terms ("L1–L4", "deterministic simulation"). **Rewrite.**

## The demo (the spine; judges see this in 3 minutes)

1. Problem: one slide or one sentence.
2. A signed-in commuter reports "Accident" at their GPS location.
3. Two more test accounts confirm nearby. The incident turns into "3+ people confirmed".
4. The map shows the incident as a real marker.
5. A passenger planning a route from the same area gets a warning and an "Avoid this route" option, with the alternative's time.
6. Employer sees the shared commute status (consent visible).
7. Authority sees the count of real incidents per place.

Anything not in these 7 steps is not required for the demo.

## Must-have (do in this order)

Each item has a "done" test. Tick only when that test passes in a browser on a phone-sized screen (390px) and a laptop screen (1440px).

- [ ] **M1. Plain-language home page.** One sentence about what the app does, two buttons: "Report a problem" and "Plan my route". Remove L1–L4 and "simulation" wording from the home page.
  - *Done when:* a person who has never seen the app can say what it does after 5 seconds.

- [ ] **M2. Citizen report uses GPS.** *Status correction:* the route planner (`src/components/routing/route-planner.tsx`) already has a GPS report form that posts to `/api/incidents`. The old `/reports/new` page still uses simulated segments. Task: make the planner's GPS report the one citizen report flow, reachable from the home page, and retire the segment-based form from citizen use. Add: small map with pin adjustment, 17 category buttons, plain-language result message.
  - *Done when:* a signed-in user reports an accident at their location and sees "Reported. 1 person has reported this."
  - *Also:* clear message when location is denied, and a sign-in prompt when not signed in.

- [ ] **M3. Live map of real reports.** Main map shows incidents from `read_active_live_incidents`. Tap a marker to see type, time, number of reporters, and level in plain words. Empty state: "No reports in the last 3 hours."
  - *Done when:* the marker from M2 appears on the map within 60 seconds.

- [ ] **M4. Route warning and avoid.** *Status correction:* the planner already warns about incidents and automatically selects an avoiding route (`avoids_incident`, "Automatic Incident Avoidance Detour"). Task: make it an explicit choice for the passenger: show the warning card with type and place, a "Avoid this route" button, and the time difference, all labelled "free-flow". Do not auto-switch without the user's choice.
  - *Done when:* the route changes after the button is pressed and the warning text matches the incident from M2.

- [ ] **M5. Employer view cleanup.** Employer sees only employees who chose to share, with route, status, and when sharing started. No coordinates shown. Employee can stop sharing in one tap.
  - *Done when:* a test employee shares, the employer sees them, the employee stops, and the employer no longer sees them after a refresh.

- [ ] **M6. Authority view uses real counts.** Turn off the default synthetic history. Show live incident counts per place and category, with a clear "Live reports only" label. Keep the synthetic history behind an explicit toggle, labelled.
  - *Done when:* the counts on screen match the incidents created in M2 and M3.

- [ ] **M7. Seeded test data, labelled.** Seed a few realistic incidents with Mangaluru place names (Hampankatta, Pumpwell, Kottara, Thokkottu) and test accounts. Every seeded item shows a "TEST DATA" label.
  - *Done when:* the demo can run from a fresh `just up` with no manual setup.

- [ ] **M8. Demo proof.** Run `just check`. Run `just test-core-loop`. Record the 7-step demo on a phone. Update `docs/progress.md` with results and failures.
  - *Done when:* the recording exists and the check results are written down.

## Stretch (only if all of M1–M8 are done)

- [ ] **S1.** Photo evidence on a report (phone camera, private storage, raises level).
- [ ] **S2.** Monthly summary export (CSV) of live reports.
- [ ] **S3.** Notification when a 3+ confirmed incident appears near a saved route.

## Parked (not for this hackathon)

Kannada and Tulu labels, voice reports, AI photo classification, predictions, mobile app, city APIs, Mangaluru to Udupi corridor, delay receipts, admin panel beyond what exists.

## Rules for every change

- One item at a time. Finish and test it before starting the next.
- Remove jargon from anything a user sees.
- Label every simulated or test value.
- Commit each finished item separately, and note the commit in `docs/progress.md`.

## Verified status of must-haves (checked in code, not from file names)

| Item | Status | What the code shows |
|---|---|---|
| M1 Plain-language home | Missing | Home page still has "Verification ladder (L1–L4)" and "deterministic" wording |
| M2 GPS citizen report | Partly built | Planner already has a GPS report posting to `/api/incidents`; `/reports/new` still uses simulated segments |
| M3 Live map of real reports | Missing on map | `/traffic` map does not load live incidents; only the planner does |
| M4 Route warning + choice | Partly built | Warning and automatic avoiding route exist; no passenger choice button yet |
| M5 Employer view cleanup | Partly built | Consent sharing works; page is labelled SIMULATED and says delay is not measured |
| M6 Authority real counts | Mostly built | Default view is live reports only; synthetic history is behind a toggle (off by default) |
| M7 Labelled test data | Mostly built | `scripts/seed-demo.mjs` creates demo accounts and submits through the real live-report path; needs Mangaluru place names and TEST labels |
| M8 Checks and recording | Not started | Not yet run |

Revised order by value for the demo: M3 (map shows real reports), M1 (home page), M4 (passenger choice), M2 (make the planner report the citizen flow), M5 and M6 (labels and cleanup), M7 (seed data), M8.
