# rayhaan-jungle-vibe — VERDICT: PASS-WITH-FIXES
Checked: 2026-10-17 19:38 AEST, re-fetched https://www.parfumo.com/Perfumes/rayhaan/jungle-vibe — the fresh fetch returned HTTP 403 Cloudflare challenge (title "Just a moment..."), tried once only per addendum. Verification was therefore done against the SAVED source: raw/rayhaan-jungle-vibe.page.html (107486 bytes) + raw/rayhaan-jungle-vibe.chart.html (10619 bytes), both mtime 17 Oct 19:24. Method: offline re-parse with the current bug-fixed parser (`parfumo_fetch.py parse raw/rayhaan-jungle-vibe`) plus a tool-independent tag-stripped text check and raw-HTML greps (title, h1, JSON-LD breadcrumb, gender phrase, s-circle classes). The useless 403 challenge page saved as raw/rayhaan-jungle-vibe.verify.page.html was deleted.

## Identity: PASS — `<title>` "Jungle Vibe by Rayhaan » Reviews & Perfume Facts"; `<h1>` "Jungle Vibe Rayhaan 2025"; JSON-LD breadcrumb Home > Brands > Rayhaan > Jungle Vibe; page text "A new perfume by Rayhaan for women and men, released in 2025". Parfumo search is blocked (HTTP 403) so step 5 could not be re-run; the researcher's `candidates` list is empty (matchCheck says an exact match was found but no candidate was recorded — cosmetic gap, no numbers involved). The Rayhaan brand module on the saved pages lists 24 releases; the only "Vibe" names are Jungle Vibe, Tropical Vibe and Vanilla Vibe, so the user wording "Jungle Vibe" is unambiguous; no edition/concentration variant seen.

## Numbers: PASS — every value traced to the saved page/chart text:
- overall 7.9 / 147 (page: "7.9 147 Ratings") OK; scent 7.9/147 OK; longevity 7.4/128 OK; sillage 7.1/128 OK; bottle 7.6/126 OK; value 8.8/116 OK
- counts reviews 11 / statements 42 / photos 4 OK; submitted Sentique, updated 13/10/2026 OK; year 2025 OK; brand Rayhaan OK; name Jungle Vibe OK
- Type chart: Sweet 6, Aquatic 10, Fruity 11, Woody 11, Citrus 16, Green 24, Fresh 23 — 152 votes OK
- Occasion: Evening 7, Night Out 9, Sport 15, Business 18, Daily 26, Leisure 25 — 136 votes OK
- Season: Winter 4, Fall 13, Summer 40, Spring 42 — 89 votes OK
- Audience & Style: Masculine 57, Feminine 43, Modern 91, Classic 9 — 94 votes OK
- No numeric discrepancies.

## Notes: PASS — Main accords Green (l), Fresh (l), Citrus (m), Fruity (s), Woody (s) confirmed from the s-circle classes in the raw HTML. The page has a "Fragrance Notes" flat list (no pyramid): Green notes, Bergamot, Fig, Grapefruit, Citrus notes, Sandalwood — the json `notes.flat` matches exactly, and the "no pyramid (flat notes only)" flag is correct.

## Flags/summary discipline: PASS after fixes —
- FIXED `identity.genderLabel: json="for women" page="for women and men" → set to "for women and men"`
- FIXED `parfumo.data.gender_label: json="for women" page="for women and men" → set to "for women and men"` (the known parser bug; the current parser's offline re-parse of the same saved page also yields "for women and men")
- FIXED `flags`: dropped "gender_label: for women (not for men)" because it rested on the wrong label. Remaining flags: "no pyramid (flat notes only)", "concentration_hint null".
- Smallest vote count is 89, so no thin-data flag is required. scentSummary uses only accords (green, fresh, citrus, woody) and notes (bergamot, fig, grapefruit); no numbers, no performance or comparison claims. fragrantica is null.
- JSON rewritten in place with json.dump(indent=1, ensure_ascii=False); id, userName, candidates, ambiguity, fragrantica, scentSummary, issues, ratings, overall and charts re-read after the write and unchanged.

## Open issues for orchestrator: none blocking. Verified against the saved source (Cloudflare 403 on fresh fetch; search blocked). Minor cosmetic: `candidates` is empty although matchCheck claims a search match.
