"""Typst で組んだ公文書を、コピー機を通したスキャンに近づける。

文字はぼかしてから紙の繊維と乗算し、インクが染みたようにする。
全体に粒状のノイズと、四隅が暗い周辺減光を足す。傾きは 0.1〜0.2 度。
不開示の帯は、縁だけトナーのスレにし、内側は検査が通るほぼ一様な黒にする。

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


def _paper(h: int, w: int) -> np.ndarray:
    tex = np.asarray(Image.open(PAPER).convert("RGB").resize((w, h), Image.Resampling.LANCZOS), dtype=np.float32)
    # 繊維の凹凸を文字より細かくする
    hp = tex - cv2.GaussianBlur(tex, (0, 0), 2.2)
    return np.clip(tex + hp * 1.8, 0, 255)


def _soak(rgb: np.ndarray, tex: np.ndarray, bars: np.ndarray) -> np.ndarray:
    """文字をぼかしてから紙と乗算し、繊維に染みたインクにする。"""
    gray = cv2.cvtColor(rgb, cv2.COLOR_RGB2GRAY).astype(np.float32)
    paper_level = float(np.median(gray[gray > 170])) if np.any(gray > 170) else 230.0
    density = np.clip((paper_level - gray) / max(paper_level, 1.0), 0, 1)
    density[bars > 0] = 0
    kernel = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (3, 3))
    thick = cv2.dilate((density > 0.18).astype(np.uint8), kernel, iterations=1)
    density = np.maximum(density, thick.astype(np.float32) * 0.22)
    density = cv2.GaussianBlur(density, (0, 0), 0.9)
    density[bars > 0] = 0
    fiber = tex / np.maximum(tex.mean(axis=(0, 1), keepdims=True), 1.0)
    base = rgb.astype(np.float32)
    # 濃いところほど紙の色が残り、ベタ黒で浮かない
    ink = base * (1.0 - density[..., None] * 0.93) * (0.78 + 0.22 * fiber)
    out = np.where(density[..., None] > 0.02, ink, base * (0.9 + 0.1 * fiber))
    return np.clip(out, 0, 255).astype(np.uint8)


def _noise_and_vignette(rgb: np.ndarray, rng: np.random.Generator) -> np.ndarray:
    h, w = rgb.shape[:2]
    acc = rgb.astype(np.float32)
    acc += rng.normal(0, 4.2, acc.shape)
    yy, xx = np.mgrid[0:h, 0:w].astype(np.float32)
    nx = (xx - w / 2) / (w / 2)
    ny = (yy - h / 2) / (h / 2)
    radius = nx * nx * 0.85 + ny * ny
    vignette = 1.04 - 0.18 * np.power(np.clip(radius, 0, 1.6), 1.05)
    # 左上をわずかに明るく、右下と四隅を落とす
    light = 1.0 + 0.045 * (-0.6 * nx - 0.8 * ny)
    edge = np.minimum(np.minimum(xx, w - 1 - xx) / (w * 0.045), np.minimum(yy, h - 1 - yy) / (h * 0.035))
    corners = 0.86 + 0.14 * np.clip(edge, 0, 1)
    acc *= (vignette * light * corners)[..., None]
    return np.clip(acc, 0, 255).astype(np.uint8)


def _toner(mask: np.ndarray, rng: np.random.Generator) -> np.ndarray:
    """帯の縁はスレ、内側はほぼ一様なトナー黒（輝度のばらつきを検査の範囲に収める）。"""
    core = cv2.erode(mask, np.ones((11, 11), np.uint8), iterations=1)
    edge = (mask > 0) & (core == 0)
    tone = rng.normal(4.5, 0.45, mask.shape).astype(np.float32)
    scratch = rng.normal(28.0, 16.0, mask.shape).astype(np.float32)
    value = np.where(core > 0, tone, np.where(edge, scratch, 0))
    return np.clip(value, 0, 70)


def _skew(rgb: np.ndarray, bars: np.ndarray, angle: float) -> tuple[np.ndarray, np.ndarray]:
    h, w = rgb.shape[:2]
    matrix = cv2.getRotationMatrix2D((w / 2, h / 2), angle, 1.0)
    paper = tuple(int(v) for v in rgb[8, 8])
    turned = cv2.warpAffine(rgb, matrix, (w, h), flags=cv2.INTER_LINEAR, borderMode=cv2.BORDER_CONSTANT, borderValue=paper)
    mask = cv2.warpAffine(bars, matrix, (w, h), flags=cv2.INTER_NEAREST, borderMode=cv2.BORDER_CONSTANT, borderValue=0)
    return turned, mask


def scan_page(rgb: np.ndarray, seed: int = 1) -> np.ndarray:
    """1ページ分。戻りは RGB uint8。帯の内側はほぼ一様な黒。"""
    if rgb.dtype != np.uint8 or rgb.ndim != 3:
        raise ValueError("RGB uint8 の画像が必要です")
    rng = np.random.default_rng(seed)
    angle = float(rng.uniform(0.1, 0.2) * rng.choice(np.array([-1.0, 1.0])))
    gray = cv2.cvtColor(rgb, cv2.COLOR_RGB2GRAY)
    bars = _bars(gray)
    soaked = _soak(rgb, _paper(*rgb.shape[:2]), bars)
    noisy = _noise_and_vignette(soaked, rng)
    turned, mask = _skew(noisy, bars, angle)
    tone = _toner(mask, rng)
    turned[mask > 0] = tone[mask > 0, None]
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
