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

The default anchor is **2026-10-15T04:00:00.000Z**, never the machine's current clock. An explicit anchor must be a canonical millisecond UTC timestamp in 2000–2099. Fixed historical timestamps must not be presented as fresh traffic; future readers must show freshness against their own defined clock. Reset removes this corridor and its dependent synthetic rows, not accounts, organisations or unrelated corridors. Replacement and reset serialize through a transaction lock; a failed replacement rolls back to the previous dataset. Separate HTTP reads can cross a replacement boundary; future multi-table readers must use a consistent snapshot or detect/retry changed data.

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

## Verification commands

```bash
docker compose run --build --rm checks
bash scripts/local-supabase.sh test
bash scripts/local-supabase.sh test-traffic
```

Seed local demo accounts before integration tests. The traffic suite exercises public reads, all account roles, denied writes/functions, rollback, concurrent replacement and scoped reset; it restores any prior owned fixture and removes its unrelated sentinel. Run it serially with other traffic mutations and account-changing tests. Browser map/list, provider-failure and evidence acceptance belong to their respective later slices, not these data checks.
