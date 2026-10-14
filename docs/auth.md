# Local Authentication

This documents the foundation for [module 1](README.md): registration, password sign-in, sign-out, roles, and organisation boundaries. Traffic reporting, journeys, sharing, maps, and analytics are separate work. [Implementation Phase 1](implementation.md#phase-1--finish-authentication-verification) defines completion checks; actual verification and outstanding failures belong in [progress.md](../progress.md). These run instructions are not a claim that every acceptance check has passed.

## Start the local demo

Requirements: Linux, Docker Engine 28 or newer with Compose, access to its Unix socket, and enough disk space for the Supabase Postgres image. All Node, pnpm, and Supabase CLI commands run in containers. The first image and package downloads require network access.

From the repository root:

```bash
bash scripts/local-supabase.sh start
bash scripts/local-supabase.sh seed
docker compose up --build -d --wait app
```

Open `http://localhost:3000`. For a production-mode local preview:

```bash
docker compose --profile production up --build -d --wait production
```

Open `http://localhost:3001`. Both use the same local database. Use one browser origin consistently; cookies are host-scoped rather than port-scoped, so localhost tabs on both ports share a login.

The start command applies pending local migrations and creates an ignored `.env.local`. The seed command creates six synthetic accounts: a commuter, employers belonging to two different organisations, an employer without membership for empty-state checks, a read-only authority, and an admin. Open **`supabase/.temp/demo-accounts.json` locally** for their generated emails and passwords. Never commit, paste into chat, or publish this file. Running seed again rotates these demo passwords and restores their assigned roles/memberships; it does not erase the database or promise to terminate every existing session.

New accounts created through the UI always start as commuters. Use synthetic email addresses and passwords only. Local email confirmation is disabled; email delivery, password recovery, OAuth, invitations, and hosted deployment are outside this foundation.

## Access rules

| Surface | Required access |
| --- | --- |
| `/`, `/login`, `/register` | Public; signed-in users visiting login/register return to their account |
| `/workspace` | Authenticated account with an assigned database profile |
| `/employer` | Employer role; only assigned organisations are returned |
| `/employer/[orgId]` | Employer role and current membership; unavailable IDs return not found |
| `/authority` | Authority role; read-only foundation |
| `/admin` | Admin role; no browser seed/reset/role-assignment actions |

The server checks the authenticated user with Supabase Auth and reads the role from `profiles` on each request. User-editable metadata and submitted role fields cannot grant access. Database row-level security allows users to read their own profile, and employers to read their own memberships and organisations. Anonymous and authenticated clients have no write grants on these access tables. Admin does not imply employer access.

Authentication cookies are HTTP-only and SameSite=Lax. The Next.js proxy refreshes them, while page-level checks remain the authorization boundary. Private reads use no-store requests; sign-in and sign-out invalidate the application layout. Sign-out affects the current session; previously issued access tokens can remain valid until their expiry, so this is not a claim of immediate revocation of copied tokens.

No employee data or journey access follows from organisation membership. Future employer sharing still requires explicit commuter consent and per-read authorization.

## Containers and network isolation

Pinned Supabase CLI 2.120.0 runs with `SUPABASE_EXPERIMENTAL_STACK=0` in the opt-in `supabase` tooling service. It uses a pinned Docker 28.5.2 client. Only that one-off service has the Docker socket and host networking; dependency installation happens during its image build before socket access is granted. Socket access is effectively host-administrator access, not a sandbox.

The wrapper preserves the repository's host path for sibling-container bind mounts and derives the socket's numeric group. It checks the dedicated `trafficsense_supabase` bridge and Docker engine version before CLI operations. The bridge defaults published ports to loopback. It is external to the app's Compose lifecycle.

The local Supabase project ID is `trafficsense-local`, separate from application Compose project `trafficsense`. Only Postgres, Auth, PostgREST, and Kong are needed. Studio, storage, realtime, mail, analytics, edge functions, and the pooler are disabled.

- Local API: `http://127.0.0.1:54321`.
- Local database: loopback port `54322` (shadow database uses `54320` when needed).
- App-to-API: `http://supabase_kong_trafficsense-local:8000` on the dedicated bridge.
- Application and production ports remain loopback-only at `3000` and `3001`.

The `demo` service seeds and tests without Docker-socket access. The privileged local service key is passed from CLI status through standard input to the seeder; it is not saved to the app environment. CLI startup logs may contain local credentials and are kept in ignored `supabase/.temp/start.log`. Build context exclusions cover this directory, environment files, and host caches.

## Configuration

| Variable | Use |
| --- | --- |
| `SUPABASE_URL` | Server-side API URL, generated for the local bridge |
| `SUPABASE_ANON_KEY` | Unprivileged API key; application requests remain subject to authentication and row-level security |
| `DEMO_MODE` | Enables the local-demo notice and allows synthetic seeding only with the exact local endpoint |
| `AUTH_COOKIE_SECURE` | Explicitly `false` for local HTTP preview; use secure cookies with HTTPS outside local development |

No privileged key belongs in the app container or a `NEXT_PUBLIC_*` variable. Hosted configuration, TLS, confirmation emails, abuse controls, and deployment need their own checks before public use. Missing configuration and service failures are shown explicitly, without replacing authentication with a mock login.

## Checks and shutdown

```bash
docker compose run --build --rm checks
bash scripts/local-supabase.sh test
bash scripts/local-supabase.sh stop
```

The first command runs unit tests, lint, route types, TypeScript, and the production build without accessing local secrets. The integration tests use real Auth-issued user sessions and PostgREST policies, not a service key. They create synthetic registration accounts which remain in the local database until intentionally removed.

`tests/browser.mjs` drives a local Chromium debugging endpoint (`CHROMIUM_DEBUG_URL`, default `http://127.0.0.1:9333`) and reads the ignored synthetic account file. With Chromium already running on loopback, run the browser driver in Docker:

```bash
docker run --rm --network host --user 1000:1000 \
  --mount type=bind,src="$PWD",dst=/workspace --workdir /workspace \
  -e APP_URL=http://127.0.0.1:3000 \
  trafficsense-demo node tests/browser.mjs
```

Repeat with port `3001` for the production preview. The driver uses an isolated browser context and checks desktop/mobile registration, roles, account switching, denied direct routes, organisation isolation, empty membership, cookie flags, logout/history, refresh and layout. Chromium itself must be available separately; the application image does not install a browser.

Stopping Supabase retains local data. `docker compose down` only stops/removes application services; it does not stop the separately managed Supabase stack. Avoid `stop --all`, Docker pruning, and unrelated projects. A deliberate local database reset deletes synthetic accounts and requires reseeding; it is not part of normal startup.
