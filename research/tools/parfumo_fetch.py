#!/usr/bin/env python3
"""Fetch a Parfumo perfume page (plus its community charts) with a plain HTTP client
and print structured JSON.  No browser needed.

Usage:
  parfumo_fetch.py search "<query>"                 -> candidate perfume URLs from Parfumo search
  parfumo_fetch.py page <url> [--raw-prefix PATH]   -> JSON with identity, notes, ratings, charts
                                                       (saves <PATH>.page.html and <PATH>.chart.html)
  parfumo_fetch.py parse <PATH>                       -> same JSON, parsed OFFLINE from <PATH>.page.html + <PATH>.chart.html
Never invents numbers: anything not found is null.
"""
import sys, re, json, time, random, html as htmlmod, urllib.request, urllib.parse, http.cookiejar

UA = ("Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 "
      "(KHTML, like Gecko) Version/17.0 Safari/605.1.15")
import subprocess, tempfile, os
COOKIES = tempfile.NamedTemporaryFile(prefix="parfumo_cj_", suffix=".txt", delete=False).name

def get(url, data=None, referer=None, tries=4):
    """Fetch with curl (urllib's TLS fails on this machine). Returns (status, final_url, body)."""
    for i in range(tries):
        cmd = ["curl", "-sL", "-A", UA, "-H", "Accept-Language: en-US,en;q=0.9",
               "-b", COOKIES, "-c", COOKIES, "--max-time", "45",
               "-w", "\n__STATUS__%{http_code}__URL__%{url_effective}"]
        if data is not None:
            cmd += ["-H", "X-Requested-With: XMLHttpRequest", "--data", data]
            if referer:
                cmd += ["-H", "Referer: " + referer]
        cmd.append(url)
        r = subprocess.run(cmd, capture_output=True, text=True)
        body, _, tail = r.stdout.rpartition("\n__STATUS__")
        m = re.match(r"(\d+)__URL__(.*)", tail or "")
        st = int(m.group(1)) if m else 0
        final = m.group(2) if m else url
        if st in (200, 404) and body:
            return st, final, body
        time.sleep(1.5 + random.random() * 2 + i * 2)
    return st, final, body if st else ""

def strip(s):
    s = re.sub(r"<[^>]+>", " ", s)
    s = htmlmod.unescape(s)
    return re.sub(r"\s+", " ", s).strip()

def num(s):
    return int(s.replace(",", "").replace(".", "")) if s else None

def search(q):
    url = "https://www.parfumo.com/s_perfumes_x.php?" + urllib.parse.urlencode({"in": 1, "filter": q})
    st, final, h = get(url)
    out = {"query": q, "status": st, "results": []}
    seen = set()
    for blk in re.split(r'<div class="name">', h)[1:]:
        blk = blk[:3000]
        m = re.search(r'<a href="(https://www\.parfumo\.com/Perfumes/[^/"]+/[^/"?#]+)">(.*?)</a>', blk, re.S)
        if not m or m.group(1) in seen:
            continue
        seen.add(m.group(1))
        br = re.search(r'class="brand">.*?<a href="[^"]*">(.*?)</a>', blk, re.S)
        yr = re.search(r'Release_Years/(\d{4})', blk)
        av = re.search(r'av_scent">\s*([\d.]+)\s*<span class="tv">.*?</i>\s*([\d,]+)', blk, re.S)
        gender = "men" if "fa-mars" in blk and "fa-venus" not in blk else ("women" if "fa-venus" in blk and "fa-mars" not in blk else ("unisex/both" if "fa-" in blk else None))
        out["results"].append({"url": m.group(1), "name": strip(m.group(2)), "brand": strip(br.group(1)) if br else None,
                               "year": int(yr.group(1)) if yr else None,
                               "scent_avg": float(av.group(1)) if av else None, "scent_votes": num(av.group(2)) if av else None,
                               "gender_icon": gender})
    return out

def parse_page(h, final_url):
    out = {"url": final_url, "fetched": time.strftime("%Y-%m-%d")}
    t = re.search(r"<title>(.*?)</title>", h, re.S)
    out["title"] = strip(t.group(1)) if t else None
    out["is_404"] = out["title"] == "404"
    out["no_ratings_text"] = bool(re.search(r"No ratings yet", h, re.I))
    h1 = re.search(r"<h1[^>]*>(.*?)</h1>", h, re.S)
    out["h1_text"] = strip(h1.group(1)) if h1 else None
    md = re.search(r'<meta name="description" content="([^"]*)"', h)
    out["meta_description"] = htmlmod.unescape(md.group(1)) if md else None
    # breadcrumb: brand + name
    bc = re.search(r'"@type":"BreadcrumbList".*?\]\}', h, re.S)
    out["brand"] = out["name"] = None
    if bc:
        items = re.findall(r'"position":(\d+),"name":"(.*?)"', bc.group(0))
        d = {int(p): htmlmod.unescape(n) for p, n in items}
        out["brand"], out["name"] = d.get(3), d.get(4)
    yr = re.search(r"\b(19|20)\d{2}\b", out["h1_text"] or "")
    out["year"] = int(yr.group(0)) if yr else None
    # concentration / gender hints from the header region (first 60k chars after h1)
    head = h[h.find("<h1"): h.find("<h1") + 60000] if "<h1" in h else h[:60000]
    con = re.search(r"(Extrait de Parfum|Eau de Parfum Intense|Eau de Parfum|Eau de Toilette|Eau de Cologne|Parfum|Extrait)\b", strip(head[:8000]))
    out["concentration_hint"] = con.group(1) if con else None
    gm = re.search(r"\bfor (women and men|men and women|men|women)\b", (out["meta_description"] or "") + " " + strip(head[:8000]), re.I)
    out["gender_label"] = gm.group(0) if gm else None
    # overall
    rv = re.search(r'itemprop="ratingValue"[^>]*>\s*([\d.]+)', h)
    rc = re.search(r'itemprop="ratingCount" content="(\d+)"', h)
    out["overall"] = {"avg": float(rv.group(1)) if rv else None, "votes": int(rc.group(1)) if rc else None}
    # category ratings
    keymap = {"scent": "scent", "durability": "longevity", "sillage": "sillage", "bottle": "bottle", "pricing": "value"}
    ratings = {}
    for m in re.finditer(r'class="rating-item rating-details[^"]*" data-type="(\w+)"', h):
        blk = h[m.end(): m.end() + 2500]
        sc = re.search(r'rating-score[^>]*>\s*([\d.]+)', blk)
        ct = re.search(r'rating-count[^>]*>\s*([\d,.]+)\s*Ratings?', blk)
        k = keymap.get(m.group(1), m.group(1))
        ratings[k] = {"avg": float(sc.group(1)) if sc else None, "votes": num(ct.group(1)) if ct else None}
    out["ratings"] = ratings
    # main accords: coloured circles, size class l/m/s = strength
    acc = []
    for m in re.finditer(r'<div class="s-circle (s-circle_\w)[^"]*"[^>]*></div><div class="text-xs grey">(.*?)</div>', h, re.S):
        acc.append({"accord": strip(m.group(2)), "size": m.group(1).replace("s-circle_", "")})
    out["main_accords"] = acc or None
    # notes: group by pyramid headings if present
    notes = {}
    blocks = re.split(r'(?i)(?=<[^>]+class="[^"]*pyramid_block)', h)
    if len(blocks) > 1:
        for b in blocks[1:]:
            hd = re.search(r"(Top Notes?|Heart Notes?|Middle Notes?|Base Notes?)", strip(b[:3000]), re.I)
            ns = [strip(x) for x in re.findall(r'<span class="clickable_note_img[^"]*"[^>]*>(.*?)</span>', b, re.S)]
            ns = [n for n in ns if n]
            if ns:
                k = (hd.group(1).split()[0].lower() if hd else "unknown").replace("middle", "heart")
                notes.setdefault(k, []).extend(ns)
    if not notes:
        flat = [strip(x) for x in re.findall(r'<span class="clickable_note_img[^"]*"[^>]*>(.*?)</span>', h, re.S)]
        flat = [n for n in flat if n]
        if flat:
            notes["flat"] = list(dict.fromkeys(flat))
    out["notes"] = notes or None
    # counts
    cnts = {}
    for k in ("reviews", "statements", "photos"):
        cm = re.search(r'action_tab_%s"[^>]*>\s*<span>[^<]*<span[^>]*>(\d+)' % k, h)
        cnts[k] = int(cm.group(1)) if cm else 0
    out["counts"] = cnts
    sub = re.search(r"Submitted by (.+?), updated on ([\d/.]+)", strip(h[-200000:]))
    out["submitted"] = {"by": sub.group(1), "updated": sub.group(2)} if sub else None
    # chart params
    cp = re.search(r'get_classification_chart\.php",\{type:type,p:(\d+),h:\'([0-9a-f]+)\',csrf_key:\'([a-z0-9]+)\'', h)
    out["_chart_params"] = {"p": cp.group(1), "h": cp.group(2), "csrf_key": cp.group(3)} if cp else None
    return out

def parse_chart(ch):
    txt = strip(ch)
    groups = {}
    # split by group titles
    parts = re.split(r"\b(Type|Occasion|Season|Audience & Style)\b", txt)
    cur = None
    for part in parts:
        if part in ("Type", "Occasion", "Season", "Audience & Style"):
            cur = part.lower().replace(" & ", "_").replace(" ", "_")
            groups[cur] = {"pct": {}, "votes": None}
            continue
        if cur is None:
            continue
        for lab, pct in re.findall(r"([A-Za-z][A-Za-z \-]*?)\s(\d+)%", part):
            groups[cur]["pct"][lab.strip()] = int(pct)
        vm = re.search(r"([\d,]+)\s+Votes?", part)
        if vm:
            groups[cur]["votes"] = num(vm.group(1))
    return groups

def page(url, raw_prefix=None):
    st, final, h = get(url)
    time.sleep(0.5 + random.random())
    out = {"http_status": st}
    if not h:
        out["error"] = "empty response"
        return out
    if raw_prefix:
        open(raw_prefix + ".page.html", "w").write(h)
    out.update(parse_page(h, final))
    cp = out.pop("_chart_params", None)
    out["charts"] = None
    out["chart_raw_votes_text"] = None
    if cp and not out["is_404"]:
        data = urllib.parse.urlencode({"type": "pie", **cp})
        cst, _, ch = get("https://www.parfumo.com/action/perfume/get_classification_chart.php", data=data, referer=final)
        if ch:
            if raw_prefix:
                open(raw_prefix + ".chart.html", "w").write(ch)
            out["charts"] = parse_chart(ch)
            out["chart_raw_text"] = strip(ch)[:1200]
        else:
            out["charts_error"] = "chart endpoint returned status %s" % cst
    return out

def parse_saved(prefix):
    h = open(prefix + ".page.html", encoding="utf-8", errors="ignore").read()
    out = {"parsed_offline_from": prefix + ".page.html"}
    out.update(parse_page(h, None))
    out.pop("_chart_params", None)
    try:
        ch = open(prefix + ".chart.html", encoding="utf-8", errors="ignore").read()
        out["charts"] = parse_chart(ch)
        out["chart_raw_text"] = strip(ch)[:1200]
    except FileNotFoundError:
        out["charts"] = None
    return out

if __name__ == "__main__":
    a = sys.argv[1:]
    if not a or a[0] not in ("search", "page", "parse"):
        print(__doc__); sys.exit(1)
    if a[0] == "parse":
        print(json.dumps(parse_saved(a[1]), indent=1, ensure_ascii=False)); sys.exit(0)
    if a[0] == "search":
        print(json.dumps(search(" ".join(a[1:])), indent=1, ensure_ascii=False))
    else:
        rp = None
        if "--raw-prefix" in a:
            i = a.index("--raw-prefix"); rp = a[i + 1]; a = a[:i] + a[i + 2:]
        print(json.dumps(page(a[1], rp), indent=1, ensure_ascii=False))
