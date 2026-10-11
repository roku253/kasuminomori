"""渡された篆書「宮坂隆造」を、右から読む四角の朱印にする。"""
from pathlib import Path

from PIL import Image, ImageDraw, ImageFilter

SRC = Path(__file__).resolve().parent / "assets" / "miyasaka-tensho.png"
DST = Path(__file__).resolve().parent / "assets" / "miyasaka-seal.png"
# 画像は左から 宮・坂・隆・造。印は右列が姓、左列が名。
SLICES = [(9, 61), (75, 127), (141, 193), (207, 260)]
RED = (186, 28, 24, 255)


def glyph(im: Image.Image, x0: int, x1: int) -> Image.Image:
    crop = im.crop((x0, 0, x1, im.height)).convert("L")
    w, h = crop.size
    px = crop.load()
    minx, miny, maxx, maxy = w, h, 0, 0
    for y in range(h):
        for x in range(w):
            if px[x, y] < 110:
                minx, miny = min(minx, x), min(miny, y)
                maxx, maxy = max(maxx, x), max(maxy, y)
    crop = crop.crop((minx, miny, maxx + 1, maxy + 1))
    out = Image.new("RGBA", crop.size, (0, 0, 0, 0))
    src, dst = crop.load(), out.load()
    for y in range(crop.height):
        for x in range(crop.width):
            if src[x, y] < 140:
                shade = 1 - src[x, y] / 180
                dst[x, y] = (RED[0], int(RED[1] * shade), int(RED[2] * shade), 255)
    return out


def main() -> None:
    im = Image.open(SRC).convert("RGB")
    chars = [glyph(im, a, b) for a, b in SLICES]
    # 宮 坂 隆 造
    miya, saka, ryu, zo = chars
    # 右上 宮、右下 坂、左上 隆、左下 造（右から縦に読む）
    placed = [(miya, 1, 0), (saka, 1, 1), (ryu, 0, 0), (zo, 0, 1)]
    cell = 300
    pad = 46
    gap = 6
    side = pad * 2 + cell * 2 + gap
    seal = Image.new("RGBA", (side, side), (0, 0, 0, 0))
    draw = ImageDraw.Draw(seal)
    m = 14
    draw.rounded_rectangle([m, m, side - m, side - m], radius=18, outline=RED, width=18)
    draw.rounded_rectangle([m + 16, m + 16, side - m - 16, side - m - 16], radius=12, outline=RED, width=5)
    for ch, col, row in placed:
        scale = (cell - 10) / max(ch.width, ch.height)
        fitted = ch.resize((max(1, int(ch.width * scale)), max(1, int(ch.height * scale))), Image.Resampling.LANCZOS)
        x = pad + col * (cell + gap) + (cell - fitted.width) // 2
        y = pad + row * (cell + gap) + (cell - fitted.height) // 2
        seal.alpha_composite(fitted, (x, y))
    seal = seal.filter(ImageFilter.GaussianBlur(0.9))
    DST.parent.mkdir(parents=True, exist_ok=True)
    seal.save(DST)
    print(DST, seal.size)


if __name__ == "__main__":
    main()
