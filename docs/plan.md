# TrafficSense — Project Plan

## Purpose and document ownership

**TrafficSense Mangaluru** is a bounded web demonstration of **REPORT → VERIFY → ALERT → ANALYSE**: explain road disruptions with visible evidence, help commuters avoid affected roads, support consent-based employer visibility, and identify recurring problems for investigation.

- This file holds scope, design decisions, proposed contracts, acceptance targets and research assumptions.
- [docs/implementation.md](implementation.md) holds the detailed phase-wise implementation plan, dependencies and exit checks.
- [progress.md](progress.md) is the sole record of implementation status, actual blockers, verification results, review and commit history.
- [Source coverage](README.md) maps the seven recommended modules to the unchanged [original PDF](Traffic_JAM.pdf).
- [Design reference](design/trafficsense/README.md) identifies the supplied UI and the rules for adapting it honestly.

Plan sequentially for one active human builder with AI assistance, using verified phases rather than fixed-day promises. Confirm any event deadline, daily capacity and submission rules before scheduling a release. The PDF is an AI-generated employer-informed product brief, not confirmed event rules or independently verified research.

## Product scope

| Recommended module | Planned bounded behavior |
| --- | --- |
| 1. Registration/login | Supabase accounts; server-enforced commuter, employer, authority and admin roles; organisation boundaries; commuter-only public registration |
| 2. GPS/traffic map | One simulated corridor, incident map/list/details, provenance and freshness; optional consented foreground GPS, not continuous tracking |
| 3. Incident reporting | Authenticated persisted reports with segment/direction, time, category including Unknown and location provenance; no photos/voice |
| 4. Verification | Explainable L1–L4 evidence indicators, separate cause assessment, freshness/recovery and a narrowly defined duplicate-report attack |
| 5. Alternative alert | One fixed primary route and precomputed alternative, relevance checks, qualified simulated estimates and abstention |
| 6. Employer dashboard | Employee-started, separately shared journeys; recipient-specific limited status, visible consent and stop/end enforcement |
| 7. Analytics/monthly reports | Deterministic dated synthetic hotspot and monthly views with defined units, recurrence and consistent totals |

A signed **Delay Receipt** is a planned extension to verification and employer sharing, not a replacement for these modules. Its minimum fields and prominence depend on employer feedback; absent feedback it remains a provisional synthetic demonstration. If included, every consent, integrity, recipient, expiry and revocation protection is mandatory.

### Explicit limits

- Simulation is not a live traffic feed; retain **SIMULATED** on every synthetic observation and derived view.
- Distinct accounts do not prove independent witnesses. Slowdown does not establish an incident cause. A signature establishes integrity/origin, not GPS truth or lateness.
- No confidence percentages, guaranteed savings, legal-grade claims, or official authority confirmation without actual support.
- Defer photos/video, AI classification, voice, native/background tracking, SOS, prediction, full administration, general spoof detection, real routing and PDF export.
- Optional after core acceptance: CSV, simulated authority-confirm actions, Realtime, foreground GPS and richer animation. Explicit refresh with freshness timestamps is acceptable.
- Do not cut the core employer status view to preserve receipts. Any module reduction needs user approval and a documented coverage gap; never remove access controls, consent, negative tests or mobile verification to save time.

## Visual design contract

Use the supplied TrafficSense Mangaluru screenshot/HTML as the visual baseline: pale lavender surface, white cards, teal actions, violet simulation labels, structured navigation, split hero, feature cards and role sections. Use Plus Jakarta Sans headings, Inter interface text and JetBrains Mono technical details.

The [reference README](design/trafficsense/README.md) governs differences between the screenshot, HTML and design-spec prose. Adapt to mobile with readable labels, accessible focus, keyboard operation, text/icons alongside colour and minimum 44px controls. User review is required for material deviations.

The template is a visual reference, not functional or verified behavior. Replace placeholder links with implemented actions or explicitly unavailable states. Its map image is not an interactive map, and sample certificates/statistics are not real results. Correct unsupported privacy/security claims while preserving the design. Keep the main traffic goal prominent rather than presenting a receipt-only product.

## Technical approach and boundaries

| Area | Choice / limit |
| --- | --- |
| Application | One Next.js App Router application, TypeScript and Tailwind; no extra backend framework |
| Runtime/package manager | Docker-only development, package commands and checks; pinned pnpm and sole `pnpm-lock.yaml` |
| Auth/data | Supabase Auth/Postgres, migrations, RLS and server authorization; local Docker for development |
| Map | MapLibre with a policy-compliant OSM-derived tile source; check attribution, coverage, quotas and key handling |
| Routes/data | Deterministic corridor, segment/direction matching, synthetic scenarios and one precomputed alternative |
| State | Shared server-derived evidence/lifecycle/consent/history rules; explicit refresh allowed; no stale private data after account changes |
| Receipts | Proposed server-side Ed25519 canonical payload/version and protected keys; implement only with full validity/access checks |
| Hosting | Authorized familiar Node host or Vercel plus suitable database; provider terms/access and deployed verification are separate gates |

Define schemas just before each feature, not a large speculative database upfront. Conceptual responsibilities: profiles/organisations/memberships; corridor and segment data; observations/reports; incidents and evidence; owned journeys and private summaries; explicit shares/consents; optional receipts; minimal audit records; dated synthetic history.

The client submits observations, never trusted identity, roles, corroboration, delay or validity. The server validates input, derives decisions, enforces current permissions and persists before showing success. Use database constraints/transactions for concurrent mutations and retries. Normal application requests use policies, not privileged-key bypasses.

Map, list, details, alerts and receipt eligibility share incident/evidence rules. Employer list/detail reads share current consent and recipient rules. Hotspots/monthly totals share dated history. Store timestamps in UTC and explicitly define Asia/Kolkata display/analytics windows. Enforce freshness/expiry on reads even if scheduled cleanup is late.

## Evidence and lifecycle contract

These thresholds are proposed demo assumptions, not calibrated field findings. Define exact eligibility and time boundaries in tests before implementation.

| Indicator | Planned rule | Limit |
| --- | --- | --- |
| L1 Reported | Valid report from an authenticated source | Does not establish congestion/cause |
| L2 Location supported | Position overlaps selected segment with acceptable accuracy and explicit provenance | Location support only; simulated provenance stays visible |
| L3 Multiple sources | At least three eligible distinct source identities, same segment/direction, 15-minute window; one contribution per source/time bucket | Distinct accounts are not proven independent people |
| L4 Slowdown supported | At least three eligible synthetic sources below 40% of baseline speed for five minutes | Demonstrates a computable rule, not real-world truth |
| L5 Photo/video | Not collected | Deferred |
| L6 Authority confirmed | Unavailable unless separately implemented as an authorized, labelled simulated action | Never inferred from other indicators |

Keep reported categories separate from evidence of congestion; show Unknown when support is insufficient. Stale after 20 minutes without fresh corroboration; clear after five minutes of supported recovery above 70% of baseline. Any manual resolve needs defined authorization. Nearby parallel roads/opposite directions do not merge by radius alone.

**Attack:** repeated fabricated-cause reports from one source must not inflate eligible-source counts, promote corroboration or enable a traffic-supported receipt. Include concurrency/retries. This establishes only the tested duplicate-report control, not general Sybil or spoof resistance.

## Delay and route-alert contract

Estimated segment delay is `max(0, complete observed traversal time − named baseline traversal time)`. Missing/partial observations or baselines return unavailable, not zero or a guessed number.

Alert only for a corroborated incident affecting the selected primary segment/direction. Compare fresh compatible primary/alternative inputs. Show simulated estimated savings; abstain below five minutes, for missing/stale inputs or a known alternative hazard/closure. Test the exactly-five-minute boundary. A precomputed alternative is neither a safety guarantee nor a real routing engine.

## Journey sharing, receipts and retention

### Active journey sharing

- Starting a journey is separate from consent to share. Preview exact fields and organisation before an explicit confirmation; show collection/sharing state and offer stop/end.
- Employer response allowlist: commuter reference, corridor label, normal/delayed/blocked status, estimated delay or unavailable, evidence summary and freshness. Name is optional only if explicitly selected/previewed.
- Never send employers raw coordinates, route geometry, home location, breadcrumbs, unrelated journeys or unrestricted history, including hidden response fields.
- Every read checks identity/role, current organisation membership, recipient, active consent and journey state. Stop/end removes subsequent server access; refresh/next update clears rendered data. Saved copies cannot be recalled.
- Refresh-based views state last updated and are not marketed as continuous live tracking. Stationary users/passengers are the intended reporting interaction context.

### Provisional receipt contract

Minimum payload: receipt ID, pseudonymous commuter reference, zone/segment, observation window, estimated delay or unavailable, baseline label, evidence summary, provenance, issuance/expiry, recipient organisation and signature. Any optional name must be previewed. Issuance requires an eligible owned journey and a corroborated incident relevant to that journey's segment, direction and observation window. Derive fields from that server-held evidence; an authenticated report or journey ownership alone is insufficient. Never sign arbitrary browser claims.

Canonical versioned signing, authenticated intended-recipient access, current expiry/revocation checks and minimal audit events are inseparable. Proposed access period is seven days. A receipt is an issuance-time snapshot, not evidence of current congestion; later clearance does not rewrite history.

Required limitation: “This summary reflects reported device observations and supporting traffic evidence. It does not prove who carried the device, when the journey began, or why a person arrived late.”

### Privacy defaults to finalize before real data

Core demonstration uses synthetic journeys. If optional real foreground GPS is added, collect only after an explicit action, process raw points locally/in memory without uploading them, and stop on end/permission withdrawal. A web app cannot promise reliable background tracking.

Proposed private-summary retention is up to seven days, distinct from receipt access duration. Define deletion/enforcement and retention separately for private summaries, receipt snapshots, consent/audit records and months of synthetic history before their implementation. No real-person data until notice, consent, access, retention/deletion and relevant legal review are approved. Coarse zone/time remains sensitive; consent does not eliminate workplace pressure or establish legal compliance.

## Analytics contract

Use deterministic dated synthetic incident/observation history for about five junctions across several months. Define working-day denominator, timezone/date boundaries, recurrence, unknown-cause handling and delay units before calculating cards/tables.

Rank hotspots and show cause mix, peak window, average/max delay, trends and monthly reason totals from common history. Define aggregate delay-hours using underlying observations if claiming commuter delay; do not relabel incident duration as total traveller delay. New demo incidents affect aggregates only inside the selected period; historical-only views explain their cutoff. “Suggested investigation” is the permitted conclusion, not an infrastructure prescription.

## Acceptance scenarios

These are targets, not results. Actual outcomes belong only in [progress](progress.md).

| ID | Scenario | Required outcome |
| --- | --- | --- |
| S1 | Genuine scripted slowdown | Explain eligible evidence; corroboration, map and details agree |
| S2 | Fabricated cause, repeated source and concurrent retry | No inflated eligible count or corroboration; no traffic-supported receipt when issuance exists |
| S3 | Missing/stale/malformed/insufficient observations | Explicit unsupported/unavailable state; no invented cause/delay |
| S4 | Expiry and supported recovery | Stale/cleared status consistent across current map/details/alerts |
| S5 | Known/missing baseline, partial traversal | Exact excess-time arithmetic or unavailable |
| S6 | Preview → consent → intended employer | Only selected allowlisted fields disclosed; provenance retained; receipt subcases in Phase 8 |
| S7 | Tampering, unauthenticated/wrong org/owner, altered role | Reject unauthorized access; no private content; receipt integrity subcases in Phase 8 |
| S8 | Receipt expiry/revocation, already-open view | Subsequent reads deny content; refreshed state clears it |
| S9 | Incident clears after receipt issue | Historical snapshot stays distinct; expiry/revocation still enforced |
| S10 | Empty, permission denial, provider/backend failure, session change | Clear states, no silent simulation fallback or previous-account data |
| S11 | Desktop/mobile/keyboard, direct links/history/refresh, two tabs | Usable complete flows, settled navigation and consistent shared readers |
| S12 | Affected/parallel route, threshold, stale/missing data, hazard | Relevant labelled estimate or abstention; no unrelated alert |
| S13 | Unshared/shared/stopped/ended journey, wrong org, open employer view | Only current authorized shares; stop/end denies next read and clears updated view; no geometry |
| S14 | History/empty period/unknown cause/date edge/new incident | Totals and recurrence reconcile with history; window inclusion explicit; CSV matches if built |

### Measurement targets

| ID | Target and qualification |
| --- | --- |
| M1 | All applicable enumerated scenarios pass; report failures individually |
| M2 | Zero promotions in enumerated duplicate-attack cases; report case count, not a general detection rate |
| M3 | Receipt access/integrity/lifecycle negatives pass and no forbidden employer fields when receipts are included |
| M4 | Proposed demo p95 report-to-map ≤3 seconds and receipt verification ≤1 second; record environment/sample count if measured |
| M5 | Exact fixture delay/savings arithmetic; unavailable without inputs |
| M6 | Proposed five-volunteer test: report within 20 seconds and at least four explain sharing correctly; never claim volunteers were tested unless run |
| M7 | Hotspot/recurrence/monthly totals equal independently computed fixture ground truth |

Use deterministic unit tests, real persistence/policy tests and end-to-end browser interaction. Field accuracy, general spoof resistance, calibrated precision/recall and battery impact are outside acceptance. Local production and hosted browsers are separate checks.

## Decisions and dependency gates

| Planning decision / unresolved dependency | Rule |
| --- | --- |
| Verified phases; one human plus AI | No assumed seven-day schedule or four parallel developers; small reviewed commits |
| Local Docker Supabase | Keep isolated development; hosted credentials/configuration require separate authorization |
| Supplied TrafficSense Mangaluru design | Follow visual baseline, correct claims, review material changes |
| Core seven modules before receipt extension | Preserve thin traffic/employer scope; explicit decision for any cut |
| Employer preference/minimum receipt fields | Ask whether limited status or receipts address the need; absent response, receipt remains provisional |
| Provider terms/keys/quotas/hosting | Confirm before dependent integration or deployment; never disable TLS/integrity checks to bypass failure |
| Privacy/retention/account policy | Approve/enforce before real data or public account use |
| Event deadline/timezone/rubric/pre-work/AI disclosure | Confirm before promising submission; product brief is not event rules |

User owns employer/event communication, access, final review and submission. AI implements bounded tasks under [the implementation workflow](implementation.md#rules-for-every-implementation-task). No implicit authorization to push, deploy to an unknown target, collect personal data or contact outsiders.

## Research and cost assumptions

These retained research notes are supplied context, not independently verified findings. Re-check primary sources, current prices, competitor features and legal dates before public claims. No “first,” “only,” winning-odds or adoption claim follows from this plan.

Crowd reporting, route alternatives and traffic analytics already exist. Employer transport tracking and Google trip sharing are substitutes. The possible differentiator is explainable evidence plus a minimal recipient-bound summary for self-commuters; one employer's problem statement does not validate adoption. A few searches not finding a direct receipt competitor is not proof of novelty.

### Retained source references

| Topic | Source / qualification |
| --- | --- |
| Roads analytics | [Google Roads Management Insights](https://mapsplatform.google.com/resources/blog/roads-management-insights-is-now-available-build-safer-smarter-and-more-efficient-road-networks/); [TraffiCure features](https://www.trafficure.com/features), [vendor webinar](https://www.trafficure.com/webinar/manage-your-city-traffic); vendor adoption claims need checking |
| Bengaluru tools | [IEEE](https://spectrum.ieee.org/bengaluru-traffic), [Arcadis ASTraM](https://www.arcadis.com/en/projects/asia/india/transforming-bengaluru-traffic-with-the-astram-initiative/), [reported app issues](https://www.deccanherald.com/india/karnataka/bengaluru/bengaluru-glitches-on-traffic-police-app-leave-users-frustrated-3690113) |
| Mangaluru context | [AI cameras/ITMS](https://newskarnataka.com/karnataka/mangaluru/mangaluru-smart-city-implements-advanced-traffic-management-technology/22052024), [signal trial](https://newskarnataka.com/mangaluru/trial-run-of-new-traffic-signals-in-mangaluru-creates-chaos-at-key-junctions/16092025/), [older road coordination report](https://www.deccanherald.com/india/karnataka/road-works8200dc8200tells-mcc-officials-coordinate-2049278); not proof of current analytics coverage |
| Employer transport | [MoveInSync](https://moveinsync.com/?p=34571), [Routematic context](https://www.cbinsights.com/company/1km-a-pied/alternatives-competitors); verify fleet versus self-commuter scope |
| Existing trip sharing | [Google Share trip progress](https://blog.google/products/maps/better-way-share-your-eta-google-maps/); compare current screens before positioning |
| Delay verification precedent | [NYC transit service](https://secondavenuesagas.com/2010/06/07/transit-unveils-online-delay-verification-app/), [lateness forms](https://paperform.co/templates/retail-store-employee-tardiness-report/); not validation of this road-receipt design |
| Crowdsourced trust | [SIH repository listing](https://github-redirect.dependabot.com/besthvr12/SIH-Hackathon), [UIC paper](https://www.cs.uic.edu/~jalowibd/uploads/ICM3423.pdf), [Sensors 2019 mirror](https://ltfe.org/reference/crowdsourced-traffic-event-detection-and-source-reputation-assessment-using-smart-contracts/) |
| Attack and open source | [99-phone precedent discussion](https://contrapunctus.codeberg.page/blog/traffic-data-for-osm.html), [Awaaz](https://fossunited.org/hack/fosshack26/p/90m5877fmp); investigate overlap rather than claim uniqueness |
| GPS/reports | [GPS accuracy](https://www.gps.gov/systems/gps/performance/accuracy/), [Waze classifier](https://www.mdpi.com/2078-2489/16/6/423), [snow-report research](https://arxiv.org/pdf/2311.10740), [coverage/timing study](https://dr.lib.iastate.edu/entities/publication/c399b90b-c4a9-410f-9600-ef8e655f91d3/full), [location matching](https://railroads.dot.gov/elibrary/evaluating-crowdsourced-data-waze-rail-safety); none is this application's benchmark |
| Legal context | [Hogan Lovells](https://www.hoganlovells.com/en/publications/indias-digital-personal-data-protection-act-2023-brought-into-force-), [DSK](https://dsklegal.com/?p=26455), [Trilegal summary](https://trilegal.com/wp-content/uploads/2025/11/DPDPA.pdf); verify official obligations/effective dates, not legal advice |
| Costs/map limits | [Supabase pricing](https://supabase.com/pricing), [OSM tile policy](https://operations.osmfoundation.org/policies/vector/), [OSRM demo policy](https://github.com/Project-OSRM/osrm-backend/wiki/Api-usage-policy); public demo endpoints are not assumed production services |
| Wider traffic context | [reported national congestion cost](https://www.newsbytesapp.com/news/india/bcg-analysis-says-delhi-mumbai-bengaluru-kolkata-lose-rs147lcr-annually/tldr), [mapping risks](https://restofworld.org/2025/google-maps-india-misdirection-fatal-accidents/), [Mappls comparison](https://www.digit.in/features/general/what-is-mappls-app-features-explained-how-is-it-compared-to-google-maps.html); verify originals before quoting, not Mangaluru measurements |

Optional validation work: ask the employer about receipt versus limited status; compare Google/Waze sharing/reporting screens; inspect Awaaz; ask 3–5 commuters what they would share; check local authority publications. Record replies and actual research only in progress, not as planned assumptions that became facts.

Goal: no cash cost for the synthetic demo, not a guarantee. Check hosting/database/tile terms, pause behavior and quotas. Preserve a labelled local fallback. Pilot arithmetic: 500 commuters ×22 working days ×2 trips =22,000 trips/month; 50,000 commuters is 100×. Illustrative payloads at 240×60-byte raw samples/trip are about 317 MB/month versus 20×100-byte summaries at about 44 MB/month, excluding overhead. This is an estimate, not permission to retain raw location.

Earlier illustrative routing cost assumed 24,200 monthly calls and third-party prices yielding about $190 or $70/month; Supabase Pro was reported as $25/month. Recheck official prices before budgeting; the core demo uses no routing API. Team time, hosting, tile egress and operations are not free by assumption. Validate possible manager time saved and disputes resolved rather than inventing impact figures.

## Planned demonstration and release

Demonstrate, in order: report and evidence; scripted duplicate attack; relevant alternative alert; explicit commuter sharing and employer stop/end; consistent hotspot/monthly history; optional receipt preview/verification/revocation. Explain simulated data and evidence limits throughout. Prepare a short narrative rather than promising unmeasured benefits.

Release requires the applicable checks in [Phase 9](implementation.md#phase-9--regression-release-and-handoff), user review and reproducible setup. Hosted acceptance needs authorized deployment and deployed browser tests. Confirm any event artefacts and deadline before scheduling submission; preserve a recovery buffer rather than starting new features immediately before it.
