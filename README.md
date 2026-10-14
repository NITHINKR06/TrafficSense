# Traffic Hackathon Project

Working name: **TrafficSense / RoadAlert**. The goal is **REPORT → VERIFY → ALERT → ANALYSE**: explain road disruptions, help commuters avoid affected roads, support consent-based employer visibility, and show recurring problems for investigation.

## Source and scope

- [Original problem statement](docs/Traffic_JAM.pdf): preserved 12-page brief, generated from employer input; not confirmed hackathon rules.
- [Module coverage and source-page references](docs/README.md): seven recommended modules, planned demo limits, and acceptance references.
- [Current plan](plan.md): v4.1 decisions, execution order, tests, and verification record.

The planned demo covers login/roles, a traffic map, reporting, evidence-based verification, a precomputed alternative-route alert, limited employer sharing, and seeded hotspot/monthly statistics. All simulated observations and estimates must be labelled. The duplicate-report attack demonstrates a specific control, not general spoof resistance.

A signed **Delay Receipt** is a proposed extension, not the entire product goal. Its final fields and pitch prominence depend on employer feedback. Signing establishes integrity and origin, not GPS truth or why an employee arrived late. Employer access always requires consent and server-side authorisation.

Photos, AI features, voice, native apps, and a real routing engine remain deferred. CSV export, authority-confirm actions, and Realtime updates are optional; explicit refresh is acceptable.

## Current state and delivery

The official `create-next-app` starter has been generated with Next.js 16.4, TypeScript, Tailwind CSS, App Router and ESLint. It still shows the default starter page. Authentication, Supabase integration, roles and traffic features are not implemented; no deployment exists yet.

### Local setup

Use Node.js 22 or newer and pnpm 11.11.0 (pinned in `package.json`). From this repository root:

```bash
pnpm install
pnpm dev
```

Open `http://localhost:3000`. Supabase credentials are not needed for the starter; configure them locally during the authentication task, never in committed files.

```bash
pnpm lint
pnpm exec next typegen
pnpm exec tsc --noEmit
pnpm build
pnpm start
```

The scaffold was generated in a temporary directory and imported here so the existing README, agent instructions and problem statement remained intact. Verification results are recorded in the current task in `plan.md`; domain tests will be added with the corresponding features.

The registered team has four people, but one human is currently building with GPT-Astra AI-agent assistance. Fewer than eight days remain; the plan uses seven-day checkpoints and reserves a buffer within the actual deadline rather than assuming an eighth day.

Start with the short event/access/employer checks, then setup/auth/roles, seeded corridor and simulator, reporting/evidence, and map/details. Exact deadline/time zone, event requirements, daily availability, provider access, privacy defaults, and employer feedback still need confirmation. Final receipt design waits for that feedback; independent foundations can proceed.

## AI-assisted development

Start with [AGENTS.md](AGENTS.md) and [the agent root rules](ai/ai_agent_root_rules.md). [Architecture](ai/resources/architecture.md) describes planned boundaries, not existing code.

Map each task to the source brief and plan. Work in small steps: tests first, implementation, checks, browser verification across shared-state pages, human diff review, then a checked commit. Preserve privacy, receipt expiry/revocation, and negative tests when reducing scope. Record any reduced module coverage explicitly; never silently replace the main traffic goal with a receipt-only product.
