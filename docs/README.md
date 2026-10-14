# Problem Statement and Scope Reference

## Original brief

[Traffic_JAM.pdf](Traffic_JAM.pdf) is the original 12-page problem statement supplied by the user, copied unchanged into this repository. Page 12 says the document was generated using ChatGPT from input supplied by an employer experiencing employee-arrival and traffic problems. Treat it as the product brief, not independently verified research or the official hackathon rules.

## Main goal

Identify and communicate road disruptions and their possible causes, help commuters avoid affected roads, provide consent-based employer visibility, and retain useful historical statistics for investigating recurring traffic problems.

The brief's four pillars are **REPORT → VERIFY → ALERT → ANALYSE** (page 12). A Delay Receipt is our proposed extension to traffic verification and employer sharing, not a separately required module in the PDF. Its exact fields and prominence depend on employer feedback; it must not replace the broader traffic goal.

## Recommended MVP traceability

The PDF recommends seven modules on page 12. The following maps them to the bounded demo in [plan.md](../plan.md). Every module is currently **planned, not implemented or verified**.

| Recommended module | Source pages / sections | Planned demonstration | Acceptance reference |
| --- | --- | --- | --- |
| 1. Registration and login | p. 12 MVP; pp. 8–9 §15 roles | Next.js + Supabase authentication; commuter/employee, employer and seeded authority-view roles; seed/reset restricted | Plan Phase 1; S7, S10–S11, S13 |
| 2. Live GPS and traffic map | pp. 1–2 §3; p. 8 §13 | One seeded corridor with incident details and provenance; foreground GPS optional; explicit refresh is acceptable | S1, S4, S10–S11 |
| 3. Incident reporting | p. 1 §2; p. 7 §11 | Simple report form, categories including Unknown, timestamp, location provenance; no photos/voice | S1–S3 |
| 4. Incident verification | pp. 2–3 §4; p. 7 §12 | L1–L4 evidence indicators, separate cause assessment, duplicate-report attack; optional simulated authority confirmation | S1–S5, S7–S9 |
| 5. Alternative route alert | pp. 1–2 §3; p. 9 §16 | Fixed primary route plus precomputed alternative; simulated estimates, relevance checks, and unavailable/stale states | S12 |
| 6. Employer employee-travel dashboard | p. 3 §5; p. 4 §6 | Employee-started, explicitly shared journey status; proposed receipt preview/verify/revoke flow | S6–S9, S13 |
| 7. Traffic analytics and monthly reports | pp. 4–6 §§7–10; pp. 9–10 §17 | Seeded hotspot view and monthly table; explainable recurrence/totals; CSV optional | S14, M7 |

### Deliberate limits, not silent omissions

- This is a web demonstration with labelled synthetic observations, not continuous mobile monitoring or a live traffic service. Optional foreground GPS does not establish full coverage of the PDF's live tracking proposal.
- Evidence levels are indicators, not calibrated probabilities or a strict ordering of truth. Multiple accounts do not prove independent witnesses; a signature does not prove GPS truth or why someone arrived late.
- The alternative route is precomputed, with explicitly simulated inputs. No real routing engine, guaranteed time savings, or road-safety guarantee is promised.
- Employer access requires explicit sharing to an authorised organisation and stops when that sharing ends. No full route, home location, or 24×7 employee tracking is exposed.
- Historical data and monthly figures are seeded and labelled simulated, not observations copied from the PDF's example numbers.
- Photos, AI, voice, native apps, emergency SOS, prediction, general spoof detection, and full administration remain deferred. L5 is not implemented; L6 confirmation is optional and demo-only.
- CSV export, authority-confirm actions, and Realtime updates may be cut first. If necessary, the live employer status table can be cut while retaining receipt verification; record that as partial module 6 coverage, not completion of the live dashboard requirement.

## Rule for future work

Before implementing a task, identify its module above and its acceptance checks in the plan. Before removing or expanding a module, update the plan's coverage table and decision log with the reason, remaining gap, and effect on the demo. The PDF remains unchanged; scope decisions belong in the plan.

[plan.md](../plan.md) holds the project plan; [progress.md](../progress.md) holds implementation updates, blockers, verification results, and commit records. The exact deadline, event requirements, and employer feedback must be confirmed rather than inferred from this brief. Do not describe planned, simulated, deferred, or partially covered behaviour as implemented real-world functionality.
