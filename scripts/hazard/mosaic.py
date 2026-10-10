"""保存済みの z17 タイル（重ねるハザードマップ）から、レイヤー別の合成画像（モザイク）を作る。

  python scripts/hazard/mosaic.py [タイルのフォルダ]      （既定: scripts/hazard/.cache/tiles）

- 入力: <タイルのフォルダ>/<レイヤー>/17/<x>/<y>.png と、取得の記録 status-17.json（fetch_tiles.py が書く）。
  404 だったタイルは「<y>.png.404」の空ファイルで記録してある（区域なし＝透明として扱う）。
- 出力: scripts/hazard/data/<レイヤー>.png（パレット PNG・公表時の配色）と data/snapshot.json（範囲・取得日・出典）。
  この2つはリポジトリに入れる。生のタイルは入れない（.cache は git の管理外）。
- 加工: 浸水深・浸水継続時間はタイルの色をそのまま（境目のぼかしは元から無い）。
  土砂災害警戒区域等は、境目のぼかし（半透明の画素）を不透明度50%で切り、
  「警戒区域」「特別警戒区域」の公表色の2色にそろえる（区域の範囲は変えない）。
- 作中の地図は「令和8年8月作成」の写しなので、定期的には取り直さない（取り直すのは枠を広げる・誤りが見つかったときだけ）。
"""
import json
import math
import pathlib
import sys

import numpy as np
from PIL import Image

HERE = pathlib.Path(__file__).resolve().parent
DATA = HERE / "data"
Z = 17

# 公表時の配色（凡例画像とタイルの色の集計で確認。2026-10-09）
FLOOD_COLORS = {  # 洪水浸水想定区域（想定最大規模）の浸水深
    "0-0.5": (247, 245, 169),
    "0.5-3": (255, 216, 192),
    "3-5": (255, 183, 183),
    "5-10": (255, 145, 145),
    "10-20": (242, 133, 201),
    "20-": (220, 122, 220),
}
KEIZOKU_COLORS = {  # 浸水継続時間（想定最大規模）
    "-12h": (160, 210, 255),
    "12h-1d": (0, 65, 255),
    "1-3d": (250, 245, 0),
    "3d-1w": (255, 153, 0),
    "1-2w": (255, 40, 0),
    "2-4w": (180, 0, 104),
    "4w-": (96, 0, 96),
}
DOSHA_COLORS = {  # 土砂災害警戒区域等: (警戒区域, 特別警戒区域)
    "dosekiryu": ((230, 200, 50), (165, 0, 33)),
    "kyukeisha": ((250, 230, 0), (250, 40, 0)),
    "jisuberi": ((255, 153, 0), (180, 0, 40)),
}
LAYERS = {
    "flood_l2": "https://disaportaldata.gsi.go.jp/raster/01_flood_l2_shinsuishin_data/{z}/{x}/{y}.png",
    "keizoku_l2": "https://disaportaldata.gsi.go.jp/raster/01_flood_l2_keizoku_data/{z}/{x}/{y}.png",
    "dosekiryu": "https://disaportaldata.gsi.go.jp/raster/05_dosekiryukeikaikuiki/{z}/{x}/{y}.png",
    "kyukeisha": "https://disaportaldata.gsi.go.jp/raster/05_kyukeishakeikaikuiki/{z}/{x}/{y}.png",
    "jisuberi": "https://disaportaldata.gsi.go.jp/raster/05_jisuberikeikaikuiki/{z}/{x}/{y}.png",
}


def tile_corner(x: int, y: int, z: int = Z):
    n = 2 ** z
    lng = x / n * 360 - 180
    lat = math.degrees(math.atan(math.sinh(math.pi * (1 - 2 * y / n))))
    return [round(lng, 7), round(lat, 7)]


def assemble(tdir: pathlib.Path, layer: str, xs, ys):
    """タイルを並べて RGBA の配列にする。無いタイル（404 の印）は透明。印も画像も無ければ止める。"""
    h, w = len(ys) * 256, len(xs) * 256
    out = np.zeros((h, w, 4), np.uint8)
    for i, x in enumerate(xs):
        for j, y in enumerate(ys):
            p = tdir / layer / str(Z) / str(x) / f"{y}.png"
            if p.exists():
                im = Image.open(p).convert("RGBA")
                out[j * 256:(j + 1) * 256, i * 256:(i + 1) * 256] = np.asarray(im)
            elif not pathlib.Path(str(p) + ".404").exists():
                sys.exit(f"タイルがありません: {layer} {x} {y}（fetch_tiles.py で取得する）")
    return out


def to_palette(index: np.ndarray, colors):
    """index（0=透明、1..n=colors の順）を、透明色つきのパレット PNG にする"""
    pal = [0, 0, 0]
    for c in colors:
        pal += list(c)
    pal += [0, 0, 0] * (256 - len(pal) // 3)
    im = Image.fromarray(index.astype(np.uint8), "P")
    im.putpalette(pal)
    im.info["transparency"] = 0
    return im


def exact_classes(rgba: np.ndarray, table: dict, layer: str):
    """色がちょうど一致するものだけを区分にする（未知の色があれば止める）"""
    on = rgba[..., 3] > 0
    idx = np.zeros(rgba.shape[:2], np.uint8)
    counts = {}
    known = np.zeros_like(on)
    for k, (name, col) in enumerate(table.items(), start=1):
        m = on & np.all(rgba[..., :3] == np.array(col, np.uint8), axis=-1)
        idx[m] = k
        known |= m
        counts[name] = int(m.sum())
    unknown = int((on & ~known).sum())
    if unknown:
        sys.exit(f"{layer}: 凡例に無い色の画素が {unknown} 個あります（配色が変わった可能性）")
    if np.any((rgba[..., 3] > 0) & (rgba[..., 3] < 255)):
        sys.exit(f"{layer}: 半透明の画素があります（想定外）")
    return idx, counts


def dosha_classes(rgba: np.ndarray, layer: str):
    kc, tc = DOSHA_COLORS[layer]
    rgb = rgba[..., :3].astype(int)
    on = rgba[..., 3] >= 128  # 境目のぼかしを 50% で切る
    dk = np.abs(rgb - np.array(kc)).sum(-1)
    dt = np.abs(rgb - np.array(tc)).sum(-1)
    toku = on & (dt < dk)
    idx = np.zeros(rgba.shape[:2], np.uint8)
    idx[on] = 1
    idx[toku] = 2
    # 指定予定の区域（紺の破線）が無いことを確かめる
    blue = on & (rgb[..., 2] > rgb[..., 0] + 40) & (rgb[..., 2] > 90)
    if int(blue.sum()):
        sys.exit(f"{layer}: 指定予定の区域（紺の破線）らしい画素があります。凡例に「指定予定」を足すか検討する")
    return idx, {"keikai_incl_tokubetsu": int(on.sum()), "tokubetsu": int(toku.sum())}


def main() -> None:
    tdir = pathlib.Path(sys.argv[1]) if len(sys.argv) > 1 else HERE / ".cache" / "tiles"
    status = json.loads((tdir / "status-17.json").read_text(encoding="utf-8"))
    (x0, x1), (y0, y1) = status["x"], status["y"]
    xs, ys = list(range(x0, x1 + 1)), list(range(y0, y1 + 1))
    DATA.mkdir(parents=True, exist_ok=True)
    pixels = {}
    for layer in LAYERS:
        rgba = assemble(tdir, layer, xs, ys)
        if layer == "flood_l2":
            idx, counts = exact_classes(rgba, FLOOD_COLORS, layer)
            im = to_palette(idx, FLOOD_COLORS.values())
        elif layer == "keizoku_l2":
            idx, counts = exact_classes(rgba, KEIZOKU_COLORS, layer)
            im = to_palette(idx, KEIZOKU_COLORS.values())
        else:
            idx, counts = dosha_classes(rgba, layer)
            im = to_palette(idx, DOSHA_COLORS[layer])
        im.save(DATA / f"{layer}.png", optimize=True)
        pixels[layer] = counts
        print(f"{layer}: {(DATA / f'{layer}.png').stat().st_size} bytes {counts}")

    snapshot = {
        "about": "重ねるハザードマップ（ハザードマップポータルサイト）の配信タイル z17 を並べた合成画像の記録。scripts/hazard/mosaic.py が書く。",
        "z": Z,
        "x": [x0, x1],
        "y": [y0, y1],
        "size": [len(xs) * 256, len(ys) * 256],
        "corners": [tile_corner(x0, y0), tile_corner(x1 + 1, y0), tile_corner(x1 + 1, y1 + 1), tile_corner(x0, y1 + 1)],
        "fetchedAt": status.get("fetched_at"),
        "tiles": LAYERS,
        "classes": {
            "flood_l2": list(FLOOD_COLORS),
            "keizoku_l2": list(KEIZOKU_COLORS),
            "dosha": ["keikai", "tokubetsu"],
        },
        "pixels": pixels,
        "processing": [
            "浸水深・浸水継続時間: タイルの色をそのまま（パレット PNG にしただけ）",
            "土砂災害警戒区域等: 境目のぼかしを不透明度50%で切り、警戒区域・特別警戒区域の公表色の2色にそろえた（区域の範囲は変えていない）",
            "枠内に指定予定の区域（紺の破線）は無い",
        ],
        "sources": {
            "portal": "国土交通省「ハザードマップポータルサイト」（重ねるハザードマップ） https://disaportal.gsi.go.jp/ 公共データ利用規約 第1.0版（PDL1.0）",
            "dosha": "国土交通省「国土数値情報（土砂災害警戒区域データ）」令和7年度（2025年8月1日時点）。長野県はオープンデータとしての利用可（商用利用可・再配信可）",
        },
        "note": "実際の取得日（fetchedAt）は作中の作成日（令和8年8月）と食い違うので、図とページには書かない。",
    }
    (DATA / "snapshot.json").write_text(json.dumps(snapshot, ensure_ascii=False, indent=1) + "\n", encoding="utf-8", newline="\n")
    total = sum((DATA / f"{k}.png").stat().st_size for k in LAYERS)
    print(f"total {total} bytes -> {DATA.relative_to(HERE.parents[1]).as_posix()}")


if __name__ == "__main__":
    main()
