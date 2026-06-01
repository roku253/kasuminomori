# -*- coding: utf-8 -*-
"""Wrap legacy pages with city site shell."""
import os
import re

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

FILES = [
    ("guide/index.html", "../", "町のご案内", "bunka/"),
    ("access/index.html", "../", "アクセス・地図", "kurashi/"),
    ("events/index.html", "../", "年間行事", "bunka/"),
    ("contact/index.html", "../", "お問い合わせ", "shisei/"),
    ("spot/1/index.html", "../../", "霞ノ杜神社", "bunka/"),
    ("spot/2/index.html", "../../", "杜の吊り橋", "bunka/"),
    ("spot/3/index.html", "../../", "霞ノ杜資料館", "bunka/"),
    ("spot/4/index.html", "../../", "霧見展望休憩所", "bunka/"),
    ("spot/5/index.html", "../../", "杜の湯", "bunka/"),
    ("history/index.html", "../", "町の歴史", "bunka/"),
    ("documents/index.html", "../", "資料室", "shisei/"),
    ("blog/2021/index.html", "../../", "2021年ローカルニュース", "shisei/"),
    ("blog/2016/index.html", "../../", "2016年アーカイブ", "shisei/"),
]

HEAD_TMPL = '''<!DOCTYPE html>
<html lang="ja">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>{title}｜霞ノ杜町</title>
  <link rel="canonical" href="https://roku253.github.io/kasuminomori/{canonical}">
  <link rel="stylesheet" href="{base}css/city-common.css">
  <link rel="stylesheet" href="{base}css/city-gate.css">
  <link rel="stylesheet" href="{base}css/style.css">
  <link rel="stylesheet" href="{base}css/mobile.css">
  {extra_style}
  <script src="{base}js/kasumi-gate-head.js"></script>
  <script src="{base}{tg}" defer></script>
</head>
<body class="city-body">
<div id="site-root">
  <div data-city-include="header"></div>
  <div class="city-page-wrap city-legacy-wrap">
'''

FOOT_TMPL = '''
  </div>
  <div data-city-include="footer"></div>
</div>
<script src="{base}js/site-include.js" data-base="{base}" defer></script>
<script src="{base}js/city-menu.js" defer></script>
<script src="{base}js/mobile.js" defer></script>
<script src="{base}js/kasumi-footprint.js" defer></script>
{extra_script}
</body>
</html>
'''

BREAD = '''    <nav class="city-breadcrumb" aria-label="パンくず">
      <a href="{base}">トップ</a> &nbsp;›&nbsp;
      <a href="{base}{cat}">{cat_label}</a> &nbsp;›&nbsp; {page}
    </nav>
'''

def wrap(path, base, page_title, cat):
    full = os.path.join(ROOT, path.replace("/", os.sep))
    with open(full, "r", encoding="utf-8") as f:
        html = f.read()
    cat_label = {"bunka/": "文化・観光", "kurashi/": "くらし・環境", "shisei/": "市政情報"}.get(cat, "文化・観光")
    extra_style = ""
    m = re.search(r"<style>([\s\S]*?)</style>", html)
    if m and ("ns-denied" in m.group(1) or "photo-zoom" in m.group(1) or "#site-root" in m.group(1)):
        # keep page-specific styles only
        styles = []
        for sm in re.finditer(r"<style>([\s\S]*?)</style>", html):
            block = sm.group(1)
            if "ns-denied-overlay" in block:
                continue
            if "#site-root" in block and "visibility" in block:
                continue
            styles.append(block)
        if styles:
            extra_style = "<style>\n" + "\n".join(styles) + "\n</style>"
    extra_script = ""
    scripts = re.findall(r"<script>([\s\S]*?)</script>", html)
    for sc in scripts:
        if "KN_FP_KEY" in sc or "photo-zoom" in sc.lower() or "knPurged" in sc:
            extra_script += "<script>\n" + sc + "\n</script>\n"
    # extract wrap content
    body_m = re.search(r"<body[^>]*>([\s\S]*)</body>", html, re.I)
    if not body_m:
        return
    body = body_m.group(1)
    start = body.find('<div class="wrap">')
    inner = None
    if start >= 0:
        start += len('<div class="wrap">')
        end = body.find('<footer class="site-footer">')
        if end < 0:
            end = body.find('<p class="kn-print-error"')
        if end < 0:
            end = body.find('</div>\n  </div>\n  <script')
        if end > start:
            inner = body[start:end]
    if inner is None:
        if "location.replace" in html or 'http-equiv="refresh"' in html:
            print("skip redirect", path)
            return
        print("skip inner", path)
        return
    inner = re.sub(r'<header class="site-header">[\s\S]*?</header>\s*', '', inner)
    inner = re.sub(r'<nav class="breadcrumb">[\s\S]*?</nav>\s*', '', inner)
    inner = re.sub(r'<footer class="site-footer">[\s\S]*?</footer>\s*', '', inner)
    inner = re.sub(r'<p class="kn-print-error"[\s\S]*?</p>\s*', '', inner)
    tg = base + "token-gate.js"
    if "../../" in tg and base.count("../") == 1:
        tg = "../token-gate.js"
    canonical = path.replace("/index.html", "/")
    out = HEAD_TMPL.format(title=page_title, base=base, tg=tg, extra_style=extra_style, canonical=canonical)
    out += '    <div class="wrap city-legacy-inner">\n'
    out += BREAD.format(base=base, cat=cat, cat_label=cat_label, page=page_title)
    out += inner
    out += "    </div>\n"
    out += FOOT_TMPL.format(base=base, extra_script=extra_script)
    with open(full, "w", encoding="utf-8", newline="\n") as f:
        f.write(out)
    print("wrapped", path)

def main():
    for path, base, title, cat in FILES:
        wrap(path, base, title, cat)

if __name__ == "__main__":
    main()
