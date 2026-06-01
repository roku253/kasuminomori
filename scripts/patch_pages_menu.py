# -*- coding: utf-8 -*-
import os
import re

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

def patch(path):
    full = os.path.join(ROOT, path.replace("/", os.sep))
    if not os.path.isfile(full):
        return
    with open(full, "r", encoding="utf-8") as f:
        html = f.read()
    orig = html
    html = re.sub(r'\s*<div data-city-include="tools"></div>\s*', "\n", html)
    if "city-menu.js" not in html and "site-include.js" in html:
        html = html.replace(
            '<script src="',
            '<script src="',
            1,
        )
        html = re.sub(
            r'(<script src="[^"]*site-include\.js"[^>]*></script>)',
            r'\1\n<script src="' + menu_src(path) + 'city-menu.js" defer></script>',
            html,
            count=1,
        )
    if html != orig:
        with open(full, "w", encoding="utf-8", newline="\n") as f:
            f.write(html)
        print("patched", path)

def menu_src(rel_path):
    rel_dir = os.path.dirname(rel_path).replace("\\", "/")
    if not rel_dir:
        return "./"
    return "../" * len([p for p in rel_dir.split("/") if p]) + "js/"

def main():
    for dirpath, _, files in os.walk(ROOT):
        if "scripts" in dirpath or "partials" in dirpath:
            continue
        for f in files:
            if f.endswith(".html"):
                rel = os.path.relpath(os.path.join(dirpath, f), ROOT).replace("\\", "/")
                patch(rel)

if __name__ == "__main__":
    main()
