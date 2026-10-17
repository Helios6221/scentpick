# rayhaan-terra — VERDICT: PASS
Checked: 2026-10-17 19:36 AEST, re-fetched https://www.parfumo.com/Perfumes/rayhaan/terra (blocked, see below)

Verified against the SAVED source, not a fresh fetch. Fresh fetch: attempted ONCE at 19:33 for rayhaan-obsidian -> HTTP 403, title "Just a moment..." (Cloudflare; raw/rayhaan-obsidian.verify.page.html, 5734 bytes). The block is host-wide, so no further live page fetches or live searches were attempted for this batch (brief: do not hammer). Source files: raw/rayhaan-terra.page.html (mtime 17 Oct 2026 19:24:55), raw/rayhaan-terra.chart.html (mtime 17 Oct 2026 19:24:55). Checked two ways: offline re-parse with the current parser (`parfumo_fetch.py parse`) and an independent tag-stripped text dump of the same HTML; programmatic field-by-field diff of json.parfumo.data vs re-parse = 0 differences.

## Identity: PASS
Saved page: `<title>` "Terra by Rayhaan » Reviews & Perfume Facts", `<h1>` "Terra Rayhaan 2025", breadcrumb Home > Brands > Rayhaan > Terra, body text "A new perfume by Rayhaan for men, released in 2025" (page also shows "Ranked 256 in Men's Perfume", not used in json). Live search not possible (host blocked); the brand carousel in the saved pages lists 24 Rayhaan releases and contains no Terra variant (no Extrait/Intense/edition/other year). Researcher candidate (Rayhaan / Terra / 2025 / 606 scent votes) agrees with the page. Gender-label bug check: page says "for men" (0 hits for "for women and men"), so "for men" is correct.

## Numbers: PASS — 0 discrepancies
- overall 8.3 / 606 — page "8.3 606 Ratings", itemprop ratingValue 8.3, ratingCount 606.
- scent 8.3/606, longevity 8.6/562, sillage 8.4/566, bottle 7.5/541, value 9.2/540 — verbatim in stripped page text.
- charts: Type Citrus 6 / Earthy 6 / Smoky 8 / Sweet 11 / Woody 13 / Spicy 21 / Oriental 19 / Resinous 16, 488 votes; Occasion Business 9 / Daily 11 / Leisure 19 / Evening 31 / Night Out 29, 310 votes; Season Spring 22 / Fall 39 / Winter 39 (no Summer slice on the page; sums to 100), 267 votes; Audience & Style Masculine 86 / Feminine 14 / Modern 84 / Classic 16, 201 votes — all identical to json.
- counts reviews 36 / statements 155 / photos 11; submitted by "Randomodnar", updated 16/10/2026; year 2025 — all on page.
- Vote drift: not assessable (no fresh fetch); json equals the saved source exactly.

## Notes: PASS
Page text: "Top Notes Cardamom Frankincense Lemon Bergamot Elemi resin Sichuan pepper Heart Notes Patchouli Saffron Coriander Cumin Orange blossom Vermouth Aniseed Geranium Rose Base Notes Amber Frankincense Labdanum Benzoin Maltol Opoponax Ambergris Musk Vanilla Birch Oud" — 6/9/11, grouping and order identical to json (26 note spans found independently; Frankincense legitimately appears in both top and base). Main accords Spicy (l), Oriental (l), Resinous (m), Woody (m), Sweet (s) match.

## Flags/summary discipline: PASS — nothing fixed
- Smallest vote count is 201; nothing under 30, no thin-data flag needed. fragrantica null. No number in json that is not on the page.
- scentSummary uses accords (spicy-oriental, resinous-woody) and pyramid notes only; no performance/comparison claims.

## Open issues for orchestrator
none
