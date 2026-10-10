#!/usr/bin/env bash
# Zero-downtime backend deploy. Run on the server:
#     bash ~/indiankart/backend/scripts/deploy.sh
# Pulls main, installs dependencies if they changed, then restarts the two
# instances one at a time, waiting for each to report healthy before touching
# the next, so nginx always has one serving.
set -euo pipefail

REPO="$(cd "$(dirname "$0")/../.." && pwd)"
cd "$REPO"

BEFORE="$(git rev-parse HEAD)"
git pull --no-rebase --no-edit origin main
AFTER="$(git rev-parse HEAD)"
echo "deploying ${BEFORE:0:7} -> ${AFTER:0:7}"

if [ -n "$(git ls-files backend/api.js)" ] || grep -q "node api.js" backend/package.json; then
    echo "ABORT: injected backend/api.js loader found (see malware history). Not restarting." >&2
    exit 1
fi

cd backend
if ! git diff --quiet "$BEFORE" "$AFTER" -- package.json package-lock.json; then
    echo "dependencies changed: npm ci"
    npm ci --omit=dev
fi

wait_healthy() {
    local port="$1"
    for _ in $(seq 1 30); do
        if curl -fsS -m 3 "http://127.0.0.1:${port}/api/health" >/dev/null 2>&1; then
            echo "  :${port} healthy"
            return 0
        fi
        sleep 2
    done
    echo "  :${port} did not become healthy" >&2
    return 1
}

for entry in backend:5000 backend-2:5001; do
    app="${entry%%:*}"
    port="${entry##*:}"
    echo "restarting ${app}"
    pm2 restart "$app" --update-env >/dev/null
    wait_healthy "$port"
done

pm2 save >/dev/null
echo "done"
