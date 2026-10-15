# TrafficSense Mangaluru

A traffic web project built around **REPORT → VERIFY → ALERT → ANALYSE**: explain disruptions with visible evidence, provide relevant alternative-route alerts, support consent-based employer visibility, and investigate recurring hotspots.

## Start here

- [Project plan](docs/plan.md): scope, design decisions, contracts and acceptance targets.
- [Phase-wise implementation plan](docs/implementation.md): build order, dependencies and exit checks.
- [Progress](docs/progress.md): actual implementation, verification, blockers and commit records.
- [Source coverage](docs/README.md): seven modules mapped to the [original product brief](docs/Traffic_JAM.pdf), which is not confirmed event rules.
- [Supplied UI reference](docs/design/trafficsense/README.md): screenshot, HTML and design specification, with adaptation constraints.

Sign-in is optional for the public guest preview and traffic browsing. Enabled local demo reporting supports accounts or an explicitly created temporary guest identity; browsing alone creates neither. Private account/organisation data, personal sharing and restricted actions still require authorization. See [demo reports](docs/reports.md) for limits and setup, and [progress](docs/progress.md) for verification status.

The intended build is a labelled synthetic demonstration, not a live traffic service. Delay receipts are a supporting extension; they do not prove GPS truth or why someone arrived late. Employer access always requires explicit commuter sharing and server authorization.

## Local development

Use Docker Engine with Compose; Node.js 24 and pinned pnpm run inside containers. Local Supabase setup requires Linux, Docker Engine 28 or newer and access to its Unix socket. Keep host package installations and unrelated Docker projects untouched.

```bash
bash scripts/local-supabase.sh start
bash scripts/local-supabase.sh seed
docker compose up --build -d --wait app
```

Open `http://localhost:3000`. Use synthetic accounts only. Setup generates ignored local configuration; seed credentials stay in the ignored local account file, never in Git or chat. Source edits hot-reload; Docker volumes isolate dependencies/build output.

```bash
docker compose run --build --rm checks
bash scripts/local-supabase.sh test
```

The first command runs unit tests, lint, route types, TypeScript and build checks. The second checks real local authentication/database policies after setup. Browser checks are separate; see [local authentication](docs/auth.md). Passing a build is not proof of working user flows.

[Docker development](docs/docker.md) documents commands, logs, package changes, shutdown, secrets and the optional production preview on port 3001. A local production preview is not a deployment.

## Delivery and AI guidance

Work sequentially for one active human with AI assistance, completing verified phases rather than promising an unconfirmed date. Consult progress for current readiness; a planned screen or test file is not a passing feature. Optional work and explicit scope gaps are defined in the plan.

Start AI work with [AGENTS.md](AGENTS.md) and [the root rules](ai/ai_agent_root_rules.md). Use tests first, meaningful browser interaction across shared-state pages, desktop/mobile checks, user review and scoped local commits. Push only on explicit request. Actual task results belong in `docs/progress.md`, never in either planning document.
