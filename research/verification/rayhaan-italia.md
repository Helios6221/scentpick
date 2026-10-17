# rayhaan-italia — VERDICT: PASS
Checked: 2026-10-17 19:36 AEST, re-fetched https://www.parfumo.com/Perfumes/rayhaan/italia (blocked, see below)

Verified against the SAVED source, not a fresh fetch. Fresh fetch: attempted ONCE at 19:33 for rayhaan-obsidian -> HTTP 403, title "Just a moment..." (Cloudflare; raw/rayhaan-obsidian.verify.page.html, 5734 bytes). The block is host-wide, so no further live page fetches or live searches were attempted for this batch (brief: do not hammer). Source files: raw/rayhaan-italia.page.html (mtime 17 Oct 2026 19:24:56), raw/rayhaan-italia.chart.html (mtime 17 Oct 2026 19:24:57). Checked two ways: offline re-parse with the current parser (`parfumo_fetch.py parse`) and an independent tag-stripped text dump of the same HTML; programmatic field-by-field diff of json.parfumo.data vs re-parse = 0 differences.

## Identity: PASS
Saved page: `<title>` "Italia by Rayhaan » Reviews & Perfume Facts", `<h1>` "Italia Rayhaan 2025", breadcrumb Home > Brands > Rayhaan > Italia, body text "A new perfume by Rayhaan for men, released in 2025". Live search not possible (host blocked); the brand carousel in the saved pages lists 24 Rayhaan releases and contains no Italia variant (no Extrait/Intense/edition/other year). The researcher's `candidates` list is empty (search hits were not recorded) even though matchCheck says a single 2025 release was found — a provenance gap, not an identity problem; identity is fully established by title/h1/breadcrumb. The single "unisex" hit on the page is inside a user review ("Although Italia is labeled as a unisex fragrance, I am sure that men would wear it more"), not Parfumo's label. Gender-label bug check: page says "for men" (0 hits for "for women and men"), so "for men" is correct.

## Numbers: PASS — 0 discrepancies
- overall 8.5 / 165 — page "8.5 165 Ratings", itemprop ratingValue 8.5, ratingCount 165.
- scent 8.5/165, longevity 8.1/155, sillage 8.0/153, bottle 8.1/155, value 9.0/153 — verbatim in stripped page text.
- charts: Type Floral 6 / Gourmand 13 / Citrus 13 / Creamy 19 / Sweet 26 / Spicy 22, 98 votes; Occasion Business 13 / Daily 15 / Leisure 20 / Night Out 26 / Evening 26, 89 votes; Season Summer 9 / Spring 26 / Winter 34 / Fall 31, 77 votes; Audience & Style Masculine 71 / Feminine 29 / Modern 91 / Classic 9, 56 votes — all identical to json.
- counts reviews 11 / statements 26 / photos 3; submitted by "Jask", updated 13/10/2026; year 2025 — all on page.
- Vote drift: not assessable (no fresh fetch); json equals the saved source exactly.

## Notes: PASS
Page text: "Top Notes Bergamot Lavender Lemon Heart Notes Honey Cashmeran Jasmine sambac Cinnamon Base Notes Tonka bean Tobacco Vanilla" — grouping and order identical to json (3/4/3). Main accords Sweet (l), Spicy (l), Creamy (l), Citrus (m), Gourmand (m) match.

## Flags/summary discipline: PASS — nothing fixed
- Smallest vote count is 56 (audience/style); nothing under 30, no thin-data flag needed. fragrantica null. No number in json that is not on the page.
- scentSummary uses accords (sweet-spicy, creamy, gourmand, citrus) and the note pyramid only; no performance/comparison claims. Minor: "honey-forward" is a prominence inference (honey is simply listed first in the heart) — within the letter of the rule, left unchanged.

## Open issues for orchestrator
- Minor/provenance only: `candidates` is `[]`; the researcher did not record search hits. Could not be back-filled because live search is blocked. Identity is nonetheless confirmed from the page.
