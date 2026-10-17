# Scent Pick — PWA build brief (for the UI build worker)

Repo: /Users/jamesnoye/Desktop/scentpick. The app lives in `docs/` and will be served by GitHub Pages at
`https://<user>.github.io/scentpick/` — so EVERY path must be relative (`./app.js`, `./data/collection.json`), manifest
`start_url`/`scope` = `./`, service worker registered as `./sw.js` with scope `./`.

Already written — do not rewrite, import them: `docs/engine.js` (ranking; read it fully first, it is the contract) and
`docs/data/collection.json` (14 bottles; shape below). `docs/package.json` is `{"type":"module"}` so Node can import engine.js
for tests; harmless on Pages.

## What the app does (James, Sherwood, Brisbane; iPhone home-screen app)
1. **Pick** (home): header strip = wear-window label + weather label (from `contextLine`), a row of "When" chips
   (`WHEN_PRESETS`; default = `inferWindow(occasion)`'s preset, highlighted), and a 2-column grid of the 10 occasions
   (`OCCASIONS`: icon + label + optional `sub`). Tapping an occasion goes straight to Results (two taps total from launch).
2. **Results**: for the chosen occasion (+ dinner `variants` as small chips at the top: Family / Friends / Work), call
   `rank({collection, occasionId, variant, window, weather, corrections})`. Show #1 as a hero card, then #2–#4 as cards, then
   a "Show the rest" disclosure. Each card: rank, name, house, grade badge (`grade`), the one-line `reason`, `sprays.n` +
   `sprays.why` (omit parentheses if why is empty) + `sprays.where`, `longevity.range` as "~7–9 h" with a tick/warning if
   `!longevity.enough`, chips for `thin` ("thin data: occasion"), `manual` ("your tags"), `noData`. Two small buttons on each
   card: 👍 and 👎 → adjust `corrections[bottle.id][occasionId]` by ±1 (clamp −2..2; tapping the same again toggles back
   to 0), re-rank in place with a subtle animation, and show "boosted"/"marked down" state. Tap the card body → Bottle detail.
3. **Bottle detail**: name, house, year, concentration, gender label, `scentSummary`, notes pyramid (top/heart/base or flat),
   accords (size l/m/s as bar lengths), performance: longevity + sillage avg with vote counts, mapped to words
   (≥8.3 "very long"/"strong", ≥7.6 "long"/"good", ≥7 "moderate", else "short"/"soft"), "Suits" = occasion and season charts
   as horizontal bars with percentages and the vote count under each chart; audience/style line; source line
   "Parfumo community · N ratings · retrieved YYYY-MM-DD" linking to `community.url` (opens in Safari: target=_blank);
   `flags` listed under "Data notes". Controls: ★ favourite (global +1), 🚫 hide from picks (`hidden`), per-occasion
   adjustments list (shows current ±), "Edit" (name/house/concentration/notes/manual tags), "Remove bottle" (confirm sheet,
   undo toast). For bottles with `manual` tags, show the tags with their `source` text and an edit control.
4. **Collection**: searchable list of all bottles (name, house, one-line summary, mini badges for longevity/sillage words,
   hidden/removed state). "+ Add bottle" sheet: name*, house*, concentration, notes (comma separated), Parfumo URL (optional),
   and the manual tags: seasons (hot/warm/mild/cool multi), occasions (multi from OCCASIONS), strength (light/moderate/strong),
   longevity (short/medium/long), your rating (1–10, optional). New bottles get `id = slug`, `userAdded: true`,
   `manual: {...}`, no `community`. Removed bottles are kept with `removed: true` in storage and can be restored in Settings.
5. **Settings**: location fixed "Sherwood, Brisbane (−27.53, 152.98)"; refresh weather; "Export my changes" (copies a JSON of
   {added, removed, edits, corrections} to clipboard and offers Web Share); "Import"; "Reset corrections"; "Restore removed";
   "About & data" (Parfumo as source, what the charts mean, that thin data is shrunk toward neutral, no numbers invented);
   app version + "update available" banner when the SW finds a new version. Also a hidden **Debug** section (shown with
   `?debug` in the URL or a long-press on the header) with weather overrides: temperature, humidity, rain %, wind, night
   share, plus "clear override". Expose `window.__scentpick = { setWeatherOverride(obj|null), state }` for automated testing.

## Data flow
- Load `./data/collection.json` (fetch; the SW serves cached copy offline). Merge with localStorage `scentpick.v1`:
  `{ added: [bottle...], removed: [id...], edits: {id: partial}, corrections: {id: {hidden, global, <occasionId>: n}}, weatherCache, prefs }`.
- Weather: Open-Meteo, no key:
  `https://api.open-meteo.com/v1/forecast?latitude=-27.53&longitude=152.98&hourly=temperature_2m,apparent_temperature,relative_humidity_2m,precipitation_probability,weather_code,cloud_cover,wind_speed_10m,is_day,uv_index&forecast_days=4&timezone=Australia%2FBrisbane`
  Cache the JSON with `fetchedAt`; refresh if older than 60 min and online; if offline use the cache and show
  "forecast from Xh ago" in the header. Pass `data.hourly` to `summarizeWeather(hourly, window)`. If no cache at all, pass
  `weather = null` (engine falls back to defaults) and show "no forecast".
- Window: `inferWindow(occasionId)` by default; "When" chips call `windowForPreset(preset, occasionId)`. Re-summarise
  weather per window (the window depends on the occasion, so recompute on the Results screen).

## Collection.json bottle shape
`{ id, name, house, userName, year, concentration, genderLabel, notes: {top,heart,base} | {flat} | null, accords: [{accord,size}],
scentSummary, community: { source, url, retrieved, ratings: {scent,longevity,sillage,bottle,value: {avg,votes}},
charts: { type|occasion|season|audience_style: {pct: {Label: n}, votes} } } | (ratings null for no data),
fragrantica: null, flags: [...], manual: {seasons,occasions,strength,longevity,rating?,source} | null, profile: {}, notesOnFit }`

## iPhone / PWA requirements
- `<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">`, `apple-mobile-web-app-capable`,
  `apple-mobile-web-app-status-bar-style=black-translucent`, `apple-mobile-web-app-title=Scent Pick`, `theme-color` (both
  schemes), `apple-touch-icon` 180px, manifest with 192/512 icons (`purpose: any maskable`), `display: standalone`.
- Safe areas: `padding: env(safe-area-inset-*)` on header/footer; `min-height: 100dvh`; `-webkit-tap-highlight-color:
  transparent`; `touch-action: manipulation`; `overscroll-behavior-y: none`; 44px+ tap targets; system font stack
  (`-apple-system, system-ui`), 17px base; `prefers-color-scheme` light & dark with CSS tokens on `:root`, dark-first palette
  (deep charcoal + warm amber accent + soft cream text); `prefers-reduced-motion` respected.
- Fast: vanilla ES modules, zero dependencies, no build step, total < 120 KB. Screens are in-page views (hash routing
  `#/`, `#/results/<occ>`, `#/bottle/<id>`, `#/collection`, `#/settings`) so Back works in standalone mode; keep scroll
  positions sane.
- Offline: `sw.js` precaches the shell (index, css, js, engine, manifest, icons, data) with a version string; cache-first for
  shell, network-first with cache fallback for `data/collection.json`; `skipWaiting` + `clients.claim`; post a message to the
  page when a new version is installed so Settings can show "Update available — reload".
- Icons: create `docs/icons/icon.svg` (simple: amber droplet/mist mark on charcoal, no text) and rasterise to
  `icon-192.png`, `icon-512.png`, `apple-touch-icon.png` (180). Try `qlmanage -t -s 512 -o docs/icons docs/icons/icon.svg`
  (macOS; output is `icon.svg.png`, rename) or `sips -z` for resizing; if SVG rasterising fails, generate the PNGs with a
  small pure-Python zlib PNG writer (flat charcoal background, amber circle). Verify the PNGs open (`file`, `sips -g all`).
- Accessibility: buttons are `<button>`, labels, `aria-pressed` for chips, focus-visible styles, text contrast ≥ 4.5:1.

## Deliverables
`docs/index.html`, `docs/app.css`, `docs/app.js`, `docs/weather.js`, `docs/store.js`, `docs/sw.js`, `docs/manifest.webmanifest`,
`docs/icons/*`, and `docs/README-dev.md` (how to run locally: `cd docs && python3 -m http.server 8080`, how to bump the SW
version). Test with `node --check` on each JS file, start the local server, and `curl` each asset for 200s. Keep code
readable (short functions, comments where logic is non-obvious). Do not change engine.js or collection.json; if you find a
bug in engine.js, report it instead of fixing it.
