"""Typst で組んだ写しを 240dpi で画像にし、スキャンのざらつきを足す。黒い帯は純黒に戻す。"""
import sys
from pathlib import Path

import fitz
from PIL import Image, ImageChops, ImageDraw, ImageFilter

W, H = 1985, 2808


def fit(im):
    im = im.convert("RGB")
    if im.size == (W, H):
        return im
    return im.resize((W, H), Image.Resampling.LANCZOS)


def grain(im):
    w, h = im.size
    im = im.filter(ImageFilter.GaussianBlur(0.45))
    noise = Image.effect_noise((w, h), 13).convert("L").point(lambda v: 214 + v * 41 // 255)
    im = ImageChops.multiply(im, Image.merge("RGB", (noise, noise, noise)))
    shade = Image.new("L", (w, h), 0)
    sd = ImageDraw.Draw(shade)
    band = int(w * 0.018)
    for k in range(band):
        a = int(20 * (1 - k / band) ** 2)
        sd.line([(k, 0), (k, h)], fill=a)
    shade = shade.filter(ImageFilter.GaussianBlur(5))
    dark = im.convert("L").point(lambda v: 255 if v < 28 else 0)
    im = Image.composite(im, ImageChops.subtract(im, Image.merge("RGB", (shade, shade, shade))), dark)
    return im


def solid_bars(im):
    gray = im.convert("L")
    w, h = gray.size
    gp = gray.load()
    runs = []
    for y in range(h):
        x = 0
        while x < w:
            if gp[x, y] < 48:
                x0 = x
                while x < w and gp[x, y] < 48:
                    x += 1
                if x - x0 > 70:
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
                if min(ax1, bx1) - max(ax0, bx0) < 40:
                    continue
                used[j] = True
                y1 = max(y1, yy)
                ax0, ax1 = min(ax0, bx0), max(ax1, bx1)
                grew = True
        if y1 - y0 >= 7:
            rects.append((ax0, y0, ax1, y1))
    draw = ImageDraw.Draw(im)
    for x0, y0, x1, y1 in rects:
        draw.rectangle([x0, y0, x1 - 1, y1], fill=(0, 0, 0))
    return im


def main(pdf_path: Path, out_dir: Path):
    out_dir.mkdir(parents=True, exist_ok=True)
    doc = fitz.open(pdf_path)
    if doc.page_count != 2:
        raise SystemExit(f"写しは2ページである必要があります（{doc.page_count}）")
    names = ["joho-p2.jpg", "joho-p3.jpg"]
    for i, name in enumerate(names):
        pix = doc[i].get_pixmap(dpi=240, alpha=False)
        im = Image.frombytes("RGB", (pix.width, pix.height), pix.samples)
        im = solid_bars(grain(fit(im)))
        dst = out_dir / name
        im.save(dst, quality=88, dpi=(240, 240))
        print(dst)


if __name__ == "__main__":
    main(Path(sys.argv[1]), Path(sys.argv[2]))
