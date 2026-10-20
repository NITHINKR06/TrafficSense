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
- **Commit:** Pending.