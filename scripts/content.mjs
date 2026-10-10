/**
 * 正本（src/content/pages/*.json・src/content/data/*.json）から生成物を作る。
 *   1. src/content/manifest.json   … scripts/build-manifest.mjs（pages の形・ツールの目印・data-pdf の登録も検査）
 *   2. 検索索引（public/search-index.json） … scripts/build-search-index.mjs
 *   3. public/pdf と src/generated/pdf-meta.json の整合（scripts/check-pdf.mjs）。ここでは注意を出すだけで、
 *      ビルド（npm run build）では check:pdf として止める。
 *
 * `npm run content`。`npm run dev`（scripts/dev.mjs）と `npm run build` の先頭でも走る。
 * 旧 `extract-content.mjs`（直下の HTML から pages を作り直す処理）は廃止した。正本は pages/*.json だけ。
 */
import { pathToFileURL } from "url";
import { buildManifest } from "./build-manifest.mjs";
import { buildSearchIndex } from "./build-search-index.mjs";
import { buildSitemap } from "./build-sitemap.mjs";
import { checkPdfMeta } from "./check-pdf.mjs";

export function buildContent(options = {}) {
  buildManifest(options);
  buildSearchIndex(options);
  buildSitemap();
  const problems = checkPdfMeta();
  if (problems.length) {
    const list = problems.map((p) => `  - ${p}`).join("\n");
    console.warn(`[注意] PDF の登録（pdf-meta.json）が public/pdf と合っていません — npm run pdf:meta で作り直してください:\n${list}`);
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  try {
    buildContent();
  } catch (e) {
    console.error(e.message);
    process.exit(1);
  }
}
