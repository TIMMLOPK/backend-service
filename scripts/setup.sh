#!/bin/bash
set -euo pipefail

# ─── Mentova – first-time setup ───────────────────────────────────────────────
# Creates configuration files from examples and prepares local volumes.
# Safe to re-run – never overwrites existing files.

cd "$(dirname "$0")/.."
ROOT=$(pwd)

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

log()  { echo -e "${GREEN}[setup]${NC} $1"; }
warn() { echo -e "${YELLOW}[setup]${NC} $1"; }

# ── 1. Root .env (docker-compose variables) ───────────────────────────────────
if [ ! -f "$ROOT/.env" ]; then
  log "Creating .env with defaults..."
  cat > "$ROOT/.env" <<'EOF'
# Volumes
MONGODB_DATA_PATH=./volumes/mongodb
REDIS_DATA_PATH=./volumes/redis
STORAGE_DATA_PATH=./volumes/content

# Ports
APP_EXTERNAL_PORT=80
FRONTEND_EXTERNAL_PORT=3000
MONGO_EXPRESS_EXTERNAL_PORT=8081
EOF
else
  warn ".env already exists – skipping"
fi

# ── 2. Configuration env files ────────────────────────────────────────────────
for example in "$ROOT"/configuration/*.env.example; do
  target="${example%.example}"
  name=$(basename "$target")
  if [ ! -f "$target" ]; then
    cp "$example" "$target"
    log "Created configuration/$name from example"
  else
    warn "configuration/$name already exists – skipping"
  fi
done

# ── 3. Populate sane dev defaults if values are empty ─────────────────────────
APP_ENV="$ROOT/configuration/app.env"

# JWT secret – generate a random one if blank
if grep -q '^JWT_SECRET_KEY=$' "$APP_ENV" 2>/dev/null; then
  secret=$(openssl rand -hex 32 2>/dev/null || head -c 64 /dev/urandom | base64 | tr -dc 'a-zA-Z0-9' | head -c 64)
  sed -i "s|^JWT_SECRET_KEY=$|JWT_SECRET_KEY=${secret}|" "$APP_ENV"
  log "Generated random JWT_SECRET_KEY"
fi

MONGO_ENV="$ROOT/configuration/mongodb.env"
if grep -q '^MONGO_INITDB_ROOT_USERNAME=$' "$MONGO_ENV" 2>/dev/null; then
  sed -i \
    -e 's|^MONGO_INITDB_ROOT_USERNAME=$|MONGO_INITDB_ROOT_USERNAME=hacktheeast|' \
    -e 's|^MONGO_INITDB_ROOT_PASSWORD=$|MONGO_INITDB_ROOT_PASSWORD=hacktheeast|' \
    -e 's|^MONGO_INITDB_DATABASE=$|MONGO_INITDB_DATABASE=hacktheeast|' \
    "$MONGO_ENV"
  log "Set default MongoDB credentials (hacktheeast/hacktheeast)"
fi

# ── 4. Create volume directories ─────────────────────────────────────────────
mkdir -p "$ROOT/volumes/mongodb" "$ROOT/volumes/redis" "$ROOT/volumes/content"
log "Volume directories ready"

# ── 5. Frontend .env.local ────────────────────────────────────────────────────
FRONTEND_ENV="$ROOT/frontend/.env.local"
if [ -d "$ROOT/frontend" ] && [ ! -f "$FRONTEND_ENV" ]; then
  cat > "$FRONTEND_ENV" <<'EOF'
NEXT_PUBLIC_API_URL=http://localhost:80
EOF
  log "Created frontend/.env.local"
else
  [ -f "$FRONTEND_ENV" ] && warn "frontend/.env.local already exists – skipping"
fi

echo ""
log "Setup complete!"
