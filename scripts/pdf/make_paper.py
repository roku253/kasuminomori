"""紙の地と、朱印の余白を抜いた画像を一度だけ書く。"""
from pathlib import Path

from PIL import Image, ImageChops, ImageDraw, ImageFilter

HERE = Path(__file__).resolve().parent
ASSETS = HERE / "assets"


def paper(path: Path):
    w, h = 1240, 1754
    base = Image.new("RGB", (w, h), (246, 242, 232))
    grain = Image.effect_noise((w, h), 11).convert("L").point(lambda v: 228 + v * 27 // 255)
    base = ImageChops.multiply(base, Image.merge("RGB", (grain, grain, grain)))
    blot = Image.effect_noise((w // 8, h // 8), 30).resize((w, h), Image.Resampling.BICUBIC)
    blot = blot.point(lambda v: 236 + v // 16)
    base = ImageChops.multiply(base, Image.merge("RGB", (blot, blot, blot)))
    d = ImageDraw.Draw(base)
    rnd_seed = 11
    import random

    rnd = random.Random(rnd_seed)
    for _ in range(70):
        x, y = rnd.randrange(w), rnd.randrange(h)
        r = rnd.choice([1, 1, 2])
        g = rnd.randrange(170, 205)
        d.ellipse([x - r, y - r, x + r, y + r], fill=(g, g - 4, g - 8))
    # 端をわずかに落とす
    shade = Image.new("L", (w, h), 0)
    sd = ImageDraw.Draw(shade)
    for k in range(28):
        a = int(18 * (1 - k / 28) ** 2)
        sd.line([(k, 0), (k, h)], fill=a)
        sd.line([(0, k), (w, k)], fill=a // 2)
    shade = shade.filter(ImageFilter.GaussianBlur(6))
    base = ImageChops.subtract(base, Image.merge("RGB", (shade, shade, shade)))
    path.parent.mkdir(parents=True, exist_ok=True)
    base.save(path, "JPEG", quality=90)
    print(path, path.stat().st_size)


def seal(src: Path, dst: Path):
    im = Image.open(src).convert("RGB")
    w, h = im.size
    px = im.load()
    minx, miny, maxx, maxy = w, h, 0, 0
    for y in range(h):
        for x in range(w):
            r, g, b = px[x, y]
            if r > 140 and r > g + 40 and r > b + 40:
                minx, miny = min(minx, x), min(miny, y)
                maxx, maxy = max(maxx, x), max(maxy, y)
    pad = 10
    im = im.crop((max(0, minx - pad), max(0, miny - pad), min(w, maxx + pad), min(h, maxy + pad)))
    im = im.convert("RGBA")
    px = im.load()
    w, h = im.size
    for y in range(h):
        for x in range(w):
            r, g, b, _ = px[x, y]
            red = r - max(g, b)
            if red > 28 and r > 100:
                px[x, y] = (r, g, b, min(255, 80 + red * 2))
            else:
                px[x, y] = (0, 0, 0, 0)
    dst.parent.mkdir(parents=True, exist_ok=True)
    im.save(dst)
    print(dst, dst.stat().st_size)


if __name__ == "__main__":
    paper(ASSETS / "paper_texture.jpg")
    seal(ASSETS / "miyasaka-seal.jpg", ASSETS / "miyasaka-seal.png")
