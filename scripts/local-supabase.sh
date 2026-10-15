#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."
export PWD="$(pwd)"
export DOCKER_GID="$(stat -c '%g' /var/run/docker.sock)"
umask 077

case "${1:-}" in
  start)
    if ! docker network inspect trafficsense_supabase >/dev/null 2>&1; then
      docker network create --driver bridge --opt com.docker.network.bridge.host_binding_ipv4=127.0.0.1 trafficsense_supabase >/dev/null
    fi
    docker compose build supabase demo
    mkdir -p supabase/.temp
    if ! docker compose run --rm supabase start --exclude realtime,storage-api,imgproxy,mailpit,postgres-meta,studio,edge-runtime,logflare,vector,supavisor >supabase/.temp/start.log 2>&1; then
      printf '%s\n' 'Supabase startup failed. Inspect the private supabase/.temp/start.log; it may contain local credentials.' >&2
      exit 1
    fi
    docker compose run --rm supabase migration up --local
    docker compose run --rm -T supabase status --output json | docker compose run --rm -T demo node /app/scripts/configure-local.mjs
    printf '%s\n' 'Local Supabase is ready. Run bash scripts/local-supabase.sh seed to create synthetic accounts.'
    ;;
  seed)
    docker compose run --rm -T supabase status --output json | docker compose run --rm -T demo node /app/scripts/seed-demo.mjs
    ;;
  test)
    docker compose run --build --rm -T demo node --test /app/tests/auth.integration.test.mjs
    ;;
  simulate)
    docker compose build demo
    docker compose run --rm -T supabase status --output json | docker compose run --rm -T demo node /app/scripts/simulate-traffic.mjs "${@:2}"
    ;;
  test-traffic)
    docker compose build demo
    docker compose run --rm -T supabase status --output json | docker compose run --rm -T demo node /app/tests/traffic.integration.test.mjs
    ;;
  test-browser-recovery)
    test_compose=(docker compose -f compose.yaml -f compose.auth-test.yaml --profile auth-test)
    test_services=(auth-recovery auth-recovery-production auth-unconfigured auth-unconfigured-development auth-faults)
    cleanup_recovery() {
      "${test_compose[@]}" rm --stop --force "${test_services[@]}"
    }
    trap cleanup_recovery EXIT
    "${test_compose[@]}" up --build -d --wait "${test_services[@]}"
    for port in 3002 3003; do
      "${test_compose[@]}" run --rm -T supabase status --output json | docker run --rm -i --network host --user 1000:1000 \
        --mount type=bind,src="$PWD",dst=/workspace --workdir /workspace \
        -e APP_URL="http://127.0.0.1:$port" -e BROWSER_SCENARIO=recovery \
        trafficsense-auth-recovery node tests/browser.mjs
    done
    for port in 3004 3005; do
      docker run --rm --network host --user 1000:1000 \
        --mount type=bind,src="$PWD",dst=/workspace --workdir /workspace \
        -e APP_URL="http://127.0.0.1:$port" -e BROWSER_SCENARIO=setup \
        trafficsense-auth-recovery node tests/browser.mjs
    done
    ;;
  stop)
    docker compose run --rm supabase stop
    ;;
  *)
    printf '%s\n' 'Usage: bash scripts/local-supabase.sh start|seed|test|test-traffic|test-browser-recovery|stop | simulate normal|slowdown|recovery [UTC-anchor] | simulate reset' >&2
    exit 2
    ;;
esac
