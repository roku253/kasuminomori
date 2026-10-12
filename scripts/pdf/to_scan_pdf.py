"""Typst で組んだ公文書を、コピー機を通したスキャンに近づける。

紙は白のままにする。変えるのは文字で、縁をぼかし、輪郭を少し欠いて、インクの濃さにムラを付ける。
傾きは 0.1〜0.2 度。不開示の帯は、縁だけトナーのスレにし、内側は検査が通るほぼ一様な黒にする。

  python scripts/pdf/to_scan_pdf.py 入力.pdf 出力ディレクトリ
"""
from __future__ import annotations

import sys
from pathlib import Path

import cv2
import fitz
import numpy as np
from PIL import Image

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


def _scanned_type(rgb: np.ndarray, bars: np.ndarray, rng: np.random.Generator) -> np.ndarray:
    """紙は白。文字と罫線の輪郭だけ、スキャンのようにぼかし、欠き、濃さのムラを付ける。"""
    gray = cv2.cvtColor(rgb, cv2.COLOR_RGB2GRAY).astype(np.float32)
    red = (rgb[:, :, 0] > rgb[:, :, 1] + 28) & (rgb[:, :, 0] > 110)
    density = np.clip((236.0 - gray) / 236.0, 0, 1)
    density[bars > 0] = 0
    density[red] = 0
    # 縁（濃さが中間のところ）に粒を足して、輪郭をギザつかせる
    edge = cv2.Laplacian((density * 255).astype(np.uint8), cv2.CV_32F)
    edge = np.clip(np.abs(edge) / 80.0, 0, 1)
    speckle = rng.normal(0, 1, density.shape).astype(np.float32)
    speckle = cv2.GaussianBlur(speckle, (0, 0), 0.45)
    density = np.clip(density + speckle * (0.05 + 0.22 * edge), 0, 1)
    density = cv2.GaussianBlur(density, (0, 0), 1.25)
    density[bars > 0] = 0
    density[red] = 0
    # 画の中でも濃さを揺らす
    mottling = cv2.GaussianBlur(rng.normal(0, 1, density.shape).astype(np.float32), (0, 0), 1.4)
    darkness = np.clip(density * (0.86 + 0.08 * mottling), 0, 0.93)
    paper = np.full(rgb.shape, 252, np.float32)
    out = paper * (1.0 - darkness[..., None])
    return np.clip(out, 0, 255).astype(np.uint8)


def _press_seal(page: np.ndarray, original: np.ndarray, rng: np.random.Generator) -> np.ndarray:
    """朱印を、押しムラとインクの欠けがある押印にする。紙の色が透ける。"""
    red = (original[:, :, 0] > original[:, :, 1] + 28) & (original[:, :, 0] > 110)
    if not np.any(red):
        return page
    ys, xs = np.nonzero(red)
    pad = 6
    y0, y1 = max(0, int(ys.min()) - pad), min(page.shape[0], int(ys.max()) + pad + 1)
    x0, x1 = max(0, int(xs.min()) - pad), min(page.shape[1], int(xs.max()) + pad + 1)
    ink = red[y0:y1, x0:x1].astype(np.float32)
    ink = cv2.GaussianBlur(ink, (0, 0), 0.55)
    ch, cw = ink.shape
    pressure = rng.random((max(3, ch // 10), max(3, cw // 10))).astype(np.float32)
    pressure = cv2.resize(pressure, (cw, ch), interpolation=cv2.INTER_CUBIC)
    pressure = 0.05 + 0.95 * np.clip(pressure, 0, 1)
    # 片側が紙に乗っていない
    tilt = np.linspace(0.25, 1.0, cw, dtype=np.float32)
    if rng.random() < 0.5:
        tilt = tilt[::-1]
    pressure *= tilt[None, :]
    gaps = rng.random((ch, cw)).astype(np.float32)
    gaps = cv2.GaussianBlur(gaps, (0, 0), 0.9)
    ink *= pressure
    ink[gaps < 0.42] = 0
    vermilion = np.array([168, 32, 26], np.float32)
    paper = page[y0:y1, x0:x1].astype(np.float32)
    stamped = paper * (1.0 - ink[..., None]) + vermilion * (paper / 252.0) * ink[..., None]
    out = page.copy()
    out[y0:y1, x0:x1] = np.clip(stamped, 0, 255).astype(np.uint8)
    return out


def _patchy_grain(rgb: np.ndarray, rng: np.random.Generator) -> np.ndarray:
    """ざらつきの強さを場所で変える。きれいな面と、汚れた塊、横筋が混ざる。"""
    h, w = rgb.shape[:2]
    coarse = rng.normal(0, 1, (max(6, h // 90), max(6, w // 90))).astype(np.float32)
    coarse = cv2.GaussianBlur(cv2.resize(coarse, (w, h), interpolation=cv2.INTER_CUBIC), (0, 0), 8)
    # 大半はほぼ無地、ところどころだけ粒が濃い
    amp = np.clip(np.maximum(coarse - 0.35, 0) * 14, 0.15, 16)
    fine = rng.normal(0, 1, (h, w)).astype(np.float32)
    dust = np.zeros((h, w), np.float32)
    yy, xx = np.ogrid[0:h, 0:w]
    for _ in range(int(rng.integers(5, 9))):
        cx = int(rng.integers(0, w))
        cy = int(rng.integers(0, h))
        rad = float(rng.integers(40, 220))
        dust += np.exp(-((xx - cx) ** 2 + (yy - cy) ** 2) / (2 * rad * rad)) * float(rng.uniform(14, 32))
    streaks = np.zeros((h, w), np.float32)
    for _ in range(int(rng.integers(1, 3))):
        y0 = int(rng.integers(0, h))
        thick = int(rng.integers(2, 6))
        x0 = int(rng.integers(0, w // 2))
        length = int(rng.integers(w // 5, w // 2))
        y1, y2 = max(0, y0 - thick), min(h, y0 + thick)
        x2 = min(w, x0 + length)
        streaks[y1:y2, x0:x2] += float(rng.uniform(6, 12))
    grain = fine * amp - dust * 0.55 - streaks
    out = rgb.astype(np.float32) + grain[..., None]
    return np.clip(out, 0, 255).astype(np.uint8)


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
    typed = _press_seal(_patchy_grain(_scanned_type(rgb, bars, rng), rng), rgb, rng)
    turned, mask = _skew(typed, bars, angle)
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
