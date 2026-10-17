# rayhaan-obsidian — VERDICT: PASS-WITH-FIXES
Checked: 2026-10-17 19:36 AEST, re-fetched https://www.parfumo.com/Perfumes/rayhaan/obsidian (blocked, see below)

Verified against the SAVED source, not a fresh fetch. Fresh fetch: attempted ONCE at 19:33 for rayhaan-obsidian -> HTTP 403, title "Just a moment..." (Cloudflare; raw/rayhaan-obsidian.verify.page.html, 5734 bytes). The block is host-wide, so no further live page fetches or live searches were attempted for this batch (brief: do not hammer). Source files: raw/rayhaan-obsidian.page.html (mtime 17 Oct 2026 19:24:56), raw/rayhaan-obsidian.chart.html (mtime 17 Oct 2026 19:24:57). Checked two ways: offline re-parse with the current parser (`parfumo_fetch.py parse`) and an independent tag-stripped text dump of the same HTML; programmatic field-by-field diff of json.parfumo.data vs re-parse = 0 differences.

## Identity: PASS
Saved page: `<title>` "Obsidian by Rayhaan » Reviews & Perfume Facts", `<h1>` "Obsidian Rayhaan 2025", breadcrumb Home > Brands > Rayhaan > Obsidian, body text "A new perfume by Rayhaan for men, released in 2025". House spelled identically to the user's wording. Live search was not possible (host blocked); instead the brand carousel embedded in all six saved Rayhaan pages lists 24 Rayhaan releases (obsidian, italia, terra, aquatica, lion, jungle-vibe, wolf, vantage, valhalla-x-legion, tiger-cal-cologne-edition, pacific-aura, nocturno-elixir, nava-sol, cedrus-blanc, azul, tonquin-giza, vanilla-vibe, tropical-vibe, rayhaan-elixir, pharaoh, pacific-aloha, equinox, crimson, adonis-icarus) and contains no Obsidian variant (no Extrait/Intense/edition/other year). Researcher candidate (Rayhaan / Obsidian / 2025 / 206 scent votes) agrees with the page. Gender-label bug check: page says "for men" (0 hits for "for women and men"), so `genderLabel`/`gender_label` = "for men" is correct; no flag depended on it.

## Numbers: PASS — 0 discrepancies
- overall: json 8.3 / 206 — page "8.3 206 Ratings", itemprop ratingValue 8.3, ratingCount 206.
- scent 8.3/206, longevity 8.0/191, sillage 7.8/190, bottle 8.1/190, value 8.9/182 — all read verbatim from the stripped page text ("Scent 8.3 206 Ratings ... Longevity 8.0 191 Ratings ... Sillage 7.8 190 Ratings ... Bottle 8.1 190 Ratings ... Value for money 8.9 182 Ratings").
- charts (chart.html text): Type Creamy 6 / Spicy 8 / Floral 12 / Woody 15 / Powdery 23 / Leathery 19 / Sweet 17, 155 votes; Occasion Leisure 11 / Daily 11 / Business 15 / Evening 32 / Night Out 31, 119 votes; Season Summer 5 / Spring 24 / Fall 35 / Winter 36, 105 votes; Audience & Style Masculine 89 / Feminine 11 / Modern 60 / Classic 40, 86 votes — every percentage and vote count identical to the json.
- counts reviews 14 / statements 49 / photos 4; submitted by "Skrwail", updated 08/10/2026; year 2025 — all on page.
- Vote drift: not assessable (no fresh fetch); json equals the saved source exactly.

## Notes: PASS
Page shows "Fragrance Notes Iris Leather Rose Oud" with no Top/Heart/Base headings anywhere (0 hits each), so the flat grouping is correct. 4 note spans found independently = Iris, Leather, Rose, Oud. Main accords Powdery (l), Leathery (l), Sweet (m), Woody (m), Floral (s) match the s-circle classes.

## Flags/summary discipline: PASS (after fix)
- Thin data: smallest vote count is 86 (audience/style chart); nothing under 30, so no thin-data flag is required. Existing flags (concentration null; flat notes) are accurate.
- fragrantica: null — correct.
- No number in the json that is not on the page (candidates.scent_votes 206 matches the page).
- FIX applied: scentSummary ended with "... rose, and oud in a flat structure." — "flat structure" is parser terminology, not anything on the page, and is meaningless to a reader. Changed to "Powdery and leathery fragrance with sweet and woody undertones. Notes include iris, leather, rose, and oud." Still uses only accords + notes; no performance/comparison claims.

## Open issues for orchestrator
none
