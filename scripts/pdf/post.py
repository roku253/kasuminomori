"""PDF の後処理と検査（scripts/pdf/build.mjs から呼ばれる。手元で実行。PyMuPDF・pypdf・Pillow が要る）。

  python scripts/pdf/post.py <spec.json>

spec.mode = "finalize":
  - 文書情報（Info）と XMP を作中の値にし、Creator・Producer などツールの痕跡を消す。DisplayDocTitle・/Lang ja。
    → scripts/hazard/pdf_post.py の finalize_pdf を**共有**して使う（ハザードマップと同じ処理）。
  - 検査（止める条件）: ページ数、全ページ A4 縦、フォントがすべて埋め込みで OFL の BIZ UDP だけ、
    mustContain（ページ指定可。空白・改行を除いて照合）、mustNotContain（文書全体）、仮の文字（1 行の中）、
    textlessPages（抽出できる文字 0・文字描画 0・フォント 0・全面画像 1 枚・黒帯の内側が一様な黒）、
    題名・説明・キーワードに事件の語が無いこと（tester K-08）、容量（既定 5MB）。
  - spec.shots があれば各ページを 110dpi の PNG にして置く（目で確かめる用）。
spec.mode = "scan":
  - 写しのページ画像（240dpi の PNG）をスキャンした紙のように整え、グレーの JPEG にする。
    黒帯は純黒のまま（ノイズを乗せない）。紙の地色・わずかな傾き・端の影・紙のゴミ（灰色の点）だけを足す。
"""
from __future__ import annotations

import datetime as dt
import json
import pathlib
import random
import re
import sys

import fitz  # PyMuPDF
from PIL import Image, ImageChops, ImageDraw, ImageFilter, ImageStat

sys.stdout.reconfigure(encoding="utf-8")
sys.stderr.reconfigure(encoding="utf-8")
HERE = pathlib.Path(__file__).resolve().parent
ROOT = HERE.parents[1]
sys.path.insert(0, str(ROOT / "scripts" / "hazard"))
import pdf_post  # noqa: E402  （WP5 の後処理を共有。ファイルは変えない）
from pdf_post import finalize_pdf  # noqa: E402
from pypdf import PdfReader  # noqa: E402

# しおり（アウトライン）の項目は兄弟の /Prev・/Next を持つので、生バイトの「/Prev」は増分保存の印にならない。
# 増分保存は「%%EOF が1回」（finalize_pdf が確かめる）と「トレーラーに /Prev が無い」（下の finalize で確かめる）で見る。
pdf_post.FORBIDDEN_KEYS = tuple(k for k in pdf_post.FORBIDDEN_KEYS if k != b"/Prev")

A4 = (595.28, 841.89)
META_FORBIDDEN = re.compile(r"負傷|搬送|神隠し|黒塗り|行方不明|失踪")


def meta_problems(label: str, s: str) -> list[str]:
    out = []
    if META_FORBIDDEN.search(s):
        out.append(f"{label} に事件の語: {META_FORBIDDEN.search(s).group(0)}")
    if re.search(r"(?<!交通)事故", s):
        out.append(f"{label} に「事故」")
    if re.search(r"児童[0-9０-９]+名|児童.{0,8}(負傷|搬送|事故|立入)", s):
        out.append(f"{label} に「児童」＋事件の語")
    return out


def squash(s: str) -> str:
    return re.sub(r"\s+", "", s)


def black_bar_stats(pix: fitz.Pixmap) -> tuple[int, float]:
    """黒（輝度16未満）の領域を 3px 削った内側の画素数と、その輝度の標準偏差"""
    img = Image.frombytes("RGB" if pix.n >= 3 else "L", (pix.width, pix.height), pix.samples).convert("L")
    mask = img.point(lambda v: 255 if v < 16 else 0)
    inner = mask.filter(ImageFilter.MinFilter(7))
    count = sum(1 for v in inner.getdata() if v)
    if not count:
        return 0, 0.0
    stat = ImageStat.Stat(img, inner)
    return count, stat.stddev[0]


def finalize(spec: dict) -> None:
    src, dst = pathlib.Path(spec["src"]), pathlib.Path(spec["dst"])
    m = spec["meta"]
    problems: list[str] = []
    for key in ("title", "subject", "keywords"):
        problems += meta_problems(key, m.get(key, ""))
    if problems:
        raise SystemExit("post.py: " + " / ".join(problems))
    created = dt.datetime.fromisoformat(m["created"])
    dst.parent.mkdir(parents=True, exist_ok=True)
    info = finalize_pdf(src, dst, title=m["title"], author=m["author"], subject=m.get("subject", ""), keywords=m.get("keywords", ""), created=created, lang="ja")

    if "/Prev" in PdfReader(str(dst)).trailer:
        problems.append("トレーラーに /Prev がある（増分保存）")
    font_re = re.compile(spec["fontPattern"])
    doc = fitz.open(dst)
    if doc.page_count != spec["pages"]:
        problems.append(f"ページ数 {doc.page_count}（予定 {spec['pages']}）")
    texts = []
    for i, page in enumerate(doc, start=1):
        w, h = page.rect.width, page.rect.height
        if abs(w - A4[0]) > 1.5 or abs(h - A4[1]) > 1.5:
            problems.append(f"p{i}: A4 縦でない（{w:.2f}×{h:.2f}pt）")
        for f in page.get_fonts(full=True):
            ext, basefont = f[1], f[3]
            if ext == "n/a":
                problems.append(f"p{i}: 埋め込まれていないフォント {basefont}")
            if not font_re.match(basefont):
                problems.append(f"p{i}: 想定外のフォント {basefont}（OFL の BIZ UDP 以外。字形が無く代わりのフォントで描かれた字がある）")
        text = page.get_text("text")
        texts.append(text)
        for ph in spec.get("placeholders", []):
            for line in text.splitlines():
                if ph in line:
                    problems.append(f"p{i}: 仮の文字「{ph}」: {line.strip()[:40]}")
    flat = [squash(t) for t in texts]
    whole = "".join(flat)
    for item in spec.get("mustContain", []):
        want = squash(item["text"])
        where = item.get("page")
        hay = flat[where - 1] if where else whole
        if want not in hay:
            problems.append(f"{'p' + str(where) if where else '本文'} に「{item['text']}」がない")
    for word in spec.get("mustNotContain", []):
        if squash(word) in whole:
            pages = [str(i + 1) for i, t in enumerate(flat) if squash(word) in t]
            problems.append(f"「{word}」がある（p{','.join(pages)}）")
    for n in spec.get("textlessPages", []):
        page = doc[n - 1]
        if squash(texts[n - 1]):
            problems.append(f"p{n}: 文字が抽出できる（{len(squash(texts[n - 1]))} 字）")
        if page.get_texttrace():
            problems.append(f"p{n}: 文字の描画がある")
        if page.get_fonts():
            problems.append(f"p{n}: フォントがある")
        infos = page.get_image_info(xrefs=True)
        if len(infos) != 1:
            problems.append(f"p{n}: 画像が {len(infos)} 枚（1 枚のはず）")
        else:
            r = fitz.Rect(infos[0]["bbox"]) & page.rect
            cover = r.get_area() / page.rect.get_area()
            if cover < 0.95:
                problems.append(f"p{n}: 画像がページの {cover:.0%} しか覆っていない")
            pix = fitz.Pixmap(doc, infos[0]["xref"])
            dpi = pix.width / (page.rect.width / 72)
            count, sd = black_bar_stats(pix)
            print(f"  p{n}: 画像 {pix.width}×{pix.height}px（{dpi:.0f}dpi）、黒帯の内側 {count} px・標準偏差 {sd:.2f}")
            if count == 0:
                problems.append(f"p{n}: 黒帯が見つからない")
            if sd >= 2:
                problems.append(f"p{n}: 黒帯の内側が一様でない（標準偏差 {sd:.2f}）")
    doc.close()
    size = dst.stat().st_size
    if size > spec["maxBytes"]:
        problems.append(f"容量 {size} bytes（上限 {spec['maxBytes']}）")
    if problems:
        raise SystemExit(f"post.py: {dst.name} の検査で {len(problems)} 件:\n  - " + "\n  - ".join(problems))

    chars = [len(f) for f in flat]
    print(f"  → {dst.relative_to(ROOT).as_posix()} {size:,} bytes, {len(flat)} ページ, 文字数/ページ {chars}, Title={info['title']}, {info['created']}")
    if spec.get("shots"):
        out = pathlib.Path(spec["shots"])
        out.mkdir(parents=True, exist_ok=True)
        with fitz.open(dst) as d:
            for i, page in enumerate(d, start=1):
                page.get_pixmap(dpi=110).save(out / f"p{i}.png")
        print(f"  確認用画像: {out}")


def scan(spec: dict) -> None:
    """写しのページ画像をスキャン風のグレー JPEG にする（黒帯は純黒のまま）"""
    rnd = random.Random(spec.get("seed", 1))
    img = Image.open(spec["src"]).convert("L")
    w, h = img.size
    paper = spec.get("paper", 243)
    # 紙の地色: 白を地色まで下げる（黒 0 は 0 のまま）
    img = img.point(lambda v: round(v * paper / 255))
    # わずかなにじみ
    img = img.filter(ImageFilter.GaussianBlur(spec.get("blur", 0.45)))
    # 傾き（地は紙の色で埋める）
    img = img.rotate(spec.get("angle", 0.25), resample=Image.BICUBIC, expand=False, fillcolor=paper)
    # 紙の濃淡（低い周波数の陰り）と、読み取り面の端の影
    shade = Image.new("L", (w, h), 0)
    sd = ImageDraw.Draw(shade)
    edge = spec.get("edge", "left")
    band = int(w * 0.02)
    for k in range(band):
        a = int(26 * (1 - k / band) ** 2)
        x = k if edge == "left" else w - 1 - k
        sd.line([(x, 0), (x, h)], fill=a)
    for k in range(int(h * 0.012)):
        a = int(14 * (1 - k / (h * 0.012)) ** 2)
        sd.line([(0, k), (w, k)], fill=max(a, 0))
    shade = shade.filter(ImageFilter.GaussianBlur(6))
    # 黒い部分には何も足さない（黒帯の内側を一様に保つ）
    black = img.point(lambda v: 255 if v < 16 else 0)
    img = Image.composite(img, ImageChops.subtract(img, shade), black)
    # 紙のゴミ（灰色の小さな点）。黒帯の上と、黒に近い色には置かない
    d = ImageDraw.Draw(img)
    for _ in range(spec.get("specks", 40)):
        x, y = rnd.randrange(w), rnd.randrange(h)
        if img.getpixel((x, y)) < 120:
            continue
        r = rnd.choice([1, 1, 1, 2])
        d.ellipse([x - r, y - r, x + r, y + r], fill=rnd.randrange(120, 190))
    img.save(spec["dst"], "JPEG", quality=spec.get("quality", 82), optimize=True, progressive=False, dpi=(spec["dpi"], spec["dpi"]))
    print(f"  写し: {pathlib.Path(spec['dst']).name} {w}×{h}px {pathlib.Path(spec['dst']).stat().st_size:,} bytes")


def main() -> None:
    spec = json.loads(pathlib.Path(sys.argv[1]).read_text(encoding="utf-8"))
    if spec["mode"] == "scan":
        scan(spec)
    else:
        finalize(spec)


if __name__ == "__main__":
    main()
