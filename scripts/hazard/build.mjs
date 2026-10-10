/**
 * ハザードマップを作り直す（npm run hazard:build）。手元で実行し、生成物をコミットする。npm run build には入れない。
 *
 * 手順（どれかが失敗したらそこで止める）:
 *   1. prepare.py   区域データ（data/*.png）→ 土砂の輪郭・避難所の ○× の検算（.cache/work）
 *   2. render.mjs   Web 用（web）と A3（a3、2回描き）を Playwright で描く（.cache/out）
 *   3. finish.py    PDF の後処理 → public/pdf/hazard-map.pdf、画像 → public/img/hazard/
 *   4. page.mjs     src/content/pages/anzen-hazard.json の bodyHtml を config.json から作る
 *   5. scripts/pdf/meta.py  src/generated/pdf-meta.json を作り直す（容量・sha256）
 *   6. verify.py    出来上がりの検査（PDF の体裁・メタデータ・語、ページと地図の一致、旧 SVG の参照なし）
 *
 * 要るもの: Python 3（PyMuPDF・Pillow・numpy・scipy・pypdf）、この PC の Chrome、ネット（下地の OpenFreeMap と
 * CDN の MapLibre GL JS）。区域データ（data/*.png）は取得済みのものを使う（取り直すときは fetch_tiles.py → mosaic.py）。
 */
import { spawnSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "..", "..");
const steps = [
  ["python", ["-I", "scripts/hazard/prepare.py"]],
  ["node", ["scripts/hazard/render.mjs", "web"]],
  ["node", ["scripts/hazard/render.mjs", "a3"]],
  ["python", ["-I", "scripts/hazard/finish.py"]],
  ["node", ["scripts/hazard/page.mjs"]],
  ["python", ["scripts/pdf/meta.py"]],
  ["python", ["-I", "scripts/hazard/verify.py"]],
];
for (const [cmd, args] of steps) {
  console.log(`\n> ${cmd} ${args.join(" ")}`);
  const r = spawnSync(cmd, args, { cwd: ROOT, stdio: "inherit", shell: false });
  if (r.status !== 0) {
    console.error(`hazard:build — 失敗（${cmd} ${args.join(" ")}、終了コード ${r.status ?? r.error}）`);
    process.exit(1);
  }
}
console.log("\nhazard:build — 完了。public/pdf/hazard-map.pdf・public/img/hazard/・anzen-hazard.json・pdf-meta.json を確かめてからコミットする。");
