# Project Instructions

Read [ai/ai_agent_root_rules.md](ai/ai_agent_root_rules.md) before working in this repository. It is the entry point for project-specific engineering guidelines.

Load only the resources relevant to the task. Next.js + Supabase is selected. An official Next.js starter is scaffolded; authentication, Supabase integration and traffic features are not implemented yet. Use pnpm (version pinned in `package.json`) and keep `pnpm-lock.yaml` as the only package lockfile. Use [plan.md](plan.md) for current scope, capacity, and pending decisions.

Keep the original goal in view: REPORT → VERIFY → ALERT → ANALYSE. Read [docs/README.md](docs/README.md) for module/source-page traceability to [Traffic_JAM.pdf](docs/Traffic_JAM.pdf). Map tasks to the seven recommended modules; record any scope cut and remaining gap in the plan. Delay receipts are a proposed extension, not a replacement for the traffic goal. The PDF is a product brief, not confirmed event rules.

Plan for one active human builder with AI assistance and fewer than eight days, not four parallel developers. Work in small checked steps with relevant tests first; preserve user review, privacy, and negative tests.

For web application changes, verify the affected flows in a browser, including other pages sharing the changed state or components. Check desktop and mobile when layout changes. If browser tools are unavailable, use the closest available tests and explicitly report what could not be verified.
