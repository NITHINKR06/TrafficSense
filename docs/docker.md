# Docker Development

Docker Engine with Compose is the only required host runtime. Node.js 24 and pnpm 11.11.0 run inside the images. Keep editing source files in your normal editor; use Docker for package commands, development, checks and production previews.

## Start development

From the repository root:

```bash
docker compose up --build -d app
docker compose logs -f app
```

Open **http://localhost:3000**. The app binds only to the host's loopback interface. Next.js also explicitly permits `127.0.0.1` for development resources so hot reload works with either local address; unrelated origins remain blocked. Override a busy port with `APP_PORT=3002 docker compose up -d app`.

The repository is bind-mounted for hot reload. Docker-managed `dependencies` and `next-cache` volumes isolate Linux packages and generated output from host `node_modules` and `.next`. Startup runs a frozen install to synchronise the dependency volume with the lockfile; a manifest/lockfile mismatch fails rather than silently rewriting the lockfile.

The container runs as the image's `node` user (UID/GID 1000/1000), matching the current Linux workstation. Generated files are not root-owned. Other Linux user IDs may require an explicit ownership configuration before editing package files from the container; do not solve that by running the app privileged or making the repository world-writable.

## Checks

```bash
docker compose run --build --rm checks
```

This runs ESLint, Next.js route-type generation, TypeScript checking and a production build in a fresh one-off container. It uses an image snapshot of current source and does not share the running app's dependency/build volumes. The checks container cannot overwrite the dev server's `.next` output.

Individual commands against the running development container:

```bash
docker compose exec app pnpm lint
docker compose exec app pnpm audit --prod
docker compose exec app sh
```

There are no authentication/domain tests yet. Add their test commands to the check workflow when those features are implemented. Container health is a readiness check, not proof that user flows work; browser verification is still required.

## Dependencies

With the development container running:

```bash
docker compose exec app pnpm add <package>
docker compose exec app pnpm add -D <package>
docker compose up --build -d app
```

The first command is for runtime dependencies; the second is for development dependencies. Run only the one needed. Review the manifest/lockfile diff and any requested build-script approvals. pnpm currently allows only the reviewed `unrs-resolver` postinstall via `pnpm-workspace.yaml`.

Use `docker compose run --rm app pnpm install --frozen-lockfile` when only an install is needed. Keep `pnpm-lock.yaml` as the sole package lockfile; do not install packages on the host. Rebuild images after dependency changes so checks and production use the same versions.

## Production preview

```bash
docker compose --profile production up --build -d production
```

Open **http://localhost:3001**. `PRODUCTION_PORT` overrides the host port. This service is opt-in and can run alongside development.

The multi-stage Dockerfile builds Next.js with `output: "standalone"`. The final image contains the traced server, static output and public assets, runs as a non-root user, and has no source bind mounts or development pnpm tooling. It is a local production preview, not a deployed service.

## Stop and restart

```bash
docker compose stop app
docker compose start app
docker compose --profile production down
```

`down` removes this project's containers/network while retaining its named volumes. Avoid `down --volumes` unless intentionally resetting this project's dependency/build caches; future database volumes would also be lost. Never prune or stop unrelated Docker projects to repair this one.

## Secrets and future Supabase work

- `.dockerignore` excludes Git metadata, host dependencies/build output, environment files and private-key files from the build context. No secrets are passed through Docker build arguments.
- Development bind mounts are different from image contents: a future local `.env.local` is visible inside the development container, as it is to a local dev process. Keep it untracked.
- Production does not automatically load host `.env.local`; define runtime environment/secrets explicitly when the backend is added. Next.js public variables may require build-time configuration; never expose privileged keys through them.
- Supabase authentication/database integration is still pending. No unused Postgres or self-hosted Supabase stack is started here. Plan the Docker-based local Supabase workflow as part of that task.
- The known development-only `braces@3.0.3` advisory is tracked in [progress.md](../progress.md). Containerisation does not fix dependency vulnerabilities.

First image builds need network access for the Node image, pnpm and packages. The starter also fetches its Google fonts at build time. Report connectivity failures rather than disabling TLS verification or substituting a different app silently.
