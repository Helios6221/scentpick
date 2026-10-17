# maison-alhambra-eternal-touch — VERDICT: PASS-WITH-FIXES
Checked: 2026-10-17 19:37, re-fetch NOT attempted for this URL (https://www.parfumo.com/Perfumes/maison-alhambra/eternal-touch-tobacco-touch): Cloudflare 403 confirmed minutes earlier on a sibling bottle; search "Eternal Touch" also returned 403.
Verified against the researcher's SAVED source (raw/<id>.page.html + raw/<id>.chart.html), not a fresh fetch: Parfumo returned HTTP 403 / title "Just a moment..." (Cloudflare challenge) on one fresh attempt at 19:32; search endpoint also 403. Not re-attempted per the no-hammer instruction. Saved page mtime 2026-10-17 19:24, chart mtime 2026-10-17 19:24.
Offline re-parse with the current parser and a tool-independent regex pass over the stripped HTML both used.

## Identity: PASS (with a caveat the orchestrator should know) — <title> "Eternal Touch / Tobacco Touch by Maison Alhambra"; h1 "Eternal Touch" with "Tobacco Touch" in the alternate-name div (`<div class="mt-0-5 mb-0-5 text-sm">`, the SAME element Parfumo uses for Marwa's Arabic name "مروة"); breadcrumb position 3 "Maison Alhambra", position 4 "Eternal Touch" (primary name). Page text: "A popular perfume by Maison Alhambra for women and men. The release year is unknown. ... It is still in production." House matches exactly.
Does the dual name hide two products? On the evidence of the saved page: no — it is ONE Parfumo entry (one rating set, one chart set, one URL slug eternal-touch-tobacco-touch), and no other Maison Alhambra entry named Eternal Touch or Tobacco Touch is linked anywhere on the page (all 40 maison-alhambra perfume links enumerated; only this slug carries either name). The on-page reviews explain the dual name as a RENAME/re-bottling: Flyview (09/10/2025) "Before there was a bottle called Tobacco Touch, I think this is exactly the same juice as before. It isn't a complete 1:1 this one is a bit more boozy"; Newtype777 "This is literally just Tobacco Touch in a new bottle, I heard Tom Ford started sending out cease and desists ... due to the bottle"; Minigolf refers to it as "Eternal Touch/Tobacco Touch"; SeStra reviews it as "Eternal Touch (Maison Alhambra)". So "Maison Alhambra Eternal Touch" (the user's wording) is this entry's primary/current name and the data belongs to it. Caveat: the 73 ratings pool votes cast under the earlier Tobacco Touch name/bottle, and one reviewer perceives a small formula difference — Parfumo's editorial judgement is that it is the same product. Search was blocked so a separate legacy "Tobacco Touch" entry cannot be 100% excluded, but nothing on the page suggests one.
Gender: page says "for women and men" (unisex); json said "for women" (known parser bug) → fixed.

## Numbers: PASS — zero discrepancies against the saved page.
- overall 7.6 / 73 (itemprop ratingValue 7.6, ratingCount 73) ✓
- Scent 7.6/73, Longevity 7.6/67, Sillage 7.5/66, Bottle 6.7/70, Value for money 8.8/70 ✓
- Type: Smoky 7, Woody 13, Gourmand 15, Oriental 15, Spicy 25, Sweet 24 — 71 votes ✓
- Occasion: Business 9, Leisure 11, Daily 11, Night Out 32, Evening 38 — 47 votes ✓
- Season: Spring 7, Fall 44, Winter 49 — 41 votes ✓ (no Summer slice on the page either)
- Audience & Style: Masculine 71, Feminine 29, Modern 50, Classic 50 — 40 votes ✓
- counts Reviews 5 / Statements 17 ✓; Photos 0 — the Photos tab on the page carries no count span (`<span>Photos</span>`), so 0 is the faithful reading ✓; Submitted by Chs724, updated 06/10/2026 ✓; year null — page says "The release year is unknown" ✓.
- matchCheck's "73 scent votes" = page ✓.

## Notes: PASS — Top: Spices, Tobacco; Heart: Vanilla, Tonka bean, Cocoa, Tobacco flower; Base: Dried fruits, Woods — matches the page's Top/Heart/Base text exactly. Main accords independently re-extracted: Spicy l, Sweet l, Oriental m, Gourmand m, Woody m — match.

## Flags/summary discipline: PASS after fixes
- FIXED gender-label parser bug: identity.genderLabel and parfumo.data.gender_label "for women" → "for women and men".
- FIXED flags: dropped "gender_label is 'for women' (other than 'for men')" because it was based on the wrong label (per brief). Remaining flag "concentration_hint is null" kept (page shows no concentration). NOTE: year is null on the page — the json records year null; there is no explicit "year unknown" flag, and the brief does not require one, so none added.
- Thin-data flags: smallest vote count is 40 (Audience & Style) — nothing under 30.
- scentSummary uses notes + accords + Type chart only ("leans heavily spicy and sweet with oriental and gourmand character" = Type/accords); no performance or comparison claims; it does not mention the Tobacco Vanille comparisons made in reviews ✓. fragrantica null ✓. No number in the json that is not on the page ✓.
- File re-dumped with indent=1 per brief; field-level diff confirmed only genderLabel, gender_label, flags changed.

## Open issues for orchestrator
- Naming caveat (not a FAIL): Parfumo pools "Eternal Touch" and the earlier "Tobacco Touch" bottle into one entry; reviews describe a rename/re-bottling with possibly minor juice tweak. If the product card needs it, consider showing the alternate name "Tobacco Touch" and/or a note that ratings include the pre-rename bottle. The json currently has `ambiguity: null` and `candidates: []` — the orchestrator may want to record the alt name in `ambiguity` (I did not, as it is a judgement call, not a mechanical fix).
- `candidates` is empty although matchCheck says the search listing showed this bottle (73 votes); minor record-keeping inconsistency, cannot be regenerated while search is 403.
