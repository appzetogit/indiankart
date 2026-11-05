#!/usr/bin/env bash
# Builds the website from the committed code and releases it on the VPS.
# Run from the repo root in Git Bash:  bash scripts/deploy-site-vps.sh
# Keeps the last 5 releases. Roll back by pointing the `current` symlink at an
# older one in /home/indiankart/site/releases.
set -euo pipefail

SERVER="root@145.223.21.188"
KEY="$HOME/.ssh/indiankart-fresh"
API_URL="https://backend.indiankart.in/api"
SSH="ssh -i $KEY -o BatchMode=yes -o ConnectTimeout=20 -o ServerAliveInterval=15 $SERVER"

if [ -n "$(git status --porcelain frontend)" ]; then
    echo "ABORT: uncommitted changes in frontend/. Commit them first." >&2
    exit 1
fi

node scripts/scan-injection.mjs
RELEASE="$(date +%Y%m%d-%H%M%S)-$(git rev-parse --short HEAD)"

(cd frontend && VITE_API_URL="$API_URL" npm run build)

if ! grep -rqF "$API_URL" frontend/dist/assets; then
    echo "ABORT: the build does not contain $API_URL" >&2
    exit 1
fi

tar -C frontend/dist -cf - . | $SSH "
    set -e
    D=/home/indiankart/site/releases/$RELEASE
    mkdir -p \$D
    tar -xf - -C \$D
    chown -R indiankart: /home/indiankart/site
    chmod -R a+rX /home/indiankart/site
    test -s \$D/index.html
    ln -sfn \$D /home/indiankart/site/current.new
    chown -h indiankart: /home/indiankart/site/current.new
    mv -T /home/indiankart/site/current.new /home/indiankart/site/current
    cd /home/indiankart/site/releases && ls -1t | tail -n +6 | xargs -r rm -rf
"
echo "Released $RELEASE"
