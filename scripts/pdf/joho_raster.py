"""情報提供資料の2〜3ページ。公文書の写し。文字は画像の中だけ。帯は一様な黒で、種類ごとに同じ長さ。"""
import random
import sys
from pathlib import Path

from PIL import Image, ImageChops, ImageDraw, ImageFilter, ImageFont

W, H = 1985, 2808  # A4 @ 240dpi
INK = (32, 32, 32)
RED = (176, 28, 28)
HERE = Path(__file__).resolve().parent
FONT = HERE / "fonts" / "bizudpmincho" / "BIZUDPMincho-Regular.ttf"
SEAL = HERE / "assets" / "miyasaka-seal.jpg"


def mm(n):
    return int(round(n / 25.4 * 240))


def font(size_mm):
    return ImageFont.truetype(str(FONT), mm(size_mm))


class Sheet:
    def __init__(self):
        self.im = Image.new("RGB", (W, H), "white")
        self.d = ImageDraw.Draw(self.im)
        self.y = mm(16)
        self.left = mm(18)
        self.right = W - mm(18)
        self.body = font(3.6)
        self.small = font(3.1)
        self.lead = font(4.2)
        self.title = font(4.6)
        self.bars = []

    def lh(self, f):
        return int(f.size * 1.85)

    def gap(self, n):
        self.y += mm(n)

    def width(self, text, f):
        return self.d.textlength(text, font=f)

    def text_at(self, x, y, text, f, fill=INK):
        self.d.text((x, y), text, font=f, fill=fill)

    def line(self, text, f=None, indent=0, center=False):
        f = f or self.body
        if center:
            x = (self.left + self.right - self.width(text, f)) / 2
        else:
            x = self.left + mm(indent)
        self.text_at(x, self.y, text, f)
        self.y += self.lh(f)

    def rule(self, thick=2):
        self.d.line([(self.left, self.y), (self.right, self.y)], fill=INK, width=thick)
        self.y += mm(2.4)

    def bar(self, x, y, width):
        h = mm(3.1)
        self.d.rectangle([x, y, x + width, y + h], fill=(0, 0, 0))
        self.bars.append((int(x), int(y), int(width), h))

    def inline(self, parts, f=None, indent=0, align="left"):
        """parts: ('t', str) or ('b', 'line'|'short'). 帯の幅は種類ごとに固定。"""
        f = f or self.body
        spans = []
        total = 0
        for kind, value in parts:
            if kind == "t":
                w = self.width(value, f)
            else:
                w = mm(28) if value == "short" else mm(108)
            spans.append((kind, value, w))
            total += w
        if align == "right":
            x = self.right - total
        else:
            x = self.left + mm(indent)
        y = self.y + mm(0.5)
        for kind, value, w in spans:
            if kind == "t":
                self.text_at(x, self.y, value, f)
            else:
                self.bar(x, y, w)
            x += w
        self.y += self.lh(f)

    def frame(self):
        m = mm(10)
        self.d.rectangle([m, m, W - m, H - m], outline=INK, width=3)
        self.d.rectangle([m + mm(1.2), m + mm(1.2), W - m - mm(1.2), H - m - mm(1.2)], outline=INK, width=1)

    def stamp(self, x, y):
        """撮った印影の朱だけを、紙の色が残るよう乗算で押す。"""
        src = Image.open(SEAL).convert("RGB")
        w, h = src.size
        px = src.load()
        minx, miny, maxx, maxy = w, h, 0, 0
        for yy in range(0, h, 2):
            for xx in range(0, w, 2):
                r, g, b = px[xx, yy]
                if r > 130 and r > g + 35 and r > b + 35:
                    minx, miny = min(minx, xx), min(miny, yy)
                    maxx, maxy = max(maxx, xx), max(maxy, yy)
        pad = 12
        src = src.crop((max(0, minx - pad), max(0, miny - pad), min(w, maxx + pad), min(h, maxy + pad)))
        side = mm(18)
        src = src.resize((side, side), Image.Resampling.LANCZOS)
        src = src.rotate(-2.4, resample=Image.BICUBIC, expand=True, fillcolor=(255, 255, 255))
        x, y = int(x), int(y)
        base = self.im.crop((x, y, x + src.width, y + src.height))
        sp, bp = src.load(), base.load()
        out = base.copy()
        op = out.load()
        for yy in range(src.height):
            for xx in range(src.width):
                r, g, b = sp[xx, yy]
                if r > 110 and r > g + 28 and r > b + 28:
                    br, bg, bb = bp[xx, yy]
                    op[xx, yy] = (br * r // 255, bg * max(g, 18) // 255, bb * max(b, 18) // 255)
        self.im.paste(out, (x, y))


def page2():
    s = Sheet()
    s.frame()
    s.line("霞ノ杜町教育委員会", s.lead, center=True)
    s.gap(0.6)
    s.rule(3)
    s.d.line([(s.left, s.y - mm(1.6)), (s.right, s.y - mm(1.6))], fill=INK, width=1)
    s.gap(2)
    s.inline([("t", "霞教第"), ("b", "short"), ("t", "号")], align="right")
    s.inline([("t", "令和元年8月"), ("b", "short"), ("t", "日")], align="right")
    s.gap(4)
    s.line("霞ノ杜町長　様")
    s.gap(2)
    name_y = s.y
    title = "霞ノ杜町教育委員会教育長"
    s.line(title, indent=62)
    s.stamp(s.left + mm(62) + s.width(title, s.body) + mm(1.5), name_y - mm(6))
    s.gap(11)
    s.line("烏啼山道付近立入禁止区域における事案について（報告）", s.title, center=True)
    s.gap(1)
    s.rule(1)
    s.gap(2)
    s.line("1　日時")
    s.inline([("t", "令和元年8月"), ("b", "short"), ("t", "日（"), ("b", "short"), ("t", "）")], indent=6)
    s.gap(1.5)
    s.line("2　場所")
    s.line("烏啼山道付近（立入禁止区域内）", indent=6)
    s.gap(1.5)
    s.line("3　関係者")
    s.inline([("b", "line")], indent=6)
    s.inline([("b", "line")], indent=6)
    s.inline([("b", "line")], indent=6)
    s.gap(1.5)
    s.line("4　概要")
    s.inline([("b", "line")], indent=6)
    s.inline([("b", "line")], indent=6)
    s.inline([("b", "line")], indent=6)
    s.line("…搬送された。", indent=6)
    return s


def page3():
    s = Sheet()
    s.frame()
    s.line("霞ノ杜町教育委員会", s.small)
    s.line("烏啼山道付近立入禁止区域における事案について（報告）（続き）", s.small)
    s.gap(0.4)
    s.rule(2)
    s.line("（写）", s.small)
    s.gap(1.2)
    s.line("5　経過")
    s.inline([("t", "8月"), ("b", "short"), ("t", "日")], indent=6)
    s.inline([("b", "line")], indent=6)
    s.gap(1.2)
    s.inline([("t", "8月"), ("b", "short"), ("t", "日")], indent=6)
    s.line("保護者より事実確認の申し入れがあった。", indent=6)
    s.line("（以下）", indent=6)
    s.inline([("b", "line")], indent=6)
    s.inline([("b", "line")], indent=6)
    s.gap(3)
    s.line("6　対応")
    s.inline([("b", "line")], indent=6)
    s.line("立入禁止区域の柵及び看板を増設する", indent=6)
    s.gap(3)
    s.line("7")
    s.line("本件は事故として処理し、終了とする。", indent=6)
    s.gap(8)
    s.rule(1)
    s.line("【7条1号】　　【7条5号】", s.small)
    return s


def as_scan(im, bars, seed):
    """紙の地色・にじみ・傾き・端の影・ゴミ。黒い帯は最後に純黒へ戻す。"""
    im = im.convert("RGB")
    w, h = im.size
    paper = (236, 231, 221)
    channels = []
    for i, ch in enumerate(im.split()):
        pc = paper[i]
        channels.append(ch.point(lambda v, pc=pc: 0 if v < 12 else int(v * pc / 255)))
    im = Image.merge("RGB", channels)
    im = im.filter(ImageFilter.GaussianBlur(0.65))
    grain = Image.effect_noise((w, h), 16).convert("L").point(lambda v: 226 + (v * 29 // 255))
    im = ImageChops.multiply(im, Image.merge("RGB", (grain, grain, grain)))
    blot = Image.effect_noise((w // 7, h // 7), 36).resize((w, h), Image.Resampling.BICUBIC)
    blot = blot.point(lambda v: 232 + v // 12)
    im = ImageChops.multiply(im, Image.merge("RGB", (blot, blot, blot)))
    shade = Image.new("L", (w, h), 0)
    sd = ImageDraw.Draw(shade)
    band = int(w * 0.02)
    for k in range(band):
        a = int(24 * (1 - k / band) ** 2)
        sd.line([(k, 0), (k, h)], fill=a)
    for k in range(int(h * 0.012)):
        a = int(12 * (1 - k / (h * 0.012)) ** 2)
        sd.line([(0, k), (w, k)], fill=a)
    shade = shade.filter(ImageFilter.GaussianBlur(7))
    dark = im.convert("L").point(lambda v: 255 if v < 18 else 0)
    im = Image.composite(im, ImageChops.subtract(im, Image.merge("RGB", (shade, shade, shade))), dark)
    rnd = random.Random(seed)
    d = ImageDraw.Draw(im)
    for _ in range(56):
        x, y = rnd.randrange(w), rnd.randrange(h)
        if im.getpixel((x, y))[0] < 150:
            continue
        r = 1 if rnd.random() < 0.8 else 2
        g = rnd.randrange(145, 188)
        d.ellipse([x - r, y - r, x + r, y + r], fill=(g, max(0, g - 6), max(0, g - 12)))
    angle = 0.32 if seed % 2 == 0 else -0.26
    mask = Image.new("L", (w, h), 0)
    md = ImageDraw.Draw(mask)
    for x, y, bw, bh in bars:
        md.rectangle([x, y, x + bw, y + bh], fill=255)
    im = im.rotate(angle, resample=Image.BICUBIC, expand=False, fillcolor=paper)
    mask = mask.rotate(angle, resample=Image.NEAREST, expand=False, fillcolor=0)
    im = Image.composite(Image.new("RGB", (w, h), (0, 0, 0)), im, mask)
    return im


def main(out_dir: Path):
    out_dir.mkdir(parents=True, exist_ok=True)
    a = out_dir / "joho-p2.jpg"
    b = out_dir / "joho-p3.jpg"
    p2, p3 = page2(), page3()
    as_scan(p2.im, p2.bars, 2).save(a, quality=84, dpi=(240, 240))
    as_scan(p3.im, p3.bars, 3).save(b, quality=84, dpi=(240, 240))
    print(a)
    print(b)


if __name__ == "__main__":
    main(Path(sys.argv[1]))
