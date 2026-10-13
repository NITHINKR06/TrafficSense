# Commit and Push Conventions

Apply these conventions when Git work is requested. Repository hosting, branch protection, and collaboration settings have not been established; inspect actual configuration instead of assuming them.

## Scope and Safety

- Do not initialize Git, create a remote, commit, push, or open a pull request solely because these guidelines exist.
- Inspect status and diffs before staging. Preserve unrelated user changes and stage only intended files.
- Never commit environment secrets, API credentials, private travel data, generated recordings, or personal evidence uploads.
- Avoid destructive Git operations and force pushes unless explicitly authorized.
- Follow actual branch protection and the team's agreed workflow. Do not assume that main is protected or that a pull request is mandatory.

## Commit Messages

Use concise conventional commits when no existing convention supersedes them:

- `feat(incidents): expire stale reports`
- `fix(sharing): enforce summary revocation`
- `test(routes): cover unaffected journeys`
- `docs(ai): add traffic project guidelines`

The subject describes the change. Add a body only when the reason or a limitation needs explanation.

## Before Committing

Review the staged diff, run applicable configured checks, and update affected documentation. State checks that could not run and why. Never claim a push or pull request succeeded without confirming the tool result.
