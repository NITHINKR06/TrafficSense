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
  stop)
    docker compose run --rm supabase stop
    ;;
  *)
    printf '%s\n' 'Usage: bash scripts/local-supabase.sh start|seed|test|stop' >&2
    exit 2
    ;;
esac
