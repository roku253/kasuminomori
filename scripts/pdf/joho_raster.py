"""Typst で組んだ写しをスキャン画像にする。処理本体は to_scan_pdf.py。"""
import sys
from pathlib import Path

from to_scan_pdf import scan_pdf

NAMES = ["joho-p2.jpg", "joho-p3.jpg"]


def main(pdf_path: Path, out_dir: Path) -> None:
    pages = scan_pdf(pdf_path, out_dir)
    if len(pages) != 2:
        raise SystemExit(f"写しは2ページである必要があります（{len(pages)}）")
    for src, name in zip(pages, NAMES):
        dst = out_dir / name
        if src != dst:
            dst.write_bytes(src.read_bytes())
            src.unlink()
        print(dst)


if __name__ == "__main__":
    main(Path(sys.argv[1]), Path(sys.argv[2]))
