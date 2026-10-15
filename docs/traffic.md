# Local synthetic traffic data

This foundation supplies module 2's public corridor data, module 5's fixed route definitions and inputs for module 4's later evidence rules. See [phase order](implementation.md), [scope](plan.md) and [verification status](progress.md). Synthetic inputs alone do not establish corroboration, cause, travel delay or route savings.

## Run locally

Use Docker and the dedicated local Supabase backend described in [Docker development](docker.md). Apply migrations with `bash scripts/local-supabase.sh start`. These commands replace only the owned `mangaluru-central-v1` dataset:

```bash
bash scripts/local-supabase.sh simulate normal
bash scripts/local-supabase.sh simulate slowdown
bash scripts/local-supabase.sh simulate recovery
bash scripts/local-supabase.sh simulate slowdown 2026-10-15T04:00:00.000Z
bash scripts/local-supabase.sh simulate reset
```

The default anchor is **2026-10-15T04:00:00.000Z**, never the machine's current clock. An explicit anchor must be a canonical millisecond UTC timestamp in 2000–2099. Fixed historical timestamps are not fresh traffic. The public reader compares observation times with its database read timestamp, then advances freshness in an open page every thirty seconds. Reset removes this corridor and its dependent synthetic rows, not accounts, organisations or unrelated corridors. Replacement and reset serialize through a transaction lock; a failed replacement rolls back to the previous dataset. Separate HTTP reads can cross a replacement boundary; `read_traffic_demo()` returns the public fields and `read_at` in one stable, security-invoker SQL statement instead.

The command requires `DEMO_MODE=true`, the exact internal local Supabase URL and local CLI status supplied through stdin. Privileged keys remain in the process, never command arguments or output. Requests have a 15-second deadline. A timeout or transport failure leaves the outcome unknown; inspect the dataset before retrying rather than assuming rollback. Database functions require the service role; even the signed-in demo admin cannot call them. There is no browser simulation/reset endpoint. A future browser control requires server-enforced demo mode **and** admin authorization, with separate tests.

## Contracts and limits

- `src/lib/traffic/simulator.ts` exports the typed fixture and a pure `createTrafficFixture(scenario, anchor)` generator. Identical inputs yield identical fresh object graphs.
- Dedicated `demo_traffic_*` tables hold corridors, directed segments, routes, ordered route segments, segment-bound sources and observations. Guests and authenticated roles can read these synthetic tables without an auth session; normal clients cannot mutate them.
- Coordinates use GeoJSON `[longitude, latitude]` order. Hand-authored lines near Mangaluru are schematic, not surveyed roads or navigation guidance. Lengths and baseline traversal seconds are named assumptions, not measured city traffic or geometry-derived distances.
- Two outward routes share endpoints. A separate reverse-direction segment prevents its samples being treated as outward traffic. Segment and source IDs are stable within the corridor.
- Each fixture has five segments, three labelled sources per segment and twelve one-minute samples: **180 observations** over eleven complete minutes ending at the anchor.
- Normal speeds come from assumed length/time. Slowdown affects only `primary-west`, at 8 km/h for the last seven samples (six complete minutes). Recovery begins with six low-speed samples, then six samples at 28 km/h (five complete recovered minutes). Nearby alternative and reverse-direction segments remain unaffected.
- Observations store km/h, UTC time and simulated provenance. Composite foreign keys bind each sample to its corridor, segment, source and anchor; unique keys reject duplicates. Geometry, baseline, speed, direction and time-window constraints reject malformed data.
- All rows are public synthetic demonstration material. Never put private journeys, account identities, real GPS observations or reported incident evidence into these tables. Later private data needs separate schemas and authorization. Replacement retains only one synthetic scenario, not historical analytics.

## Public browsing and optional map

Open `/demo` and choose **Browse synthetic traffic**, or open `/traffic` directly. A single `?segment=` parameter selects the same directed segment in the accessible list, details and optional map. Browser history and refresh preserve the selected ID; invalid or duplicate selections are explicit. Data refresh rereads the database but does not generate samples or change their timestamps. No sign-in, anonymous Auth session, location permission or private-table access is needed.

The stored scenario is separate from sample freshness. Timestamps display in **Asia/Kolkata**. Samples at least twenty minutes old are stale; future-dated and missing samples have their own labels. Baselines and geometry are assumptions. Colours identify routes/direction, not congestion severity; synthetic sources are not independent witnesses. No incident cause, corroboration, traversal delay or savings is calculated.

**Load map** opts into external requests to OpenFreeMap and its delivery providers, following a privacy notice. MapLibre GL JS 6.14.0, CSS and the worker are bundled with the app; no runtime script CDN or API key is used. The Liberty background uses OpenStreetMap/OpenMapTiles data. Attribution remains below the canvas at narrow widths; `/map-notices.txt` contains the renderer license and provider/data/style notices. Provider terms and privacy are linked there. No offline/bulk download is implemented. The service has no uptime guarantee; failed provider requests or unavailable WebGL show **Retry map** while the list/details remain usable. **Hide map** releases map resources.

Unconfigured, unavailable/denied, invalid and empty backend responses never substitute hardcoded healthy data. The static home/guest introduction remains available independently. Simulator commands are operator-only local tools, never public browser actions.

## Verification commands

```bash
docker compose run --build --rm checks
bash scripts/local-supabase.sh test
bash scripts/local-supabase.sh test-traffic
```

Seed local demo accounts before integration tests. The traffic suite exercises public reads, all account roles, denied writes/functions, rollback, concurrent replacement and scoped reset; it restores any prior owned fixture and removes its unrelated sentinel. Run it serially with other traffic mutations and account-changing tests. Database checks do not replace browser or later evidence acceptance.

With the local Chromium debugger on port 9333 (see [authentication browser setup](auth.md)), run the traffic browser suite separately for development and a rebuilt production preview:

```bash
export DOCKER_GID="$(stat -c '%g' /var/run/docker.sock)"
docker compose run --rm -T supabase status --output json | docker run --rm -i --network host --user 1000:1000 \
  --mount type=bind,src="$PWD",dst=/workspace --workdir /workspace \
  -e APP_URL=http://127.0.0.1:3000 -e TRAFFIC_NARROW=true \
  trafficsense-demo node tests/traffic-browser.mjs
bash scripts/local-supabase.sh test-browser-recovery
```

Use port 3001 for production. The traffic suite uses real CDP pointer/keyboard input, network completion checks, provider style/tile blocking and WebGL denial; default widths are 1440/390px and `TRAFFIC_NARROW=true` adds 320px. It replaces/resets the owned synthetic fixture during checks and restores the prior fixture in cleanup. Run serially with database mutations. Screenshots stay in ignored `supabase/.temp/browser`; account forms are not captured. The recovery runner includes traffic database/Auth failures on isolated ports 3002/3003 and unconfigured browsing on 3004/3005, then removes those test services.
