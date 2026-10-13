# Architecture

## Status and Intent

This is a proposed responsibility model, not an implemented application layout. The technology stack, hosting, map provider, routing provider, and data sources are undecided. Use [the root README](../../README.md) for current project status.

The original traffic proposal covers incident reporting, alternative routes, commute verification, and analytics. A recommended hackathon flow is:

Report a disruption → attach evidence → alert an affected commuter → share a delay summary with consent → clear or expire the incident.

Confirm scope before implementing. Full government administration, emergency dispatch, predictive traffic models, and employee monitoring are not default requirements.

## Proposed Responsibilities

| Area | Responsibility |
| --- | --- |
| Commuter experience | Journey selection, incident reporting, route alerts, sharing preview and consent |
| Incident service | Validate reports, group related reports, track freshness and resolution |
| Evidence assessment | Explain supporting signals; distinguish congestion evidence from claimed causes |
| Route assessment | Determine whether an active incident affects the selected route |
| Delay sharing | Create minimal, authorized, expiring summaries and enforce revocation |
| Employer experience | Display only summaries the viewer is authorized to access |
| Integrations | Isolate map, routing, speech, model, and notification providers |

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
3. Route assessment considers active, relevant incidents rather than alerting everyone nearby.
4. The commuter receives an explanation reflecting evidence freshness and limitations.
5. A separate sharing action creates an authorized summary, not access to the underlying journey.
6. Resolution and expiry propagate consistently to all views that read incident state.

Clients cannot grant themselves authority-confirmed status or employer access. AI outputs are untrusted suggestions, not evidence that an incident happened. Shared algorithms should have explicit public interfaces rather than imports through another feature's private internals.

## External Data and Demonstrations

- OpenStreetMap map data is not itself a live traffic feed or a routing service.
- Verify provider access, coverage, terms, attribution, and cost before promising integration behavior.
- Keep provider secrets on the server where required; restrict intentionally public map keys according to provider guidance.
- Label simulated reports, GPS traces, delays, and historical data wherever users could mistake them for live observations.
- If an integration fails, show its unavailable state. Never silently substitute synthetic data for live data.
- Treat routing around floods or closures as safety-sensitive; an alternative route is not a guarantee of safety.
