# french-avenue-vulcan-feu — VERDICT: PASS-WITH-FIXES
Checked: 2026-10-17 19:33 AEST. Fresh re-fetch of https://www.parfumo.com/Perfumes/french-avenue/feu not possible: Parfumo returned HTTP 403 "Just a moment..." (Cloudflare) on the single probe allowed by the addendum, so verification was done against the SAVED SOURCE: raw/french-avenue-vulcan-feu.page.html + .chart.html (both mtime 17 Oct 19:24). Checked two ways: `tools/parfumo_fetch.py parse raw/french-avenue-vulcan-feu` (current, bug-fixed parser) and an independent tag-strip regex pass. The two agree with each other; vs the json exactly 1 field diff (gender_label, see Flags).

## Identity: PASS — identity judged sound
- Parfumo's name for this bottle is "Feu": `<title>` "Feu by French Avenue » Reviews & Perfume Facts"; `<h1>` "Feu French Avenue 2025"; BreadcrumbList pos3 "French Avenue", pos4 "Feu"; og:title "Feu by French Avenue".
- "Vulcan" is the collection, confirmed on the page in three places: meta description "Vulcan | Feu French Avenue: Popular fruity-sweet new Fragrance Release from 2025"; Interesting Facts "The fragrance is part of the Vulcan collection."; and the header text region renders "Vulcan Feu French Avenue 2025" (Parfumo prints the collection label directly above the name). The on-page reviews also call it "Vulcan Feu" (5 mentions). Header: "A new perfume by French Avenue for women and men, released in 2025"; "Ranked 208 in Unisex Perfume".
- Conclusion: the saved page is the bottle the user calls "French Avenue Vulcan Feu" — same house, 2025, collection "Vulcan", name "Feu". identity.name "Feu" is Parfumo's canonical name and matchCheck already explains the Vulcan/Feu split correctly.
- Alternatives: search endpoint also 403 and the researcher recorded candidates = [], so the "no better-matching release" check rests on the saved page only. No other "Feu" or Vulcan-collection release is linked from the page.

## Numbers: PASS — 0 discrepancies
Traced to saved page text: overall 8.0 / 1,216 (itemprop ratingValue 8.0, ratingCount 1216); Scent 8.0 / 1,216; Longevity 7.8 / 1,140; Sillage 7.7 / 1,130; Bottle 7.7 / 1,126; Value for money 8.9 / 1,107; Reviews 93, Statements 307, Photos 18; "Submitted by Skrwail, updated on 17/10/2026"; year 2025; no concentration word in header region (null correct).
Traced to saved chart HTML: Type Synthetic 6 / Creamy 8 / Citrus 14 / Fresh 20 / Fruity 28 / Sweet 24 — 864 votes; Occasion Sport 8 / Business 10 / Evening 11 / Night Out 15 / Leisure 30 / Daily 25 — 776; Season Fall 11 / Spring 41 / Summer 48 — 537; Audience & Style Masculine 59 / Feminine 41 / Modern 93 / Classic 7 — 571. All identical to json.
Main accords Fruity(l) Sweet(l) Fresh(l) Citrus(m) Creamy(s) match.
Vote drift: none measurable (same fetch as the researcher's; fresh fetch blocked).

## Notes: PASS
Page: Top Notes Mango, Ginger, Lemon, Rhubarb | Heart Notes Jasmine, Pink pepper, Praliné, Violet | Base Notes Ambergris, Cedarwood, Moss, Tonka bean. Grouping and spelling identical to json.

## Flags/summary discipline: PASS after fixes
- FIXED (known parser bug): page says "for women and men" (2 occurrences), "unisex"/"Unisex" (3); json said "for women". Set identity.genderLabel and parfumo.data.gender_label to "for women and men".
- FIXED: dropped flag "gender_label is 'for women' (not 'for men')" — it was based entirely on the wrong label. Remaining flags: ["no concentration_hint"]. Verified by reload that only identity.genderLabel, parfumo.data.gender_label and flags changed.
- Lowest vote count is 537 → no <30 flags needed.
- scentSummary uses notes + accords (fruity-sweet, fresh, citrus) only. The closing phrase "for warmth and depth" describes the base notes, not performance; judged acceptable, flagged here in case a stricter reading is wanted.
- fragrantica null. No number in the json that is not on the saved page (candidates is empty, ambiguity null).

## Open issues for orchestrator
- Minor: candidates = [] because the researcher recorded no search results and search is now blocked, so no cross-check against other releases was possible beyond the saved page. Identity is nonetheless well supported by the page itself (collection text + header + meta).
- Optional (not changed, editorial not mechanical): identity.matchCheck could cite the on-page "part of the Vulcan collection" fact instead of only the meta description.
