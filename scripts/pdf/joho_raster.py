"""情報提供資料の2〜3ページ。公文書の写し。文字は画像の中だけ。帯は一様な黒で、種類ごとに同じ長さ。"""
import sys
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont

W, H = 1985, 2808  # A4 @ 240dpi
INK = (32, 32, 32)
RED = (176, 28, 28)
FONT = Path(__file__).resolve().parent / "fonts" / "bizudpmincho" / "BIZUDPMincho-Regular.ttf"


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
        self.d.rectangle([x, y, x + width, y + mm(3.1)], fill=(0, 0, 0))

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

    def seal(self, cx, cy):
        r = mm(8)
        self.d.ellipse([cx - r, cy - r, cx + r, cy + r], outline=RED, width=4)
        self.d.ellipse([cx - r + mm(1.1), cy - r + mm(1.1), cx + r - mm(1.1), cy + r - mm(1.1)], outline=RED, width=2)
        mark = "印"
        f = font(3.4)
        box = self.d.textbbox((0, 0), mark, font=f)
        tw, th = box[2] - box[0], box[3] - box[1]
        self.d.text((cx - tw / 2, cy - th / 2 - mm(0.6)), mark, font=f, fill=RED)


def page2():
    s = Sheet()
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
    s.line("霞ノ杜町教育委員会教育長", indent=78)
    s.seal(s.right - mm(12), name_y + mm(2))
    s.gap(6)
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
    return s.im


def page3():
    s = Sheet()
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
    return s.im


def main(out_dir: Path):
    out_dir.mkdir(parents=True, exist_ok=True)
    a = out_dir / "joho-p2.jpg"
    b = out_dir / "joho-p3.jpg"
    page2().save(a, quality=92)
    page3().save(b, quality=92)
    print(a)
    print(b)


if __name__ == "__main__":
    main(Path(sys.argv[1]))
