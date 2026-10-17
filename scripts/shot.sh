#!/bin/sh
# Headless-Chrome screenshot at iPhone 14/15 size. Usage: scripts/shot.sh "<url>" out.png [height]
URL="$1"; OUT="${2:-shot.png}"; H="${3:-844}"
"/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" --headless=new --disable-gpu --hide-scrollbars \
  --window-size=390,$H --force-device-scale-factor=2 --virtual-time-budget=6000 \
  --user-data-dir=/tmp/scentpick-chrome-profile --no-first-run --no-default-browser-check \
  --screenshot="$OUT" "$URL" 2>/dev/null
ls -la "$OUT"
