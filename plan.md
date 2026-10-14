# Project Plan — TrafficSense (working name)

>  Narrows the v2 proposal before coding, following the user's scope recommendation. Keeps evidence-based traffic verification, a privacy-conscious Delay Receipt, employer verification, a live-updating map, and a simulated fake-report attack. Defers routing, AI, photos, native apps, and authority analytics.
> **Tagline (draft):** *Share traffic-delay evidence, not your travel history.*
>
> **Verification note:** This is a plan, not an implemented product. External citations, legal dates, provider availability, prices, and competitor claims have not been independently verified. Supplied hackathon winner examples and judging weights are background material, not verified facts or this event's rubric. A signed receipt establishes integrity and origin, not the truth of GPS observations or the cause of employee lateness.

## Evidence labels

| Label | Meaning |
| --- | --- |
| `[R]` | Supplied research with a source in section 7; not independently checked. Verify before quoting. |
| `[A]` | Assumption or proposed design; requires validation. |
| `[T]` | Target to measure, not an achieved result. |
| `[V]` | Verified application result. None exist yet. |

## 1. Current Status and Core Idea

- Working name: TrafficSense / RoadAlert; final name undecided.
- Proposed track: Smart Mobility & Traffic Intelligence, based on the employer-originated problem statement. Actual event fit is unconfirmed.
- Stage: planning. Implemented: documentation and a private repository only. No application code, integrations, or application tests exist.
- **Scope direction confirmed by user:** evidence-based traffic verification → limited Delay Receipt → employer verification, supported by a polished map and a simulated attack demonstration.
- **Still blocking implementation:** event rules and deadline, team size and skills, final stack, map provider, and consent/retention defaults.
- Planning assumption `[A]`: 3–4 people, 24–48 hours, a mobile-first web demo on one corridor with labelled simulation. Section 10 includes 24-, 48-, and 72-hour variants; none is a confirmed deadline.

### Target users and value

| User | Need | Proposed value | Validation needed |
| --- | --- | --- | --- |
| Commuter / employee | Explain a traffic-related delay without sharing a complete journey | Choose a limited summary, preview its recipient and contents, share and revoke it | Would commuters voluntarily use it and understand its limits? |
| Employer reviewer | Evaluate a delay claim without browsing employee travel history | Inspect an authorised, tamper-evident summary and supporting evidence | What evidence would be useful, and would it change a real workflow? |

**One-sentence pitch:** TrafficSense lets commuters voluntarily share a tamper-evident traffic-delay summary with an employer, with visible supporting evidence and without exposing the full travel history.

**Primary demonstration:** report → inspect evidence on the map → challenge it with a fake-report attempt → preview and share a receipt → verify as the intended employer → revoke.

**Success:** one repeatable end-to-end flow; fabricated report volume cannot promote the scripted attack to corroborated congestion; the employer receives only permitted fields; tampered, expired, revoked, and cross-organisation access fails. These are targets, not results. Real-world value requires user validation.

## 2. How We Maintain This File

1. Update the relevant task before implementation, with scope, owner, dependencies, and acceptance checks.
2. Use proposed / ready / in progress / blocked / completed / deferred; do not mark a task complete without evidence.
3. Record implementation separately from verification, including commands, browser interactions, failures, and limitations.
4. Keep assumptions, targets, supplied research, and verified results distinct.
5. Preserve the scope exclusions until an explicit decision changes them.
6. Keep secrets, personal journeys, and credentials out of documentation and fixtures.
7. Pitch claims must trace to verified results or checked sources. Label simulated observations and estimated delays wherever displayed.

## 3. Problem, Scope, and Non-goals

The supplied problem statement asks for commuter traffic information and employer visibility. This plan prioritises voluntary delay sharing over continuous employee monitoring. Confirm with the employer that this narrower interpretation meets the event requirement.

### Required hackathon scope

| Capability | Minimum deliverable |
| --- | --- |
| Reporting | Select a point on the demo corridor, category or "Unknown", and submit a timestamped report. Foreground GPS is optional, with a permission-denied fallback. |
| Evidence-based verification | Server-side rules show reports, distinct source signals, slowdown observations, freshness, and reasons for the current status. Cause evidence stays separate. |
| Live-updating map | Incident markers and a details panel update after reports, corroboration, and expiry. Desktop and mobile layouts; visible simulated/live provenance. "Live-updating" does not mean a connected live traffic feed. |
| Simulated attack | Submit one fabricated report and repeated reports from the same authenticated demo source. Show why duplicates do not count as independent corroboration and why the claim is not promoted. |
| Delay Receipt | Commuter preview, explicit recipient selection and consent, server signing, expiry, revocation, and a verification link. No full route or raw coordinates in employer responses. |
| Employer verification | Authenticated access restricted to the intended organisation; integrity check and current expiry/revocation checks on every view. |
| Demo readiness | Repeatable seed/reset, labelled simulation, core negative tests, browser checks, deployed flow, and a recorded fallback. |

### Deferred — not build dependencies

- Real-time or event-driven rerouting, alternative travel-time savings, and routing-engine hosting.
- AI/LLM features, voice transcription, photo/video collection or verification.
- Native apps and continuous/background location tracking.
- Complex authority analytics, seeded hotspot dashboards, recurrence packs, PDF/CSV exports, and government roles.
- Public incident feeds, reputation models, numerical trust probabilities, advanced spoof detection, and general Sybil-attack resistance.
- A multi-route pilot, field-accuracy claims, and city-scale deployment.

A fixed-route relevance alert is optional only after the required flow passes. It uses a preselected demo route, never computes an alternative, and must distinguish parallel roads. Emergency dispatch, automated employment decisions, and infrastructure recommendations remain outside scope.

## 4. Differentiation and Judging Readiness

**Differentiator to validate:** explainable incident evidence combined with voluntary, recipient-restricted delay sharing. Maps and incident pins are not the novelty.

| Comparator | Supplied context | What to check before pitching |
| --- | --- | --- |
| Google Maps / Waze | Congestion, routes, and incident reporting `[R]` | What evidence and freshness information is exposed? Is comparable employer sharing available? |
| Mappls | Traffic, hazards, and reporting `[R]` | Compare the actual incident detail and sharing experience. |
| Awaaz | Open-source incident reporting with confirmation and expiry `[R]` | Inspect the source/demo, acknowledge overlap, and identify a concrete difference. |

Existing similar solutions do not require a pivot by themselves. Demonstrate a useful difference; avoid "first", "only", or unsupported competitor absences.

| Judging area | Evidence to prepare |
| --- | --- |
| Innovation | Comparison of incident evidence and limited sharing, without claiming unverified uniqueness |
| Technical implementation | Working server-side evidence rules, signatures, authorisation, revocation, and negative tests |
| Impact | Employer/commuter feedback; separate measured usability from anticipated benefits |
| Design and presentation | Clear map states, understandable consent preview, and a rehearsed three-minute demo |
| Eligibility | Confirm required technology, code/repository visibility, allowed pre-work, AI disclosure, attributions, video, and submission deadline |

The user's example weights (30% innovation, 25% technology, 25% impact, 20% presentation) are illustrative only. Do not infer winning odds or event scores from them.

## 5. Focused Solution Design `[A]`

### A. Evidence assessment

Replace the v2 six-level Evidence Ladder and weighted Trust Score with explicit evidence indicators and a small set of statuses:

| Status / indicator | Proposed rule and limitation |
| --- | --- |
| Reported | At least one valid report; does not establish congestion or cause |
| Location supported | Observation overlaps the selected road segment with acceptable reported accuracy; supports reported device location only |
| Corroborated congestion | At least three distinct source identities with location-consistent summaries on the same segment in a 15-minute window, each showing slowdown over a five-minute observation window |
| Cause | Show reported categories and their sources; use "Unknown reason" when insufficient. A claimed accident never establishes an accident by itself. |
| Stale / expired | No eligible fresh corroboration for 20 minutes; stop presenting as current congestion |
| Cleared | Sufficient fresh slowdown sources show recovery for five minutes; distinguish recovery evidence from expiry |

Initial slowdown threshold: below 40% of the demo baseline speed; recovery: at least 70%. Timing, source count, location tolerance, and minimum data coverage are assumptions to finalise and test, not calibrated truth. Use segment identity and direction, not radius alone, to avoid merging parallel roads.

One source contributes once per segment/time bucket. Duplicate submission is idempotent. The server derives source identity from authentication; the browser cannot assign itself another source or a corroborated status. Multiple accounts still may be controlled by one person. Simulator identities represent known synthetic sources, not demonstrated real-world independence.

Show counts, supporting observations, freshness, and uncertainty, not a confidence percentage. A low-speed device may be parked; matching time and segment observations only strengthen evidence. Basic malformed-input and impossible-transition checks are useful, but no universal spoof-detection claim is permitted.

### B. Live map and simulated attack

- One corridor with a reproducible incident and synthetic slowdown summaries; all synthetic markers, details, journeys, and receipts carry a visible **SIMULATED** label.
- User reports, evidence changes, and incident expiry update both markers and the open details panel without inconsistent status.
- Use text/icons alongside colour. Support keyboard access, a mobile details panel, loading, empty, map-provider failure, and stale-data states.
- Attack sequence: one source submits a fabricated cause repeatedly. Reports remain unsupported; duplicate attempts do not increase eligible source count or create a corroborated receipt.
- Present this as rejection of a **scripted duplicate-report attack**, not proof that all false reports or multi-account attacks are detected.
- Simulator controls must be restricted to demo mode and cannot issue receipts represented as real observations.

### C. Delay measurement and receipt

For a complete observed demo segment, compute excess traversal time over a named baseline: `max(0, observed traversal time − baseline traversal time)`. Label the value **estimated delay** and the baseline source. Synthetic traversal times remain labelled simulated. Partial observations or a missing baseline produce "delay unavailable", not an invented number.

Receipt preview and employer payload contain only:

`receipt_id · pseudonymous commuter reference · zone/segment label · observation window · estimated delay (or unavailable) · baseline label · evidence summary · data provenance · issued_at · expires_at · recipient org id · signature`

Names are optional and explicitly previewed. The server validates journey ownership and derives the signed summary from stored evidence; it does not sign client-supplied delay or verification claims. Create a traffic-supported delay receipt only from an eligible, sufficiently observed journey and corroborated incident; explain why creation is unavailable otherwise. Employer verification checks integrity and access, not the truth of the commute.

Required security behaviour:

- Sign on the server, with a specified canonical payload format; Ed25519 is the proposed choice, subject to stack confirmation. Secrets remain server-side.
- Require authenticated organisation membership. A link identifier or signature is not an access credential.
- Bind the signature to the recipient organisation and expiry; proposed expiry is seven days.
- Check stored revocation and expiry on every authenticated verification. Offline signature validation cannot prove current revocation status.
- Show revoked/expired status to authorised recipients without exposing receipt contents. Deny unauthorised access without disclosing private details.
- Treat a receipt as an issuance-time evidence snapshot. Later incident clearance or expiry does not retroactively erase observed delay; verification displays the observation window and checks receipt validity separately.
- Withdrawal blocks future sharing/collection as applicable; receipt revocation removes further online access. Copies already viewed cannot be recalled.

Required wording: **"This summary reflects reported device observations and supporting traffic evidence. It does not prove who carried the device, when the journey began, or why a person arrived late."**

### D. Privacy and retention

- The commuter starts/stops any foreground journey collection and sees an active indicator. A web app cannot promise reliable background GPS.
- Process raw pings locally in memory; do not upload or persist them in the core demo. The server receives only the minimum segment summaries needed for evidence and delay calculation.
- Proposed defaults pending confirmation: segment summaries retained up to seven days, receipt access expires after seven days, revocation takes effect immediately on subsequent server reads. Define deletion jobs and minimal audit retention before collecting real data.
- Employers receive no raw coordinates, route geometry/history, home location, unrelated incidents, or unrestricted journey access. Zone and time information remain sensitive personal information.
- Record minimal issuance, verification, revocation, and consent events without raw locations or full payloads in logs.
- Consent does not remove workplace power imbalances or establish legal compliance. Seek employer and commuter input; real deployment needs legal/privacy review.

## 6. Technical Approach `[A]`

The stack remains proposed; confirm it before scaffolding.

| Layer | Proposed choice | Scope limit / fallback |
| --- | --- | --- |
| Client | Next.js, mobile-first web app | Use the team's familiar framework if different; no native app |
| Map | MapLibre GL with a policy-compliant OSM-derived tile provider | Check attribution, quota, and reliability; provider failure is explicit |
| Backend | Server routes plus Supabase Postgres/Auth, optional Realtime | Server authorisation and database row-level security; authenticated refresh is acceptable if realtime integration delays the core |
| Signing | Server-side Ed25519 library | Canonical payload, protected key, tamper tests |
| Incident/receipt lifecycle | Shared server-side freshness/expiry rules; scheduled cleanup | Reads enforce expiry even if cleanup has not run |
| Demo data | Deterministic simulator, fixed corridor and baseline | No paid routing API or live traffic feed required |
| Hosting | Vercel or a familiar Node host | Confirm commercial/demo terms and required background jobs |

Minimum conceptual data: `users · orgs · memberships · journeys · segment_summaries · incident_reports · incidents · incident_evidence · receipts · consents · audit_log`.

Keep evidence assessment, receipt signing, authorisation, and simulator logic separate within one application. Do not create additional services or integration layers for deferred features.

### Threat model for the core demo

| Threat | Required control / test | Remaining limitation |
| --- | --- | --- |
| Duplicate fake reports | Server-derived source identity, idempotency, per-source deduplication | Separate malicious accounts may still evade this control |
| Invented cause | Cause remains reported/unknown; cannot manufacture slowdown evidence | Real cause is not automatically established |
| Fabricated client delay | Derive receipt from server-held eligible observations | Input device observations can still be spoofed |
| Receipt modification | Canonical signed payload and verification on read | Signature does not establish observation truth |
| Cross-organisation reuse/access | Authenticated recipient binding and negative tests | An authorised viewer can manually copy visible information |
| Expired/revoked access | Check current server state on each view; refresh cached views | Previously saved copies cannot be recalled |
| Excessive disclosure | Allowlisted employer response; no journey access | Even coarse zone/time data can reveal sensitive information |
| Simulator misuse | Restricted demo controls, provenance preserved in every output | Simulated results do not predict field accuracy |

## 7. Research Notes and Sources

Preserved from the supplied v2 research for validation, not as verified claims. Sources for deferred features are background only.

| Finding / topic from v2 | Source | Use and qualification |
| --- | --- | --- |
| Smartphone GPS accuracy around 4.9 m under open sky | https://www.gps.gov/systems/gps/performance/accuracy/ | Context for uncertainty; does not establish local accuracy or spoof resistance |
| Waze classifier: 82.5% accuracy, F1 82.8%, AUC 0.90 | https://www.mdpi.com/2078-2489/16/6/423 | Different data and task; not a TrafficSense benchmark or result |
| 690 of 853 unplowed-road reports confirmed; about 1.9 false reports/day | https://arxiv.org/pdf/2311.10740 | Snow-report context, not directly transferable to Indian congestion |
| Waze coverage and earlier reporting study | https://dr.lib.iastate.edu/entities/publication/c399b90b-c4a9-410f-9600-ef8e655f91d3/full | Supplied figures: 43.2% coverage and 9.8 minutes earlier; check methods before quoting |
| Report location may differ from actual incident | https://railroads.dot.gov/elibrary/evaluating-crowdsourced-data-waze-rail-safety | Supports checking road-segment relevance |
| Indian DPDP implementation and employment context | https://www.hoganlovells.com/en/publications/indias-digital-personal-data-protection-act-2023-brought-into-force- ; https://dsklegal.com/?p=26455 ; https://trilegal.com/wp-content/uploads/2025/11/DPDPA.pdf | V2 supplied Nov 2025 notification and staged 2026/2027 commencement dates. Check official legal text before quoting dates or claiming compliance. |
| Four-metro congestion costs, earlier BCG-Uber report | https://www.newsbytesapp.com/news/india/bcg-analysis-says-delhi-mumbai-bengaluru-kolkata-lose-rs147lcr-annually/tldr ; https://scroll.in/article/876209/scroll_in | Supplied ₹1.47 lakh crore/year and congestion figures are national context, not measured local impact; verify primary source/date |
| Historic Mangaluru roadwork and coordination problems | https://www.deccanherald.com/india/karnataka/road-works8200dc8200tells-mcc-officials-coordinate-2049278 ; https://www.thenewsminute.com/article/after-delay-over-10-years-pumpwell-flyover-inaugurated-mangaluru-117234 | Old articles; verify current corridor conditions before using in a pitch |
| Google Maps incident reporting and India context | https://restofworld.org/2025/google-maps-india-misdirection-fatal-accidents/ | Check current product behaviour directly |
| Mappls traffic/reporting features | https://www.digit.in/features/general/what-is-mappls-app-features-explained-how-is-it-compared-to-google-maps.html | Secondary source; confirm in current app |
| Awaaz incident reporting project | https://fossunited.org/hack/fosshack26/p/90m5877fmp | Inspect current source/demo and acknowledge overlap |
| OSRM demo service policy | https://github.com/Project-OSRM/osrm-backend/wiki/Api-usage-policy | Routing deferred; public demo is not a production dependency |
| OSM vector tile policy | https://operations.osmfoundation.org/policies/vector/ | Confirm chosen provider and relevant raster/vector policy |
| Backend pricing | https://supabase.com/pricing | Check current limits, pause behaviour, and production terms before selection |

V2's model identifier, release date, and token prices are unverified and removed from the active budget because AI is deferred. Winner anecdotes, sample medical statistics, and hypothetical user-test results from the supplied general guide are not evidence for TrafficSense and must not appear as project results.

## 8. Evaluation and Acceptance Plan

**Application verification status: Not run.** All targets below remain unmeasured.

### Required scenarios

| ID | Scenario | Acceptance target `[T]` |
| --- | --- | --- |
| S1 | Genuine scripted slowdown with eligible synthetic sources | Evidence details show the rule inputs; incident becomes corroborated and map/detail agree |
| S2 | Single fabricated cause plus repeated submissions by one source | No corroborated status, no inflated independent-source count, no eligible traffic-supported receipt |
| S3 | Missing, stale, malformed, or insufficient observations | Explicit unsupported/unavailable state; no invented delay, confidence, or cause |
| S4 | Freshness expiry and supported recovery | Correct expired/cleared status on map and details; no stale current-congestion claim |
| S5 | Complete simulated segment, known baseline; missing baseline variant | Correct deterministic excess-time arithmetic; unavailable delay for insufficient data |
| S6 | Commuter preview → consent → share → intended employer view | Only previewed allowlisted fields reach the employer; simulation label persists |
| S7 | Modified payload, wrong organisation, unauthenticated access, or another user's journey | Forgery/access rejected; no private contents disclosed |
| S8 | Receipt expiry, revocation, and already-open employer page | Subsequent server reads deny contents; refreshed view shows current validity; no cached protected payload after invalidation |
| S9 | Incident clears after receipt issuance | Historical observation summary remains distinct from incident's current status; receipt expiry/revocation still enforced |
| S10 | Empty map, denied location, provider failure, session change | Usable explanations; no silent substitution of simulated data for live data; no previous user's protected state |
| S11 | Desktop/mobile, keyboard, refresh and direct-link navigation | Core flow usable on both viewports; shared components/state remain consistent |
| S12 | Optional fixed-route alert, only if built | Affected route alerted; parallel/unaffected road not alerted; expiry removes current alert |

### Metrics to report

| ID | Metric | Target `[T]` | Status |
| --- | --- | --- | --- |
| M1 | Required scenario pass counts | All required cases pass; record individual failures | Not run |
| M2 | Duplicate-report attack outcome | Zero promotions in the enumerated scripted duplicate cases; report case count, not a general attack success rate | Not run |
| M3 | Receipt integrity, authorisation, privacy and lifecycle tests | Every enumerated negative case passes; no forbidden fields in employer payloads | Not run |
| M4 | Report-to-map update and authenticated receipt verification latency | Proposed demo-environment p95 ≤ 3 s and ≤ 1 s respectively; record sample count and environment | Not run |
| M5 | Delay calculation on deterministic fixtures | Exact expected arithmetic; unavailable when coverage/baseline is missing | Not run |
| M6 | Usability and consent understanding | If five volunteers are available: report time ≤ 20 s and at least four correctly identify what is shared | Not run |

Run deterministic unit/integration tests first, then browser verification across map, incident details, receipt preview, commuter receipt list, and employer list/detail views. Include organisation/account switching, direct links, consent cancellation, expiry, revocation, and back/refresh behaviour. Proposed screen names are not implemented routes.

Use fake time for lifecycle tests and synthetic fixtures for attack cases. Include a simple count-only comparator to show why duplicate filtering matters, if time permits. Calibrated precision/recall, general spoof resistance, battery impact, field delay accuracy, and hotspot ranking are deferred; do not claim v2 accuracy targets were met by passing scripted cases.

Record results with date, commit, command/interaction, data type, sample size, outcome, and limitations. A field mini-pilot is optional follow-up after consent/retention rules are settled, not a demo prerequisite.

## 9. Resources and Cost Assumptions

### Core demo budget

- Use synthetic accounts, a fixed corridor, a deterministic baseline, and synthetic segment summaries. No live-traffic, routing, AI, photo storage, or native-device budget is required.
- A free-tier prototype is a goal, not a guarantee. Confirm map tiles, hosting, database/auth quotas, attribution, permitted use, and any pause behaviour before committing.
- Set request limits and spending controls where providers support them. Keep a local demo dataset and recorded fallback; do not silently replace a failed real integration with synthetic data.
- Required resources: team's familiar development stack, map access, deployment credentials, browser testing, and signing-key storage. Assign owners in Phase 0.
- Pilot/city costs are deferred until usage, retention, traffic-data source, provider contracts, and actual resource measurements are known. Team time and operations cannot be treated as free in a viability claim.

### Corrections retained for the v2 cost analysis

The former detailed routing/AI budget is not a build requirement or a verified estimate:

- 500 commuters × 22 working days × 2 trips = **22,000 trips/month**.
- One initial route call plus one extra call on 10% of trips would give **24,200 calls**, not 26,400; routing is now deferred.
- 50,000 commuters is **100×** 500, not 10×; the same trip assumptions give 2.2 million trips/month.
- A 40-minute trip sampled every 10 seconds gives about 240 samples: 240 × 60 B × 22,000 ≈ 317 MB/month. Twenty 100 B summaries per trip give ≈ 44 MB/month. These are illustrative payload sizes, not database/storage/egress estimates; raw pings are not uploaded in the core design.
- Self-hosted routing has finite compute and operations costs and does not provide live traffic observations by itself. It is not the only possible commercial approach.
- All former Google, Supabase, hosting, and model prices need current official verification before reuse. No measured operating-cost claim exists.

## 10. Implementation Roadmap and Time Budget

### Phase 0 — Confirm constraints before coding

Status: in progress (scope direction agreed; remaining decisions open).

- [x] Establish guidelines, repository, and the central plan.
- [x] Narrow the hackathon scope per the user's recommendation.
- [ ] Confirm event, judging criteria, deadline, allowed pre-work, required technology, and submission deliverables.
- [ ] Confirm team availability, roles, and actual build window; choose a schedule below.
- [ ] Validate the proposed receipt with the employer and 3–5 commuters where feasible; otherwise record validation as incomplete.
- [ ] Check the most relevant competitor flows and current local problem context.
- [ ] Confirm stack, map provider, hosting, quotas, attribution, and credentials.
- [ ] Finalise evidence thresholds, observation coverage, canonical receipt payload, consent, expiry, retention/deletion, and audit policy.

Acceptance: implementation constraints and owners recorded; no unsupported live-data, accuracy, compliance, or cost promises.

### Phase 1 — Receipt and employer flow first

Status: proposed; depends on Phase 0.

- [ ] Scaffold with documented setup, checks, auth, and role/organisation boundaries.
- [ ] Seed synthetic journeys, evidence, two employers, and commuter accounts with visible provenance.
- [ ] Implement server-derived receipt preview/create, explicit consent, signing, recipient binding, and authenticated verification.
- [ ] Implement revocation and expiry, minimal audit events, and an allowlisted employer payload.
- [ ] Test tampering, unauthorised reads, wrong-organisation access, and invalid lifecycle states immediately.

Acceptance: synthetic commuter → intended employer → revoke works end to end; S6–S9 pass for this initial flow. Expiry, revocation, and authorisation are mandatory, not polish.

### Phase 2 — Reporting, live map, and attack demonstration

Status: proposed; builds on Phase 1.

- [ ] Implement report validation, deduplication, segment/time matching, slowdown evidence, and freshness lifecycle.
- [ ] Add fixed-corridor simulator and baseline-based delay computation; restrict demo controls.
- [ ] Connect map, details, receipt eligibility, and evidence summaries to the same server-derived state.
- [ ] Demonstrate genuine corroboration and the scripted duplicate-report attack side by side.
- [ ] Cover empty/loading/error/stale states and mobile/desktop layouts.

Acceptance: S1–S5 and relevant S10–S11 cases pass; a fake report cannot obtain an eligible traffic-supported receipt through repeated submissions.

### Phase 3 — Verification, deployment, and pitch

Status: proposed; tests also run throughout earlier phases.

- [ ] Run all required scenarios, inspect employer responses, and record results in section 16.
- [ ] Browser-test all affected pages and shared state on desktop/mobile, including account switching, direct links, revocation, expiry, and provider failure.
- [ ] Deploy and repeat the complete flow; confirm reset/seed works without real personal data.
- [ ] Refine map clarity, keyboard access, and consent comprehension; seek brief user feedback.
- [ ] Rehearse the three-minute demo, capture a recorded fallback, and prepare concise README/screenshots, slides, video, links, and required disclosures.
- [ ] Check submission rules and leave a submission buffer.

Acceptance: required flow and negative cases pass with recorded evidence; remaining limitations are visible; submissions are ready. Optional alerts cannot displace security or verification work.

### Schedule variants `[A]`

Hours below are elapsed event hours, not per-person effort or a recommendation to work without rest. Parallelise tasks by responsibility and adjust for the team's actual capacity.

| Window | Setup and decisions | First complete receipt flow | Map, evidence, attack | Freeze, verify, polish and submit |
| --- | --- | --- | --- | --- |
| 24 hours | 0–2 h | 2–7 h | 7–15 h | 15–24 h |
| 48 hours | 0–3 h | 3–12 h | 12–28 h | 28–48 h |
| 72 hours | 0–4 h | 4–16 h | 16–40 h | 40–72 h |

For 24 hours, use seeded corridor selection, a minimal map, and one attack fixture; omit optional GPS and alerts. For 48 hours, deepen error/lifecycle checks and UI polish. For 72 hours, prioritise user feedback, accessibility, repeatability, and an optional fixed-route alert after the required flow passes; do not restore deferred features automatically. If the core misses its checkpoint, reduce visual/optional work, not receipt protections.

### Roles (owners pending)

| Responsibility | Suggested owner |
| --- | --- |
| Map, reporting UI, responsive layouts, consent preview | Frontend developer / designer |
| Auth, receipts, signing, authorisation, lifecycle tests | Backend developer |
| Evidence rules, simulator, attack fixtures, integration tests | Full-stack developer |
| User feedback, end-to-end browser checks, pitch and submission | Product/presentation owner; shared by the team if only three people |

## 11. Three-Minute Demo and Presentation

1. **Problem — 20 s:** "How can a commuter share useful traffic-delay evidence without exposing their full journey?"
2. **Map and evidence — 40 s:** submit a report on the demo corridor; reveal labelled simulated slowdown sources and explain the corroboration rule. Keep the cause unknown unless supported.
3. **Attack — 30 s:** repeat a fabricated report from one source; show that eligible-source count and corroborated status do not rise. State the attack's limited scope.
4. **Receipt and employer — 50 s:** preview the exact fields and recipient, consent, share, switch to the intended employer, and inspect the evidence summary. Show that no full route is available.
5. **Integrity and control — 25 s:** demonstrate a tampered receipt failing and revoke a valid receipt; refresh the employer view and show access withdrawn.
6. **Results and limits — 15 s:** show actual test counts only if measured, identify simulation, and state that signatures do not prove GPS truth. Finish with the next validation step.

Total: **180 seconds**. Rehearse with seeded resets and a recorded fallback that is clearly identified when used.

Suggested slides: title/problem; users and differentiation; live demo; measured tests and limitations; next validation steps and repository link. Do not use hypothetical testimonials, savings, medical statistics, or general guide examples as project evidence.

## 12. Risks and Blockers

| Risk / blocker | Response |
| --- | --- |
| Event, team, deadline or stack unknown | Confirm Phase 0 before scaffolding; sample judging weights are not official |
| Oversized scope | Keep one corridor and the required flow; deferred features stay deferred |
| Too few real independent users | Use labelled simulation; validate a bounded employer cohort later, without claiming the adoption problem is solved |
| Device spoofing or multiple malicious accounts | Demonstrate only specified controls; publish limits; no universal verification guarantee |
| Employer rejects receipt or commuters feel coerced | Validate usefulness and voluntary participation before a real pilot |
| Estimated delay misrepresented as proven lateness | Display baseline, provenance, uncertainty, and the receipt limitation text |
| Browser background GPS limitation | Foreground-only optional observations; synthetic demo; native app deferred |
| Privacy/access leaks | Allowlisted responses, server-side checks, negative tests, no full journey access |
| Provider outage or hosting pause | Check terms/availability, explicit failure state, local demo data and recorded fallback |
| Unverified research, law, pricing or competitor claims | Verify key sources before slides; omit claims that cannot be checked |
| Incomplete browser or security verification | Record the blocker; do not claim readiness or promote optional features |

## 13. Repository Setup

Status: completed in v1; historical verification, not a fresh remote check.

- [x] Verify GitHub authentication and Git identity.
- [x] Initialise local Git and commit the initial documentation.
- [x] Create and push the private repository.
- [x] Verify private visibility, branch tracking, matching commits, and clean working tree at initial setup.

Repository: [NITHINKR06/hackathon](https://github.com/NITHINKR06/hackathon).

V1 recorded `isPrivate: true`, default branch `main`, and matching local/remote commits. Local documentation has since changed. `.gitignore` excludes local environment/key files. No application verification follows from repository setup.

## 14. Detailed Task Template

### Task: <name>

- **Status:** proposed / ready / in progress / blocked / completed / deferred.
- **Goal and scope:** required behaviour and explicit exclusions.
- **Owner and dependencies:** unresolved decisions, provider access, and prerequisite work.
- **Affected files and routes:** actual implementation paths once known.
- **Scenarios/metrics:** relevant S1–S12 and M1–M6 entries.
- **Steps:** implement, add tests, verify shared state in the browser, update affected documentation.
- **Acceptance checks:** success, denied access, unavailable data, failure, expiry/revocation, and viewport cases as applicable.
- **Verification results:** commands/interactions, environment, data provenance, outcomes, and limitations; Not run until executed.
- **Blockers/follow-up:** explicit unfinished work.

## 15. Decision Log

| Decision | Status | Reason |
| --- | --- | --- |
| Central plan and project-specific guidelines | Implemented documentation | One record of scope and verification |
| Focus on traffic evidence, limited receipts, and employer verification | Confirmed by user's v3 direction | One coherent, differentiated flow |
| Polished live-updating map and simulated fake-report attack | Confirmed scope | Make evidence and its limitations visible |
| Receipt expiry, revocation, consent and authorisation | Required in v3 | Necessary for the promised sharing design |
| Explicit evidence indicators instead of six-level ladder and numerical Trust Score | Proposed v3 design, supersedes v2 scoring | Avoid uncalibrated confidence and misleading evidence ordering |
| One corridor, synthetic data, web-first demo | Proposed delivery approach | Fit the time budget and data availability |
| Rerouting, AI, photos, native apps and authority analytics | Deferred per user direction | Remove competing features and dependencies |
| Seeded hotspots and recurrence packs | Deferred, supersedes v2 demo | Keep employer sharing central |
| Event, actual judging rubric, owners and timeline | Pending Phase 0 | No verified event/team constraints yet |
| Stack, map provider, hosting, consent/retention defaults and final name | Pending Phase 0 | Confirm before implementation |

## 16. Completed Work and Verification

- V1: created `AGENTS.md`, `README.md`, and `ai/` guidelines; recorded validation of 12 Markdown files and 14 local links; published the private repository.
- V2: added supplied problem analysis, research, scoring, receipts, proposed stack, evaluation targets, cost assumptions, and roadmap. Documentation only; no claimed application results.
- V3: revised the plan around the user's focused scope; retained supplied research with verification caveats, corrected workload arithmetic, prioritised receipt protections, and replaced the broad roadmap with a single demonstration flow.
- V3 documentation verification (14 Oct 2026): `git diff --check` passed. A Python documentation check passed for all three edited documents, six local links, 16 numbered sections, section references, required scope assertions, and code-fence balance. Reviewed the README/architecture diff for alignment with the plan. External sources were not checked.
- **Application verification:** Not run. No application tests, simulations, field tests, deployments, or browser flows have run. All section 8 metrics remain Not run.
