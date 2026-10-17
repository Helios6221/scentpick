#!/bin/sh
# Bump the service-worker cache version, rebuild data, commit and push. Usage: ./scripts/release.sh "message"
set -e
cd "$(dirname "$0")/.."
MSG="${1:-update}"
STAMP="$(date +%Y%m%d-%H%M)"
if [ -f docs/sw.js ]; then
  # replace the first VERSION/CACHE string literal in sw.js with the timestamp
  sed -i '' -E "1,/(VERSION|CACHE_NAME|CACHE)[[:space:]]*=[[:space:]]*['\"][^'\"]*['\"]/ s/((VERSION|CACHE_NAME|CACHE)[[:space:]]*=[[:space:]]*['\"])[^'\"]*(['\"])/\1v$STAMP\3/" docs/sw.js
fi
python3 scripts/build_collection.py
git add -A
git commit -m "$MSG (release v$STAMP)" || echo "nothing to commit"
git push
echo "Pushed. GitHub Pages will redeploy in about a minute."
