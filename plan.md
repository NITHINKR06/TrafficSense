# Project Plan

This is the central planning document for the traffic hackathon project. Record future implementation plans, decisions, progress, blockers, and verification outcomes here.

## Current Status

- Working name: RoadAlert / TrafficSense; final name undecided.
- Stage: planning and development guidelines.
- Implemented: project documentation only.
- Application stack, hackathon constraints, and final feature scope: not yet confirmed.
- The roadmap below is proposed, not approval to implement every feature.

## How We Maintain This File

1. Before implementation, add or update the relevant plan with the goal, scope, steps, and acceptance checks.
2. Keep one entry per coherent task; update it instead of creating duplicate plans.
3. Distinguish proposed, ready, in progress, blocked, completed, and deferred work.
4. Check a task only after its acceptance checks pass. Record implementation separately if verification is blocked.
5. Record actual verification results and limitations, never anticipated results.
6. When scope changes, record the decision and update affected steps. Preserve a short summary of completed work.
7. Keep credentials and personal data out of this file.

## Product Goal

Help commuters understand road disruptions affecting their route and voluntarily share evidence-backed delay summaries without exposing their complete location history to employers.

Proposed demonstration:

Report an incident → show supporting evidence → alert an affected commuter → preview and share a delay summary → view it as an authorized employer → resolve or expire the incident.

## Decisions Needed Before Building

- [ ] Confirm hackathon theme, judging criteria, submission requirements, and deadline.
- [ ] Confirm team size, responsibilities, and available development time.
- [ ] Validate the problem with the employer and potential commuter users.
- [ ] Agree on the minimum demonstration flow and final project name.
- [ ] Choose the frontend, backend, database, and deployment approach.
- [ ] Select map and routing providers after checking coverage, access, terms, and cost.
- [ ] Decide which data sources are real and which need clearly labelled simulation.
- [ ] Define consent, sharing permissions, retention, expiry, and revocation behavior.

## Proposed Roadmap

### Phase 0 — Planning Foundation

Status: in progress.

- [x] Create project-specific AI coding guidelines.
- [x] Establish this central planning document.
- [ ] Confirm the decisions above and revise this roadmap to fit the hackathon.

Acceptance: the team has an agreed scope, stack, demonstration story, and achievable delivery order.

### Phase 1 — Application Foundation

Status: proposed; depends on scope and stack decisions.

- [ ] Scaffold the agreed application without unrelated features.
- [ ] Configure environment variables, local setup, formatting, linting, and tests.
- [ ] Define incident reports, incidents, evidence, journeys, and shared-summary contracts for the agreed scope.
- [ ] Establish authentication and server-side access rules where needed.
- [ ] Build the basic responsive navigation and page structure.
- [ ] Create a deterministic demo-data setup with visible simulation labels.

Acceptance: the app starts using documented commands, required checks pass, and navigation works on desktop and mobile.

### Phase 2 — Incident Reporting and Evidence

Status: proposed; depends on Phase 1.

- [ ] Implement location-aware incident submission with validation and permission-denied handling.
- [ ] Add optional evidence only if included in the agreed scope.
- [ ] Display incident details, observation time, freshness, and supporting reports.
- [ ] Define duplicate handling and location/time grouping rules.
- [ ] Keep reported causes separate from corroborated congestion.
- [ ] Implement authorized incident resolution and stale-report expiry.

Acceptance: submitting a report persists it, relevant views update, duplicate submissions do not inflate evidence, and expired or cleared incidents no longer appear as current disruptions.

### Phase 3 — Journey Relevance and Alerts

Status: proposed; depends on Phase 2 and a route-data approach.

- [ ] Let the commuter select or start a journey.
- [ ] Identify active incidents affecting the selected route.
- [ ] Show alerts with evidence limitations and clearly sourced delay estimates, if available.
- [ ] Handle unavailable location, missing route data, and provider failure.
- [ ] Verify affected, unaffected, and nearby parallel-road cases.

Acceptance: the affected commuter receives the correct alert, an unrelated route does not, and incident clearance updates the alert consistently.

### Phase 4 — Consent-Based Delay Sharing

Status: proposed; depends on journey and authorization behavior.

- [ ] Build a preview showing exactly what information will be shared and with whom.
- [ ] Require explicit commuter action to create a share.
- [ ] Enforce recipient permissions, expiry, and revocation on the server.
- [ ] Build an employer view containing only authorized summary information.
- [ ] Verify account switching, direct-link access, expired shares, and revoked shares.

Acceptance: an authorized employer sees the intended summary; unauthorized, expired, and revoked requests fail; full location histories are not exposed to the employer client.

### Phase 5 — Verification and Demo Readiness

Status: proposed; verification also happens during every earlier phase.

- [ ] Run relevant unit, integration, lint, type, and build checks configured by the chosen stack.
- [ ] Exercise the complete commuter-to-employer flow in the browser.
- [ ] Visit all routes sharing changed state, data, or components and check for regressions.
- [ ] Verify desktop and mobile layouts, accessibility basics, and empty/error/stale states.
- [ ] Verify provider outages remain distinguishable from valid empty results and simulated data.
- [ ] Deploy if required and verify the deployed flow.
- [ ] Prepare a repeatable demo, honest metrics, and a clearly labelled fallback demonstration.
- [ ] Prepare the pitch, limitations, setup instructions, and submission materials.

Acceptance: agreed flows work end to end, verification outcomes are recorded, remaining limitations are explicit, and all claims in the presentation are supported.

## Optional Work — Only After Core Scope Is Stable

These are not committed features. Select them based on time and judging criteria.

- Voice-to-structured incident reporting, with supported-language checks and user confirmation.
- Alternative routing through a suitable provider, without claiming route safety guarantees.
- Basic historical incident summaries using clearly identified data sources.
- Photo-assisted category suggestions, treated as unverified suggestions.

Full government administration, continuous employer tracking, emergency dispatch, and infrastructure recommendations are outside the proposed minimum build.

## Repository Setup

Status: completed.

Goal: initialize local Git and publish the project documentation to a private GitHub repository under the authenticated account.

- [x] Verify GitHub authentication and Git commit identity.
- [x] Check that `NITHINKR06/hackathon` is available.
- [x] Initialize Git on `main` and commit the intended project files.
- [x] Create the private GitHub repository and push `main`.
- [x] Verify private visibility, branch tracking, matching local/remote commits, and a clean working tree.

Repository: [NITHINKR06/hackathon](https://github.com/NITHINKR06/hackathon).

Verification: GitHub reports `isPrivate: true` and default branch `main`. The initial push succeeded, `main` tracks `origin/main`, and local/remote commit IDs matched with a clean working tree. Added `.gitignore` rules for local environment files and key files. No application checks apply to this documentation-only setup.

## Detailed Task Plan Template

Copy this section for each substantial implementation task when it is scheduled.

### Task: <name>

- **Status:** proposed / ready / in progress / blocked / completed / deferred.
- **Goal:** the user-visible outcome or engineering requirement.
- **Scope:** included behavior and explicit exclusions.
- **Dependencies and decisions:** prerequisites that must be resolved.
- **Affected files and routes:** identify after inspecting the actual application.

**Steps**

- [ ] Describe the implementation step.
- [ ] Add or update relevant automated tests.
- [ ] Verify affected browser flows and shared-state surfaces for web changes.
- [ ] Update affected documentation and this plan.

**Acceptance checks**

- Describe observable success, failure, and edge-case expectations.

**Verification results**

- Not run. Replace with actual commands, browser interactions, outcomes, and limitations.

**Blockers and follow-up**

- Record unresolved dependencies or explicitly deferred work.

## Decision Log

| Decision | Status | Reason |
| --- | --- | --- |
| Use `plan.md` as the central project planning record | Confirmed by user request | Keep future plans and progress in one place |
| Adapt the Silent Seal guideline structure for traffic work | Implemented | Reuse engineering structure without unrelated security-project assumptions |
| Keep the stack undecided until selected | Pending selection | No application stack has been agreed |
| Use the reporting-to-sharing flow as the minimum demo | Proposed | Demonstrate a focused end-to-end use case |

## Completed Work and Verification

- Created `AGENTS.md`, `README.md`, and the `ai/` guideline resources.
- Initial guideline validation checked 12 Markdown files and 14 local links; all links resolved.
- No application tests or browser flows have run because application code does not yet exist.
