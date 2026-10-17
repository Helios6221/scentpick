# afnan-supremacy-collectors-edition — VERDICT: PASS
Checked: 2026-10-17 19:33 AEST. Fresh re-fetch of https://www.parfumo.com/Perfumes/Afnan_Perfumes/supremacy-collector-s-edition attempted ONCE (single curl) → HTTP 403, title "Just a moment..." (Cloudflare challenge), so per the addendum verification was done against the SAVED SOURCE: raw/afnan-supremacy-collectors-edition.page.html + .chart.html (both mtime 17 Oct 19:24). Checked two ways: `tools/parfumo_fetch.py parse raw/afnan-supremacy-collectors-edition` (current parser) and an independent tag-strip regex pass over the same HTML. Both agree with each other and with the json on every field (0 field diffs).

## Identity: PASS
- `<title>` "Supremacy Collector's Edition by Afnan Perfumes » Reviews & Perfume Facts"; `<h1>` "Supremacy Collector's Edition Afnan Perfumes 2024"; BreadcrumbList pos3 "Afnan Perfumes", pos4 "Supremacy Collector's Edition"; header text "A popular perfume by Afnan Perfumes for men, released in 2024"; "Ranked 102 in Men's Perfume"; Interesting Facts "The fragrance is part of the Supremacy collection." → house, name, year 2024, genderLabel "for men" all trace to the page. User wording "Afnan Supremacy Collector's Edition" matches exactly (house spelled "Afnan Perfumes" on Parfumo — same house).
- Alternatives: search endpoint also 403, so judged from the saved page + researcher's single candidate. Same-house Supremacy siblings linked from the page: Supremacy Not Only Intense, Supremacy Incense, Supremacy in Oud, Supremacy Silver, Supremacy in Heaven — none is a Collector's Edition variant; no "Limited Edition"/concentration variant text on the page. No better match seen.

## Numbers: PASS — 0 discrepancies
Traced to saved page text: overall 8.2 / 1,390 (itemprop ratingValue 8.2, ratingCount 1390); Scent 8.2 / 1,390; Longevity 8.4 / 1,295; Sillage 8.2 / 1,293; Bottle 8.1 / 1,270; Value for money 9.0 / 1,262; Reviews 98, Statements 285, Photos 17; "Submitted by Skrwail, updated on 17/10/2026"; year 2024; no concentration word in the header region (concentration_hint null is correct).
Traced to saved chart HTML: Type Floral 5 / Smoky 5 / Spicy 5 / Sweet 12 / Woody 14 / Fruity 23 / Fresh 18 / Citrus 16 — 1,039 votes; Occasion Sport 9 / Night Out 14 / Evening 15 / Business 18 / Daily 24 / Leisure 20 — 1,051; Season Winter 17 / Fall 27 / Spring 29 / Summer 27 — 867; Audience & Style Masculine 97 / Feminine 3 / Modern 81 / Classic 19 — 509. All identical to json.
Vote drift: none measurable (saved page is the same fetch the researcher used; fresh fetch blocked).
Main accords Fruity(l) Fresh(l) Citrus(m) Woody(m) Sweet(m) match the page's s-circle markup.

## Notes: PASS
Page: Top Notes Pineapple, Apple, Bergamot, White blossoms | Heart Notes Birch, Amber, Orange blossom | Base Notes Ambergris, Musk, Oakmoss. Grouping and spelling identical to json.

## Flags/summary discipline: PASS — nothing to fix
- Lowest vote count anywhere is 509 (Audience & Style) → no <30 flags needed.
- scentSummary uses only notes and accords (fruity/fresh/woody); no performance or comparison claims.
- fragrantica is null. Flags: ["concentration_hint: null"] — appropriate.
- Only number not on the perfume page: candidates[0].scent_votes = 1387, which came from the researcher's search result (page shows 1,390; 3-vote drift between search snapshot and page is plausible). Labelled as a search candidate, so not treated as a failure; cannot be re-verified now because search is blocked.

## Open issues for orchestrator
none (note: all checks were against the saved source, not a fresh fetch, and the search cross-check could not be run).
