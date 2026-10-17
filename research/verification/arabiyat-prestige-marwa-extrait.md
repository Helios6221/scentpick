# arabiyat-prestige-marwa-extrait — VERDICT: PASS-WITH-FIXES
Checked: 2026-10-17 19:37, re-fetch NOT attempted for this URL (https://www.parfumo.com/Perfumes/arabiyat-prestige/marwa-extrait): Cloudflare 403 confirmed minutes earlier on a sibling bottle and on the search endpoint.
Verified against the researcher's SAVED source (raw/<id>.page.html + raw/<id>.chart.html), not a fresh fetch: Parfumo returned HTTP 403 / title "Just a moment..." (Cloudflare challenge) on one fresh attempt at 19:32; search endpoint also 403. Not re-attempted per the no-hammer instruction. Saved page mtime 2026-10-17 19:24, chart mtime 2026-10-17 19:24.
Offline re-parse with the current parser and a tool-independent regex pass over the stripped HTML both used.

## Identity: PASS — the saved page IS the Extrait. <title> "Marwa / مروة by Arabiyat Prestige (Extrait) » Reviews & Perfume Facts"; h1 "Marwa" + alt-name div "مروة" + brand link Arabiyat Prestige + Release_Years/2026 + concentration span `<span class="p_con ...">Extrait`; breadcrumb position 4 "Marwa (Extrait)"; canonical slug marwa-extrait. The page's "My suggestion" strip lists "Marwa Eau de Parfum" as a separate entry, corroborating the researcher's two-candidate picture (EDP 2025 vs Extrait 2026). User asked for "Marwa Extrait" → Extrait is the right pick. House spelled identically. Search was 403-blocked, so the EDP candidate's 1385 votes could not be re-checked (it is a rejected-candidate listing number, not a claim about this bottle).
Gender: page text "A new perfume by Arabiyat Prestige for men, released in 2026" → json "for men" is correct (bug did not affect this bottle).

## Numbers: PASS — zero discrepancies against the saved page.
- overall 8.4 / 114 (itemprop ratingValue 8.4, ratingCount 114) ✓
- Scent 8.4/114, Longevity 7.7/106, Sillage 7.4/107, Bottle 8.4/108, Value for money 8.2/102 ✓
- Type: Oriental 6, Powdery 6, Floral 7, Spicy 22, Fresh 31, Citrus 28 — 54 votes ✓
- Occasion: Evening 11, Night Out 11, Sport 15, Business 20, Daily 23, Leisure 20 — 71 votes ✓
- Season: Winter 13, Fall 17, Spring 34, Summer 36 — 47 votes ✓
- Audience & Style: Masculine 76, Feminine 24, Modern 92, Classic 8 — 33 votes ✓
- counts Reviews 16 / Statements 21 / Photos 3 ✓; Submitted by EaZyBnA, updated 11/10/2026 ✓; year 2026 ✓; concentration Extrait ✓
- candidates[1].scent_votes 106 vs page 114: researcher already recorded this as search-listing lag in `issues`; acceptable. candidates[0] (EDP) 1385: unverifiable while search is blocked.

## Notes: PASS — Top: Calabrian bergamot, Sicilian orange, Lemon; Heart: Ceylonese cinnamon, Nigerian ginger, Tunisian neroli; Base: Ambroxan, Chinese black tea, Frankincense, Gaiac wood — matches the page's Top/Heart/Base text exactly. Main accords independently re-extracted: Fresh l, Citrus l, Spicy l, Floral s, Oriental s — match.

## Flags/summary discipline: PASS after fix
- FIXED scentSummary: removed the closing sentence "Highly modern with strong masculine appeal." — it was derived from the Audience & Style chart (Modern 92% / Masculine 76%), which is outside the allowed sources (notes / accords / Type chart). Remaining text uses top/heart/base notes and the fresh/citrus/spicy accords only; "woody amber base" is a fair reading of Ambroxan + Gaiac wood. Orchestrator may restore the sentence if Audience & Style is deemed an allowed source.
- Thin-data flags: smallest vote count is 33 (Audience & Style) — nothing under 30; flags [] is correct. Concentration present, so no concentration flag needed.
- fragrantica null ✓. No number in the json that is not on the page, except the candidate-listing numbers noted above ✓.
- File re-dumped with indent=1 per brief; field-level diff confirmed only scentSummary changed.

## Open issues for orchestrator
- The EDP candidate's 1385 scent votes (and the 106 listing figure) come from the researcher's search run and cannot be re-verified until Parfumo's search endpoint stops serving the Cloudflare challenge. Not a correctness risk for this bottle's data.
