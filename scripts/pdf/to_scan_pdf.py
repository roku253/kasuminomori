"""Typst で組んだ公文書を、古紙をスキャンした画像にする。

インクのにじみ、紙の繊維への乗算、ざらつきと周辺減光、0.2〜0.5度の傾きを足す。
不開示の黒い帯は、傾きのあと純黒の矩形に戻す（検査が帯の内側の均一さを見るため）。

  python scripts/pdf/to_scan_pdf.py 入力.pdf 出力ディレクトリ
"""
from __future__ import annotations

import sys
from pathlib import Path

import cv2
import fitz
import numpy as np
from PIL import Image

HERE = Path(__file__).resolve().parent
PAPER = HERE / "assets" / "paper_texture.jpg"
A4 = (1985, 2808)  # 240dpi


def _bars(gray: np.ndarray) -> np.ndarray:
    """太い黒の帯のマスク。細い文字は含めない。"""
    h, w = gray.shape
    dark = gray < 48
    mask = np.zeros((h, w), np.uint8)
    runs: list[tuple[int, int, int]] = []
    for y in range(h):
        row = dark[y]
        x = 0
        while x < w:
            if row[x]:
                x0 = x
                while x < w and row[x]:
                    x += 1
                if x - x0 > 70:
                    runs.append((y, x0, x))
            else:
                x += 1
    used = [False] * len(runs)
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
            mask[y0 : y1 + 1, ax0:ax1] = 255
    return mask


def _ink_bleed(rgb: np.ndarray, bars: np.ndarray) -> np.ndarray:
    """文字の縁だけをわずかに太らせ、ぼかしてインクのにじみにする。帯は除く。"""
    gray = cv2.cvtColor(rgb, cv2.COLOR_RGB2GRAY)
    ink = ((gray < 96) & (bars == 0)).astype(np.uint8) * 255
    kernel = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (3, 3))
    swelled = cv2.dilate(ink, kernel, iterations=1)
    softened = cv2.erode(swelled, kernel, iterations=1)
    bleed = ((softened > 0) & (bars == 0))
    blurred = cv2.GaussianBlur(rgb, (0, 0), 0.7)
    out = rgb.copy()
    out[bleed] = blurred[bleed]
    return out


def _paper(h: int, w: int) -> np.ndarray:
    tex = Image.open(PAPER).convert("RGB").resize((w, h), Image.Resampling.LANCZOS)
    return np.asarray(tex)


def _blend(rgb: np.ndarray, tex: np.ndarray, bars: np.ndarray) -> np.ndarray:
    """乗算で紙の繊維に乗せ、オーバーレイで起伏を少し足す。帯は後で戻す。"""
    base = rgb.astype(np.float32)
    paper = tex.astype(np.float32)
    mul = base * paper / 255.0
    seated = base * 0.62 + mul * 0.38
    b = np.clip(seated / 255.0, 0, 1)
    s = np.clip(paper / 255.0, 0, 1)
    overlay = np.where(b < 0.5, 2 * b * s, 1 - 2 * (1 - b) * (1 - s))
    mixed = b * 0.82 + overlay * 0.18
    out = np.clip(mixed * 255.0, 0, 255).astype(np.uint8)
    out[bars > 0] = rgb[bars > 0]
    return out


def _noise_and_vignette(rgb: np.ndarray, rng: np.random.Generator) -> np.ndarray:
    h, w = rgb.shape[:2]
    acc = rgb.astype(np.float32)
    acc += rng.normal(0, 2.4, acc.shape)
    yy, xx = np.mgrid[0:h, 0:w]
    nx = (xx - w / 2) / (w / 2)
    ny = (yy - h / 2) / (h / 2)
    vignette = 1 - 0.07 * (nx * nx + ny * ny)
    left = 1 - 0.06 * np.clip(1 - xx / (w * 0.08), 0, 1) ** 2
    top = 1 - 0.035 * np.clip(1 - yy / (h * 0.04), 0, 1) ** 2
    acc *= (vignette * left * top)[..., None]
    return np.clip(acc, 0, 255).astype(np.uint8)


def _skew(rgb: np.ndarray, bars: np.ndarray, angle: float) -> tuple[np.ndarray, np.ndarray]:
    h, w = rgb.shape[:2]
    matrix = cv2.getRotationMatrix2D((w / 2, h / 2), angle, 1.0)
    paper = tuple(int(v) for v in rgb[8, 8])
    turned = cv2.warpAffine(rgb, matrix, (w, h), flags=cv2.INTER_LINEAR, borderMode=cv2.BORDER_CONSTANT, borderValue=paper)
    mask = cv2.warpAffine(bars, matrix, (w, h), flags=cv2.INTER_NEAREST, borderMode=cv2.BORDER_CONSTANT, borderValue=0)
    return turned, mask


def scan_page(rgb: np.ndarray, seed: int = 1) -> np.ndarray:
    """1ページ分。戻りは RGB uint8。帯の内側は純黒。"""
    if rgb.dtype != np.uint8 or rgb.ndim != 3:
        raise ValueError("RGB uint8 の画像が必要です")
    rng = np.random.default_rng(seed)
    angle = float(rng.uniform(0.2, 0.5) * rng.choice(np.array([-1.0, 1.0])))
    gray = cv2.cvtColor(rgb, cv2.COLOR_RGB2GRAY)
    bars = _bars(gray)
    bled = _ink_bleed(rgb, bars)
    seated = _blend(bled, _paper(*rgb.shape[:2]), bars)
    noisy = _noise_and_vignette(seated, rng)
    turned, mask = _skew(noisy, bars, angle)
    turned[mask > 0] = 0
    return turned


def scan_pdf(src: Path, out_dir: Path, dpi: int = 240) -> list[Path]:
    out_dir.mkdir(parents=True, exist_ok=True)
    doc = fitz.open(src)
    written = []
    for i, page in enumerate(doc):
        pix = page.get_pixmap(dpi=dpi, alpha=False)
        rgb = np.frombuffer(pix.samples, dtype=np.uint8).reshape(pix.height, pix.width, 3).copy()
        if (pix.width, pix.height) != A4 and dpi == 240:
            rgb = cv2.resize(rgb, A4, interpolation=cv2.INTER_AREA)
        out = scan_page(rgb, seed=i + 1)
        dst = out_dir / f"p{i + 1}.jpg"
        Image.fromarray(out, "RGB").save(dst, quality=88, dpi=(dpi, dpi))
        written.append(dst)
        print(dst)
    return written


def main() -> None:
    if len(sys.argv) != 3:
        raise SystemExit("使い方: python scripts/pdf/to_scan_pdf.py 入力.pdf 出力ディレクトリ")
    scan_pdf(Path(sys.argv[1]), Path(sys.argv[2]))


if __name__ == "__main__":
    main()
