# AI Agent Root Rules

These guidelines apply to the traffic hackathon project. They are adapted from the Silent Seal guideline structure; Silent Seal's modules, Python-only assumptions, cryptography requirements, and repository settings do not apply here.

## Core Rules

- Implement the current plan's thin seven-module scope one task at a time, not the entire product brief at once. Map each task to [the source coverage reference](../docs/README.md); record omissions and coverage gaps in the plan. Keep REPORT → VERIFY → ALERT → ANALYSE as the main goal; receipts support it.
- Read existing code and relevant documentation before changing behavior.
- Keep changes focused, understandable, and reversible.
- Distinguish proposed, implemented, and verified behavior in code documentation and responses.
- Never claim tests, integrations, browser checks, or deployment succeeded without evidence.
- Never fabricate live traffic, incident causes, authority confirmation, confidence percentages, or measured travel-time savings.
- Obtain explicit consent before sharing commuter information. Employer access must not imply continuous location tracking.
- Do not copy secrets, personal travel histories, or credentials into source files, fixtures, logs, or documentation.

## Resource Loading

For implementation and architectural work, first read:

1. [Coding principles](resources/coding_principles.md).
2. [Architecture](resources/architecture.md).

Then load only the resources relevant to the task:

| Task | Resource |
| --- | --- |
| Naming modules, functions, data, or tests | [Naming](resources/coding_practices_naming_guidelines.md) |
| Comments and documentation | [Comments and documentation](resources/coding_practices_comments_and_doc.md) |
| Application logic, APIs, state, integrations, or privacy | [Programming practices](resources/coding_practices_programming_practices.md) |
| Logs, diagnostics, or error reporting | [Logging](resources/coding_practices_logging_guidelines.md) |
| Behavior changes and verification | [Testing](resources/coding_practices_testing.md) |
| Classes, interfaces, and dependency abstractions | [Object-oriented programming](resources/coding_practices_object_oriented_programming.md) |
| Git commits, branches, or pushes | [Commit and push conventions](resources/skills_commit_push.md) |

Documentation-only reviews do not require the full implementation workflow or application tests.

## Work Process

### Before implementation

1. Read the root README and any existing README or instructions in affected directories.
2. Check the current files and working-tree changes. Preserve unrelated user work.
3. Identify the requested behavior, source module, affected surfaces, and acceptance checks using [docs/README.md](../docs/README.md). Consult the linked PDF pages when interpreting the brief; do not mistake its examples for live data or event requirements.
4. Read [plan.md](../plan.md) and add or update the relevant implementation plan before starting work. Maintain its decisions, progress, blockers, and actual verification outcomes as work proceeds. For multi-step work, also maintain a short task list.
5. Use the selected Next.js + Supabase stack with pnpm inside Docker (pinned in `package.json`); follow [Docker commands](../docs/docker.md), preserve `pnpm-lock.yaml`, and avoid host installs or npm/yarn lockfiles. Leave unrelated Docker projects untouched. Confirm unresolved provider access before dependent work. Plan sequentially for one active human with AI assistance; the exact deadline and available hours remain in the plan. Employer feedback gates final receipt fields and prominence, not independent auth, simulation, reporting, or map foundations.

### During implementation

- Prefer existing patterns and dependencies over new frameworks or abstractions.
- Validate external data and enforce authorization on the server.
- Keep incident evidence, interpretation, and lifecycle state separate.
- Keep shared state consistent across map/details, alternative alerts, commuter and employer views, and historical analytics within their stated date windows.
- Write relevant tests before behaviour, implement one bounded task, run checks and browser verification, then review the diff and commit the checked step under the commit rules.
- Make loading, empty, denied-permission, stale-data, and failure states explicit.
- Keep demonstrations clearly labelled when data or integrations are simulated.

### Verification

- Run configured checks relevant to the change; report failures and blockers accurately.
- Add tests for meaningful logic, especially consent, access control, incident expiry, duplicate handling, and route relevance.
- For web changes, use available browser tools to click, type, submit, and navigate the changed flow end to end.
- Visit every route sharing changed components, state, or data, and look for regressions.
- Check desktop and mobile viewports after layout or styling changes.
- Exercise affected edge states, not only the happy path. Fix discovered regressions and verify again.
- If browser tools are unavailable, use the closest available substitute and say exactly what remains unverified.

### Documentation

Update documentation when a change makes it inaccurate. Keep the root README as a short orientation and status summary; put detailed module behavior or run instructions in the affected module's README or docs when those exist.

Do not create repetitive progress reports for every task. Do not invent completion percentages or test results. Review-only tasks need no project edits unless requested.

## Conflicts and Maintenance

Higher-priority session instructions and applicable nested project instructions take precedence. Within this guideline set, root rules take precedence over resources; task-specific resources take precedence over general coding principles for their domain. Surface any unresolved conflict instead of silently weakening privacy or verification requirements.

Keep resource links, source coverage, and architecture synchronized when scope or boundaries change. The Next.js TypeScript/Tailwind starter is scaffolded with pnpm; Supabase integration is pending. Read version-specific Next.js documentation bundled under `node_modules/next/dist/docs/` before framework changes.
