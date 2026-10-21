# Mobile app progress

Record only mobile implementation updates, device verification evidence, blockers, and commit records here.

Cross-app changes also belong in [shared progress](../../../packages/shared/docs/progress.md).

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
