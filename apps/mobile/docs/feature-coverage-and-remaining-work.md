# TrafficSense feature coverage and remaining work

This document is the single mobile-team checklist for the complete TrafficSense experience. It covers the shared product goal, the existing web surface, the Expo mobile surface, verification evidence, and the work still needed before a feature can be called complete.

The product goal is **REPORT → VERIFY → ALERT → ANALYSE**. “Implemented” means code exists. “Verified” means the recorded check actually passed. “Device pending” means local code checks passed but a real Expo Go/device interaction is still required.

## Current verification snapshot

- Docker project test suite: **197/197 tests passed**.
- Local LAN demo: `just mobile-lan 192.168.0.224` started Supabase, seeded demo data, started the web API, started Expo, and printed a QR for `exp://192.168.0.224:8081`.
- Web/API: local HTTP/API startup and core report, evidence, routing, sharing, authority, and analytics logic are covered by the repository tests and recorded progress entries.
- Mobile static checks: Docker dependency resolution, Expo configuration, TypeScript, the Android bundle check, and focused lint checks passed for the implemented mobile slices.
- Real-device acceptance is still pending for Expo Go rendering, authentication against a phone-reachable Supabase URL, native location permission, and an authenticated report submission.
- Hosted deployment, production credentials, and real traffic data are not verified by local Docker checks.

## Feature coverage

| Product feature | Web/API status | Mobile status | Remaining acceptance |
| --- | --- | --- | --- |
| Home and navigation | Implemented with plain-language Report and Plan actions | Implemented Expo home and route entry screens | Verify mobile navigation and small-screen layout on a device |
| Authentication | Supabase auth, role guards, registration, login, logout, recovery and server authorization implemented | Supabase sign-in, commuter registration, secure session persistence, protected workspace and sign-out implemented | Device sign-in, confirmation, restart/session restoration, invalid session, account switching and outage recovery |
| Report a problem | Canonical planner report flow supports categories, location guidance, authenticated reporting, validation and safe server errors | Category selection, optional note, foreground location on submit, permission-denied state, Bearer-token submission and success/error states implemented | Real permission grant/deny, location unavailable, authenticated phone submission, duplicate/rate-limit/rejection UX |
| Report identity and privacy | Server derives identity, enforces authorization, quotas, validation and public projection boundaries | Uses the existing server contract; does not duplicate authorization | Confirm no private fields appear in mobile/public responses during device and API checks |
| Verify report evidence | L1–L6 evidence rules, source counting, freshness, lifecycle and authority actions implemented in server/web | Mobile traffic screen displays active incident type, count, level and plain-language status | Confirm the post-report refresh on a device; add a mobile report-history/status view if required |
| Live traffic reports | `/api/incidents`, map markers, details, refresh and empty state implemented | Traffic screen has loading, error, empty, refresh and active-incident presentation | Device visual check with populated incidents and offline/retry behavior |
| Route relevance and warnings | Route planner uses directed route relevance, incident warning, explicit avoid choice and free-flow labels | Mobile route-alert screen is not yet implemented | Define mobile route contract, selected corridor, active/stale/expired states, alternative choice and unrelated-route negative tests |
| Alternative routes | Existing route engine and web planner compare supported alternatives conservatively; hazards can suppress recommendations | Not yet exposed as a complete mobile flow | Implement mobile alternative cards and verify no false alerts for parallel/unrelated routes |
| Journey tracking | Commuter-controlled journey start/end and shared summary flow implemented on web/API | Not yet implemented as a complete mobile flow | Add foreground-only journey state, start/end, expiry and failure handling without background tracking |
| Employer sharing | Consent-based allowlisted employer summaries, organization authorization, stop/revoke and no-coordinate boundary implemented | Not yet implemented as a complete mobile flow | Add preview, recipient selection, allowlisted fields, stop sharing and revocation/error states |
| Authority review | Authority dashboard can confirm, resolve or reject active incidents with bounded history and authorization | Mobile authority surface is not in scope by default | Keep authority workflow web-only unless scope is explicitly expanded; do not expose privileged actions in a client selector |
| Analytics | Hotspots, monthly totals, recurrence and cause summaries use defined windows and synthetic provenance | Mobile analytics surface is not implemented | Decide web-only versus mobile scope; if added, preserve date windows, evidence boundaries and empty states |
| Delay receipts | Protected receipt extension is planned/provisional and follows employer input; it is not a replacement for traffic features | Not implemented | Do not begin until core sharing is complete and receipt fields, signing, expiry, recipient binding and revocation are approved |
| Notifications | Not claimed; no push permission or notification delivery is implemented | Not implemented | Add only after alert contracts are stable, with consent, preferences, token revocation and provider-failure handling |
| Offline operation | Web/API failure and empty states exist; no general offline queue is claimed | No durable offline queue is implemented | Add only for safe/idempotent operations with retry, conflict, retention and sign-out clearing rules |
| LAN phone development | `mobile-lan <ip>` binds the API/Supabase/Expo services and prints a QR | Verified as a local command and QR renderer | Phone must scan successfully on the same trusted LAN; firewall and router isolation remain environment-specific |

## Remaining work, in priority order

### 1. Complete real-device acceptance

- Open the QR-generated project in Expo Go on an Android phone using the current SDK-compatible Expo Go version.
- Confirm the phone can load the app and that the home, auth, traffic and report screens render without clipped controls or horizontal overflow.
- Sign in with a local seeded commuter account and confirm registration/login errors are understandable.
- Close and reopen Expo Go to verify session restoration; sign out and confirm protected workspace data disappears.
- Grant location permission only when submitting a report; verify denied and unavailable states do not submit fabricated coordinates.
- Submit an authenticated report, confirm the success state, navigate to Traffic, refresh, and confirm the new server state appears.
- Record device model, OS, Expo Go version, LAN address, commands, screenshots or video location, and failures in `apps/mobile/docs/progress.md`.

### 2. Harden mobile auth and failure handling

- Verify malformed credentials, invalid credentials, duplicate registration, missing environment variables, expired sessions and invalid refresh sessions.
- Verify account switching cannot display the previous account’s protected workspace or report data.
- Verify network outage and recovery during login, session restoration, sign-out and report submission.
- Add focused mobile tests for auth state transitions and protected navigation where practical.

### 3. Finish mobile report and verification UX

- Add a signed-in report history/status view separate from public active incidents.
- Show lifecycle state, freshness, evidence level and plain-language limitations; do not state that a reported cause is proven.
- Handle duplicate, rate-limited, expired, resolved and server-rejected reports explicitly.
- Refresh/invalidate report and traffic queries after submission.
- Confirm that public responses never expose account identity, private notes or unrestricted coordinates.

### 4. Implement mobile route alerts

- Reuse the existing directed route-relevance rules instead of creating a second evidence algorithm.
- Add corridor/route selection without continuous tracking.
- Show alerts only for current incidents affecting the selected route and distinguish active, stale, resolved and expired records.
- Require an explicit commuter choice before showing an alternative.
- Label all route durations as free-flow estimates when they are not measured delays.
- Add loading, empty, stale, offline and provider-failure states plus unrelated/parallel-route negative tests.

### 5. Implement mobile journeys and consent sharing

- Add commuter-controlled start/end state and foreground-only collection boundaries.
- Add a preview showing the recipient and exact allowlisted summary fields before sharing.
- Add stop-sharing/revocation and clear the mobile view after server denial.
- Verify wrong organization, expired share, revoked share, account switch and direct-access cases against the server.
- Never send raw GPS history, route geometry, home location or unrelated observations to an employer.

### 6. Finish quality and release checks

- Resolve the known full-lint issue in `apps/mobile/app/traffic.tsx` without weakening lint rules.
- Run mobile typecheck, focused lint, full unit tests, route type generation, web typecheck and production build after each feature slice.
- Verify development and production-preview API behavior separately.
- Check Android and iOS configuration/bundles if both platforms are targets.
- Review accessibility: labels, status announcements, readable errors, keyboard/focus equivalents where applicable, and touch-target sizes.
- Review LAN exposure, environment variables, public keys, secure storage, and production origins before any hosted deployment.

## Deliberate scope boundaries

These are not missing bugs; they are intentionally excluded until separately approved:

- Background or continuous location tracking.
- Fabricated live traffic, inferred causes, confidence percentages or guaranteed travel-time savings.
- Employer access to raw GPS, full journey history or unrestricted coordinates.
- Push notifications before route-alert contracts and consent are complete.
- Offline mutation queues before idempotency, retention and conflict rules are defined.
- Delay receipts before core report, verification, alert and consent-sharing flows are complete.
- Native EAS release claims before Expo Go/device acceptance and hosted configuration are verified.

## Definition of complete

The mobile feature set is complete only when:

1. REPORT works on a real phone with explicit location permission and authenticated server authorization.
2. VERIFY shows current evidence, source limits and expiry without claiming more than the data proves.
3. ALERT is route-relevant, conservative, explicitly chosen and honest about estimates.
4. ANALYSE/sharing exposes only authorized summaries and preserves consent/revocation boundaries.
5. Loading, empty, denied, stale, offline and provider-failure states are covered.
6. Docker tests, typechecks, lint, build and required browser/device checks pass and are recorded in the appropriate progress files.
7. Remaining gaps, scope cuts and hosted limitations are documented rather than silently treated as complete.

## Phone test command

From the repository root, on a trusted LAN:

```bash
just mobile-lan 192.168.0.224
```

Replace the address with the computer’s LAN IP. Scan the printed QR in Expo Go. `just mobile-up` remains a localhost-only development command and is not the phone acceptance path.
