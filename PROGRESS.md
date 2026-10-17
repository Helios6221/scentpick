# Scent Pick — progress log (survives context resets)

App: iPhone home-screen PWA that ranks James's fragrances by occasion + time of day + Sherwood (Brisbane) weather.
Repo root: /Users/jamesnoye/Desktop/PuntersTech/scentpick  (app in docs/, served by GitHub Pages; research in research/)

## Environment facts (checked 2026-10-17)
- Parfumo works with plain curl. Charts come from POST /action/perfume/get_classification_chart.php (params in page JS). Extractor: research/tools/parfumo_fetch.py (search + page). Tested on Rayhaan Obsidian.
- Fragrantica is Cloudflare-blocked for curl (403 "Just a moment"). Claude-in-Chrome extension NOT connected this session -> Fragrantica fallback unavailable unless James connects Chrome.
- gh CLI not installed; no GitHub SSH key. brew available. git identity set (James Noye). Deploy walkthrough needed.
- Open-Meteo works (lat -27.53, lon 152.98, timezone Australia/Brisbane). No key, CORS ok.
- Earlier attempts exist in ../sillage (app code) and ../spritz (research tooling, no data) — NOT used; building from scratch per James.

## Plan / status
- [x] 0. Environment probes, extractor tool
- [ ] 1. Research: 14 Haiku workers, one per bottle -> research/bottles/<id>.json (+ raw HTML in research/raw/)
- [ ] 2. Verification: strong-model verifiers (did not research) re-check every number + identity -> research/verification/<id>.md; fix findings
- [ ] 3. Design ranking logic (occasion x weather x time) from evidence -> docs/engine.js + data/collection.json
- [ ] 4. Build PWA (vanilla JS, offline SW, iOS meta) in docs/
- [ ] 5. Test at iPhone size, all occasions x weather scenarios; fix
- [ ] 6. git init, GitHub Pages walkthrough, Home Screen instructions

## Bottle ids
afnan-supremacy-collectors-edition, french-avenue-liquid-brun, french-avenue-vulcan-feu, aromatix-french-avenue-forbidden-fruit,
arabiyat-prestige-marwa-extrait, fragrance-world-bois-de-bois, rayhaan-obsidian, rayhaan-italia, rayhaan-terra, rayhaan-lion,
rayhaan-jungle-vibe, rayhaan-aquatica, bujairami-vibration, maison-alhambra-eternal-touch

## Open questions for James
(filled in as they arise)

## Log
- 2026-10-17 15:30 Started. Probed environment, wrote extractor.
- 2026-10-17 19:23 Brief written: research/RESEARCH_BRIEF.md. Launching 14 Haiku research workers.
- 19:26 VERIFY_BRIEF.md + scripts/build_collection.py written
- Research done (14 workers, ~30k tokens each). 13 matched on Parfumo. Findings:
  - Bois de Bois: NOT on Parfumo under any query -> identification worker launched (house may differ).
  - Vulcan Feu = Parfumo "Feu" in French Avenue's "Vulcan" collection (page title "Feu by French Avenue", meta "Vulcan | Feu").
  - Eternal Touch = Parfumo "Eternal Touch / Tobacco Touch" by Maison Alhambra, year null.
  - Liquid Brun: 2024 original chosen over 2025 Limited Edition (ask James). Marwa: Extrait 2026 chosen over EDP 2025 (per wording).
  - TOOL BUG fixed: gender regex returned "for women" for "for women and men"; research JSONs may carry wrong gender_label -> verifiers correct from fresh fetch.
- Next: verifiers (fable) in 5 groups; engine + UI build in parallel.
- 19:30 Parfumo now Cloudflare-blocked (403) for curl. Added offline 'parse' mode; verifiers work from saved raw HTML. Re-verify fresh later if block lifts.
- 19:39 Engine tuned after sweep (indoor blending, sharper fits). BUILD_BRIEF.md written; curation.json has Bois de Bois tags.
- Verification done (5 fable verifiers, ~80k tokens each): 13/13 PASS or PASS-WITH-FIXES, 0 numeric discrepancies, all against saved source HTML (Parfumo 403 for fresh fetch). Fixes: gender labels (bug), Vibration thin flags, 2 scentSummary wording fixes. Verified facts: Eternal Touch = renamed Tobacco Touch (pooled ratings); Marwa page is the Extrait; Liquid Brun page is 2024 original; "Feu" is in the Vulcan collection; Forbidden Fruit is French Avenue's Aromatix collection. Bois de Bois: real FW EDP (late 2025), no community data reachable; manual tags suggested in data/curation.json.
- Engine re-tuned and sweep re-run: hot days -> fresh picks (Aquatica/Vulcan Feu/Vibration/Supremacy/Marwa), cool nights -> Liquid Brun/Terra/Lion/Italia/Obsidian; indoor venues only half-shelter; manual-tag bottles shrunk toward neutral.
- UI build delegated to an Opus worker per BUILD_BRIEF.md. Next: git init, README/deploy walkthrough, iPhone-size browser test, fresh-fetch re-verification if Cloudflare clears.
## Open questions for James
1. Liquid Brun: using the 2024 original's numbers; if the bottle is the 2025 Limited Edition, say so.
2. Bois de Bois: no Parfumo/Fragrantica data reachable (new release); currently ranked from suggested tags — edit them in the app.
3. Eternal Touch: Parfumo treats it as the renamed Tobacco Touch; numbers include votes for both names.
- 19:43 Engine: window labels/edge cases, spray thresholds fixed; live-forecast check OK (19° rainy Mon -> Supremacy; 15° night -> Liquid Brun).
- JAMES FEEDBACK (test): a tropical/beachy scent (Aquatica: lime, coconut, rum) does NOT fit a grey, drizzly 21° morning even though the Parfumo season chart says warm-season. Added sky handling to the engine: cloud_cover + rain prob -> `gloom`; per-bottle `tropical` index from Aquatic/Citrus/Fruity/Fresh/Creamy types + tell-tale notes; penalty in daylight scaled by outdoor exposure; small bonus for warm scents on grey days. Also: I flip-flopped when James pushed back once — hold a reasoned position and say why.
- UI built by Opus worker (docs/: index.html, app.css, app.js, store.js, weather.js, sw.js, manifest, icons, README-dev.md). Fixed after its report: office window preset tag, "a autumn", contextLine threshold, weather-code mode, Brisbane +10:00 parsing; grid overflow at 390px; now-window labels rounded to the hour.
- Visual test at true 390px via docs/dev-frame.html (Chrome min window width otherwise ~500px): home, results (office/date/beach/dinner/clubbing/casual) under live, heatwave, muggy-night and grey-drizzle overrides, bottle detail, collection, settings — all fit, no sideways scroll.
- Engine after visual review: dressy-occasion penalty for beach scents; weather weight scales with outside extremity (heatwave x1.6); stronger muggy penalty; grades capped to 'Good' when weather/occasion fit is poor, and never improve down the list; "wants sun" chip only for clear cases.
- STATUS: app complete locally, git repo initialised with everything committed. NOT yet pushed: gh CLI not installed, no GitHub SSH key — James must run the README steps (brew install gh; gh auth login; gh repo create ...). Fresh-fetch re-verification of Parfumo numbers still pending while Cloudflare 403 persists.
