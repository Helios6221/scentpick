# rayhaan-aquatica — VERDICT: PASS
Checked: 2026-10-17 19:36 AEST. Fresh re-fetch of https://www.parfumo.com/Perfumes/rayhaan/aquatica attempted ONCE -> HTTP 403 "Just a moment..." (Cloudflare), not retried. Verified against the SAVED source the researcher used: raw/rayhaan-aquatica.page.html (116456 bytes) + raw/rayhaan-aquatica.chart.html (10061 bytes), both mtime 17 Oct 19:24. Re-parsed offline with the current parser (`parse raw/rayhaan-aquatica`) AND cross-checked tool-independently (regex over tag-stripped HTML).

## Identity: PASS — judged from saved page + researcher's candidates (search blocked)
- `<title>` = "Aquatica by Rayhaan » Reviews & Perfume Facts"; `<h1>` = "Aquatica Rayhaan 2025" with brand link /Perfumes/rayhaan and year link /Release_Years/2025. Intro text: "A new perfume by Rayhaan for men, released in 2025" -> genderLabel "for men" is correct (page never says "for women and men", so this bottle was not affected by the gender_label parser bug).
- Parfumo search ("Rayhaan Aquatica") returned 403; identity judged from the saved page plus the researcher's single candidate (Rayhaan / Aquatica / 2025 / same URL). Of the 24 Rayhaan perfume links present on the saved page only one is an `aquatica` slug (no Intense/Extrait/Collector variant linked). No concentration word (Extrait, Eau de Parfum, EdP, EdT) appears anywhere on the page, so `concentration: null` is right. "Aqua Collection" in the meta description / Interesting Facts is the collection the bottle belongs to, not a different release. House spelling identical to the user's wording.

## Numbers: PASS — 0 discrepancies
Every value traced to the saved HTML text:
- overall 8.3 / 886 ("8.3 886 Ratings"); scent 8.3 / 886; longevity 7.3 / 833; sillage 7.1 / 836; bottle 7.7 / 810; value 8.8 / 802 ("Value for money 8.8 802 Ratings").
- Charts (chart.html text verbatim): Type Aquatic 10 / Fruity 13 / Creamy 14 / Sweet 16 / Citrus 24 / Fresh 23, 635 votes; Occasion Evening 10 / Business 11 / Night Out 12 / Sport 15 / Leisure 27 / Daily 25, 527 votes; Season Fall 9 / Spring 38 / Summer 53, 322 votes; Audience & Style Masculine 69 / Feminine 31 / Modern 88 / Classic 12, 357 votes. All match.
- counts reviews 78 / statements 222 / photos 13: page tab strip reads "Reviews 78 Statements 222 Photos 13" and the statements header reads "Statements 222 short views on the fragrance" -> mapping confirmed (number follows label).
- main_accords Citrus(l) Fresh(l) Sweet(m) Creamy(m) Fruity(m): matches the `s-circle_l/_m` classes in the "Main accords" block, same order.
- submitted "Skrwail", updated 16/10/2026; year 2025; meta description: all match.
- candidates[0].scent_votes = 881 vs page 886: this came from the research-time search snippet, which cannot be re-run (403). 5-vote drift on an 886-vote bottle is consistent with the brief's "drift is fine"; noted, not failed.
- Numbers on the page but deliberately NOT in the json (fine): "Ranked 162 in Men's Perfume".

## Notes: PASS
Top: Lime, Coconut, Bergamot, Mandarin orange; Heart: Ginger, Hibiscus, Ylang-ylang, Jasmine; Base: Musk, Sugar cane, White rum — identical to the page's Top/Heart/Base Notes text, grouping correct.

## Flags/summary discipline: PASS — nothing to fix
- No vote count under 30 (smallest is the season chart at 322).
- scentSummary uses only notes (lime, bergamot, mandarin orange, jasmine, ginger, musk, sugar cane) and accords (fresh, citrus, sweet); no performance or comparison claims; no numbers.
- fragrantica = null (no method label needed). flags = ["concentration_hint null"] is accurate. JSON left unchanged.

## Open issues for orchestrator
none (only note: verification was against the saved source, not a fresh fetch, and search could not be re-run because of the Cloudflare block).
