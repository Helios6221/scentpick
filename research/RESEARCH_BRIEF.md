# Research brief: ONE fragrance bottle -> ONE JSON file

You are collecting **aggregated community data for one exact bottle** for a personal "what should I wear today" app.
Copy numbers from the source. Never fill a gap from memory, from an individual review, or from the perfume this bottle
is "inspired by". If a number is not on the page, write `null` and say so in `flags`. Do not deliberate; this is mechanical.

## Tool (already tested — use it, do not write your own fetcher, do not use WebFetch on Parfumo, do not use browser tools)
Run from `/Users/jamesnoye/Desktop/PuntersTech/scentpick/research`:

1. Find the page:  `python3 tools/parfumo_fetch.py search "<name words>"`
   Prints candidates with brand, name, year, scent avg + votes, url. Try 1-3 different queries if needed
   (e.g. just the name; name + house; a distinctive word). Parfumo's house names can differ from the user's
   (e.g. "Afnan Perfumes" for Afnan; "Fragrance World" or "French Avenue" for French Avenue lines; "My Perfumes" for Arabiyat).
2. Fetch the page + charts:  `python3 tools/parfumo_fetch.py page "<url>" --raw-prefix raw/<id>`
   Prints JSON (title, h1_text, brand, name, year, concentration_hint, gender_label, overall, ratings{scent,longevity,
   sillage,bottle,value:{avg,votes}}, main_accords, notes{top/heart/base or flat}, counts, charts{type,occasion,season,
   audience_style:{pct,votes}}, chart_raw_text, no_ratings_text, is_404). It also saves raw/<id>.page.html and raw/<id>.chart.html.
   If `is_404` is true, `no_ratings_text` is true, `ratings` is empty, or `charts` is null: wait 5 s and re-run once; if still
   wrong, record exactly what came back in `issues`.
   Sanity check: `ratings.scent.avg` and `.votes` should match the search listing's scent avg/votes (small drift is fine).

## Identity check (before trusting the page)
Confirm house + name match the bottle you were given, including edition/concentration words ("Collector's Edition",
"Extrait", "Intense"). If the search shows MORE THAN ONE plausible release for this name (e.g. an EDP and an Extrait, or
two years), record ALL of them in `candidates` with their urls, pick the one that best matches the user's wording, and
describe the ambiguity in `ambiguity`. If nothing matches, set parfumo to null and say where you looked.

## Fragrantica (fallback only — usually blocked)
Only if the Parfumo page is missing or has fewer than 10 scent votes: try ONE `WebFetch` of the Fragrantica perfume page
(find it with WebSearch). If it returns a Cloudflare/"Just a moment" page, JS-only content, or anything you cannot read
numbers from, set `fragrantica: null` and add a flag. Any number you do record must say method "webfetch (model-extracted, unverified)".

## Output file: /Users/jamesnoye/Desktop/PuntersTech/scentpick/research/bottles/<id>.json
Write it with a Bash heredoc (`cat > file <<'EOF' ... EOF`). Exact shape:
{
  "id": "<id>",
  "userName": "<the user's wording>",
  "identity": {"house": "<as Parfumo lists it>", "name": "<as Parfumo lists it>", "year": null, "concentration": null,
               "genderLabel": "<gender_label from tool or null>",
               "matchCheck": "1-2 sentences: what you compared and whether house/name/edition match"},
  "candidates": [ {"brand": "", "name": "", "year": null, "url": "", "scent_votes": null} ],
  "ambiguity": null,
  "parfumo": {"url": "", "retrieved": "2026-10-17", "method": "curl via tools/parfumo_fetch.py",
              "data": { ...the tool's page JSON, UNCHANGED (paste the whole object)... }},
  "fragrantica": null,
  "scentSummary": "1-2 plain sentences on what it smells like, built ONLY from notes, main_accords and the Type chart. No hype, no performance claims, no comparisons to other perfumes.",
  "flags": ["one string per flag"],
  "issues": "retries, mismatches, odd output, or 'none'"
}

Flag rules (check EVERY vote count): under 30 votes = "thin", under 10 = "very thin". One flag per rating/chart that is thin,
e.g. "Parfumo season chart: 9 votes (very thin)". Also flag: missing charts, no pyramid (flat notes only), gender label other
than 'for men', `concentration_hint` null, and any mismatch between search-listing numbers and page numbers.

## Return to the orchestrator (max 8 lines, nothing else)
file path; Parfumo house/name/year matched? ; scent/longevity/sillage avg (votes); season chart votes; occasion chart votes;
ambiguity (or none); flags count + the most important flag; issues (or none).
