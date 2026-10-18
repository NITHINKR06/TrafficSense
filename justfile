# TrafficSense Justfile
# Unified task runner on top of Docker Engine & Compose.
# Pinned Node.js 24 and pnpm 11.11.0 execute inside containers.

set shell := ["bash", "-cu"]

# Display available recipes
default:
    @just --list

# Display available recipes (alias)
list:
    @just --list

# Start development environment (Supabase backend + seed + dev app)
up:
    @echo "==> Starting local Supabase backend..."
    bash scripts/local-supabase.sh start
    @echo "==> Seeding synthetic test accounts..."
    bash scripts/local-supabase.sh seed
    @echo "==> Starting TrafficSense dev container on http://localhost:3000..."
    docker compose up --build -d app
    @echo "==> Ready! Access the web app at: http://localhost:3000"

# Start dev app and follow logs directly
dev:
    docker compose up --build app

# Start production preview container on http://localhost:3001
prod:
    @echo "==> Starting production preview container..."
    docker compose --profile production up --build -d production
    @echo "==> Production preview ready at: http://localhost:3001"

# Stop dev and production preview containers (preserves database and cache)
down:
    docker compose --profile production down

# Stop the dev container
stop:
    docker compose stop app

# Restart the dev container
restart:
    docker compose restart app

# Stop all containers including Supabase backend
stop-all:
    @echo "==> Stopping dev & production containers..."
    docker compose --profile production down
    @echo "==> Stopping local Supabase backend..."
    bash scripts/local-supabase.sh stop
    @echo "==> All TrafficSense containers stopped."

# Show status of TrafficSense and Supabase containers
status:
    @echo "=== Application Containers ==="
    @docker compose ps -a
    @echo ""
    @echo "=== Local Supabase Containers ==="
    @docker ps --filter "name=supabase" --format "table {{ '{{' }}.Names{{ '}}' }}\t{{ '{{' }}.Status{{ '}}' }}\t{{ '{{' }}.Ports{{ '}}' }}"

# Stream logs for a container (default: app)
logs service="app":
    docker compose logs -f {{service}}

# Open an interactive shell inside a container (default: app)
shell service="app":
    docker compose exec {{service}} sh

# Start local Supabase backend
db-start:
    bash scripts/local-supabase.sh start

# Seed local Supabase backend with synthetic accounts and demo data
db-seed:
    bash scripts/local-supabase.sh seed

# Stop local Supabase backend
db-stop:
    bash scripts/local-supabase.sh stop

# Restart and re-seed local Supabase backend
db-reset:
    bash scripts/local-supabase.sh stop
    bash scripts/local-supabase.sh start
    bash scripts/local-supabase.sh seed

# Run traffic simulator (scenario: normal | slowdown | recovery | reset)
simulate scenario="normal":
    bash scripts/local-supabase.sh simulate {{scenario}}

# Reset traffic simulator state to baseline
simulate-reset:
    bash scripts/local-supabase.sh simulate reset

# Run unit tests inside Docker
test:
    docker compose exec app pnpm test 2>/dev/null || docker compose run --rm app pnpm test

# Run fast ESLint check inside Docker
lint:
    docker compose exec app pnpm lint 2>/dev/null || docker compose run --rm app pnpm lint

# Run backend integration tests (auth, traffic, reports)
test-integration:
    bash scripts/local-supabase.sh test
    bash scripts/local-supabase.sh test-traffic
    bash scripts/local-supabase.sh test-reports

# Run full checks suite (test + lint + typegen + tsc + build) in isolated container
check:
    docker compose run --build --rm checks

# Clean up stopped project containers
clean:
    docker compose --profile production --profile tools down --remove-orphans

# Start a free Cloudflare Tunnel exposing http://localhost:3000 to the internet
tunnel:
    @echo "==> Starting Cloudflare Tunnel for http://localhost:3000..."
    @docker rm -f trafficsense-tunnel 2>/dev/null || true
    @docker run -d --name trafficsense-tunnel --network host cloudflare/cloudflared:latest tunnel --no-autoupdate --url http://localhost:3000
    @sleep 3
    @echo "==> Tunnel created! Public HTTPS URL:"
    @docker logs trafficsense-tunnel 2>&1 | grep -o 'https://.*\.trycloudflare\.com' | head -n 1 || docker logs trafficsense-tunnel

# Stop the Cloudflare Tunnel
tunnel-stop:
    @echo "==> Stopping Cloudflare Tunnel..."
    @docker rm -f trafficsense-tunnel 2>/dev/null || true
    @echo "==> Tunnel stopped."

