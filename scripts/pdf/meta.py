"""public/pdf/*.pdf を全部調べ、src/generated/pdf-meta.json を書く（手元で実行する。PyMuPDF が要る）。

  npm run pdf:meta    （= python scripts/pdf/meta.py）

- 1ファイルごとに: 容量（bytes）・sha256・ページ数・用紙（A4 / A3 / それ以外は null）・各ページの寸法（pt）・PDF の Title。
- 出力は内容が同じなら同じバイト列になる（生成日時は入れない）。PDF を足したり作り直したりしたら必ず実行してコミットする。
- ビルド（CI）では Python を使わず、scripts/check-pdf.mjs が「public/pdf と pdf-meta.json の容量・sha256 が一致し、
  登録漏れ・孤児が無い」ことだけを確かめる。ページ JSON の data-pdf は scripts/build-manifest.mjs が pdf-meta.json と照合する。
"""
import hashlib
import json
import pathlib
import re
import sys

try:
    import fitz  # PyMuPDF
except ImportError:  # pragma: no cover
    sys.exit("PyMuPDF が見つかりません（pip install pymupdf）")

ROOT = pathlib.Path(__file__).resolve().parents[2]
PDF_DIR = ROOT / "public" / "pdf"
OUT = ROOT / "src" / "generated" / "pdf-meta.json"

# 用紙（pt）。向きは問わない。±3pt まで同じとみなす
PAPERS = {"A4": (595.28, 841.89), "A3": (841.89, 1190.55)}


def paper_of(width: float, height: float):
    short, long_ = sorted((width, height))
    for name, (w, h) in PAPERS.items():
        if abs(short - w) <= 3 and abs(long_ - h) <= 3:
            return name
    return None


def main() -> None:
    files = {}
    for path in sorted(PDF_DIR.glob("*.pdf")):
        data = path.read_bytes()
        with fitz.open(stream=data, filetype="pdf") as doc:
            sizes = [[round(page.rect.width, 2), round(page.rect.height, 2)] for page in doc]
            files[path.name] = {
                "bytes": len(data),
                "sha256": hashlib.sha256(data).hexdigest(),
                "pages": doc.page_count,
                "paper": paper_of(*sizes[0]) if sizes else None,
                "pageSizes": sizes,
                "title": (doc.metadata or {}).get("title") or "",
            }
    OUT.parent.mkdir(parents=True, exist_ok=True)
    text = json.dumps({"files": files}, ensure_ascii=False, indent=2) + "\n"
    # 寸法の組 [幅, 高さ] は1行にする（読みやすさのため）
    text = re.sub(r"\[\s+(-?[\d.]+),\s+(-?[\d.]+)\s+\]", r"[\1, \2]", text)
    old =OUT.read_text(encoding="utf-8") if OUT.exists() else None
    if old != text:
        OUT.write_text(text, encoding="utf-8", newline="\n")
    # 端末の文字コードに左右されないよう、表示は英数字だけにする
    print(f"pdf-meta: {len(files)} files ({'updated' if old != text else 'unchanged'}) -> {OUT.relative_to(ROOT).as_posix()}")


if __name__ == "__main__":
    main()
