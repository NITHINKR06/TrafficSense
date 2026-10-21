# Mobile app progress

Record only mobile implementation updates, device verification evidence, blockers, and commit records here.

Cross-app changes also belong in [shared progress](../../../packages/shared/docs/progress.md).

## LAN route API recovery — verified, 21 Oct 2026

- **Issue:** The phone showed “Traffic service is unreachable” for route planning because the LAN Next.js API container had exited. Its log identified a Turbopack crash caused by the host reaching the inotify file-watch limit; this was not a route-contract or traffic-data failure.
- **Implementation:** The Docker development app now runs Next.js with webpack and one-second Watchpack polling. This avoids Turbopack’s host watch allocation for the bind-mounted workspace while preserving the same `http://<LAN-IP>:3000` API used by Expo Go.
- **Verification:** After restart with the current Wi-Fi address, `http://192.168.0.224:3000/api/incidents` returned HTTP 200 and a LAN `POST /api/route` returned HTTP 200 with one route. The app container remained healthy and its log records webpack startup rather than a Turbopack panic. The Android Expo bundle remains available through Metro.
- **Commit:** Pending; the workspace contains unrelated mobile changes that must not be included in this runtime repair commit.

## Part A — Core native UI and navigation — implemented, device verification pending, 21 Oct 2026

- **Implementation:** Added shared mobile design tokens and the web-parity Home screen, stack titles/back behavior, refreshed login/register/workspace/report/traffic styling, clickable traffic incident details, and the canonical `/planner` route. The planner uses Part B’s real route client, labels durations as free-flow estimates, links warnings to real incident details, and keeps an alternative hidden until the commuter explicitly presses “Avoid this route.” No API, Supabase, web, or shared contract was changed.
- **Source coverage and handoff:** REPORT → VERIFY → ALERT is represented by `/report` → `/traffic` → `/traffic/[incidentId]` and `/planner`. Part B state already supplies every required auth, incident, report, and route field; no contract change is needed. Journey/consent-sharing screens remain deferred pending mobile journey state/endpoints. Employer and authority administration remain web-only. A native map is also not included in this slice; incident cards provide the accessible active-report presentation.
- **Verification:** `just mobile-typecheck`, `just lint` (web workspace lint), and `git diff --check` passed in Docker. Metro reached `packager-status:running`; the Expo Router Android bundle endpoint `/.expo/.virtual-metro-entry.bundle?platform=android&dev=true&minify=false` returned HTTP 200 after the UI changes.
- **Remaining acceptance gaps:** No Expo Go device session was available to exercise taps, login, report permission/submission, direct/deep link recovery, back stack, or phone layout. There is no configured mobile ESLint script; only the repository web lint command currently exists. The physical-device and map/journey scope gaps remain open and are not passed checks.
- **Commit:** Pending.

## Phase 1 — Expo shell — verified, 20 Oct 2026

- **Implementation:** Added the Expo Router TypeScript shell, truthful home/report/traffic placeholder screens, Expo configuration, and a platform-neutral `@trafficsense/shared` workspace package. The shell does not request authentication or location on launch.
- **Verification:** Docker dependency resolution, `pnpm --filter @trafficsense/mobile typecheck`, and Expo public-config validation passed. Expo Go, simulator/device launch, native permissions, and end-to-end mobile flows remain unverified because no device session was available.
- **Commit:** `27271f1` — `feat(mobile): start Expo client shell`.

## Phase 2 — Supabase authentication — implemented, 20 Oct 2026

- **Implementation:** Added a Supabase mobile client using secure device storage, explicit public environment variables, session restoration, sign-in, commuter registration, confirmation messaging, protected workspace navigation, sign-out, and unavailable/error states. No location permission is requested.
- **Verification:** Docker dependency resolution, Expo configuration validation, strict mobile TypeScript checking, and `git diff --check` passed. A physical device, Expo Go, session against a reachable hosted Supabase URL, and native secure-storage behavior remain unverified.
- **Commit:** `43ef3b8` — `feat(mobile): add Supabase authentication flow`.
## Mobile LAN launch — verified, 20 Oct 2026

- **Implementation:** Corrected Expo Router compatibility for the Expo SDK 58 shell and disabled optional typed-route generation, which was preventing Metro from starting.
- **Verification:** Docker Expo server is running at `exp://192.168.0.224:8081`; Metro `/status` returned `packager-status:running`. Mobile TypeScript checking passed. The local Supabase API remains loopback-only, so phone authentication is not reachable from the LAN.
- **Commit:** Pending.

> Expo CLI aligned the install to its compatible SDK 57 dependency set while starting the server. The package manifest and lockfile now record that working pairing; the original SDK 58 wording above refers to the initial scaffold.

## Expo Go blank screen fix — verified, 20 Oct 2026

- **Cause:** Expo Go reached the manifest, but the Android bundle failed first on an undeclared `query-string` import and then on SDK-57/SDK-58 React Native dependency mixing (`react-native@0.88.0` with Expo SDK 57).
- **Fix:** Declared `query-string` and ran Expo's SDK compatibility alignment. The mobile package now uses Expo `57.0.30`, Expo Router `57.0.28`, React Native `0.86.3`, and the matching SDK packages.
- **Verification:** SDK 57 manifest returned successfully, the Android Expo Router bundle returned HTTP 200 (7.4 MB), and the Docker mobile TypeScript check passed. Expo Go device rendering remains the final user-side check.
- **Commit:** Pending.

## Phase 3 — public traffic API — implemented, 20 Oct 2026

- **Implementation:** Added a platform-neutral active-incident contract, mobile API client, configurable API base URL, traffic loading/error/empty/refresh states, evidence-level presentation, and a Compose LAN-bind override for physical-device development. The default web bind remains loopback.
- **Verification:** Docker mobile TypeScript checking passed. The web API returned `{"ok":true,"incidents":[]}` at `http://192.168.0.224:3000/api/incidents`; Expo Metro returned `packager-status:running` with the LAN API URL configured. No active incident fixture was available for a populated-card/device visual check.
- **Commit:** Pending.

## Phase 4 — authenticated incident reporting — implemented, 20 Oct 2026

- **Implementation:** Added Expo foreground-location permission and current-position capture only on submit, category selection, optional note, explicit sign-in and permission-denied states, authenticated Bearer-token submission, and success/error handling. Added `expo-location` configuration and shared submission contracts. The server now accepts mobile Authorization headers while retaining web cookies and rejects unknown categories or non-finite coordinates.
- **Verification:** Docker frozen install regenerated `pnpm-lock.yaml`; mobile and web TypeScript checks passed; focused ESLint passed for the changed report/API files; all 197 project tests passed; `git diff --check` passed; unauthenticated `POST /api/incidents` returned HTTP 401 with the expected safe error. Expo Go interaction, real authenticated mobile submission, and native location permission behavior remain unverified.
- **Blockers:** A physical-device authenticated submission still requires a Supabase URL reachable from the phone and a configured mobile session.
- **Commit:** Pending.

## Phase 5 — report-to-traffic verification handoff — implemented, 21 Oct 2026

- **Implementation:** The traffic screen now refreshes whenever it becomes active, so returning from a successful report shows the latest server state. Evidence levels use plain-language labels rather than unexplained codes, and the report screen provides a direct link to active traffic reports after submission.
- **Verification:** Docker mobile and web TypeScript checks, focused mobile ESLint, and all 197 project tests passed. The Expo Android bundle remained HTTP 200 after the change. Real device submission and visual confirmation remain user-side checks.
- **Commit:** Pending.

## Phase 6 — route API integration foundation — implemented, 21 Oct 2026

- **Implementation:** Added shared mobile route request/response types matching the existing web `/api/route` contract and a typed Expo `fetchRoute` helper with finite-coordinate validation and safe invalid-response/service errors. No web or backend files were changed.
- **Verification:** `just mobile-typecheck` passed in Docker; `git diff --check` passed. Route screen rendering, live route responses and Expo Go interaction remain unverified until Part A adds the planner screen.
- **Commit:** Pending.

## Phase 7 — mobile request reliability — implemented, 21 Oct 2026

- **Implementation:** Added a shared mobile JSON request helper with an eight-second timeout, caller cancellation support, invalid-JSON handling and safe network-error messages. Incidents, report submission and route requests now use it. POST requests are not automatically retried, preventing duplicate reports.
- **Verification:** `just mobile-typecheck` passed in Docker and `git diff --check` passed. Native timeout/cancellation behavior remains unverified on a physical device.
- **Commit:** Pending.

## Phase 8 — auth failure handling — implemented, 21 Oct 2026

- **Implementation:** Supabase session restoration now fails closed when the client rejects, auth events clear the loading state, and sign-in, registration and sign-out convert network/client exceptions into stable user-facing errors. Invalid credentials remain distinct from service failures.
- **Verification:** `just mobile-typecheck` and `git diff --check` passed. Live native auth and secure-storage behavior remain unverified without an Expo Go session.
- **Commit:** Pending.

## Phase 9 — runtime API response validation — implemented, 21 Oct 2026

- **Implementation:** Mobile incident, report and route clients now validate response envelopes and required fields at runtime instead of trusting TypeScript casts. Malformed incidents, reports and routes fail closed with safe service errors; server-declared errors remain available to the caller.
- **Verification:** `just mobile-typecheck`, the full Docker test suite (197 passed, 0 failed), and `git diff --check` passed. Native request fixtures and Expo Go behavior remain unverified.
- **Commit:** Pending.

## Phase 10 — typed mobile API failures — implemented, 21 Oct 2026

- **Implementation:** Added `MobileApiError` with HTTP status, authentication-required and retryable flags. Incident, report and route failures now expose structured state for the future mobile UI instead of requiring message-string parsing.
- **Verification:** `just mobile-typecheck` and `git diff --check` passed. HTTP-state rendering remains deferred to Part A wiring.
- **Commit:** Pending.

## Phase 11 — focused mobile API tests — verified, 21 Oct 2026

- **Implementation:** Added parser and structured-error tests for valid/malformed incidents, report success/errors, malformed routes, authentication-required responses and retryable HTTP failures. The test is included in the repository suite.
- **Verification:** Docker test suite passed 201 tests with 0 failures; the test runner emitted only Node's module-type warning for the TypeScript mobile parser import. No native device behavior was claimed.
- **Commit:** Pending.

## Phase 12 — safe traffic GET retry — verified, 21 Oct 2026

- **Implementation:** The mobile request helper now retries one time only for GET requests after timeout, network failure, or retryable HTTP statuses (408, 429 and 5xx). Report and route POST requests remain non-retryable to prevent duplicate mutations.
- **Verification:** Docker mobile typecheck passed and the full test suite passed 202 tests with 0 failures, including a mocked transient GET retry and non-retryable POST assertion. Retry behavior against a real outage remains unverified.
- **Commit:** Pending.

## Phase 13 — report refresh, journey review and Expo readiness — verified/deferred, 21 Oct 2026

- **Report refresh:** Existing mobile behavior already links a successful report to Traffic, and the Traffic screen reloads on focus plus pull-to-refresh; no duplicate refresh mechanism was added.
- **Journey/sharing review:** The web has server RPCs for journeys and consent sharing, but no mobile route contract exists. Mobile journey/sharing remains explicitly deferred until a contract is agreed; no unsafe client-side GPS or employer API was invented.
- **Device check:** The existing Expo container is healthy and `http://127.0.0.1:8081/status` returned `packager-status:running`. The attempted forced image rebuild was stopped after a slow dependency export; no source failure was reported. Physical Expo Go login, permissions and authenticated report submission remain user-device checks.
- **Commit:** Pending.
