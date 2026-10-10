"""ハザードマップの出来上がりを検査する（npm run hazard:build の最後に呼ばれる。単独でも実行できる）。

  python scripts/hazard/verify.py

見ること（受け入れ条件 H1〜H7・K-01/K-03/K-04/K-25 のうち、手元で確かめられるもの）:
  PDF   … A3 横・1ページ・5MB 以下、地図の画像は 300dpi 以上、Title/Author/作成日は作中の値、Creator・Producer なし、
          XMP あり、/Lang ja、DisplayDocTitle、%%EOF 1回、禁止キーなし、フォントはすべて埋め込み、
          出典・加工・OpenStreetMap・作成年月・誤認防止の一文がある、地図の文字が二重に取り出されない、
          避難所の名称と ○× が config と同じ
  画像  … Web 用 1920px 以上、拡大用 A3 全体 2400px 以上、ページに書いた寸法・容量と実物が同じ
  ページ … bodyHtml が config から作った最新のもの（page.mjs）、避難所の表の名称・○× が config と同じ、
          data-pdf で PDF にリンク、地区検索（hazard-area）なし、物語のページ（資料室・町の歴史・過去の記事）へのリンクなし
  語    … config・ページ・PDF に禁止語（霞会館・杉並ヶ岡・三日月町・旧整備区域・揺れやすい・避難勧告・孤塚・架空 など）が無い。
          町名・地区は正本表の語だけ。立入禁止区域の文に年・人数（数字）が無い
  その他 … 旧 SVG（public/img/hazard-map.svg・map.svg）が無く、どこからも参照されない。pdf-meta.json が実物と一致
"""
import hashlib
import json
import pathlib
import re
import sys
from html.parser import HTMLParser

import fitz  # PyMuPDF
from PIL import Image
from pypdf import PdfReader

sys.stdout.reconfigure(encoding="utf-8")
HERE = pathlib.Path(__file__).resolve().parent
ROOT = HERE.parents[1]
CONFIG = json.loads((HERE / "config.json").read_text(encoding="utf-8"))
PDF = ROOT / "public" / "pdf" / "hazard-map.pdf"
WEB_IMG = ROOT / "public" / "img" / "hazard" / "hazard-map.webp"
A3_IMG = ROOT / "public" / "img" / "hazard" / "hazard-map-a3.jpg"
PAGE = ROOT / "src" / "content" / "pages" / "anzen-hazard.json"
PDF_META = ROOT / "src" / "generated" / "pdf-meta.json"

# 正本表（統合案 v1 §1-5・world 3.3）
TOWNS = ["三日月中央", "三日月北", "成沢", "狐塚", "木戸", "西木戸", "駅前", "大萩", "箕浦", "柳川", "筒川", "湖畔", "大字杜ケ丘"]
DISTRICTS = {"三日月": ["三日月中央", "三日月北", "成沢"], "湖畔": ["湖畔", "西木戸", "大萩", "狐塚"],
             "駅前": ["駅前", "木戸", "筒川", "柳川", "箕浦"], "杜ケ丘": ["大字杜ケ丘", "烏啼"]}
FORBIDDEN = ["霞会館", "杉並ヶ岡", "三日月町", "旧整備区域", "北西部", "揺れやすい", "避難勧告", "孤塚", "霞ヶ丘", "架空", "フィクション",
             "謎解き", "2019", "令和元年", "伝承", "児童", "負傷", "事故", "黒塗り", "資料室", "防災課", "危機管理係", "三日月庁舎", "広報誌",
             "市政", "0123-", "霞ノ杜小学校", "（試作）"]
STORY_HREF = re.compile(r"documents|history|blog|archive|gikai|chiiki-anzen", re.I)
REQUIRED_SOURCE = ["国土交通省", "ハザードマップポータルサイト", "重ねるハザードマップ", "加工して作成", "国土数値情報",
                   "© OpenStreetMap contributors", "OpenMapTiles", "OpenFreeMap"]

problems = []


def check(ok, msg):
    if not ok:
        problems.append(msg)


def squash(s):
    return re.sub(r"\s+", "", s)


def fmt_bytes(n):  # src/lib/content/pdf-links.ts の formatBytes と同じ
    return f"{n / 1048576:.1f}MB" if n >= 1048576 else f"{max(1, round(n / 1024))}KB"


class Tables(HTMLParser):
    """HTML の表をセルの文字の配列にする"""

    def __init__(self):
        super().__init__()
        self.tables, self.row, self.cell = [], None, None

    def handle_starttag(self, tag, attrs):
        if tag == "table":
            self.tables.append([])
        elif tag == "tr":
            self.row = []
        elif tag in ("td", "th") and self.row is not None:
            self.cell = []

    def handle_endtag(self, tag):
        if tag in ("td", "th") and self.cell is not None:
            self.row.append(squash("".join(self.cell)))
            self.cell = None
        elif tag == "tr" and self.row is not None:
            self.tables[-1].append(self.row)
            self.row = None

    def handle_data(self, data):
        if self.cell is not None:
            self.cell.append(data)


def all_strings(o):
    if isinstance(o, str):
        yield o
    elif isinstance(o, dict):
        for k, v in o.items():
            if k != "$comment":
                yield from all_strings(v)
    elif isinstance(o, list):
        for v in o:
            yield from all_strings(v)


def main() -> None:
    C = CONFIG
    M = C["meta"]

    # ---- 語・正本表（config）
    cfg_text = "\n".join(all_strings(C))
    for w in FORBIDDEN:
        check(w not in cfg_text, f"config に禁止語「{w}」")
    for t in C["towns"]:
        check(t["name"] in TOWNS, f"config の町名「{t['name']}」が正本表にない")
        check(t["name"] in DISTRICTS.get(t["district"], []), f"町名「{t['name']}」の地区「{t['district']}」が正本表と違う")
    check(sorted(t["name"] for t in C["towns"]) == sorted(TOWNS), "地図の町名が正本表の13とそろっていない")
    for d in C["districts"]:
        check(DISTRICTS.get(d["name"]) == d["towns"], f"地区「{d['name']}」の町名が正本表と違う")
    for s in C["shelters"] + [C["hq"]]:
        check(s["town"] in TOWNS and s["town"] in DISTRICTS[s["district"]], f"避難所「{s['name']}」の所在・地区が正本表と合わない")
    ban_text = C["ban"]["name"] + C["ban"]["reason"]
    check(not re.search(r"[0-9０-９年人名]", ban_text), "立入禁止区域の文に年・人数らしい語がある")

    # ---- PDF
    raw = PDF.read_bytes()
    check(len(raw) <= 5 * 1048576, f"PDF が 5MB を超える（{len(raw)}）")
    check(raw.count(b"%%EOF") == 1, "PDF の %%EOF が1回でない")
    for key in (b"/JavaScript", b"/EmbeddedFile", b"/OCProperties", b"/Thumb", b"/ActualText", b"/Prev"):
        check(key not in raw, f"PDF に {key.decode()}")
    hit = re.search(rb"Chrom|Skia|Playwright|Puppeteer|Headless|pdf-lib|wkhtmltopdf|ReportLab|MuPDF|pypdf|Next\.js|Claude|Cursor", raw, re.I)
    check(hit is None, f"PDF にツール名らしい語 {hit.group(0) if hit else ''}")
    reader = PdfReader(str(PDF))
    meta = reader.metadata or {}
    check(meta.get("/Title") == M["title"], f"PDF の Title: {meta.get('/Title')}")
    check(meta.get("/Author") == M["publisher"], f"PDF の Author: {meta.get('/Author')}")
    want_date = "D:" + M["creationDate"][:10].replace("-", "")
    check(str(meta.get("/CreationDate", "")).startswith(want_date), f"PDF の作成日: {meta.get('/CreationDate')}")
    check("/Creator" not in meta and "/Producer" not in meta, "PDF に Creator / Producer が残っている")
    xmp = reader.xmp_metadata
    check(xmp is not None and (xmp.dc_title or {}).get("x-default") == M["title"], "PDF の XMP の題名")
    root = reader.trailer["/Root"]
    check(str(root.get("/Lang")) == "ja", "PDF の /Lang が ja でない")
    vp = root.get("/ViewerPreferences")
    check(vp is not None and bool(vp.get_object().get("/DisplayDocTitle")), "DisplayDocTitle が true でない")
    for page in reader.pages:
        for a in page.get("/Annots") or []:
            check(a.get_object().get("/Subtype") == "/Link", "リンク以外の注釈がある")

    doc = fitz.open(PDF)
    check(doc.page_count == 1, f"PDF のページ数 {doc.page_count}")
    pg = doc[0]
    w, h = pg.rect.width, pg.rect.height
    check(abs(w - 1190.55) <= 1 and abs(h - 841.89) <= 1, f"PDF の用紙が A3 横でない（{w:.2f}x{h:.2f}pt）")
    for f in pg.get_fonts(full=True):
        check(f[1] != "n/a", f"埋め込まれていないフォント {f[3]}")
    imgs = pg.get_images(full=True)
    check(len(imgs) >= 1, "PDF に地図の画像がない")
    big = max(imgs, key=lambda i: i[2] * i[3])
    bbox = pg.get_image_bbox(big)
    dpi = min(big[2] / (bbox.width / 72), big[3] / (bbox.height / 72))
    check(dpi >= 299, f"地図の画像が 300dpi 未満（{dpi:.0f}dpi）")
    text = pg.get_text()
    flat = squash(text)
    for word in REQUIRED_SOURCE + [M["made"], M["title"]]:
        check(squash(word) in flat, f"PDF に「{word}」が無い")
    check(squash(C["disclaimer"]) in flat, "PDF に誤認防止の一文が無い")
    for wd in FORBIDDEN:
        check(wd not in flat, f"PDF に禁止語「{wd}」")
    # 地図の文字が二重に取り出されないこと（縁取りを画像に焼き込んだので、各ラベルは1回ずつ）
    map_text = squash(pg.get_text(clip=bbox))
    labels = [t["name"] for t in C["towns"]] + [l["name"] for l in C["labels"]] + [s["short"] for s in C["shelters"]] + [C["hq"]["short"]]
    joined = "|".join(labels)
    for t in TOWNS:
        exp = joined.count(t)
        got = map_text.count(t)
        check(got == exp, f"地図の「{t}」の取り出し回数 {got}（期待 {exp}）")
    # 避難所の表（PDF 右欄）: 名称と ○×
    words = pg.get_text("words")
    side = [wd for wd in words if wd[0] > bbox.x1]
    for s in C["shelters"]:
        first = s["name"].split(" ")[0]
        hits = [wd for wd in side if wd[4] == first]
        check(len(hits) == 1, f"PDF の表に「{s['name']}」が1行ない（{len(hits)}）")
        if hits:
            y = (hits[0][1] + hits[0][3]) / 2
            marks = [wd[4] for wd in sorted(side, key=lambda q: q[0]) if abs((wd[1] + wd[3]) / 2 - y) < 3 and wd[4] in ("○", "×")]
            check(marks == [s["flood"], s["dosha"], s["quake"]], f"PDF の表の ○× が違う: {s['name']} {marks}")

    # ---- 画像
    with Image.open(WEB_IMG) as im:
        web_size = im.size
    with Image.open(A3_IMG) as im:
        a3_size = im.size
    check(web_size[0] >= 1920, f"Web 用の画像が小さい {web_size}")
    check(a3_size[0] >= 2400, f"拡大用の画像が 2400px 未満 {a3_size}")

    # ---- ページ
    page = json.loads(PAGE.read_text(encoding="utf-8"))
    body = page.get("bodyHtml", "")
    page_text = "\n".join(all_strings(page))
    for wd in FORBIDDEN:
        check(wd not in page_text, f"ページに禁止語「{wd}」")
    check("hazard-area" not in json.dumps(page, ensure_ascii=False), "ページに地区検索（hazard-area）が残っている")
    check("hazard-map.svg" not in json.dumps(page), "ページに旧 SVG の参照")
    check('data-pdf="hazard-map.pdf"' in body, "PDF へのリンク（data-pdf）が無い")
    check(f'src="/img/hazard/{WEB_IMG.name}" width="{web_size[0]}" height="{web_size[1]}"' in body, "地図の画像の寸法がページと実物で違う")
    check(f'href="/img/hazard/{A3_IMG.name}"' in body and f"・{fmt_bytes(A3_IMG.stat().st_size)}）" in body, "拡大用の画像のリンクか容量の表示が実物と違う")
    for word in REQUIRED_SOURCE + [M["made"]]:
        check(squash(word) in squash(body), f"ページに「{word}」が無い")
    check(C["disclaimer"] in body, "ページに誤認防止の一文が無い")
    hrefs = re.findall(r'href="([^"]+)"', body) + [r["href"] for r in page.get("related", [])]
    for href in hrefs:
        check(not STORY_HREF.search(href), f"物語・資料室のページへのリンク: {href}")
    parser = Tables()
    parser.feed(body)
    rows = [r for r in (parser.tables[0] if parser.tables else []) if r and r[0] not in ("番号",)]
    by_no = {r[0]: r for r in rows}
    for s in C["shelters"]:
        r = by_no.get(s["no"])
        check(r is not None and r[1] == squash(s["name"]) and r[3:6] == [s["flood"], s["dosha"], s["quake"]],
              f"ページの表が config と違う: {s['no']} {s['name']} {r}")
    check(len(parser.tables) == 2 and len(parser.tables[1]) == 1 + len(C["districts"]), "地区別の見方の表が4地区でない")

    # ---- 旧 SVG・pdf-meta
    for old in ("public/img/hazard-map.svg", "public/img/map.svg"):
        check(not (ROOT / old).exists(), f"{old} が残っている")
    pat = re.compile(r"hazard-map\.svg|img/map\.svg")
    for base in ("src", "public", "scripts", "e2e"):
        for p in (ROOT / base).rglob("*"):
            if p.is_file() and p.suffix in (".json", ".ts", ".tsx", ".js", ".mjs", ".cjs", ".css", ".html", ".md", ".py") and "node_modules" not in p.parts:
                if p.resolve() == pathlib.Path(__file__).resolve():
                    continue
                if pat.search(p.read_text(encoding="utf-8", errors="ignore")):
                    problems.append(f"旧 SVG の参照: {p.relative_to(ROOT).as_posix()}")
    pm = json.loads(PDF_META.read_text(encoding="utf-8"))["files"].get(PDF.name)
    check(pm is not None and pm["bytes"] == len(raw) and pm["sha256"] == hashlib.sha256(raw).hexdigest() and pm["paper"] == "A3" and pm["pages"] == 1,
          "pdf-meta.json の hazard-map.pdf が実物と違う（python scripts/pdf/meta.py）")

    print(f"verify: PDF {len(raw)} bytes {w:.2f}x{h:.2f}pt 地図 {big[2]}x{big[3]}px（{dpi:.0f}dpi）、Web {web_size}、A3 {a3_size}、"
          f"表 {len(rows)} 行、地区 {len(parser.tables[1]) - 1 if len(parser.tables) > 1 else 0}")
    if problems:
        print(f"verify: 問題 {len(problems)} 件")
        for p in problems:
            print("  - " + p)
        sys.exit(1)
    print("verify: ok")


if __name__ == "__main__":
    main()
