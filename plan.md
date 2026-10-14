# Project Plan — TrafficSense (working name)

> **Version 4.1 — 14 Oct 2026.** Retains v4's planned thin coverage of the seven recommended modules in the [original problem statement](docs/Traffic_JAM.pdf), with [source-page traceability and explicit limits](docs/README.md). Updates delivery for fewer than eight days, a registered team of four but one active human builder with GPT-Astra AI-agent assistance. The official framework scaffold is now generated; product modules remain unimplemented.
> **Tagline (draft):** *Understand the disruption, avoid affected roads, share limited delay evidence, and investigate recurring problems.*
>
> **Verification note:** The 12-page supplied PDF was read for this documentation review. It is an AI-generated product brief based on employer input (p. 12), not confirmed event rules. Section 7 contains supplied research claims, not independent verification by this review. Prices, dates, legal points, and competitor features need checking before slides. A signed receipt proves integrity and origin, not GPS truth or why anyone was late.

## Evidence labels

| Label | Meaning |
| --- | --- |
| `[R]` | Researched; source in section 7; not independently verified. |
| `[A]` | Assumption or proposed design; needs validation. |
| `[T]` | Target to measure, not a result. |
| `[V]` | Verified application result. **None exist yet.** |

---

## 1. Current Status and Core Idea

- Working name: TrafficSense / RoadAlert; final name undecided.
- Proposed track: Smart Mobility & Traffic Intelligence (employer-originated problem statement). Event rules, exact deadline/time zone, and rubric remain unconfirmed.
- Stage: initial setup. The official Next.js TypeScript/Tailwind starter is generated; dependency/check results are recorded in the current task. No authentication or traffic modules are implemented yet.
- **Main goal:** REPORT → VERIFY → ALERT → ANALYSE. Explain disruptions, help commuters avoid affected roads, support consent-based employer visibility, and show recurring problems. See PDF pp. 1 and 12.
- **Direction:** thin planned coverage of all seven recommended modules on one simulated corridor. Explainable evidence and the fake-report attack are core; the Delay Receipt is a proposed extension, with fields and prominence pending employer feedback.
- **Confirmed capacity:** team of four on paper; only the user is currently building, assisted by the GPT-Astra AI agent. Plan for one human's available hours, not four parallel developers.
- **Confirmed time constraint:** fewer than eight days remain. Use the seven-day target in section 10 only if it fits the actual deadline; there is no guaranteed eighth day.
- **Selected stack:** Next.js + Supabase, with pnpm inside Docker and no extra backend services. The official Next.js starter is scaffolded; Supabase integration, map provider, hosting, account access and privacy defaults remain pending.
- Safe first work after the initial checks: setup/auth/roles, seeded corridor and simulator, reporting/evidence rules, and map/details. Employer feedback gates the final receipt contract and headline, not those independent foundations.

**One-sentence pitch:** TrafficSense shows evidence behind traffic disruptions, alerts commuters to a precomputed alternative, shares limited commute information with consent, and gives authorities clearly labelled recurring-hotspot statistics.

## 2. How We Maintain This File

1. Update the relevant task before implementation: scope, owner, dependencies, acceptance checks.
2. Use proposed / ready / in progress / blocked / completed / deferred; complete only with evidence.
3. Record implementation separately from verification (commands, browser steps, failures, limits).
4. Keep assumptions, targets, researched claims, and verified results distinct.
5. Map every task to the [source brief and coverage reference](docs/README.md). **Do not drop a recommended module without recording the decision, remaining coverage gap, and demo impact here.** Planned or simulated coverage is not full real-world implementation.
6. Keep secrets, real journeys, and credentials out of docs and fixtures.
7. Pitch claims trace to `[V]` results or checked sources. Label simulated data everywhere it is shown.

---

## 3. Validation: Does This Already Exist, and How Good Is the Idea?

### 3.1 Verdict by component

| Component | Exists? | Who / evidence `[R]` | Verdict |
| --- | --- | --- | --- |
| Crowd incident reporting with confirmations | **Yes, commodity** | Google Maps and Waze incident reports; Mappls reporting; Awaaz (open source) with confirmation and auto-expiry | Table stakes. Not novel. |
| Trust / verification of crowd reports | **Yes, as a known idea** | A Smart India Hackathon 2020 problem statement asked for exactly this ("trust mechanisms… verified by other users on the same route"); academic trust and reputation models (UIC; Sensors 2019); Waze report-reliability studies | The *idea* is old. A clear, explainable demo and an attack test can still stand out; the concept cannot. |
| Alternative routes | **Yes, commodity** | Google, Waze, Mappls | Table stakes; include thinly because the PS requires it. |
| Authority hotspot analytics | **Yes, commercial, deployed in India** | Google Roads Management Insights; TraffiCure (vendor lists Pune City Police, Kolkata Police and others as live); Bengaluru's ASTraM | **Not a gap in big cities.** Include because the PS requires it; do not claim novelty. The supplied search summary found camera/signal-based ITMS in Mangaluru, not a speed-analytics product; that search was not exhaustive or independently checked here. |
| Employer visibility of commute | **Yes, for company transport** | MoveInSync and Routematic track company cabs/shuttles with ETA and delay alerts | Covers fleet commutes, not employees driving themselves `[A]` verify. |
| Employee shares live trip with someone | **Yes, free substitute** | Google Maps "Share trip progress" shares live location, route, and ETA | Shows more than needed (the route), shows no "why", and gives no tamper-evident after-the-fact proof. This is the real substitute to beat. |
| Employer asks "was traffic the reason?" | **Manual and unverified today** | HR late-arrival forms accept self-reported reasons and screenshots; New York's transit authority built an official delay-verification service because employers demanded proof (2010) | Confirms the pain exists; suggests no equivalent for road commuters `[A]`. |
| **Signed, minimal, revocable delay receipt backed by incident evidence, for self-commuters** | **Not found** | No direct competitor was reported in the supplied search summary | Closest thing to a real wedge. **Absence from a few searches is not proof**, and the need is validated by only one employer so far. |
| Fake-report attack as a demo | The attack is real | A well-known stunt used 99 phones to fake a Google Maps traffic jam (cited in an OSM discussion) | A strong, honest demo hook with real-world precedent. |

### 3.2 How good is the idea? (honest assessment)

| Dimension | Assessment |
| --- | --- |
| Problem is real | **Medium–high.** An employer stated it, and the NYC precedent shows employers do demand delay proof. Only one employer is confirmed. |
| Novelty | **Low** for 5 of the 7 PS modules. **Low–medium** for the receipt wedge. |
| Feasibility in a hackathon | **High** if scope stays thin and the corridor is simulated. |
| Competitiveness | Will not win on uniqueness. Can win on **completeness of the PS, a convincing trust demo, and privacy done properly.** I cannot estimate winning odds. |

**Main risks to the receipt:** an employer may prefer simple live sharing; employees may not use it; signed observations do not prove a device was genuinely present or why someone was late. Ask the employer (P0-A) before finalising the receipt. The source brief supports the traffic problem, but does not validate acceptance of our receipt design.

### 3.3 Positioning that holds up
- **Do not say** "first", "only", or "no one does this".
- **Say:** "For employees who drive themselves, today's options are a screenshot nobody can verify or live location sharing that reveals the whole route. We give a verifiable, minimal alternative, backed by visible incident evidence."
- Present authority analytics honestly: "Big-city police already buy this; we show a lightweight crowd-based version for a city like Mangaluru, built on the same evidence."
- Acknowledge Awaaz and Google/Waze reporting openly; differentiate on evidence display, the receipt, and the employer flow.

### 3.4 Validation tasks (do before or alongside coding)
- [ ] P0-A: User sends the employer: "Would you accept a verified delay receipt instead of a screenshot, or is live trip sharing enough?" Explain that verification covers evidence and receipt integrity, not guaranteed GPS truth. Record the reply and required fields here; this message has not been sent by the agent.
  - If accepted: finalise the minimum receipt fields and make sharing/verification prominent.
  - If live sharing is enough: lead with evidence, the attack demo, and a consent-based status dashboard; keep the receipt supporting or record an explicit scope change.
  - If no reply: continue independent foundations; treat the proposed receipt fields as a provisional demo design, not employer-approved.
- [ ] P0-B: Test Google Maps and Waze incident screens and "Share trip progress" on this corridor; record what they show and omit (screenshots).
- [ ] P0-C: Inspect Awaaz's repository or demo; list overlaps and differences.
- [ ] P0-D: Ask 3–5 commuters whether they would create a receipt and what they fear it reveals.
- [ ] P0-E: Check whether Mangaluru police or the smart-city command centre publish any speed or incident analytics.

---

## 4. Problem-Statement Coverage

The seven modules are recommended on PDF p. 12, not established event submission rules. [docs/README.md](docs/README.md) maps each to source pages, acceptance checks, and deliberate limits. Receipt signing is our extension to modules 4 and 6. All rows below are planned, not implemented.

| PS module (recommended MVP) | v4.1 scope | Tier |
| --- | --- | --- |
| 1. Registration and login | Accounts with roles: commuter/employee, employer, authority (demo), admin (seed/reset only) | Must |
| 2. Live GPS + traffic map | Map with incident markers and details; foreground GPS optional; simulated corridor with visible provenance. Not a live-traffic feed. | Must |
| 3. Incident reporting | Point on corridor, category or "Unknown", timestamp; photo/voice deferred | Must |
| 4. Incident verification | PS levels shown as evidence labels (section 5.A); no invented confidence percentage | Must |
| 5. Alternative route alert | One fixed corridor, one precomputed alternative, event-driven alert, labelled estimated saving | Must (thin) |
| 6. Employer employee-travel dashboard | Status table of **journeys the employee started and chose to share**, plus receipts; no route breadcrumb | Must (thin) |
| 7. Traffic analytics and monthly reports | Seeded history: hotspot ranking, recurrence ("X of last 30 working days"), monthly reason table; labelled simulated. CSV is optional. | Must (thin) |

**Deferred, not dropped from the product vision:** photo/video evidence and AI classification, voice reporting, emergency SOS, native apps and background tracking, traffic prediction, full authority and admin dashboards, API integrations, push notifications, hosted routing engine, reputation scoring, general spoof detection. Recorded in the decision log.

---

## 5. Solution Design `[A]`

### A. Evidence assessment (PS verification levels, made computable)

| PS level | v4 behaviour | Notes |
| --- | --- | --- |
| L1 User reported | Valid report from an authenticated source | Never implies congestion or cause |
| L2 GPS confirms location | Reported or observed position overlaps the selected segment, acceptable accuracy | Supports device location only |
| L3 Multiple users | ≥ 3 distinct source identities, same segment and direction, 15-minute window; one vote per source per time bucket | Duplicates are idempotent |
| L4 GPS speed confirms congestion | ≥ 3 independent sources with slowdown below 40% of baseline over 5 minutes | Thresholds are assumptions to test |
| L5 Photo/video | Shown as "not collected in this version" | Deferred |
| L6 Authority confirmation | Optional seeded authority-confirm action, labelled simulated; otherwise show unavailable | First-cut feature, not required for L1–L4 or read-only authority analytics |

- **Cause is separate:** show reported categories with their sources; use "Unknown reason" when evidence is thin. A claimed accident never establishes an accident by itself.
- **Lifecycle:** stale after 20 minutes without fresh corroboration; cleared after 5 minutes of recovery above 70% of baseline; authorised manual resolve. Use segment identity and direction, not radius alone.
- **Display:** counts, supporting observations, freshness, and uncertainty. **No confidence percentage** (the PS example shows one; we deliberately do not, because it would be uncalibrated; recorded as a decision). Levels are evidence indicators, not a strict ordering of truth: a photo or authority label cannot silently stand in for observed slowdown.
- Server derives source identity from authentication; the browser cannot assign status. Distinct accounts do not establish independent people. Simulator sources are known synthetic identities; passing the duplicate test does not establish general Sybil resistance.

### B. Live map and simulated attack
- One corridor with a reproducible incident and synthetic slowdown summaries; every synthetic marker, journey, and receipt shows **SIMULATED**.
- Reports, evidence changes, and expiry update markers and the open details panel consistently. Text and icons accompany colour; keyboard access; loading, empty, provider-failure, and stale states.
- **Attack demo:** one source repeatedly submits a fabricated cause. Eligible-source count and corroborated status do not rise, and no traffic-supported receipt can be issued. Frame it as rejection of a **scripted duplicate-report attack**, with a one-line nod to the 99-phone precedent. It is not proof of general attack resistance.
- Simulator controls exist only in demo mode.

### C. Alternative route alert (thin, fixed corridor)
- One primary route and **one precomputed alternative** stored as data (no routing API).
- Alert only when a corroborated incident intersects the primary route's segment. Show "alternative saves about X min (estimated, simulated)" and **abstain** when the saving is below 5 minutes or the data is stale `[A]`.
- Calculate savings only from comparable, fresh primary/alternative travel-time inputs. Seeded baselines and scripted delay inputs may support an explicitly simulated estimate. If alternative inputs are missing, show "alternative not observed / saving unavailable" rather than recommend it as faster. Suppress a recommendation for a known closure or hazard; a precomputed route is not a safety guarantee.
- A parallel road must not trigger the alert.

### D. Delay measurement and Delay Receipt

The fields below are a provisional design pending P0-A, not an employer-approved contract. Build evidence and authorisation foundations first. When a receipt is included, consent, recipient restriction, integrity, expiry, revocation, and negative tests remain mandatory regardless of pitch prominence.

- **Estimated delay** = `max(0, observed traversal time − baseline traversal time)` over a complete observed segment, with the baseline named. Missing or partial data shows "delay unavailable".
- Receipt fields only: `receipt_id · pseudonymous commuter reference · zone/segment label · observation window · estimated delay (or unavailable) · baseline label · evidence summary · provenance · issued_at · expires_at · recipient org id · signature`. Name appears only if the commuter opts in and previews it.
- The server derives the summary from stored eligible evidence and signs it (Ed25519 proposed, canonical payload); it never signs client-supplied delay or verification claims. A receipt is issued only for an eligible journey and a corroborated incident.
- Employer verification requires authenticated organisation membership. A link or signature alone is not an access credential. Signature is bound to the recipient and expiry (7 days proposed). Revocation and expiry are checked on every authenticated read. A receipt is an issuance-time snapshot; later incident clearance does not erase it.
- Required wording: **"This summary reflects reported device observations and supporting traffic evidence. It does not prove who carried the device, when the journey began, or why a person arrived late."**

### E. Employer dashboard (PS section 5, with the PS's own privacy rules from section 6)
- Table: employee reference · corridor label · status (normal / delayed / blocked) · estimated delay · evidence level. Only for journeys the **employee started and chose to share with that organisation**.
- Sharing stops when the journey ends or the employee stops it. A visible "sharing active" indicator is shown to the employee. Every server read checks current consent, journey state, and recipient membership; an already-open employer view must clear revoked data on refresh or its next update. Refresh-based views show last-updated time and are not called live tracking.
- No route geometry, breadcrumbs, home location, or off-journey tracking. The receipt is an after-the-fact evidence summary, not proof of lateness.
- Employer-configurable policy in the demo is limited to "only when the employee starts a journey". Other PS tracking policies are deferred.

### F. Analytics and monthly report (PS sections 7, 8, 17; seeded)
- Seeded history for about five junctions across several months, clearly labelled **SIMULATED**. The PS's sample figures are illustrations, not data.
- Hotspot ranking by delay-hours; recurrence = congestion days ÷ working days in the window; cause mix, peak window, average and maximum delay, and trend.
- Monthly report with a reason/incident/total-delay table; CSV export optional, PDF export deferred. Compute the view from deterministic incident history, not unrelated hardcoded totals. Define delay-hours, working-day denominator, date/time zone, and unknown-cause handling in tests. New simulated incidents must update the corresponding aggregate or be explicitly outside the displayed historical window.
- Wording: "suggested investigation" only; engineering decisions stay with the authority (as in the PS).

### G. Privacy and retention
- The commuter starts and stops foreground collection and sees an indicator. A web app cannot promise background GPS.
- Raw pings are processed in memory and not uploaded in the core demo; the server receives only segment summaries.
- Proposed defaults, pending confirmation: summaries retained up to 7 days, receipt access 7 days, revocation effective on the next server read, minimal audit log without raw locations or full payloads.
- Employers never receive raw coordinates, route geometry, unrelated incidents, or unrestricted journey access. Zone and time data remain sensitive.
- Consent does not remove the workplace power imbalance and does not equal legal compliance; real deployment needs legal review. DPDP notice, consent, and security obligations are scheduled to start 13 May 2027 `[R]` (verify against the official text).

---

## 6. Technical Approach

Next.js + Supabase is the selected stack for this build; the remaining implementation details are proposed `[A]`. Use one application and no additional backend services. Provider credentials and deployment access still need checking.

| Layer | Selected / proposed choice | Fallback / limit |
| --- | --- | --- |
| Client | Next.js, mobile-first web app (selected) | No native app or framework switch without a recorded decision |
| Map | MapLibre GL with a policy-compliant OSM-derived tile source | Check attribution and quotas; show provider failure explicitly |
| Backend | Server routes + Supabase Postgres/Auth (row-level security); Realtime optional | Authenticated refresh is acceptable if Realtime slips |
| Signing | Server-side Ed25519 library; key kept server-side | Specify the canonical payload; run tamper tests |
| Lifecycle | Shared freshness/expiry rules; scheduled cleanup | Reads enforce expiry even if cleanup has not run |
| Demo data | Deterministic simulator and seeds; precomputed alternative | No live-traffic or routing API needed |
| Hosting | Vercel or a familiar Node host | Confirm demo/commercial terms |

Conceptual data: `users · orgs · memberships · journeys · segment_summaries · incident_reports · incidents · incident_evidence · receipts · shared_journeys · consents · audit_log · hotspot_history`.

### Threat model for the core demo

| Threat | Required control / test | Remaining limitation |
| --- | --- | --- |
| Duplicate fake reports | Server-derived identity, idempotency, per-source dedup | Separate malicious accounts may evade this |
| Invented cause | Cause stays reported/unknown | Real cause not automatically established |
| Fabricated client delay | Derive receipts from server-held eligible observations | Input device observations can still be spoofed |
| Receipt modification | Canonical signed payload; verify on read | Signature does not prove observation truth |
| Cross-organisation access | Authenticated recipient binding; negative tests | A viewer can copy what they see |
| Expired/revoked access | Check current state on every view | Saved copies cannot be recalled |
| Excess disclosure | Allowlisted employer responses; no journey geometry | Coarse zone/time can still be sensitive |
| Employer sees unshared journeys | Dashboard reads only journeys flagged shared to that org | Policy and consent need human review |
| Simulator misuse | Demo-only controls; provenance preserved | Simulated results do not predict field accuracy |

---

## 7. Research Notes and Sources

### New in v4: existing solutions
| Finding | Source |
| --- | --- |
| Google Roads Management Insights offers authorities recurring-hotspot and congestion-trend analysis | https://mapsplatform.google.com/resources/blog/roads-management-insights-is-now-available-build-safer-smarter-and-more-efficient-road-networks/ |
| TraffiCure turns that data into ranked junctions and alerts; vendor site lists Pune City Police, Kolkata Police, Howrah, Bidhannagar, Barrackpore as live | https://www.trafficure.com/features · https://www.trafficure.com/webinar/manage-your-city-traffic |
| Bengaluru's ASTraM: congestion alerts, incident logging, event management, dashboard analytics, a citizen companion app; users complained of glitches | https://spectrum.ieee.org/bengaluru-traffic · https://www.arcadis.com/en/projects/asia/india/transforming-bengaluru-traffic-with-the-astram-initiative/ · https://www.deccanherald.com/india/karnataka/bengaluru/bengaluru-glitches-on-traffic-police-app-leave-users-frustrated-3690113 |
| Mangaluru: smart-city AI cameras, command centre, ITMS signals; a Sept 2025 signal trial caused congestion | https://newskarnataka.com/karnataka/mangaluru/mangaluru-smart-city-implements-advanced-traffic-management-technology/22052024 · https://newskarnataka.com/mangaluru/trial-run-of-new-traffic-signals-in-mangaluru-creates-chaos-at-key-junctions/16092025/ |
| MoveInSync tracks company cabs/shuttles with ETA and delay alerts (1.3M+ daily users claimed); Routematic is a similar vendor | https://moveinsync.com/?p=34571 · https://www.cbinsights.com/company/1km-a-pied/alternatives-competitors |
| Google Maps "Share trip progress" shares live location, route, and ETA with chosen contacts | https://blog.google/products/maps/better-way-share-your-eta-google-maps |
| NYC transit built an online delay-verification service because employers asked for proof (2010) | https://secondavenuesagas.com/2010/06/07/transit-unveils-online-delay-verification-app/ |
| HR late-arrival forms collect self-reported reasons and screenshots | https://paperform.co/templates/retail-store-employee-tardiness-report/ |
| SIH-2020 problem statement asked for trust mechanisms and same-route verification (repository listing) | https://github-redirect.dependabot.com/besthvr12/SIH-Hackathon |
| Academic crowdsourced-report verification and reputation work | https://www.cs.uic.edu/~jalowibd/uploads/ICM3423.pdf · Mihelj et al., Sensors 19(15):3267, 2019 (mirror: https://ltfe.org/reference/crowdsourced-traffic-event-detection-and-source-reputation-assessment-using-smart-contracts/) |
| Fake traffic jam via many phones is a known attack | https://contrapunctus.codeberg.page/blog/traffic-data-for-osm.html (cites a Wired story) |
| Awaaz: open-source Indian incident reporting with an open feed | https://fossunited.org/hack/fosshack26/p/90m5877fmp |

### Retained from v2/v3 (background; qualify before quoting)
| Topic | Source | Qualification |
| --- | --- | --- |
| Phone GPS about 4.9 m under open sky, worse near structures | https://www.gps.gov/systems/gps/performance/accuracy/ | Context for uncertainty only |
| Waze alert classifier: 82.5% accuracy, F1 82.8%, AUC 0.90 | https://www.mdpi.com/2078-2489/16/6/423 | Different data; not our benchmark |
| 690 of 853 unplowed-road reports confirmed; ~1.9 false reports/day | https://arxiv.org/pdf/2311.10740 | Snow reports, not congestion |
| Waze coverage 43.2% of agency reports; 9.8 min earlier than probe-based | https://dr.lib.iastate.edu/entities/publication/c399b90b-c4a9-410f-9600-ef8e655f91d3/full | Check methods |
| Report vs incident location can differ | https://railroads.dot.gov/elibrary/evaluating-crowdsourced-data-waze-rail-safety | Use segment matching |
| DPDP implementation and employment context | https://www.hoganlovells.com/en/publications/indias-digital-personal-data-protection-act-2023-brought-into-force- · https://dsklegal.com/?p=26455 · https://trilegal.com/wp-content/uploads/2025/11/DPDPA.pdf | Check official text; dates differ slightly across sources |
| Four-metro congestion cost, ~₹1.47 lakh crore/year (BCG) | https://www.newsbytesapp.com/news/india/bcg-analysis-says-delhi-mumbai-bengaluru-kolkata-lose-rs147lcr-annually/tldr | National context, not Mangaluru |
| Mangaluru NH-66 flyover history and coordination gaps | https://www.deccanherald.com/india/karnataka/road-works8200dc8200tells-mcc-officials-coordinate-2049278 | Old; check current conditions |
| Google Maps/Mappls context | https://restofworld.org/2025/google-maps-india-misdirection-fatal-accidents/ · https://www.digit.in/features/general/what-is-mappls-app-features-explained-how-is-it-compared-to-google-maps.html | Check current apps |
| OSRM demo policy; OSM tile policy | https://github.com/Project-OSRM/osrm-backend/wiki/Api-usage-policy · https://operations.osmfoundation.org/policies/vector/ | Not production dependencies |
| Supabase pricing | https://supabase.com/pricing | Check current limits and pause behaviour |

---

## 8. Evaluation and Acceptance Plan

**Application verification status: Not run.** All targets are unmeasured.

### Required scenarios

| ID | Scenario | Acceptance target `[T]` |
| --- | --- | --- |
| S1 | Genuine scripted slowdown, eligible synthetic sources | Evidence shows rule inputs; incident corroborated; map and details agree |
| S2 | Fabricated cause + repeated submissions by one source | No corroborated status, no inflated source count, no traffic-supported receipt |
| S3 | Missing, stale, malformed, or insufficient observations | Explicit unsupported/unavailable state; no invented delay or cause |
| S4 | Freshness expiry and supported recovery | Correct stale/cleared status on map and details |
| S5 | Known baseline vs missing baseline | Exact excess-time arithmetic; "unavailable" when data is missing |
| S6 | Preview → consent → share → intended employer view | Only previewed allowlisted fields reach the employer; SIMULATED label persists |
| S7 | Tampered payload, wrong org, unauthenticated, another user's journey | Rejected; no private content disclosed |
| S8 | Receipt expiry, revocation, already-open employer page | Later reads deny content; refreshed view shows validity |
| S9 | Incident clears after receipt issuance | Snapshot stays distinct from current incident status; expiry/revocation still enforced |
| S10 | Empty map, denied location, provider failure, session change | Clear explanations; no silent substitution of simulated for live data; no previous user's state |
| S11 | Desktop/mobile, keyboard, refresh, direct links | Core flow usable; shared state consistent |
| S12 | Alternative route: affected route, parallel road, saving below threshold, missing/stale inputs, known hazard | Affected route alerted with labelled estimate; parallel road not alerted; abstains below 5 min, without fresh comparable inputs, or for a known hazardous alternative |
| S13 | Shared journey, stopped/ended journey, unshared journey, wrong org, already-open employer page | Only authorised active shares appear; stop/end removes access on the next server read and clears refreshed/cached views; unshared journeys never appear; no geometry |
| S14 | Seeded analytics, empty period, unknown cause, new report versus selected historical window | Ranking, recurrence, and monthly totals match the underlying history; live demo events are consistently included or explicitly excluded by date; CSV matches if implemented |

### Metrics

| ID | Metric | Target `[T]` | Status |
| --- | --- | --- | --- |
| M1 | Required scenario pass counts | All pass; record failures individually | Not run |
| M2 | Duplicate-report attack outcome | Zero promotions in enumerated scripted cases (report case count, not a general rate) | Not run |
| M3 | Receipt integrity, authorisation, privacy and lifecycle | Every negative case passes; no forbidden fields in employer payloads | Not run |
| M4 | Report-to-map and receipt-verification latency | p95 ≤ 3 s and ≤ 1 s (demo environment; record sample count) | Not run |
| M5 | Delay and alternative-saving arithmetic on fixtures | Exact expected values; unavailable when data is missing | Not run |
| M6 | Usability and consent understanding | With 5 volunteers: report ≤ 20 s; ≥ 4 correctly state what is shared | Not run |
| M7 | Analytics exactness | Recurrence and totals equal the seeded ground truth | Not run |

Run deterministic unit and integration tests first, then browser checks across map, details, receipt preview, commuter receipt list, employer list/detail, alternative-route alert, and analytics. Include account switching, direct links, consent cancellation, expiry, revocation, and refresh. Use fake time for lifecycle tests. If time permits, add a count-only baseline to show why duplicate filtering matters. Calibrated precision/recall, general spoof resistance, battery impact, and field accuracy are deferred; passing scripted cases is not evidence of them.

Record each result with date, commit, command or interaction, data type (simulated/field), sample size, outcome, and limitations.

---

## 9. Resources and Cost Assumptions

**Core demo:** synthetic accounts, one corridor, deterministic baselines, a precomputed alternative route, seeded analytics. **Goal: no cash cost**, not a guarantee. Confirm map tile terms, hosting and database quotas, attribution, and any free-tier pause (Supabase's free tier pauses after about a week idle `[R]`). Set request limits where supported; keep a local demo dataset and a recorded fallback; never silently replace a failed real integration with synthetic data.

**Pilot arithmetic (corrected) `[A]`:** 500 commuters × 22 working days × 2 trips = **22,000 trips/month**; 50,000 commuters is **100×** that (2.2 million trips).
- Raw 10 s pings: ~240 samples × 60 B × 22,000 ≈ 317 MB/month. On-device summaries (~20 × 100 B per trip) ≈ 44 MB/month. These are payload sizes, not full storage or egress estimates.
- If a commercial routing API were used with one initial call plus one extra call on 10% of trips: ~24,200 calls/month. At third-party-reported list prices (traffic-aware ≈ $10 per 1,000 after a 5,000 free cap; basic ≈ $5 per 1,000 after 10,000) that is roughly $190 or $70 per month; verify on Google's official pricing page. Re-routing every few minutes would cost about ten times more. The demo uses a precomputed alternative only; hosting a routing engine remains deferred.
- Backend: Supabase Pro is reported at $25/month for a production start `[R]`; hosting, tiles, and operations costs are unknown until chosen.
- AI/LLM features are deferred, so no model spend is planned. Pilot and city-scale budgets wait until data sources, retention, and provider contracts are known. Team time is not free.

**Value to validate (no numbers claimed):** minutes of manager or HR time per lateness dispute, and the share of disputes a receipt would settle.

---

## 10. Roadmap and Time Budget

### Scope cut-line

| Tier | Features |
| --- | --- |
| **Must** | Login and server-enforced roles; reporting; L1–L4 evidence; map/details with refresh; simulator and duplicate attack; privacy-safe employer view; fixed-corridor alternative alert; seeded hotspots and monthly table; basic mobile/keyboard usability; negative tests; seed/reset; deployment |
| **Planned receipt, pending P0-A** | Preview, consent, signing, intended-employer verification, expiry and revocation. Final fields and headline wait for feedback; every protection is mandatory if receipts are built. |
| **Should** | CSV export; optional simulated authority-confirm action (L6); Realtime updates; visual polish |
| **Could** | Foreground GPS with denied/unavailable handling |
| **Deferred** | Photos, voice, AI, native app, real routing engine, PDF export, and the remaining exclusions in section 4 |

Cut in order if behind: **(1)** CSV and authority-confirm action, while retaining the read-only authority role; **(2)** Realtime, using explicit refresh and freshness timestamps; **(3)** live employer status table, retaining receipt verification. The third cut is partial module 6 coverage and must be recorded in the coverage table and pitch. Never cut receipt expiry, revocation, authorisation, negative tests, or basic mobile verification. Additional module cuts require an explicit decision; do not silently mark incomplete modules done.

### Phase 0 — Three quick checks (first 1–2 hours)

Status: in progress; documentation only so far.

- [x] Guidelines, repository, central plan, and v4 seven-module direction.
- [x] Record fewer than eight days and one active human builder in a team of four, assisted by the AI agent.
- [x] Select Next.js + Supabase and pnpm; generate the official Next.js starter. Supabase integration remains pending.
- [ ] Confirm exact deadline/time zone, event rules/rubric, allowed pre-work and AI use, required tech, submission items, and available daily hours.
- [ ] User sends P0-A to the employer; record receipt versus live-sharing preference. No reply is required to start independent foundations.
- [ ] Confirm stack access: Supabase project/credentials, map tile provider/terms, hosting account and deployment target.
- [ ] Before real-data work, fix consent, retention/deletion, audit policy, and sharing defaults. Finalise receipt contract after P0-A.

Competitor checks P0-B–P0-E can run alongside the build; unresolved research is not a reason to block a synthetic map or auth skeleton. Event eligibility and missing credentials remain explicit blockers for the work they affect.

### Phase 1 — Safe foundations first (Day 1 target)

- [ ] Write initial auth/role/organisation-boundary tests, then scaffold Next.js + Supabase with documented checks.
- [ ] Seed synthetic commuter, two employer organisations and a read-only authority account; demo login must still enforce server permissions.
- [ ] Add deterministic corridor, map/details shell, synthetic journeys and reset controls restricted to demo mode.
- [ ] Verify login as each role, logout/account switching, direct routes, and denied access; all can see permitted map data, not private employer data.

Acceptance: reproducible setup and seeded map; role boundaries tested. Employer-view access is not granted by a browser role selector alone. Initial subset of S7 and S10–S11 passes.

### Current task — Official Next.js scaffold

- **Status:** completed (14 Oct 2026); authentication and remaining Day 1 work are still pending.
- **Source modules:** shared setup prerequisite for module 1 and later modules; see [coverage reference](docs/README.md).
- **Scope:** user requested `create-next-app` instead of hand-created boilerplate, then selected pnpm. Generate Next.js App Router with TypeScript, Tailwind CSS and ESLint; preserve project docs; convert the initial npm lockfile to pnpm, install dependencies and verify the starter.
- **Exclusions:** authentication, roles, database migration, simulator/map and every domain feature remain the next bounded tasks. Scaffolding alone does not complete Day 1 or module 1.
- **Access constraints:** no Supabase URL/key or `.env.local` is present. The scaffold does not require them. Live authentication and database access will need local configuration; never substitute a mock login silently.
- **Files/routes:** generated package/config files, `src/app` starter, and `public` assets. Keep generated documentation from overwriting project instructions.
- **Steps:** run the official generator; import its scaffold; install; run generated lint/type/build checks; verify the starter through available browser or closest substitute; document commands and limitations.
- **Acceptance:** generator succeeds, installation and applicable checks pass, starter route works, existing project documentation is preserved, and no unimplemented auth/domain functionality is claimed.
- **Verification (14 Oct 2026):** `pnpm install --frozen-lockfile`, `pnpm lint`, `pnpm exec next typegen`, `pnpm exec tsc --noEmit`, and `pnpm build` passed. Generated source/config files match the official scaffold; the original PDF is byte-identical. A temporary Chromium automation script tested the production starter at 1440×1000 and 390×844: image loading, no horizontal overflow, keyboard focus, Documentation link opening, reload, 404 and return navigation; no runtime exceptions. Reviewed settled light/dark layouts. These are starter checks, not domain/auth tests.
- **Dependency caveat:** `pnpm audit --prod` reports no known vulnerabilities. Full audit still reports a high-severity development-only `braces@3.0.3` advisory through Next.js ESLint tooling. `pnpm update braces --depth 10` found no update; the registry returns no matching `braces@3.0.4`, the stated patch. Keep this visible for follow-up rather than suppressing it. pnpm's `unrs-resolver` postinstall was explicitly reviewed and approved; no blanket script approval.
- **Package manager:** pnpm 11.11.0 is pinned; `pnpm-lock.yaml` is the only package lockfile. The starter was initially generated with npm, then converted at the user's request. No Supabase credentials were added.

### Current task — Docker development and checks

- **Status:** completed and verified (14 Oct 2026).
- **Source modules:** shared development prerequisite; no product feature added.
- **User direction:** run the app, package management and checks in Docker. Keep pnpm and commit the verified task.
- **Scope:** Docker Compose development with hot reload and isolated dependency/build volumes; a separate one-off check container; a non-root standalone production image; Docker-first commands and agent guidance.
- **Exclusions:** no auth/database services before their implementation task, no changes to unrelated Docker projects, and no cloud deployment.
- **Acceptance checks:** Compose validates; clean image build/frozen installation succeeds; lint/type/build run inside Docker; development and production routes/assets/404 work; source changes hot-reload and restore correctly; containers run non-root; host dependencies, Git data and environment secrets are excluded from image context; desktop/mobile starter interactions remain usable.
- **Verification (14 Oct 2026):** `docker compose config --quiet`, `docker compose up --build -d --wait app`, `docker compose run --build --rm checks`, and `docker compose --profile production up --build -d --wait production` passed. The isolated checks ran ESLint, route-type generation, TypeScript and a production build. Compose builds reused cached layers; a separate `docker build --no-cache --target dependencies -t trafficsense-dependency-check .` verified a fresh frozen installation of all 353 packages with pnpm 11.11.0.
- **Browser verification:** MCP browser tools were unavailable, so a temporary Node runner inside Docker drove the existing local headless Chromium through its debugging protocol. Development (port 3000) and production (port 3001) each passed at 1440×1000 and 390×844: image loading, no horizontal overflow, keyboard link focus, Documentation click opening its expected URL, reload, missing route and return navigation, with no runtime exceptions. Light/dark screenshots were captured and desktop/mobile samples inspected. A temporary source-text edit and its restoration both hot-reloaded without navigation; `src/app/page.tsx` remains unchanged. No authentication/domain interactions exist to test.
- **Runtime and boundary checks:** both services run as `node` (UID/GID 1000/1000); development dependency/build volumes are writable. The development image excludes Git metadata, local environment files and host build output; the production image contains `server.js` without application source or Git metadata. Production `/`, logo assets and missing-route HTTP status checks passed. Development assets returned 200 for localhost/127.0.0.1 origins and 403 for an untrusted origin. Both services remain available on loopback; unrelated Docker projects were left untouched.
- **Limits and next step:** this verifies local Docker setup, not deployment or product modules. The previously recorded development dependency advisory remains unresolved; no new audit was run. Next is module 1 authentication and server-enforced roles, with Supabase configuration still pending.

### Phase 2 — Reporting, evidence and attack (Days 2–3 targets)

- [ ] Tests first for reports, deduplication, segment/direction/time matching, evidence inputs and freshness.
- [ ] Implement the reporting form and map incident details; state is derived from shared server logic.
- [ ] Add simulator slowdown/recovery controls, baseline-based delay calculation and attack fixtures.
- [ ] Show genuine corroboration and the duplicate-report attack side by side; handle empty, unsupported, expired and provider-failure states.

Acceptance: S1–S5 and relevant S10–S11 pass. Unsupported reports do not gain corroboration by repetition. Do not claim receipt-issuance tests passed before receipts exist.

### Phase 3 — Receipt decision and employer verification (Day 4 target)

- [ ] Record P0-A result; if unanswered, explicitly label the demo contract provisional. Adjust pitch prominence without abandoning traffic verification.
- [ ] Write tamper, wrong-org, unauthorised, ownership, expiry and revocation tests before implementing the receipt flow.
- [ ] Implement server-derived preview, consent, canonical signing, recipient binding, verification, revocation, expiry, minimal audit events and allowlisted payloads.
- [ ] Verify commuter-to-employer sharing, already-open pages, historical evidence snapshots, and attack-based receipt ineligibility.

Acceptance: S6–S9 pass and S2 also blocks receipt issuance. Receipt protections are mandatory regardless of its pitch prominence.

### Phase 4 — Remaining recommended modules, thin (Day 5 target)

- [ ] Fixed-corridor precomputed alternative with relevance, unavailable-data, hazard and abstention tests (S12).
- [ ] Employee-started, recipient-specific shared-journey table, visible indicator and stop/end enforcement (S13).
- [ ] Deterministic hotspot history and monthly reason table with consistent totals (S14). CSV only after required views pass.

Acceptance: S12–S14 pass for implemented scope, with synthetic provenance on every surface. Record any fallback cut and resulting partial module coverage.

### Phase 5 — Verification, deployment and submission (Days 6–7 targets)

- [ ] Run all scenarios and record outcomes; security, tests and browser checks also run after each earlier task.
- [ ] Verify every shared-state surface on desktop and mobile, including roles, direct links, revocation, stop-sharing, expiry, provider failure and analytics.
- [ ] Deploy and repeat the complete flow; fix regressions and verify reset/seed.
- [ ] Rehearse the three-minute demo; capture a clearly labelled fallback; prepare README/screenshots, slides, video and required disclosures.
- [ ] Submit before the confirmed deadline with a reserved buffer. No new features during the buffer.

Acceptance: deployed flow and negative cases pass with recorded evidence; all limitations and partial coverage disclosed; required submission items ready.

### Seven-day target `[A]`, subject to the actual deadline

| Day | Goal | Done when |
| --- | --- | --- |
| 1 | Quick checks, setup, auth/roles, database and seeded map | Each demo role logs in and sees only allowed map/data surfaces |
| 2 | Reporting and L1–L4 evidence rules | Reports correctly update evidence and incident details |
| 3 | Slowdown simulator and duplicate-report attack | Genuine synthetic slowdown corroborates; scripted attack does not |
| 4 | Receipt flow, provisional if employer has not replied | Consent/share/verify/revoke works; tamper, wrong-employer and lifecycle tests pass |
| 5 | Alternative alert, shared-journey table, hotspot/monthly views | Thin flows pass S12–S14, or fallback gaps are explicitly recorded |
| 6 | Full regression/mobile checks and deployment | Complete flow works on the deployed link |
| 7 | Fixes, pitch, slides, recorded demo, README and submission | Submission requirements checked and deliverables submitted in time |

Fewer than eight days is not eight full days. Reserve the final available hours before the real deadline for submission/recovery; day 8 is buffer-only **if it actually exists**, never planned feature time. Daily hours are unknown, so this is a sequence of checkpoints, not a guaranteed capacity estimate. Compress or cut optional work once the exact deadline is known.

### Working with the AI agent

- User owns employer/event communication, provider access, scope decisions, final review and submission. Do not assume the other three registered teammates are active developers.
- Give the agent one small, testable task at a time. Write relevant tests before behaviour, implement, run checks, then inspect the diff.
- Review authentication, signing, consent, and database row-level security especially closely. An agent's "done" message is not independent evidence.
- Agent browser verification covers the changed flow and every shared-state surface; the user should also click through the demo and review recorded results.
- Commit after each checked, reviewed step under the repository commit rules. No blanket authorisation for remote pushes is implied.
- Keep Next.js + Supabase minimal; avoid extra services and deferred features.

## 11. Three-Minute Demo

1. **Problem (20 s):** "A commuter needs to understand a disruption and avoid the affected road; an employer needs limited delay evidence, and authorities need to see recurring problems."
2. **Map and evidence (35 s):** submit a report; show labelled simulated slowdown sources and the L1→L4 labels; cause stays unknown unless supported.
3. **Attack (25 s):** repeat a fabricated report from one source; counts do not rise; state the limited scope.
4. **Alternative route (20 s):** the commuter's route is affected; alert shows the alternative and its labelled estimated saving.
5. **Receipt and employer (45 s):** preview exact fields, consent, share; employer sees the evidence summary and the shared-journey status; no route is exposed; tampered receipt fails; revoke and refresh.
6. **Authority view (20 s):** hotspot "X of last 30 days" and the monthly table, labelled simulated; acknowledge big-city tools exist.
7. **Results and limits (15 s):** show measured test counts only if run; state that signatures do not prove GPS truth.

Total: **180 seconds**. Slides: title/problem; users and validation findings; live demo; tests and limitations; next steps and repository. Adjust the employer/receipt segment after P0-A; if a fallback was cut, demonstrate the remaining flow and disclose the gap instead of claiming full coverage.

## 12. Risks and Blockers

| Risk | Response |
| --- | --- |
| Idea judged as "already exists" | Position honestly (section 3.3); win on PS completeness, trust demo, and privacy |
| Employer prefers simple live sharing | Run P0-A early; keep the receipt thin until validated |
| Scope creep | Cut-line and tiers; deferred list stays deferred |
| Too few real users | Labelled simulation; no adoption claims |
| Device spoofing or multiple malicious accounts | Demonstrate only the specified control; publish limits |
| Estimated delay presented as proof of lateness | Show baseline, provenance, and the limitation text |
| Browser cannot track in the background | Foreground-only optional GPS; synthetic demo; native app deferred |
| Privacy or access leaks | Allowlisted responses, server checks, negative tests, shared-only dashboard |
| Provider outage or free-tier pause | Check terms, explicit failure state, local data, recorded fallback |
| Unverified claims in slides | Verify key sources first; drop what cannot be checked |

## 13. Repository Setup

Status: completed in v1 (historical, not a fresh remote check).
- [x] Verify GitHub authentication and Git identity.
- [x] Initialise Git, commit the documentation, create and push the private repository.
- [x] Verify private visibility, branch tracking, matching commits, clean tree at initial setup.

Repository: [NITHINKR06/hackathon](https://github.com/NITHINKR06/hackathon). `.gitignore` excludes local environment and key files. No application verification follows from repository setup.

## 14. Detailed Task Template

### Task: <name>
- **Status:** proposed / ready / in progress / blocked / completed / deferred.
- **Goal and scope:** required behaviour and exclusions.
- **Owner and dependencies:** decisions, provider access, prerequisites.
- **Affected files and routes:** actual paths once known.
- **Scenarios/metrics:** relevant S1–S14 and M1–M7.
- **Source module:** link the relevant row in [docs/README.md](docs/README.md); record scope changes and coverage gaps.
- **Steps:** write relevant tests first, implement, run checks, verify shared state in the browser, review diff, update docs, commit the checked step.
- **Acceptance checks:** success, denied access, unavailable data, failure, expiry/revocation, viewports.
- **Verification results:** commands, interactions, environment, data provenance, outcomes, limits; "Not run" until executed.
- **Blockers/follow-up:** unfinished work.

## 15. Decision Log

| Decision | Status | Reason |
| --- | --- | --- |
| Central plan and project guidelines | Implemented (docs) | One record of scope and verification |
| Restore all seven recommended modules in thin form | Decided in v4; retained in v4.1 | Follow the source brief's main goal; disclose simulated and partial coverage rather than claim full implementation |
| Show PS verification levels as evidence labels; no confidence percentage | Proposed | Avoids uncalibrated numbers; keeps PS vocabulary |
| Delay Receipt and evidence as the differentiator | Proposed, pending P0-A | Closest thing to a gap found; unvalidated |
| Employer dashboard limited to employee-started, shared journeys | Proposed | Follows PS section 6 privacy rules |
| Alternative route precomputed on one corridor | Proposed | Meets PS without hosting a routing engine |
| Authority analytics seeded and labelled simulated | Proposed | Needs weeks of real data; big-city tools already exist |
| Photo, AI, voice, native app, SOS, prediction, full admin | Deferred | Not needed for the core story |
| Fewer than eight days; registered team of four, one active builder plus GPT-Astra AI assistance | Confirmed by user | Plan sequential checked tasks, not four developers' capacity |
| Next.js + Supabase, no extra backend services | Selected; official Next.js starter generated | Keep the solo build minimal; Supabase credentials/integration still pending |
| Official `create-next-app` scaffold and pnpm 11.11.0 | Requested by user during setup | Generate boilerplate rather than write it manually; retain only the pnpm lockfile |
| Docker for development, package management and checks | Implemented and locally verified (14 Oct 2026) | Isolate dependencies/build output from the host; use Node.js 24 containers and keep Supabase setup in its own task |
| Foundations before final receipt fields | Confirmed v4.1 sequence | Auth, simulator, reporting, evidence and map do not depend on employer preference |
| Receipt fields and prominence | Pending employer response P0-A | The PDF requests traffic verification and employer visibility, not a signed receipt specifically |
| CSV, L6 confirmation, Realtime, then live employer table are fallback cuts | Recorded v4.1 order | Preserve receipt protections; cutting the status table leaves a disclosed module 6 gap |
| Original PDF and source-page traceability in docs/ | Added in v4.1 | Keep the main goal and explicit deviations visible to future work |
| Exact deadline/time zone, event rules/rubric, daily hours, provider access, privacy defaults and final name | Pending Phase 0 | Confirm without inventing an eighth day or live-data availability |

## 16. Completed Work and Verification

- V1: created `AGENTS.md`, `README.md`, and `ai/` guidelines; recorded validation of 12 Markdown files and 14 local links; published the private repository.
- V2: added problem analysis, research, scoring, receipts, stack, evaluation targets, cost assumptions, roadmap. Documentation only.
- V3: narrowed scope to evidence, receipts, employer verification, map, and attack; corrected workload arithmetic; recorded a documentation check on 14 Oct 2026.
- **V4 (14 Oct 2026):** restored the PS modules, added the validation against existing solutions, extended scenarios and metrics (S12–S14, M7), updated schedule and demo. **No documentation checks were run on v4**; external sources were read via search results and not independently verified.
- **V4.1 (14 Oct 2026):** read all 12 PDF pages, copied the source unchanged to `docs/Traffic_JAM.pdf`, and added module/source-page traceability. Updated capacity, selected stack, build order, fallback cuts, and provisional receipt status; aligned README and agent guidance. Documentation checks passed: 14 Markdown files, 33 local links, balanced code fences, 16 numbered sections, 14 scenarios, seven metrics, and seven source-module mappings. Main-goal/stack/scope assertions and `git diff --check` passed. Byte comparison verified the PDF copy is unchanged (128,844 bytes; SHA-256 `3642bcdc74c59edc419bb27e2b653ece845f49bf6fd526ff4d63e4dd63fc9150`). External research was not verified.
- **Scaffold verification (14 Oct 2026):** official Next.js starter generated and converted to pnpm; frozen installation, lint, route type generation, TypeScript, production build, and desktop/mobile Chromium starter checks passed. See the current task for the unresolved development dependency advisory.
- **Domain verification:** Not run. Authentication, roles, simulations, traffic flows, receipts, field tests and deployment are not implemented or verified. All section 8 metrics remain Not run.