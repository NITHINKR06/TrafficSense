# Architecture

## Status and Goal

This is a planned responsibility model, not implemented domain behaviour. The official Next.js TypeScript/Tailwind starter is scaffolded with pnpm. Docker Compose provides development, isolated checks and an optional standalone production preview; see [Docker development](../../docs/docker.md). Supabase integration, map provider, hosting and access remain pending; no database service is configured yet. Use [plan.md](../../plan.md) for current decisions and [the source coverage reference](../../docs/README.md) for the original PDF's seven recommended modules and deliberate demo limits.

The main goal is **REPORT → VERIFY → ALERT → ANALYSE**. The demo combines one simulated corridor, incident evidence, a duplicate-report attack, a precomputed alternative, consent-based employer visibility, and seeded hotspot/monthly statistics. A Delay Receipt supports verification and employer sharing; it does not replace those broader goals. Its final contract and prominence await employer feedback.

Build sequentially for one active human with AI assistance: setup/auth/roles and seeds; reporting/map/evidence; slowdown and attack; receipt/employer verification; remaining thin modules; deployed verification and presentation. Every step includes tests and relevant browser checks. Do not assume four active developers or eight full days.

## Proposed Responsibilities

| Area | Responsibility |
| --- | --- |
| Auth and roles | Supabase authentication, server-enforced memberships, commuter/employee, employer and seeded authority-view roles; restricted seed/reset |
| Commuter experience | Selected demo journey, report form, map/details, route alert, explicit sharing controls and visible collection/sharing indicators |
| Incident service | Validate and deduplicate reports, group by segment/direction/time, track freshness and resolution |
| Evidence assessment | L1–L4 indicators, source counts and observed slowdown; separate congestion evidence from claimed causes |
| Simulator | Deterministic synthetic journeys, slowdown/recovery and duplicate attack, with restricted demo controls and persistent provenance |
| Alternative alert | Compare fixed primary/alternative data only when an incident affects the selected route; no routing engine |
| Delay sharing | Server-derived preview, consent, signed recipient-bound receipt, expiry/revocation; fields provisional pending employer input |
| Employer experience | Authorised receipts and explicitly shared active journeys only; no full route or unrelated observations |
| Analytics | Aggregate deterministic incident history into seeded hotspot and monthly views; explain time window, recurrence and delay units |

These responsibilities live in one Next.js application with Supabase, not extra backend services. Realtime is optional; refresh-based views show freshness explicitly. Read-only authority analytics is distinct from the optional authority-confirm action. Photos, AI, voice, native apps, full administration, and real routing remain deferred.

## Conceptual Data

- **Incident report:** authenticated source, observation/submission times, segment and direction, reported category and provenance.
- **Incident:** grouped observations, lifecycle status, timestamps and explanation.
- **Evidence assessment:** eligible sources, supporting/conflicting observations, freshness, and separate cause/congestion support. L1–L4 are indicators, not calibrated probabilities or guaranteed independent witnesses.
- **Journey:** commuter-controlled state and private segment summaries; raw pings remain local/in-memory in the demo design.
- **Shared journey:** explicit consent, intended organisation, current sharing state and limited status fields. Ending/stopping sharing removes future employer access.
- **Receipt:** server-derived issuance-time evidence snapshot, recipient, signature, expiry and revocation state; no journey trace.
- **Historical data:** deterministic dated incident records used consistently by hotspot and monthly calculations; synthetic labels are retained.

Finalise schemas and canonical signing payloads before their implementation. Keep report count, evidence support, incident lifecycle, sharing state and receipt validity distinct.

## Boundaries and Shared State

1. Clients submit observations; the server validates inputs and derives source identity, evidence status, delay and access. A browser role selector cannot grant privileges.
2. Map markers, incident details, alerts and receipt eligibility read the same incident/evidence rules. Duplicate submissions do not add independent corroboration.
3. Alert only for the affected primary segment/direction, not a nearby parallel road. Missing/stale alternative inputs yield unavailable savings; known hazards suppress recommendations. Simulated comparisons remain labelled.
4. Sharing is separate from starting a journey. The server checks recipient membership, current consent and journey state on every dashboard read; stop/end revokes access and refreshed views clear prior contents.
5. Receipt verification checks authentication, intended organisation, canonical integrity, expiry and current revocation. Signatures alone grant neither access nor proof of GPS truth.
6. Incident clearance updates current map/alert/dashboard state. Receipt evidence remains historical, with separate expiry and revocation. A previously issued receipt does not become live evidence of current congestion.
7. Hotspot and monthly totals derive from the same dated history. Newly reported incidents affect aggregates only within the selected period; historical-only views explicitly state that boundary.
8. Account switching, logout, refresh and direct links must not retain another user's protected data. Test every surface sharing changed state, including employer and analytics views.

## Privacy and Demo Limits

- Employers receive an allowlisted summary, never raw coordinates, geometry, home location, unrelated journeys or unrestricted history. Even coarse zone/time data is sensitive.
- Real data collection waits for defined consent, retention/deletion and access rules. A web app does not promise reliable background GPS.
- Consent revocation stops subsequent server access; it cannot recall copies a viewer already saved. Explain this limit.
- OSM-derived map tiles are not a live traffic feed. Check provider terms, attribution, coverage, quotas and key handling before integration.
- Preserve **SIMULATED** labels on map observations, alerts, dashboard data, receipts and historical statistics. Never silently substitute synthetic data after a provider failure.
- The duplicate-report demo establishes only the tested control. Distinct accounts, low speed and signatures do not prove a real jam, true cause, or person-level lateness.
- A precomputed alternative is not a safety guarantee, and historical patterns support suggested investigation rather than infrastructure decisions.

## Scope Changes

Follow the fallback order in the plan: CSV and authority confirmation; Realtime; then the live employer table while retaining receipt verification. The last fallback leaves partial employer-dashboard coverage and must be disclosed. Do not remove receipt protections or silently drop another recommended module. Update the source coverage reference and plan when scope changes.
