# Worktree Setup & Port Allocation

Read this when creating a worktree, allocating ports, or wiring up Docker Compose for per-worktree services.

## Quick Start

### Create a Worktree

```bash
# Create worktree for a new feature branch
git worktree add ../wt-auth -b feature/new-auth main

# Create worktree from an existing branch
git worktree add ../wt-hotfix hotfix/fix-login

# Create worktree in a dedicated directory
git worktree add ~/worktrees/myapp-auth -b feature/auth origin/main
```

### List All Worktrees

```bash
git worktree list
# Output:
# /Users/dev/myapp              abc1234 [main]
# /Users/dev/wt-auth            def5678 [feature/new-auth]
# /Users/dev/wt-hotfix          ghi9012 [hotfix/fix-login]
```

### Remove a Worktree

```bash
# Safe removal (fails if there are uncommitted changes)
git worktree remove ../wt-auth

# Force removal (discards uncommitted changes)
git worktree remove --force ../wt-auth

# Prune stale metadata
git worktree prune
```

## Port Allocation Strategy

### Deterministic Port Assignment

Each worktree gets a block of ports based on its index:

```
Worktree Index    App Port    DB Port    Redis Port    API Port
────────────────────────────────────────────────────────────────
0 (main)          3000        5432       6379          8000
1 (wt-auth)       3010        5442       6389          8010
2 (wt-hotfix)     3020        5452       6399          8020
3 (wt-feature)    3030        5462       6409          8030
```

Formula: `port = base_port + (worktree_index * stride)`
Default stride: 10

### Port Map File

Store the allocation in `.worktree-ports.json` at the worktree root:

```json
{
  "worktree": "wt-auth",
  "branch": "feature/new-auth",
  "index": 1,
  "ports": {
    "app": 3010,
    "database": 5442,
    "redis": 6389,
    "api": 8010
  },
  "created": "2026-03-09T10:30:00Z"
}
```

### Port Collision Detection

```bash
# Check if a port is already in use
check_port() {
  local port=$1
  if lsof -i :"$port" > /dev/null 2>&1; then
    echo "PORT $port is BUSY"
    return 1
  else
    echo "PORT $port is FREE"
    return 0
  fi
}

# Check all ports for a worktree
for port in 3010 5442 6389 8010; do
  check_port $port
done
```

## Full Worktree Setup Script

```bash
#!/bin/bash
# setup-worktree.sh — Create a fully prepared worktree
set -euo pipefail

BRANCH="${1:?Usage: setup-worktree.sh <branch-name> [base-branch]}"
BASE="${2:-main}"
WT_NAME="wt-$(echo "$BRANCH" | sed 's|.*/||' | tr '[:upper:]' '[:lower:]')"
WT_PATH="../$WT_NAME"
MAIN_REPO="$(git rev-parse --show-toplevel)"

echo "Creating worktree: $WT_PATH from $BASE..."

# 1. Create worktree
if git rev-parse --verify "$BRANCH" > /dev/null 2>&1; then
  git worktree add "$WT_PATH" "$BRANCH"
else
  git worktree add "$WT_PATH" -b "$BRANCH" "$BASE"
fi

# 2. Copy environment files
for envfile in .env .env.local .env.development; do
  if [ -f "$MAIN_REPO/$envfile" ]; then
    cp "$MAIN_REPO/$envfile" "$WT_PATH/$envfile"
    echo "Copied $envfile"
  fi
done

# 3. Allocate ports
WT_INDEX=$(git worktree list | grep -n "$WT_PATH" | cut -d: -f1)
WT_INDEX=$((WT_INDEX - 1))
STRIDE=10

cat > "$WT_PATH/.worktree-ports.json" << EOF
{
  "worktree": "$WT_NAME",
  "branch": "$BRANCH",
  "index": $WT_INDEX,
  "ports": {
    "app": $((3000 + WT_INDEX * STRIDE)),
    "database": $((5432 + WT_INDEX * STRIDE)),
    "redis": $((6379 + WT_INDEX * STRIDE)),
    "api": $((8000 + WT_INDEX * STRIDE))
  }
}
EOF
echo "Ports allocated (index $WT_INDEX)"

# 4. Update .env with allocated ports
if [ -f "$WT_PATH/.env" ]; then
  APP_PORT=$((3000 + WT_INDEX * STRIDE))
  DB_PORT=$((5432 + WT_INDEX * STRIDE))
  sed -i.bak "s/APP_PORT=.*/APP_PORT=$APP_PORT/" "$WT_PATH/.env"
  sed -i.bak "s/:5432/:$DB_PORT/g" "$WT_PATH/.env"
  rm -f "$WT_PATH/.env.bak"
  echo "Updated .env with worktree ports"
fi

# 5. Install dependencies
cd "$WT_PATH"
if [ -f "pnpm-lock.yaml" ]; then
  pnpm install --frozen-lockfile
elif [ -f "package-lock.json" ]; then
  npm ci
elif [ -f "yarn.lock" ]; then
  yarn install --frozen-lockfile
elif [ -f "requirements.txt" ]; then
  pip install -r requirements.txt
elif [ -f "go.mod" ]; then
  go mod download
fi

echo ""
echo "Worktree ready: $WT_PATH"
echo "Branch: $BRANCH"
echo "App port: $((3000 + WT_INDEX * STRIDE))"
echo ""
echo "Next: cd $WT_PATH && pnpm dev"
```

## Docker Compose Per-Worktree

```yaml
# docker-compose.worktree.yml — override for worktree-specific ports
# Usage: docker compose -f docker-compose.yml -f docker-compose.worktree.yml up

services:
  postgres:
    ports:
      - "${DB_PORT:-5432}:5432"
    environment:
      POSTGRES_DB: "myapp_${WT_NAME:-main}"

  redis:
    ports:
      - "${REDIS_PORT:-6379}:6379"

  app:
    ports:
      - "${APP_PORT:-3000}:3000"
    environment:
      DATABASE_URL: "postgresql://dev:dev@postgres:5432/myapp_${WT_NAME:-main}"
```

Launch with worktree-specific ports:

```bash
DB_PORT=5442 REDIS_PORT=6389 APP_PORT=3010 WT_NAME=auth \
  docker compose -f docker-compose.yml -f docker-compose.worktree.yml up -d
```
