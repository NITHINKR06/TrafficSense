# Architecture

## Status and Intent

This is a proposed responsibility model, not an implemented application layout. The technology stack, hosting, and map provider are undecided. The core demo uses clearly labelled simulated observations; routing integration is deferred. Use [the root README](../../README.md) for current project status.

The focused hackathon scope is recorded in [plan.md](../../plan.md):

Report a disruption → inspect evidence on a live-updating map → demonstrate a rejected duplicate-report attack → preview and share a limited delay receipt → verify as the intended employer → revoke.

The map updates application state; it is not a connected live traffic feed. Simulated observations and receipts remain labelled throughout the flow. Signatures establish receipt integrity and origin, not GPS truth or the cause of lateness.

Rerouting, AI, photo verification, native apps, and authority analytics are deferred. A fixed-route relevance alert is optional after the core flow passes. Confirm stack and event constraints before implementation.

## Proposed Responsibilities

| Area | Responsibility |
| --- | --- |
| Commuter experience | Demo journey selection, incident reporting, sharing preview, consent and revocation |
| Incident service | Validate reports, group related reports, track freshness and resolution |
| Evidence assessment | Explain supporting signals; distinguish congestion evidence from claimed causes |
| Optional route assessment | Determine whether an incident affects a fixed demo route; no alternative routing |
| Delay sharing | Create minimal, authorized, expiring summaries and enforce revocation |
| Employer experience | Display only summaries the viewer is authorized to access |
| Map and simulator | Isolate the chosen map provider and restrict synthetic observation controls to demo mode |

These may live in a single application. Separate responsibilities do not require separate services or deployments.

## Conceptual Data

- **Incident report:** a source account's observation, observation and submission times, location, claimed category, and optional evidence references.
- **Incident:** grouped reports and lifecycle state, with timestamps and an auditable explanation for status changes.
- **Evidence assessment:** supporting and conflicting signals, their provenance and freshness, and separate assessments for congestion and cause.
- **Journey:** the commuter's selected route and explicit journey state. Precise locations are private by default.
- **Delay summary:** the minimum information intentionally shared, intended audience, expiry, and revocation state.

Finalize schemas during implementation. Do not collapse report count, incident status, and confidence into one field.

## Boundaries and Data Flow

1. The client submits a report; the server validates it and checks access rules.
2. Incident logic associates evidence using explicit spatial and time criteria.
3. Evidence status and receipt eligibility are derived server-side; duplicate submissions do not add independent corroboration.
4. The commuter receives an explanation reflecting evidence freshness and limitations. Optional route alerts consider only the selected fixed route.
5. A separate sharing action creates a signed, recipient-restricted summary, not access to the underlying journey. Every employer read checks authentication, organisation membership, receipt expiry, and revocation.
6. Incident resolution and expiry propagate consistently to current incident views. Receipt evidence remains an issuance-time snapshot with its own expiry and revocation state.

Clients cannot assign verification status, sign their own delay claims, or grant employer access. Shared algorithms should have explicit public interfaces rather than imports through another feature's private internals.

## External Data and Demonstrations

- OpenStreetMap map data is not itself a live traffic feed or a routing service.
- Verify provider access, coverage, terms, attribution, and cost before promising integration behavior.
- Keep provider secrets on the server where required; restrict intentionally public map keys according to provider guidance.
- Label simulated reports, GPS traces, delays, and historical data wherever users could mistake them for live observations.
- If an integration fails, show its unavailable state. Never silently substitute synthetic data for live data.
- Treat routing around floods or closures as safety-sensitive; an alternative route is not a guarantee of safety.
