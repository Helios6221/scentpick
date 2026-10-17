# Verification brief (you did NOT do the research; check it)

Goal: every number and the bottle identity in `research/bottles/<id>.json` must be traceable to the Parfumo page for the
EXACT bottle. Work from `/Users/jamesnoye/Desktop/scentpick/research`. Use Bash (`cat`, `python3`), not WebFetch.

For each bottle assigned to you:

1. `cat bottles/<id>.json`.
2. Re-fetch independently: `python3 tools/parfumo_fetch.py page "<parfumo.url from the json>" --raw-prefix raw/<id>.verify`
3. Tool-independent check of the raw HTML (so a parser bug cannot rubber-stamp itself). Example:
   `python3 - <<'PY'
   import re,html
   for f in ["raw/<id>.verify.page.html","raw/<id>.verify.chart.html"]:
       t=re.sub(r"\s+"," ",html.unescape(re.sub(r"<[^>]+>"," ",open(f,encoding="utf-8",errors="ignore").read())))
       for pat in [r".{0,60}Ratings.{0,20}", r"Top Notes.{0,200}", r"Heart Notes.{0,200}", r"Base Notes.{0,200}", r"Type .{0,400}Votes", r"Occasion .{0,300}Votes", r"Season .{0,200}Votes", r"Audience.{0,200}Votes"]:
           for m in re.findall(pat,t)[:6]: print(f.split('/')[-1][:12], "|", m)
   PY`
   Also check `<title>` and `<h1>` text (brand, name, year) with a grep on the raw page.
4. Compare EVERY value in the json against what you see: overall avg/votes; scent, longevity, sillage, bottle, value
   avg + votes; notes (and top/heart/base grouping); year; brand; name; every chart percentage and vote count.
   Vote counts may have drifted by a few since the research fetch — that is fine; note it, don't fail it.
5. Identity: run `python3 tools/parfumo_fetch.py search "<name>"` (and a second query with the house) and confirm there is no
   other release that better matches the user's wording (e.g. Extrait vs Eau de Parfum, Collector's Edition vs regular,
   different year). Confirm the house matches (Parfumo may spell it differently — judge whether it is the same house).
6. Flags discipline: every vote count under 30 must be flagged; `scentSummary` must only use notes/accords/type chart (no
   performance or comparison claims); no number anywhere in the json that is not on the page; `fragrantica` must be null
   unless it has a method label saying how it was obtained.

Fix policy: if a problem is purely mechanical and unambiguous (vote-count drift you can confirm from the fresh fetch, a
missing thin-data flag, a wrong grouping of notes, a scentSummary that breaks the rules), FIX the json in place (python
json load/dump, indent=1, ensure_ascii=False) and record the fix. If the problem is identity (wrong release, wrong house,
ambiguous name) or a number you cannot trace, do NOT guess — record it as a FAIL for the orchestrator.

Write `verification/<id>.md`:
```
# <id> — VERDICT: PASS | PASS-WITH-FIXES | FAIL
Checked: <date/time>, re-fetched <url>
## Identity: PASS/FAIL — one or two sentences (alternatives seen in search, if any)
## Numbers: PASS/FAIL — list each discrepancy as `field: json=X page=Y → action`
## Notes: PASS/FAIL
## Flags/summary discipline: PASS/FAIL — what you fixed
## Open issues for orchestrator (or 'none')
```
Return to the orchestrator: max 5 lines per bottle: verdict, identity result, number of discrepancies and the worst one,
fixes applied, open issues.

## IMPORTANT addendum (2026-10-17 19:30): Parfumo is currently serving a Cloudflare challenge (HTTP 403 "Just a moment...")
to fresh fetches from this machine after the research burst. Do NOT hammer it and do NOT try to bypass the challenge.
Procedure instead:
- Try the fresh fetch in step 2 ONCE. If `http_status` is 403 / title "Just a moment...", fall back to the saved source:
  `python3 tools/parfumo_fetch.py parse raw/<id>` re-parses the researcher's saved raw/<id>.page.html + raw/<id>.chart.html
  offline with the CURRENT (bug-fixed) parser. Do the tool-independent text check (step 3) on those same saved files.
- The saved HTML is the page the researcher actually used; verify identity (title/h1/breadcrumb/notes) and every number against it.
- Record in the verdict whether verification was against a fresh fetch or the saved source, with the file's mtime (`ls -l`).
- Known parser bug fixed after research: `gender_label` was "for women" whenever the page said "for women and men". Re-derive
  gender_label from the saved page text (grep "for women and men" / "for men" / "for women") and FIX identity.genderLabel and
  parfumo.data.gender_label in the json if wrong; drop any flag that was based on the wrong label.
- Search (step 5) may also be blocked; if so, judge identity from the saved page + the researcher's `candidates`, and say so.
