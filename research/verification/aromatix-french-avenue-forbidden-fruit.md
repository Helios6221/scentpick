# aromatix-french-avenue-forbidden-fruit — VERDICT: PASS-WITH-FIXES
Checked: 2026-10-17 19:37, re-fetch attempted https://www.parfumo.com/Perfumes/french-avenue/forbidden-fruit → HTTP 403 Cloudflare challenge.
Verified against the researcher's SAVED source (raw/<id>.page.html + raw/<id>.chart.html), not a fresh fetch: Parfumo returned HTTP 403 / title "Just a moment..." (Cloudflare challenge) on one fresh attempt at 19:32; search endpoint also 403. Not re-attempted per the no-hammer instruction. Saved page mtime 2026-10-17 19:24, chart mtime 2026-10-17 19:24.
Offline re-parse with the current parser (`parse raw/<id>`) and a tool-independent regex pass over the stripped HTML both used.

## Identity: PASS — <title> "Forbidden Fruit by French Avenue » Reviews & Perfume Facts"; h1 "Forbidden Fruit" + brand link French Avenue + Release_Years/2025; breadcrumb position 3 "French Avenue", position 4 "Forbidden Fruit".
The Aromatix link is evidenced ON THE SAVED PAGE, not assumed: (1) a collection label directly above the h1, `<a href=".../Perfumes/french-avenue?col_id=9107">Aromatix</a>`; (2) meta description "Aromatix | Forbidden Fruit French Avenue: ..."; (3) "Interesting Facts: The fragrance is part of the Aromatix collection."; (4) two on-page reviews call it "Aromatix Forbidden Fruit". Parfumo models Aromatix as a French Avenue *collection* (col_id 9107), not a separate house — consistent with the user's "Aromatix × French Avenue Forbidden Fruit". Search was 403-blocked; the researcher's single candidate (121 votes) equals the page, and nothing on the page points to another Forbidden Fruit release (no concentration selector in the h1, no sibling variant in "My suggestion").
Gender: page text reads "A new perfume by French Avenue for women and men, released in 2025" with a fa-venus-mars icon; "unisex" appears only inside user reviews/statements.

## Numbers: PASS — zero discrepancies against the saved page.
- overall 7.8 / 121 (itemprop ratingValue 7.8, ratingCount 121) ✓
- Scent 7.8/121, Longevity 7.9/110, Sillage 7.8/108, Bottle 8.4/105, Value for money 8.5/98 ✓ (page text "Scent 7.8 121 Ratings ... Value for money 8.5 98 Ratings")
- Type: Spicy 6, Synthetic 7, Fresh 10, Floral 13, Citrus 13, Fruity 26, Sweet 24 — 99 votes ✓
- Occasion: Business 10, Daily 18, Night Out 22, Leisure 26, Evening 24 — 78 votes ✓
- Season: Winter 10, Fall 27, Spring 33, Summer 30 — 70 votes ✓
- Audience & Style: Masculine 50, Feminine 50, Modern 96, Classic 4 — 59 votes ✓
- counts Reviews 7 / Statements 32 / Photos 9 ✓; Submitted by MartialScent, updated 15/10/2026 ✓; year 2025 ✓; candidates[0].scent_votes 121 = page ✓
- No vote drift (saved source is the same file the researcher used, so none possible).

## Notes: PASS — Top: Blood orange, Bergamot, Cardamom; Heart: Margarita, Peach, Red apple, Rose; Base: Amber, Benzoin, Cedarwood, Musk, Sandalwood, Vanilla absolute — grouping matches the page's "Top Notes / Heart Notes / Base Notes" text exactly. Main accords independently re-extracted from the s-circle markup: Fruity l, Sweet l, Floral m, Citrus m, Fresh s — match.

## Flags/summary discipline: PASS after fixes
- FIXED gender-label parser bug: identity.genderLabel and parfumo.data.gender_label "for women" → "for women and men" (page: "for women and men"). No flag depended on the old label.
- FIXED (precision, not a number): identity.matchCheck now cites the three on-page Aromatix evidences and says "collection" (Parfumo's term) instead of "collaboration".
- Thin-data flags: smallest vote count is 59 (Audience & Style) — nothing under 30, no flag needed. Existing flag "concentration_hint is null" kept (page shows no concentration).
- scentSummary uses only notes + accords (fruity/sweet/floral/citrus), no performance or comparison claims ✓. fragrantica null ✓. No number in the json that is not on the page ✓.
- Note: file re-dumped with indent=1 per brief (was indent=2) — whitespace-only change elsewhere; field-level diff confirmed only genderLabel, gender_label, matchCheck changed.

## Open issues for orchestrator
none (verification was against saved source, not a fresh fetch — a fresh re-fetch when Cloudflare lifts would only show vote drift).
