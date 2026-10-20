# Mobile app plan

## Goal

Build an Expo React Native client for the commuter experience while retaining the existing Next.js app for web, employer, authority, and administration workflows. The mobile client uses the existing Supabase backend and must preserve the product goal: **REPORT -> VERIFY -> ALERT -> ANALYSE**.

## Phase order

1. **Shell and contracts:** Expo Router navigation, TypeScript configuration, shared package boundary, and a truthful home screen.
2. **Authentication:** Supabase session lifecycle, sign-in, sign-out, expiry, and protected commuter actions.
3. **Report:** Category selection, explicit location permission state, report submission, and failure states.
4. **Verify and alert:** Incident status, freshness, route relevance, and qualified alternative-route alerts.
5. **Analyse and sharing:** Commuter-controlled journeys, consent-based employer summaries, and read-only analytics.
6. **Native extensions:** Push notifications, optional foreground location, offline recovery, and EAS builds only after core flows pass.

## Boundaries

- The backend, migrations, RLS policies, and existing web app remain in place.
- Mobile builds read `EXPO_PUBLIC_SUPABASE_URL` and `EXPO_PUBLIC_SUPABASE_ANON_KEY`; local Docker-only service URLs are not reachable from a physical device.
- The mobile app does not duplicate server verification or authorization logic.
- No background location, continuous tracking, fabricated live traffic, or notification claim is included in the shell.
- Synthetic and estimated data remains explicitly labelled.

## Phase 1 acceptance criteria

- The app starts with Expo Router and TypeScript from `apps/mobile`.
- The first screen explains the product and exposes truthful placeholders for report, traffic, and sign-in entry points.
- The workspace installs from the root lockfile without adding another lockfile.
- Shared package exports are platform-neutral and contain no React Native or Next.js imports.
- The shell has a documented offline/error state and does not request location or authentication on launch.

Reuse domain contracts from [the shared package plan](../../../packages/shared/docs/plan.md). Record actual implementation and verification in [progress.md](progress.md).