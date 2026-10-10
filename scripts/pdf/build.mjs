/**
 * 町の文書の PDF を作る（手元で実行する。build・CI には入れない。PDF と pdf-meta.json をコミットする）。
 *
 *   npm run pdf:build                       → docs/*.mjs の全文書
 *   npm run pdf:build -- gikai-r1-09        → 指定した文書だけ
 *   npm run pdf:build -- --shots <dir>      → 各ページの確認用画像（PNG）も書く
 *   そのあと npm run pdf:meta（src/generated/pdf-meta.json を更新）→ npm run check:pdf
 *
 * 流れ（1 文書ごと）:
 *   1. docs/<id>.mjs（文書のデータ）を templates/<template>.mjs（組版）で HTML にする。1 ページ＝ <section class="page">（210×297mm）。
 *   2. この PC の Chrome（Playwright の channel:"chrome"。同梱ブラウザは版違いのため使わない）で開き、print のメディアで
 *      組版を検査する（lib/layout-check.mjs）。はみ出し・区画の外・ページ数違い・画像やフォントの読み込み失敗があれば止める。
 *   3. page.pdf（A4・背景あり・タグ付き・しおり）→ .cache/raw/<id>.pdf
 *   4. post.py: 文書情報と XMP を作中の値にし、ツールの痕跡を消す（scripts/hazard/pdf_post.py の finalize_pdf を共有）。
 *      ページ数・寸法・フォント（OFL の BIZ UDP だけ）・語の有無・文字の無いページ・容量（5MB）を確かめて public/pdf/ に置く。
 *   部分開示の写し（template.raster）は、先に写しのページを 240dpi の画像にし（帯の下に文字は無い。原文はデータにも無い）、
 *   post.py scan でスキャン風に整えてから、1 ページ 1 枚の画像として PDF に入れる。
 */
import { spawnSync } from "node:child_process";
import { createRequire } from "node:module";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { documentHtml, fileUrl, FONT_NAME_PATTERN } from "./lib/html.mjs";
import { layoutCheck } from "./lib/layout-check.mjs";
import { checkTownConstants } from "./lib/town.mjs";

const require = createRequire(import.meta.url);
const { chromium } = require("playwright");

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(HERE, "..", "..");
const CACHE = path.join(HERE, ".cache");
const PUBLIC_PDF = path.join(ROOT, "public", "pdf");
const PYTHON = process.env.PYTHON || "python";

/** すべての PDF に書かない語（tester K-05。空白・改行を除いて照合） */
const ALWAYS_FORBIDDEN = ["黒塗り", "渡辺", "佐藤", "さとう", "青木", "大野", "川村", "年生", "神隠し", "町長の孫", "TODO", "ダミー", "lorem", "フィクション", "架空"];
/** 仮の文字（プレースホルダ）。表の隣り合うセルを誤って拾わないよう、1 行の中で照合 */
const PLACEHOLDERS = ["○○", "◯◯", "△△", "××", "ＸＸ", "XX", "〇〇"];

const args = process.argv.slice(2);
let shots = null;
const ids = [];
for (let i = 0; i < args.length; i++) {
  if (args[i] === "--shots") shots = path.resolve(args[++i]);
  else ids.push(args[i]);
}

const docFiles = fs
  .readdirSync(path.join(HERE, "docs"))
  .filter((f) => f.endsWith(".mjs") && !f.startsWith("_"))
  .map((f) => f.replace(/\.mjs$/, ""));
const targets = ids.length ? ids : docFiles;
for (const id of targets) {
  if (!docFiles.includes(id)) {
    console.error(`文書がありません: docs/${id}.mjs`);
    process.exit(2);
  }
}

checkTownConstants();
for (const dir of ["html", "raw", "raster", "spec"]) fs.mkdirSync(path.join(CACHE, dir), { recursive: true });

const browser = await chromium.launch({ channel: "chrome", headless: true });
let failed = 0;
try {
  for (const id of targets) {
    try {
      await buildOne(id);
    } catch (e) {
      failed++;
      console.error(`\n✗ ${id}: ${e.message}`);
    }
  }
} finally {
  await browser.close();
}
if (failed) {
  console.error(`\npdf:build — ${failed} 件が止まりました`);
  process.exit(1);
}
console.log(`\npdf:build — ${targets.length} 件。続けて npm run pdf:meta と npm run check:pdf を実行する`);

async function openChecked(html, name, { expectedPages, dpr = 1 }) {
  const htmlPath = path.join(CACHE, "html", `${name}.html`);
  fs.writeFileSync(htmlPath, html, "utf8");
  const ctx = await browser.newContext({ viewport: { width: 794, height: 1123 }, deviceScaleFactor: dpr, locale: "ja-JP" });
  const page = await ctx.newPage();
  const errors = [];
  page.on("pageerror", (e) => errors.push(`pageerror: ${e.message}`));
  page.on("requestfailed", (r) => errors.push(`読み込み失敗: ${r.url().slice(-80)}`));
  page.on("console", (m) => m.type() === "error" && errors.push(`console: ${m.text().slice(0, 200)}`));
  await page.emulateMedia({ media: "print" });
  await page.goto(pathToFileURL(htmlPath).href, { waitUntil: "load" });
  await page.evaluate(async () => {
    await document.fonts.ready;
    await Promise.all([...document.images].map((img) => (img.complete ? null : new Promise((r) => (img.onload = img.onerror = r)))));
  });
  const problems = [...errors, ...(await page.evaluate(layoutCheck, { expectedPages }))];
  if (problems.length) {
    await ctx.close();
    throw new Error(`組版の検査で ${problems.length} 件（${path.relative(ROOT, htmlPath)}）:\n  - ${problems.slice(0, 40).join("\n  - ")}`);
  }
  return { ctx, page };
}

function runPost(spec, name) {
  const specPath = path.join(CACHE, "spec", `${name}.json`);
  fs.writeFileSync(specPath, JSON.stringify(spec, null, 1), "utf8");
  const r = spawnSync(PYTHON, [path.join(HERE, "post.py"), specPath], { stdio: "inherit" });
  if (r.status !== 0) throw new Error(`post.py が止まりました（${name}）`);
}

async function buildOne(id) {
  const doc = (await import(pathToFileURL(path.join(HERE, "docs", `${id}.mjs`)).href)).default;
  const tpl = (await import(pathToFileURL(path.join(HERE, "templates", `${doc.template}.mjs`)).href)).default;
  console.log(`\n■ ${id}（${doc.meta.title}）`);

  // 1. 部分開示の写しなど、画像にして入れるページ
  const raster = {};
  if (tpl.raster) {
    for (const r of tpl.raster(doc)) {
      const html = documentHtml({ title: r.name, styles: r.styles, pages: r.pages });
      const { ctx, page } = await openChecked(html, `${id}-${r.name}`, { expectedPages: r.pages.length, dpr: r.dpi / 96 });
      const els = await page.$$(".page");
      for (let i = 0; i < els.length; i++) {
        const png = path.join(CACHE, "raster", `${id}-${r.name}-${i + 1}.png`);
        const jpg = path.join(CACHE, "raster", `${id}-${r.name}-${i + 1}.jpg`);
        await els[i].screenshot({ path: png, type: "png" });
        runPost({ mode: "scan", src: png, dst: jpg, dpi: r.dpi, ...(r.scan?.[i] || {}) }, `${id}-${r.name}-${i + 1}-scan`);
        (raster[r.name] ||= []).push(fileUrl(jpg));
      }
      await ctx.close();
    }
  }

  // 2. 本体
  const rendered = tpl.render(doc, { raster });
  const html = documentHtml({ title: doc.meta.title, styles: rendered.styles, pages: rendered.pages });
  const { ctx, page } = await openChecked(html, id, { expectedPages: doc.pages });
  const raw = path.join(CACHE, "raw", `${id}.pdf`);
  await page.pdf({ path: raw, preferCSSPageSize: true, printBackground: true, tagged: true, outline: true, margin: { top: 0, right: 0, bottom: 0, left: 0 } });
  await ctx.close();

  // 3. 後処理と検査
  const c = doc.checks || {};
  runPost(
    {
      mode: "finalize",
      src: raw,
      dst: path.join(PUBLIC_PDF, doc.file),
      meta: doc.meta,
      pages: doc.pages,
      fontPattern: FONT_NAME_PATTERN,
      mustContain: c.mustContain || [],
      mustNotContain: [...ALWAYS_FORBIDDEN, ...(c.mustNotContain || [])],
      placeholders: PLACEHOLDERS,
      textlessPages: c.textlessPages || [],
      maxBytes: c.maxBytes || 5 * 1024 * 1024,
      shots: shots ? path.join(shots, id) : null,
    },
    id,
  );
}
