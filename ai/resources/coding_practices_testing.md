# Testing and Browser Verification

Use the test framework and scripts configured by the chosen stack. There is no application test command yet; do not claim one ran until tooling exists.

## Automated Tests

Test observable behavior rather than internal function-call sequences. Prefer real inexpensive dependencies and isolate external providers through controlled responses. Use synthetic fixtures without personal location histories. Control clocks for expiry tests rather than relying on arbitrary sleeps.

Prioritize these cases when the corresponding feature is implemented:

- Invalid coordinates, malformed timestamps, unsupported uploads, and missing fields are rejected.
- Duplicate reports and retried submissions do not inflate independent evidence.
- Congestion corroboration does not automatically confirm an accident or another claimed cause.
- Old or resolved incidents stop producing current alerts.
- A route intersecting a disruption is alerted; an unrelated or nearby parallel route is not incorrectly alerted.
- Incident updates remain consistent across all readers.
- Sharing requires an explicit action and exposes only the selected summary fields.
- Unauthorized users cannot access journeys, evidence, or employer summaries by changing IDs or opening direct URLs.
- Expired and revoked shares are denied by the server, not merely hidden in the interface.
- Provider failure remains distinguishable from an empty result and from simulated data.

Use unit tests for rules, integration tests for persistence and authorization, and end-to-end tests for the complete user flow. No universal coverage percentage is required.

## Mandatory Browser Workflow for Web Changes

1. Start the app using its documented command and open it with available browser tools.
2. Exercise the changed behavior as a user: click, type, submit, navigate, and inspect the actual outcome.
3. Visit every page or route sharing the changed components, state, or data. Verify consistency after navigation and reload.
4. Actively test affected edge states and surrounding existing flows. A screenshot or successful render alone is insufficient.
5. For layout or styling changes, check desktop and mobile widths, including overflow, overlays, and map controls.
6. Check console and network failures when tools permit, without exposing sensitive request contents.
7. Fix discovered problems and repeat the affected checks before declaring completion.

For the proposed reporting-to-sharing flow, verify report creation, supporting-evidence display, relevant and irrelevant routes, share preview, employer access, revocation, and incident clearance when those capabilities exist.

If browser tools are unavailable, use the closest available substitute, such as automated UI tests, rendering checks, or HTTP checks. Explicitly state which interactions and visual states remain unverified.

## Results

Report the commands and flows actually checked and their outcomes. Distinguish skipped, blocked, and failed checks. Never describe a mocked integration test as verification against a live provider.
