#!/usr/bin/env python3
"""Compile research/bottles/*.json (verified community data) + data/curation.json (judgement layer)
into docs/data/collection.json, the file the app ships with.  Run from repo root:  python3 scripts/build_collection.py"""
import json, glob, os, sys, datetime
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
bottles = []
cur = {}
cp = os.path.join(ROOT, "data", "curation.json")
if os.path.exists(cp):
    cur = json.load(open(cp))
for f in sorted(glob.glob(os.path.join(ROOT, "research", "bottles", "*.json"))):
    r = json.load(open(f))
    p = (r.get("parfumo") or {}).get("data") or {}
    ident = r.get("identity") or {}
    c = cur.get(r["id"], {})
    bottles.append({
        "id": r["id"],
        "name": c.get("displayName") or ident.get("name") or r["userName"],
        "house": c.get("displayHouse") or ident.get("house"),
        "userName": r["userName"],
        "year": ident.get("year"),
        "concentration": c.get("concentration") or ident.get("concentration"),
        "genderLabel": ident.get("genderLabel"),
        "notes": p.get("notes"),
        "accords": p.get("main_accords"),
        "scentSummary": c.get("scentSummary") or r.get("scentSummary"),
        "community": {
            "source": "Parfumo",
            "url": (r.get("parfumo") or {}).get("url"),
            "retrieved": (r.get("parfumo") or {}).get("retrieved"),
            "ratings": p.get("ratings"),
            "charts": p.get("charts"),
        },
        "fragrantica": r.get("fragrantica"),
        "flags": r.get("flags") or [],
        "manual": c.get("manual"),           # user/orchestrator tags for bottles without community data
        "profile": c.get("profile", {}),     # judgement layer: see data/curation.json
        "notesOnFit": c.get("notesOnFit"),
        "aka": c.get("aka"),
    })
out = {"generated": datetime.date.today().isoformat(), "bottles": bottles}
os.makedirs(os.path.join(ROOT, "docs", "data"), exist_ok=True)
json.dump(out, open(os.path.join(ROOT, "docs", "data", "collection.json"), "w"), indent=1, ensure_ascii=False)
print("wrote docs/data/collection.json with", len(bottles), "bottles")
