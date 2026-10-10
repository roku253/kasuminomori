/**
 * public/pdf/*.pdf と src/generated/pdf-meta.json の整合を Node だけで確かめる（ビルドで使う。Python は要らない）。
 *   - pdf-meta.json に無い PDF（登録漏れ）、pdf-meta.json にあるのに無い PDF、容量・sha256 の食い違い
 * 食い違ったら `npm run pdf:meta`（scripts/pdf/meta.py）で作り直してコミットする。
 *
 * 実行: npm run check:pdf （npm run build の途中でも走る。問題があれば終了コード 1）
 */
import crypto from "crypto";
import fs from "fs";
import path from "path";
import { fileURLToPath, pathToFileURL } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, "..");
export const PDF_DIR = path.join(ROOT, "public", "pdf");
export const PDF_META_PATH = path.join(ROOT, "src", "generated", "pdf-meta.json");

export function readPdfMeta() {
  if (!fs.existsSync(PDF_META_PATH)) return null;
  return JSON.parse(fs.readFileSync(PDF_META_PATH, "utf8"));
}

export function checkPdfMeta() {
  const problems = [];
  const meta = readPdfMeta();
  if (!meta) {
    problems.push("src/generated/pdf-meta.json がありません（npm run pdf:meta で作る）");
    return problems;
  }
  const registered = meta.files || {};
  const onDisk = fs.existsSync(PDF_DIR) ? fs.readdirSync(PDF_DIR).filter((f) => f.toLowerCase().endsWith(".pdf")) : [];
  for (const file of onDisk) {
    const entry = registered[file];
    if (!entry) {
      problems.push(`public/pdf/${file} が pdf-meta.json に登録されていません`);
      continue;
    }
    const data = fs.readFileSync(path.join(PDF_DIR, file));
    if (data.length !== entry.bytes) problems.push(`public/pdf/${file}: 容量が違います（実物 ${data.length} / 登録 ${entry.bytes}）`);
    const sha = crypto.createHash("sha256").update(data).digest("hex");
    if (sha !== entry.sha256) problems.push(`public/pdf/${file}: sha256 が違います（作り直した後に pdf:meta を実行していない）`);
  }
  for (const file of Object.keys(registered)) {
    if (!onDisk.includes(file)) problems.push(`pdf-meta.json の ${file} が public/pdf にありません`);
  }
  return problems;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const problems = checkPdfMeta();
  if (problems.length) {
    console.error(`check:pdf — 問題 ${problems.length} 件（npm run pdf:meta で作り直す）:\n  - ${problems.join("\n  - ")}`);
    process.exit(1);
  }
  const count = Object.keys(readPdfMeta().files || {}).length;
  console.log(`check:pdf — ${count} ファイル、容量・sha256 とも一致`);
}
