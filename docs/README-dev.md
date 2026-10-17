# Scent Pick — developer notes

Vanilla ES modules, no dependencies, no build step. Everything in this folder is served as-is by GitHub Pages
(`https://<user>.github.io/scentpick/`), so every path is relative (`./app.js`, `./data/collection.json`).

## Run locally

```sh
cd docs && python3 -m http.server 8080
# open http://localhost:8080/            (add ?debug for the weather-override tools)
```

`localhost` counts as a secure origin, so the service worker and offline mode work locally too.
To try it on an iPhone on the same Wi-Fi, use `http://<your-mac-ip>:8080/` (no service worker over plain http
on a LAN IP; that's expected — GitHub Pages is https).

Quick checks:

```sh
for f in *.js; do node --check "$f"; done          # syntax
node ../scripts/scenarios.mjs                       # engine sweep across weather scenarios
```

## Files

| File | What it does |
| --- | --- |
| `index.html` | Shell: iOS meta tags, tab bar, toast, sheet `<dialog>`. Loads `app.js`. |
| `app.css` | Design tokens on `:root` (dark-first, light override), components, safe-area padding. |
| `app.js` | Hash router (`#/`, `#/results/<occ>?when=&v=`, `#/bottle/<id>`, `#/collection`, `#/settings`), views, events. |
| `engine.js` | Ranking contract (pure). **Don't edit casually** — the UI relies on its output shape. |
| `store.js` | `localStorage['scentpick.v1']`: added/removed/edits/corrections/weatherCache/prefs + merge helpers. Node-safe. |
| `weather.js` | Open-Meteo fetch, 60-min freshness, per-window summary, debug override. |
| `sw.js` | Offline: precaches the shell; cache-first for shell, network-first for `data/collection.json`. |
| `data/collection.json` | The bottles (Parfumo community data). |

## Shipping a change (bump the service-worker version)

The service worker serves the app shell cache-first, so **every deploy that changes any file in `docs/` must bump
`VERSION` at the top of `sw.js`** (e.g. `'1.0.0'` → `'1.0.1'`). On the next launch the phone downloads the new
worker, it installs, takes over, deletes the old cache and posts `{type:'updated'}` — the app then shows
"Update available · Reload" (top banner and in Settings). Settings → App shows the running version.

`data/collection.json` is network-first, so data-only changes reach the phone on the next online launch even
without a bump (bumping is still good practice). If you add a new file to the shell, add it to `SHELL` in `sw.js`.

## Testing hooks

- `?debug` in the URL, or a long-press on the top bar, shows **Settings → Debug** (weather override: temperature,
  humidity, rain %, cloud %, wind, night share; "Clear override"). Overrides persist until cleared, and a
  "DEBUG WEATHER" pill shows in the header strip while one is active.
- `window.__scentpick.setWeatherOverride({ temp: 33, humidity: 75, rain: 10, cloud: 20, wind: 12, nightShare: 0 })`
  (or `null` to clear); `window.__scentpick.state` is the live app state (`state.lastRanked` = last ranking shown).
- Reset everything: Safari → Settings → Advanced → Website Data, or `localStorage.removeItem('scentpick.v1')`.

## iPhone-size screenshots without a phone (headless Chrome)

Chrome enforces a minimum window width, so `dev-frame.html` wraps the app in a 390px iframe and can seed a debug
weather override before loading it. With the local server running:

```sh
# fresh profile each time so the service worker cannot serve stale files
rm -rf /tmp/scentpick-chrome-profile
"/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" --headless=new --hide-scrollbars --window-size=600,1500 \
  --force-device-scale-factor=2 --virtual-time-budget=9000 --user-data-dir=/tmp/scentpick-chrome-profile \
  --screenshot=out.png 'http://localhost:8080/dev-frame.html?go=%23/results/dinner&h=1500&o=%7B%22temp%22%3A33%2C%22humidity%22%3A78%2C%22rain%22%3A10%2C%22cloud%22%3A15%7D'
```

`go` is the hash route, `h` the frame height, `o` a JSON weather override (keys: temp, feels, humidity, rain, cloud,
wind, nightShare; `null` clears it). `scripts/scenarios.mjs` sweeps the engine across weather scenarios without a browser.
