# bujairami-vibration — VERDICT: PASS-WITH-FIXES
Checked: 2026-10-17 19:36 AEST. Fresh re-fetch of https://www.parfumo.com/Perfumes/bujairami/vibration attempted ONCE -> HTTP 403 "Just a moment..." (Cloudflare), not retried. Verified against the SAVED source the researcher used: raw/bujairami-vibration.page.html (95724 bytes) + raw/bujairami-vibration.chart.html (7872 bytes), both mtime 17 Oct 19:24. Re-parsed offline with the current (bug-fixed) parser (`parse raw/bujairami-vibration`) AND cross-checked tool-independently (regex over tag-stripped HTML).

## Identity: PASS — judged from saved page only (search blocked, researcher's candidates list is EMPTY)
- `<title>` = "Vibration by Bujairami » Reviews & Perfume Facts"; `<h1>` = "Vibration Bujairami 2026" with brand link /Perfumes/bujairami and year link /Release_Years/2026. House spelling identical to the user's wording "Bujairami Vibration"; plain name "Vibration" matches exactly.
- GENDER BUG CONFIRMED AND FIXED: page intro reads "A new perfume by Bujairami for women and men, released in 2026". JSON had "for women" (the known parser bug). Current parser re-derives "for women and men". Fixed identity.genderLabel, parfumo.data.gender_label and the matchCheck sentence that embedded the wrong label. No flag in the json was based on the wrong label, so none dropped.
- Parfumo search ("Bujairami Vibration") returned 403 and the researcher recorded `candidates: []`, so no search evidence exists at all for this bottle. From the saved page: of the 30 Bujairami perfume links present, only one is a `vibration` slug (no Intense/Extrait/flanker linked); no concentration word (Extrait, Eau de Parfum, EdP, EdT) appears anywhere, so `concentration: null` is right. Identity passes on page evidence; see open issue.

## Numbers: PASS — 0 discrepancies
Every value traced to the saved HTML text:
- overall 8.9 / 47 ("8.9 47 Ratings"); scent 8.9 / 47; longevity 8.1 / 43; sillage 8.2 / 43; bottle 8.0 / 43; value 9.0 / 43 ("Value for money 9.0 43 Ratings").
- Charts (chart.html text verbatim): Type Floral 11 / Green 14 / Fruity 18 / Fresh 32 / Citrus 25, 28 votes; Occasion Night Out 6 / Evening 9 / Sport 14 / Business 20 / Daily 29 / Leisure 23, 35 votes; Season Fall 15 / Spring 38 / Summer 46, 26 votes; Audience & Style Masculine 100 / Feminine 0 / Modern 80 / Classic 20, 21 votes. All match.
- counts reviews 2 / statements 9 / photos 3: page tab strip reads "Reviews 2 Statements 9 Photos 3" and the statements header reads "Statements 9 short views on the fragrance" -> mapping confirmed.
- main_accords Fresh(l) Citrus(l) Fruity(l) Green(m) Floral(s): matches the `s-circle_l/_m/_s` classes in the "Main accords" block, same order.
- submitted "EaZyBnA", updated 16/10/2026; year 2026; meta description: all match. No number in the json is absent from the page.

## Notes: PASS
Top: Grapefruit, Bergamot, Jasmine, Magnolia; Heart: Ginger, Herbaceous notes, Powdery notes; Base: Amber, Cedar, Musk, Orris root, Patchouli — identical to the page's Top/Heart/Base Notes text, grouping correct.

## Flags/summary discipline: PASS after fixes
Fixed in bottles/bujairami-vibration.json (python json load/dump, indent=1, ensure_ascii=False; backup of the pre-fix file in the session scratchpad):
1. identity.genderLabel: "for women" -> "for women and men".
2. parfumo.data.gender_label: "for women" -> "for women and men".
3. identity.matchCheck: rewritten to state the correct label, quote the page text, and note the correction.
4. flags: three MANDATORY thin-data flags added for vote counts under 30 — type chart 28, season chart 26, audience_style chart 21 (the latter also records that Masculine 100% / Feminine 0% rests on 21 votes while the page label is "for women and men") — plus one caution flag that the occasion chart has 35 votes and all five ratings rest on only 43-47 votes (2026 release). Previously the only flag was "concentration_hint null", so the <30 rule was violated three times.
- scentSummary checked: uses only notes (grapefruit, bergamot, ginger, herbaceous, amber, cedar, musk) and the accords/sizes (fresh, citrus, fruity; green m and floral s rendered as "subtle"); no performance or comparison claims; no numbers. Left unchanged.
- fragrantica = null (OK).

## Open issues for orchestrator
1. Identity rests on the saved page alone: search is 403-blocked AND the researcher's `candidates` is empty, so there is no search-side confirmation that no other "Vibration" release by Bujairami exists. Page evidence is strong (exact house/name, only one vibration slug among 30 house links), so I did not fail it, but re-run `search "Bujairami Vibration"` and `search "Vibration"` once Cloudflare clears and populate `candidates`.
2. Everything downstream should treat this bottle as thin-data: 47 scent votes, 43 for the other ratings, charts 21-35 votes.
