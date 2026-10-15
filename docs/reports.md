# Local synthetic reporting

This bounded reporting flow supports **REPORT → VERIFY → ALERT → ANALYSE** without treating a submission as verified traffic. Reports are **SIMULATED · L1 Reported · unconfirmed**, manually located on one directed demonstration segment. No GPS, photo, free text, personal journey or employer sharing is collected. Incident grouping, corroboration, recovery, alerts and receipts have separate acceptance gates. Actual verification results belong in [progress.md](progress.md).

## Use the demonstration

Start the dedicated backend and application using [Docker development](docker.md). Load a corridor and explicitly enable reporting:

```bash
bash scripts/local-supabase.sh simulate slowdown
bash scripts/local-supabase.sh reports enable
```

Open `/traffic`, select a directed segment and choose **Report a simulated problem**. `/reports/new` also supports one valid `?segment=` value. Choose **Continue as guest** or **Use current account**, select a category (including Unknown), review the manually entered Asia/Kolkata observation time and submit a synthetic example while stationary or as a passenger. The initial time is supplied by the database. New observations must be within the last twenty minutes and not in the future.

Success means the database acknowledged persistence, not that congestion or the claimed cause was confirmed. Follow the saved-report link to the matching public segment. Map markers, list counts and details share the same snapshot; another open tab must refresh to see new data. Counts include stale and repeated-source reports, not independent witnesses. Details show the ten most recently received reports for that direction.

## Identity and privacy

- Browsing `/`, `/demo`, `/traffic` or the initial report form neither creates an identity nor reads account data. Background map loading remains a separate explicit external-network choice.
- Explicit guest preparation creates a Supabase anonymous identity in an HTTP-only, same-site `trafficsense-report-guest` cookie namespace, separate from `trafficsense-auth`. Guest reporting access expires 24 hours after first preparation; refreshing a token does not extend that period.
- An existing account takes precedence. A broken account session never silently becomes a guest submission. Guest identities cannot read private account/organisation records or acquire private-route access, even if a malformed legacy profile exists.
- Every submission and acknowledgement checks the current verified identity against the prepared source. Logout, cookie loss, expiry or account switching does not transfer a pending draft to a new source.
- Public report fields are only `id`, `segment_id`, `direction`, `category`, `observed_at`, `received_at`, `provenance` and `location_provenance`. Source/user/request identifiers and canonical retry payloads remain private. Observation and receipt times are public; use synthetic examples only.

The application uses the unprivileged API key and verified session. A dedicated non-login, non-RLS-bypassing database executor owns narrow functions but not their tables. Direct client writes and private-table reads are denied. Guest identities are excluded from account profile creation and account-only policies. Local anonymous signup is limited to 30 per hour per IP; this and source quotas do not establish person-level abuse resistance. Public deployment needs separate security, abuse and privacy review.

## Persistence and interrupted submissions

The database atomically stores a private immutable report and its minimal public projection. The prepared source and request UUID identify a retry: identical input returns the original acknowledgement, while changed content with the same key conflicts. Replay does not consume another quota reservation. The observation time is validated only for a new report, so an old accepted request remains replayable while its owner retains access and reporting is enabled.

Before dispatch, the browser saves the exact draft in session storage. A timeout or lost response is **unknown**, not proof of failure. Keep the draft and use **Check saved status** or **Retry unchanged report**. Reloading retains this reference in the same tab. Clearing storage or closing the tab can lose it; the public report can still exist. Explicit discard removes only the local reference and does not cancel or delete a report. Confirmed validation, segment or quota rejection allows correction; an uncertain outcome stays frozen.

New-report limits are five per source per rolling fifteen minutes, 300 globally per rolling hour and 2,000 retained reports, with a 5,000-source cap. Database serialization enforces limits during concurrent requests. These are local-demo limits, not general spoof or multiple-identity defenses.

The durable directed-segment catalog is independent of the replaceable simulator fixture. Resetting the simulator preserves reports and retry keys; an empty fixture hides unmatched reports and prevents new submissions. Restoring the corridor exposes matching reports again. Reports become stale at twenty minutes; a stale report is not a cleared incident.

## Disable and clean up

```bash
bash scripts/local-supabase.sh reports disable
bash scripts/local-supabase.sh reports cleanup --confirm
bash scripts/local-supabase.sh reports cleanup-expired-guests --confirm
```

Disabling blocks preparation, submission and acknowledgement checks but preserves public browsing and stored reports. Dataset cleanup requires reporting to be disabled and removes report rows/sources only; traffic fixtures and Auth accounts are preserved. It also removes retry records, so old references can no longer acknowledge earlier reports.

Expired-guest cleanup verifies each selected Auth user is still anonymous before deletion, processes at most 100 per invocation and cascades that guest's reports. It preserves unrelated accounts and traffic fixtures. Guest expiry itself blocks access even before cleanup; no scheduled deletion or automatic retention period is claimed. Synthetic records otherwise remain until local cleanup. The local operator commands require the exact configured demo endpoint and receive privileged status only through stdin, never through the app environment. Errors can have unknown outcomes; inspect local state before retrying destructive operations.

## Checks

Run database-mutation/browser suites serially because they temporarily share the corridor and reporting gate. They restore the prior fixture/gate and remove only test-owned identities and reports. An interruption needs local inspection before another run.

```bash
docker compose run --build --rm checks
bash scripts/local-supabase.sh test-reports
bash scripts/local-supabase.sh test-traffic
bash scripts/local-supabase.sh test
bash scripts/local-supabase.sh test-browser-recovery
DOCKER_GID="$(stat -c '%g' /var/run/docker.sock)" docker compose run --rm supabase db lint --local --fail-on error
```

With local Chromium's debugging endpoint running on port 9333, run real report interactions in Docker:

```bash
set -euo pipefail
export DOCKER_GID="$(stat -c '%g' /var/run/docker.sock)"
docker compose run --rm -T supabase status --output json |
  docker run --rm -i --init --network host --user 1000:1000 \
    --mount type=bind,src="$PWD",dst=/workspace --workdir /workspace \
    -e APP_URL=http://127.0.0.1:3000 -e REPORTS_BROWSER=true -e TRAFFIC_NARROW=true \
    trafficsense-demo node tests/traffic-browser.mjs
```

Repeat with port 3001 after rebuilding production. Run without `REPORTS_BROWSER=true` for the existing traffic regression suite. The recovery wrapper runs account, traffic and report suites against isolated development/production fault services, then missing-configuration apps. Its test-only proxy can discard a real submission response after the backend commits, allowing browser verification that retry creates no duplicate. No runtime fault-control endpoint is added to the application. Screenshots contain synthetic traffic/report surfaces and are stored in ignored `supabase/.temp/browser/`.
