"""情報提供資料の2〜3ページ。スキャンした写しの画像をA4に整え、黒い帯だけ純黒に戻す。"""
import sys
from pathlib import Path

from PIL import Image, ImageDraw

W, H = 1985, 2808  # A4 @ 240dpi
HERE = Path(__file__).resolve().parent
SRC = {
    "joho-p2.jpg": HERE / "assets" / "joho-scan-p2.jpg",
    "joho-p3.jpg": HERE / "assets" / "joho-scan-p3.jpg",
}


def fit_a4(im):
    im = im.convert("RGB")
    scale = H / im.height
    nw = int(round(im.width * scale))
    im = im.resize((nw, H), Image.Resampling.LANCZOS)
    if nw == W:
        return im
    if nw > W:
        left = (nw - W) // 2
        return im.crop((left, 0, left + W, H))
    paper = im.getpixel((8, 8))
    canvas = Image.new("RGB", (W, H), paper)
    canvas.paste(im, ((W - nw) // 2, 0))
    return canvas


def solid_bars(im):
    """太い黒の帯だけを純黒の矩形に戻す。細い文字は触らない。"""
    gray = im.convert("L")
    w, h = gray.size
    gp = gray.load()
    runs = []
    for y in range(h):
        x = 0
        while x < w:
            if gp[x, y] < 42:
                x0 = x
                while x < w and gp[x, y] < 42:
                    x += 1
                if x - x0 > 80:
                    runs.append((y, x0, x))
            else:
                x += 1
    used = [False] * len(runs)
    rects = []
    for i, (y, x0, x1) in enumerate(runs):
        if used[i]:
            continue
        used[i] = True
        y0, y1, ax0, ax1 = y, y, x0, x1
        grew = True
        while grew:
            grew = False
            for j, (yy, bx0, bx1) in enumerate(runs):
                if used[j] or yy < y0 or yy > y1 + 3:
                    continue
                if min(ax1, bx1) - max(ax0, bx0) < 50:
                    continue
                used[j] = True
                y1 = max(y1, yy)
                ax0, ax1 = min(ax0, bx0), max(ax1, bx1)
                grew = True
        if y1 - y0 >= 8:
            rects.append((ax0, y0, ax1, y1))
    draw = ImageDraw.Draw(im)
    for x0, y0, x1, y1 in rects:
        draw.rectangle([x0, y0, x1 - 1, y1], fill=(0, 0, 0))
    return im


def main(out_dir: Path):
    out_dir.mkdir(parents=True, exist_ok=True)
    for name, src in SRC.items():
        im = solid_bars(fit_a4(Image.open(src)))
        dst = out_dir / name
        im.save(dst, quality=90, dpi=(240, 240))
        print(dst)


if __name__ == "__main__":
    main(Path(sys.argv[1]))
