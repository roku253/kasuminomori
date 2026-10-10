"""描画の結果を、サイトに置く形に仕上げる（npm run hazard:build の中で呼ばれる）。

  python scripts/hazard/finish.py

入力（render.mjs の出力）: .cache/out/a3-raw.pdf、.cache/out/web.png
出力:
  public/pdf/hazard-map.pdf             … A3 横1ページ。文書情報・XMP を作中の値にし、ツール名を消す（pdf_post.py）
  public/img/hazard/hazard-map.webp     … Web 用の地図（地図＋出典帯。1920px 幅＝表示 960px の2倍）
  public/img/hazard/hazard-map-a3.jpg   … 拡大用の A3 全体（最終 PDF を 200dpi で画像化。PDF と同じ見た目）
  .cache/out/images.json                … 寸法と容量（page.mjs がページの記述に使う）
"""
import datetime as dt
import json
import pathlib
import sys

import fitz  # PyMuPDF
from PIL import Image

sys.stdout.reconfigure(encoding="utf-8")
HERE = pathlib.Path(__file__).resolve().parent
ROOT = HERE.parents[1]
sys.path.insert(0, str(HERE))
from pdf_post import finalize_pdf  # noqa: E402

OUT = HERE / ".cache" / "out"
PDF_DST = ROOT / "public" / "pdf" / "hazard-map.pdf"
IMG_DIR = ROOT / "public" / "img" / "hazard"
WEB_IMG = IMG_DIR / "hazard-map.webp"
A3_IMG = IMG_DIR / "hazard-map-a3.jpg"
MAX_PDF = 5 * 1024 * 1024


def main() -> None:
    cfg = json.loads((HERE / "config.json").read_text(encoding="utf-8"))
    m = cfg["meta"]
    created = dt.datetime.fromisoformat(m["creationDate"])
    PDF_DST.parent.mkdir(parents=True, exist_ok=True)
    info = finalize_pdf(OUT / "a3-raw.pdf", PDF_DST, title=m["title"], author=m["publisher"], subject=m["pdfSubject"],
                        keywords=m["pdfKeywords"], created=created, lang="ja")
    if info["bytes"] > MAX_PDF:
        sys.exit(f"hazard-map.pdf が 5MB を超えました（{info['bytes']} bytes）")
    print(f"pdf: {PDF_DST.relative_to(ROOT).as_posix()} {info['bytes']} bytes, Title={info['title']}, {info['created']}")

    IMG_DIR.mkdir(parents=True, exist_ok=True)
    # Web 用（地図＋出典帯）
    web = Image.open(OUT / "web.png").convert("RGB")
    web.save(WEB_IMG, "WEBP", quality=85, method=6)
    # 拡大用 A3 全体（最終 PDF から）
    with fitz.open(PDF_DST) as doc:
        pix = doc[0].get_pixmap(dpi=200)
        a3 = Image.frombytes("RGB", (pix.width, pix.height), pix.samples)
    a3.save(A3_IMG, "JPEG", quality=88, optimize=True, progressive=True)

    images = {
        "web": {"file": "img/hazard/" + WEB_IMG.name, "width": web.width, "height": web.height, "bytes": WEB_IMG.stat().st_size},
        "a3": {"file": "img/hazard/" + A3_IMG.name, "width": a3.width, "height": a3.height, "bytes": A3_IMG.stat().st_size},
        "pdf": {"file": "pdf/" + PDF_DST.name, "bytes": info["bytes"]},
    }
    (OUT / "images.json").write_text(json.dumps(images, ensure_ascii=False, indent=1), encoding="utf-8")
    for k, v in images.items():
        print(f"{k}: {v}")


if __name__ == "__main__":
    main()
