"""情報提供資料の2〜3ページ。文字は画像の中だけに描き、PDFから抽出できない。帯は一様な黒。"""
import sys
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont

W, H = 1985, 2808  # A4 @ 240dpi
BAR_H = 28
BAR_W = 900


def font(size):
    candidates = [
        Path(__file__).resolve().parents[0] / "fonts" / "bizudpgothic" / "BIZUDPGothic-Regular.ttf",
    ]
    for p in candidates:
        if p.exists():
            return ImageFont.truetype(str(p), size)
    return ImageFont.load_default()


def page(lines):
    im = Image.new("RGB", (W, H), "white")
    d = ImageDraw.Draw(im)
    f = font(42)
    y = 160
    x = 140
    for kind, text in lines:
        if kind == "bar":
            d.rectangle([x, y, x + BAR_W, y + BAR_H], fill=(0, 0, 0))
            y += BAR_H + 36
        elif kind == "gap":
            y += 28
        else:
            d.text((x, y), text, fill=(0, 0, 0), font=f)
            y += 64
    return im


def main(out_dir: Path):
    out_dir.mkdir(parents=True, exist_ok=True)
    p2 = page([
        ("t", "霞ノ杜町教育委員会"),
        ("t", "霞教第"),
        ("bar", ""),
        ("t", "令和元年8月"),
        ("bar", ""),
        ("gap", ""),
        ("t", "霞ノ杜町長　様"),
        ("t", "霞ノ杜町教育委員会教育長"),
        ("gap", ""),
        ("t", "件名　烏啼山道付近立入禁止区域における事案について（報告）"),
        ("gap", ""),
        ("t", "1　日時"),
        ("t", "令和元年8月"),
        ("bar", ""),
        ("t", "2　場所　烏啼山道付近（立入禁止区域内）"),
        ("t", "3　関係者"),
        ("bar", ""),
        ("bar", ""),
        ("bar", ""),
        ("t", "4　概要"),
        ("bar", ""),
        ("bar", ""),
        ("bar", ""),
        ("t", "…搬送された。"),
    ])
    p3 = page([
        ("t", "5　経過"),
        ("t", "8月"),
        ("bar", ""),
        ("bar", ""),
        ("t", "8月"),
        ("bar", ""),
        ("t", "保護者より事実確認の申し入れがあった。"),
        ("t", "（以下）"),
        ("bar", ""),
        ("bar", ""),
        ("gap", ""),
        ("t", "6　対応"),
        ("bar", ""),
        ("t", "立入禁止区域の柵及び看板を増設する"),
        ("gap", ""),
        ("t", "7"),
        ("t", "本件は事故として処理し、終了とする。"),
        ("gap", ""),
        ("t", "【7条1号】　【7条5号】"),
    ])
    a = out_dir / "joho-p2.jpg"
    b = out_dir / "joho-p3.jpg"
    p2.save(a, quality=90)
    p3.save(b, quality=90)
    print(a)
    print(b)


if __name__ == "__main__":
    main(Path(sys.argv[1]))
