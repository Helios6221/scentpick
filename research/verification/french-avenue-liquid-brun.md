# french-avenue-liquid-brun — VERDICT: PASS-WITH-FIXES
Checked: 2026-10-17 19:33 AEST. Fresh re-fetch of https://www.parfumo.com/Perfumes/french-avenue/liquid-brun not possible: Parfumo returned HTTP 403 "Just a moment..." (Cloudflare) on the single probe allowed by the addendum, so verification was done against the SAVED SOURCE: raw/french-avenue-liquid-brun.page.html + .chart.html (both mtime 17 Oct 19:24). Checked two ways: `tools/parfumo_fetch.py parse raw/french-avenue-liquid-brun` (current, bug-fixed parser) and an independent tag-strip regex pass. The two agree with each other; vs the json there was exactly 1 field diff (gender_label, see Flags).

## Identity: PASS
- Saved page IS the 2024 original: `<title>` "Liquid Brun by French Avenue » Reviews & Perfume Facts"; `<h1>` "Liquid Brun French Avenue 2024"; URL slug /liquid-brun; BreadcrumbList pos3 "French Avenue", pos4 "Liquid Brun"; header "A popular perfume by French Avenue for women and men, released in 2024"; "Ranked 45 in Unisex Perfume". No "Limited Edition" in title/h1/breadcrumb.
- Both releases confirmed from the page itself: it links to the sibling https://www.parfumo.com/Perfumes/french-avenue/liquid-brun-limited-edition (the 2025 Limited Edition in candidates[1]). User wording "French Avenue Liquid Brun" carries no edition, so the 2024 base release is the correct pick; the 2025 LE is recorded in candidates/ambiguity.
- House "French Avenue" matches. Search endpoint also 403, so alternatives judged from saved page + researcher's two candidates; nothing else named Liquid Brun is linked from the page.

## Numbers: PASS — 0 discrepancies
Traced to saved page text: overall 8.4 / 2,590 (itemprop ratingValue 8.4, ratingCount 2590); Scent 8.4 / 2,590; Longevity 8.4 / 2,470; Sillage 8.1 / 2,472; Bottle 7.2 / 2,445; Value for money 9.3 / 2,424; Reviews 158, Statements 562, Photos 26; "Submitted by Aqua99, updated on 17/10/2026"; year 2024; no concentration word in header region (null correct).
Traced to saved chart HTML: Type Woody 6 / Oriental 10 / Spicy 15 / Creamy 19 / Sweet 26 / Gourmand 24 — 1,675 votes; Occasion Business 7 / Daily 13 / Leisure 18 / Evening 32 / Night Out 31 — 1,391; Season Spring 12 / Fall 42 / Winter 46 — 1,071; Audience & Style Masculine 69 / Feminine 31 / Modern 79 / Classic 21 — 968. All identical to json.
Main accords Sweet(l) Gourmand(l) Creamy(l) Spicy(m) Oriental(s) match.
Vote drift: none measurable (same fetch as the researcher's; fresh fetch blocked).

## Notes: PASS
Page: Top Notes Orange blossom, Cardamom, Cinnamon, Bergamot | Heart Notes Bourbon vanilla, Elemi resin | Base Notes Praliné, Gaiac wood, Musk, Ambroxan. Grouping and spelling identical to json.

## Flags/summary discipline: PASS after fix
- FIXED (known parser bug): page says "for women and men" (2 occurrences) and "Unisex"; json said "for women". Set identity.genderLabel and parfumo.data.gender_label to "for women and men". Verified by reload that only those two paths changed. No flag depended on the old label, so none dropped.
- Lowest vote count is 968 → no <30 flags needed.
- scentSummary uses notes + accords (sweet-gourmand, creamy-spicy) only; no performance/comparison claims.
- fragrantica null. Flags: ["concentration_hint null"] — appropriate.
- Numbers not on the perfume page: candidates[].scent_votes 2579 and 655, and the same two numbers in `ambiguity`, come from the researcher's search snapshot (page shows 2,590 for the base; 11-vote drift plausible). The LE's 655 cannot be re-verified now (search blocked, LE page not saved). Labelled as search candidates, so not a failure.

## Open issues for orchestrator
none.
