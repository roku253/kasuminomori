# -*- coding: utf-8 -*-
import os
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
BASE = "https://roku253.github.io/kasuminomori/"
SKIP = ("scripts", "partials", "_template")
urls = set()
for dirpath, _, files in os.walk(ROOT):
    parts = dirpath.replace(ROOT, "").replace("\\", "/").strip("/").split("/")
    if parts and parts[0] in SKIP:
        continue
    for f in files:
        if not f.endswith(".html"):
            continue
        rel = os.path.relpath(os.path.join(dirpath, f), ROOT).replace("\\", "/")
        if rel.startswith("spot/") and f != "index.html" and "/" not in rel.replace("spot/", "").replace(f, ""):
            # spot/1.html redirects - skip root spot/*.html if any
            if rel in ("spot/1.html", "spot/2.html", "spot/3.html", "spot/4.html", "spot/5.html"):
                continue
        url = BASE + rel.replace("index.html", "").replace(".html", "/" if f == "index.html" else "")
        if f.endswith(".html") and f != "index.html":
            url = BASE + rel.replace(".html", "/") if not rel.endswith("index.html") else url
            # kurashi/gomi.html -> kurashi/gomi/ for clean URLs? GitHub pages serves .html directly
            url = BASE + rel  # keep .html for non-index pages on gh pages
        if f == "index.html":
            url = BASE + rel.replace("index.html", "")
        else:
            url = BASE + rel
        urls.add(url)
xml = ['<?xml version="1.0" encoding="UTF-8"?>',
       '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">']
for u in sorted(urls):
    pri = "1.0" if u.rstrip("/").endswith("kasuminomori") or u.endswith("kasuminomori/") else "0.8"
    if u.endswith("kasuminomori/"):
        pri = "1.0"
    xml.append("  <url><loc>%s</loc><changefreq>monthly</changefreq><priority>%s</priority></url>" % (u, pri))
xml.append("</urlset>")
with open(os.path.join(ROOT, "sitemap.xml"), "w", encoding="utf-8") as f:
    f.write("\n".join(xml) + "\n")
print(len(urls), "urls")
