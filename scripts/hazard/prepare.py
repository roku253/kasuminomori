"""区域データ（data/*.png）と設定（config.json）から、描画用の材料を作り、避難所の ○× を検算する。

  python scripts/hazard/prepare.py            （npm run hazard:build の中で呼ばれる）

出力（scripts/hazard/.cache/work/。git の管理外）:
  dosha.geojson  … 土砂災害警戒区域等の輪郭（多角形）。cls = K_all / T_all / K_dosekiryu / K_kyukeisha / K_jisuberi
                    K_* は警戒区域（特別警戒区域を含む）、T_all は特別警戒区域。輪郭は画素の境目を取り出し、
                    角を半画素だけ面取りして間引いた（ずれは 0.5 画素＝約0.5m 以内。区域の範囲は変えない）
  points.json    … 避難所・本部の地点が、どの区域に入るか／最寄りの区域までの距離（m）
  stats.json     … 町名ごと（ラベルから半径250m）と地区ごとの区域の割合（本文の「地区別の見方」の検算用）
止める条件（終了コード1）:
  - 避難所の ○× が config と区域データで食い違う
  - 立入禁止区域（町が設けた区域）が法の区域（浸水・土砂）と重なる
  - 図の表示範囲が区域データの範囲からはみ出す（はみ出した所は「区域なし」に見えてしまう）
"""
import json
import math
import pathlib
import sys

import numpy as np
from PIL import Image, ImageDraw
from scipy import ndimage

sys.stdout.reconfigure(encoding="utf-8")
HERE = pathlib.Path(__file__).resolve().parent
DATA = HERE / "data"
WORK = HERE / ".cache" / "work"
CONFIG = HERE / "config.json"

DOSHA = ("dosekiryu", "kyukeisha", "jisuberi")
FLOOD_CLASSES = ("0-0.5", "0.5-3", "3-5", "5-10", "10-20", "20-")
KEIZOKU_CLASSES = ("-12h", "12h-1d", "1-3d", "3d-1w", "1-2w", "2-4w", "4w-")
SHEET_PX = {"a3": (1000, 928)}  # A3 の地図枠（CSS px。map.html と同じ）
NEAR_M = 30  # 区域の「すぐ外」とみなす距離（m）。この範囲の ○× は config の判断に任せる


class Grid:
    """z17 モザイクの画素 ⇔ 経緯度"""

    def __init__(self, snap):
        self.z = snap["z"]
        self.x0, self.y0 = snap["x"][0] * 256, snap["y"][0] * 256
        self.w, self.h = snap["size"]
        self.world = 256 * 2 ** self.z

    def to_px(self, lng, lat):
        x = (lng + 180) / 360 * self.world
        lr = math.radians(lat)
        y = (1 - math.log(math.tan(lr) + 1 / math.cos(lr)) / math.pi) / 2 * self.world
        return x - self.x0, y - self.y0

    def to_lnglat(self, px):
        """px: (N,2) の配列 → (N,2) の [lng, lat]"""
        X = (px[:, 0] + self.x0) / self.world
        Y = (px[:, 1] + self.y0) / self.world
        lng = X * 360 - 180
        lat = np.degrees(np.arctan(np.sinh(np.pi * (1 - 2 * Y))))
        return np.stack([lng, lat], 1)

    def mpp(self, lat):
        return 40075016.686 / self.world * math.cos(math.radians(lat))


# ---------------------------------------------------------------- 輪郭の取り出し
def boundary_edges(mask):
    """区域の画素の外周を、向きのついた単位の辺にする（区域が進む向きの左手＝画面で反時計回り）"""
    m = np.pad(mask, 1, constant_values=False)
    c = m[1:-1, 1:-1]
    parts = []
    i, j = np.nonzero(c & ~m[:-2, 1:-1])   # 上の辺 (j+1,i)->(j,i)
    parts.append(np.stack([j + 1, i, j, i], 1))
    i, j = np.nonzero(c & ~m[2:, 1:-1])    # 下の辺 (j,i+1)->(j+1,i+1)
    parts.append(np.stack([j, i + 1, j + 1, i + 1], 1))
    i, j = np.nonzero(c & ~m[1:-1, :-2])   # 左の辺 (j,i)->(j,i+1)
    parts.append(np.stack([j, i, j, i + 1], 1))
    i, j = np.nonzero(c & ~m[1:-1, 2:])    # 右の辺 (j+1,i+1)->(j+1,i)
    parts.append(np.stack([j + 1, i + 1, j + 1, i], 1))
    return np.concatenate(parts).astype(np.int64)


def edge_rings(E, width):
    """辺をつないで閉じた輪にする。斜めに接する所では左に曲がる（4近傍で分ける）"""
    n = len(E)
    if n == 0:
        return []
    stride = width + 3
    sk = E[:, 1] * stride + E[:, 0]
    ek = E[:, 3] * stride + E[:, 2]
    order = np.argsort(sk, kind="stable")
    sks = sk[order]
    lo = np.searchsorted(sks, ek, "left")
    hi = np.searchsorted(sks, ek, "right")
    cnt = hi - lo
    if np.any(cnt < 1) or np.any(cnt > 2):
        raise RuntimeError("輪郭の辺がつながりません")
    nxt = order[lo].copy()
    d = E[:, 2:] - E[:, :2]
    for e in np.nonzero(cnt == 2)[0]:
        a, b = order[lo[e]], order[lo[e] + 1]
        ca = d[e, 0] * d[a, 1] - d[e, 1] * d[a, 0]
        cb = d[e, 0] * d[b, 1] - d[e, 1] * d[b, 0]
        nxt[e] = a if ca < cb else b
    seen = np.zeros(n, bool)
    rings = []
    nxt_l = nxt.tolist()
    sx, sy = E[:, 0].tolist(), E[:, 1].tolist()
    for s in range(n):
        if seen[s]:
            continue
        pts = []
        e = s
        while not seen[e]:
            seen[e] = True
            pts.append((sx[e], sy[e]))
            e = nxt_l[e]
        rings.append(np.array(pts, float))
    return rings


def simplify(pts, tol):
    """閉じた輪の Douglas-Peucker（端点は最も離れた2点）"""
    n = len(pts)
    if n <= 4:
        return pts
    i0 = 0
    i1 = int(np.argmax(((pts - pts[0]) ** 2).sum(1)))
    keep = np.zeros(n, bool)
    keep[i0] = keep[i1] = True
    stack = [(i0, i1), (i1, n)]
    ext = np.vstack([pts, pts[:1]])
    while stack:
        a, b = stack.pop()
        if b - a < 2:
            continue
        p, q = ext[a], ext[b]
        seg = ext[a + 1:b]
        dx, dy = q - p
        L = math.hypot(dx, dy)
        if L == 0:
            dist = np.hypot(seg[:, 0] - p[0], seg[:, 1] - p[1])
        else:
            dist = np.abs(dy * (seg[:, 0] - p[0]) - dx * (seg[:, 1] - p[1])) / L
        k = int(np.argmax(dist))
        if dist[k] > tol:
            m = a + 1 + k
            keep[m % n] = True
            stack.append((a, m))
            stack.append((m, b))
    return pts[keep]


def ring_area(p):
    x, y = p[:, 0], p[:, 1]
    return 0.5 * float(np.dot(x, np.roll(y, -1)) - np.dot(np.roll(x, -1), y))


def point_in_ring(pt, ring):
    x, y = pt
    xs, ys = ring[:, 0], ring[:, 1]
    xs2, ys2 = np.roll(xs, -1), np.roll(ys, -1)
    cond = (ys > y) != (ys2 > y)
    with np.errstate(divide="ignore", invalid="ignore"):
        xint = xs + (y - ys) * (xs2 - xs) / (ys2 - ys)
    return bool(np.count_nonzero(cond & (x < xint)) % 2)


def polygonize(mask, min_area=2.0, tol=0.4):
    """2値の区域 → 多角形のリスト [[外周, 穴, ...], ...]（画素座標）"""
    rings = edge_rings(boundary_edges(mask), mask.shape[1])
    outers, holes = [], []
    for r in rings:
        mid = (r + np.roll(r, -1, axis=0)) / 2.0  # 角を半画素だけ面取り
        s = simplify(mid, tol)
        if len(s) < 3:
            continue
        a = ring_area(s)
        if abs(a) < min_area:
            continue
        # 画面座標（y 下向き）で、区域を左手に見る向き → 外周は面積が負
        (outers if a < 0 else holes).append((s, abs(a)))
    polys = [[o[0]] for o in outers]
    boxes = [(o[0][:, 0].min(), o[0][:, 1].min(), o[0][:, 0].max(), o[0][:, 1].max()) for o in outers]
    for h, _ in holes:
        pt = h[0]
        best, best_area = None, None
        for k, (o, area) in enumerate(outers):
            b = boxes[k]
            if not (b[0] <= pt[0] <= b[2] and b[1] <= pt[1] <= b[3]):
                continue
            if area <= 0 or (best_area is not None and area >= best_area):
                continue
            if point_in_ring(pt, o):
                best, best_area = k, area
        if best is not None:
            polys[best].append(h)
    return polys


# ---------------------------------------------------------------- 判定・集計
def load():
    cfg = json.loads(CONFIG.read_text(encoding="utf-8"))
    snap = json.loads((DATA / "snapshot.json").read_text(encoding="utf-8"))
    g = Grid(snap)
    idx = {k: np.asarray(Image.open(DATA / f"{k}.png")) for k in ("flood_l2", "keizoku_l2") + DOSHA}
    return cfg, snap, g, idx


def view_bounds(view, w, h):
    """中心と縮尺の分母から、表示範囲 [西, 南, 東, 北]（CSS 96px/inch。map.html と同じ式）"""
    lng, lat = view["center"]
    mpp = view["scaleDenom"] * 0.0254 / 96
    dlng = w * mpp / (111319.49 * math.cos(math.radians(lat)))
    dlat = h * mpp / 111319.49
    return [lng - dlng / 2, lat - dlat / 2, lng + dlng / 2, lat + dlat / 2]


def main() -> None:
    cfg, snap, g, idx = load()
    WORK.mkdir(parents=True, exist_ok=True)
    problems = []

    # 1) 表示範囲がデータの範囲に入るか
    (w0, n0), _, (e0, s0), _ = snap["corners"]
    views = {"a3": view_bounds(cfg["views"]["a3"], *SHEET_PX["a3"]),
             "web": view_bounds(cfg["views"]["web"], cfg["views"]["web"]["width"], cfg["views"]["web"]["height"])}
    for name, (w, s, e, n) in views.items():
        if w < w0 or e > e0 or s < s0 or n > n0:
            problems.append(f"表示範囲 {name} [{w:.5f},{s:.5f},{e:.5f},{n:.5f}] が区域データ [{w0},{s0},{e0},{n0}] からはみ出しています")

    # 2) 区域のマスク
    flood = idx["flood_l2"] > 0
    keikai = {k: idx[k] >= 1 for k in DOSHA}
    toku = {k: idx[k] == 2 for k in DOSHA}
    k_all = np.zeros_like(flood)
    t_all = np.zeros_like(flood)
    for k in DOSHA:
        k_all |= keikai[k]
        t_all |= toku[k]

    # 3) 輪郭 → GeoJSON
    feats = []
    nverts = 0
    for cls, mask in [("K_all", k_all), ("T_all", t_all)] + [(f"K_{k}", keikai[k]) for k in DOSHA]:
        polys = polygonize(mask)
        for poly in polys:
            rings = []
            for r in poly:
                ll = g.to_lnglat(r)
                ring = np.round(ll, 7).tolist()
                ring.append(ring[0])
                rings.append(ring)
                nverts += len(ring)
            feats.append({"type": "Feature", "properties": {"cls": cls}, "geometry": {"type": "Polygon", "coordinates": rings}})
    (WORK / "dosha.geojson").write_text(json.dumps({"type": "FeatureCollection", "features": feats}, separators=(",", ":")), encoding="utf-8")
    print(f"dosha.geojson: {len(feats)} polygons, {nverts} vertices")

    # 4) 地点の判定
    dist_flood = ndimage.distance_transform_edt(~flood)
    dist_dosha = ndimage.distance_transform_edt(~k_all)
    points = []
    for s in cfg["shelters"] + [cfg["hq"]]:
        x, y = g.to_px(s["lng"], s["lat"])
        xi, yi = int(x), int(y)
        mpp = g.mpp(s["lat"])
        f_cls = int(idx["flood_l2"][yi, xi])
        kinds = [k for k in DOSHA if keikai[k][yi, xi]]
        rec = {
            "no": s["no"], "name": s["name"],
            "flood": FLOOD_CLASSES[f_cls - 1] if f_cls else None,
            "keizoku": KEIZOKU_CLASSES[int(idx["keizoku_l2"][yi, xi]) - 1] if idx["keizoku_l2"][yi, xi] else None,
            "dosha": kinds, "dosha_tokubetsu": [k for k in DOSHA if toku[k][yi, xi]],
            "dist_flood_m": round(float(dist_flood[yi, xi]) * mpp, 1),
            "dist_dosha_m": round(float(dist_dosha[yi, xi]) * mpp, 1),
        }
        if s is not cfg["hq"]:
            # 区域の中 → ×。区域から NEAR_M を超えて離れている → ○。その間（区域のすぐ外）は config の判断を認め、備考に理由を書く
            rec["judge"] = {}
            for key, inside, dist in (("flood", bool(f_cls), rec["dist_flood_m"]), ("dosha", bool(kinds), rec["dist_dosha_m"])):
                want = "×" if inside else ("○" if dist > NEAR_M else "○×")
                rec["judge"][key] = want
                if s[key] not in want:
                    problems.append(f"避難所 {s['no']} {s['name']}: config は {key}={s[key]}、区域データでは {want}（区域まで {dist}m）")
                elif want == "○×" and s[key] == "×" and not s.get("note"):
                    problems.append(f"避難所 {s['no']} {s['name']}: 区域のすぐ外を × にしたときは備考に理由を書く")
        points.append(rec)
    (WORK / "points.json").write_text(json.dumps(points, ensure_ascii=False, indent=1), encoding="utf-8")
    for p in points:
        print(f"  {p['no']:>2} {p['name']}: 浸水={p['flood']} 継続={p['keizoku']} 土砂={p['dosha'] or '-'}"
              f" 特別={p['dosha_tokubetsu'] or '-'}  最寄り 浸水{p['dist_flood_m']}m 土砂{p['dist_dosha_m']}m")

    # 5) 立入禁止区域と法の区域の重なり
    img = Image.new("L", (g.w, g.h), 0)
    ImageDraw.Draw(img).polygon([g.to_px(lng, lat) for lng, lat in cfg["ban"]["polygon"]], fill=1)
    ban = np.asarray(img).astype(bool)
    over = {"flood": int((ban & flood).sum()), "dosha": int((ban & k_all).sum())}
    print(f"立入禁止区域: {int(ban.sum())} 画素、浸水と重なり {over['flood']}、土砂と重なり {over['dosha']}、"
          f"最寄りの土砂の区域まで {round(float(dist_dosha[ban].min()) * g.mpp(36.055), 1)}m")
    if over["flood"] or over["dosha"]:
        problems.append(f"立入禁止区域が法の区域と重なっています {over}")

    # 6) 町名・地区ごとの集計（半径250m）
    yy, xx = np.mgrid[0:g.h, 0:g.w]
    stats = {"towns": {}, "districts": {}}
    dmask = {}
    for t in cfg["towns"]:
        x, y = g.to_px(t["lng"], t["lat"])
        r = 250 / g.mpp(t["lat"])
        m = (xx - x) ** 2 + (yy - y) ** 2 <= r * r
        dmask.setdefault(t["district"], np.zeros_like(m))
        dmask[t["district"]] |= m
        stats["towns"][t["name"]] = summarize(m, idx, keikai, toku)
    for d, m in dmask.items():
        stats["districts"][d] = summarize(m, idx, keikai, toku)
    (WORK / "stats.json").write_text(json.dumps(stats, ensure_ascii=False, indent=1), encoding="utf-8")
    print("町名・地区ごと（半径250m。%）:")
    for kind in ("towns", "districts"):
        for name, s in stats[kind].items():
            print(f"  {name}: {s['text']}")

    if problems:
        print("prepare: 問題 %d 件" % len(problems))
        for p in problems:
            print("  - " + p)
        sys.exit(1)
    print("prepare: ok")


def summarize(m, idx, keikai, toku):
    n = int(m.sum())
    pct = lambda a: round(100.0 * int((a & m).sum()) / n, 1)
    out = {"flood": {c: pct(idx["flood_l2"] == i + 1) for i, c in enumerate(FLOOD_CLASSES)},
           "keizoku": {c: pct(idx["keizoku_l2"] == i + 1) for i, c in enumerate(KEIZOKU_CLASSES)},
           "keikai": {k: pct(keikai[k]) for k in DOSHA}, "tokubetsu": {k: pct(toku[k]) for k in DOSHA}}
    parts = [f"浸水 {c} {v}" for c, v in out["flood"].items() if v] + \
            [f"継続 {c} {v}" for c, v in out["keizoku"].items() if v >= 5] + \
            [f"{k}警戒 {v}" for k, v in out["keikai"].items() if v] + \
            [f"{k}特別 {v}" for k, v in out["tokubetsu"].items() if v]
    out["text"] = "、".join(parts) or "区域なし"
    return out


if __name__ == "__main__":
    main()
