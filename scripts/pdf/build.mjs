/**
 * 町の文書の PDF を作る（手元で実行する。build・CI には入れない。PDF と pdf-meta.json をコミットする）。
 *
 *   npm run pdf:build                       → docs/*.mjs の全文書
 *   npm run pdf:build -- gikai-r1-09        → 指定した文書だけ
 *   npm run pdf:build -- --shots <dir>      → 各ページの確認用画像（PNG）も書く
 *   そのあと npm run pdf:meta（src/generated/pdf-meta.json を更新）→ npm run check:pdf
 *
 * 流れ（1 文書ごと）:
 *   1. docs/<id>.mjs を JSON にする（typst/prepare.mjs）。
 *   2. typst compile。システム字体は使わず、scripts/pdf/fonts だけを埋め込む。
 *   3. post.py で作中の文書情報に直し、許可フォント・語の有無・文字の無いページ・容量を確かめる。
 * 部分開示の 2〜3 ページは joho_raster.py が文字の無い画像にする。Chrome は使わない。
 */
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { FONT_NAME_PATTERN } from "./lib/html.mjs";
import { checkTownConstants } from "./lib/town.mjs";
import { prepareAnzen, prepareFlow, prepareJoho, prepareKoho, writePayload } from "./typst/prepare.mjs";

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
for (const dir of ["typst-data", "raw", "raster", "spec"]) fs.mkdirSync(path.join(CACHE, dir), { recursive: true });

const TYPST = process.env.TYPST || "typst";
let failed = 0;
for (const id of targets) {
  try {
    await buildOne(id);
  } catch (e) {
    failed++;
    console.error(`\n✗ ${id}: ${e.message}`);
  }
}
if (failed) {
  console.error(`\npdf:build — ${failed} 件が止まりました`);
  process.exit(1);
}
console.log(`\npdf:build — ${targets.length} 件。続けて npm run pdf:meta と npm run check:pdf を実行する`);

function runPost(spec, name) {
  const specPath = path.join(CACHE, "spec", `${name}.json`);
  fs.writeFileSync(specPath, JSON.stringify(spec, null, 1), "utf8");
  const r = spawnSync(PYTHON, [path.join(HERE, "post.py"), specPath], { stdio: "inherit" });
  if (r.status !== 0) throw new Error(`post.py が止まりました（${name}）`);
}

function typstCompile(template, dataFile, outPdf) {
  const dataRel = "/" + path.relative(ROOT, dataFile).split(path.sep).join("/");
  const r = spawnSync(
    TYPST,
    [
      "compile",
      "--root",
      ROOT,
      "--font-path",
      path.join(HERE, "fonts"),
      "--ignore-system-fonts",
      "--input",
      `data=${dataRel}`,
      path.join(HERE, "typst", template),
      outPdf,
    ],
    { stdio: "inherit" },
  );
  if (r.status !== 0) throw new Error(`typst compile が止まりました（${template}）`);
}

function pageCount(pdf) {
  const r = spawnSync(PYTHON, ["-c", "import fitz,sys; print(fitz.open(sys.argv[1]).page_count)", pdf], { encoding: "utf8" });
  if (r.status !== 0) throw new Error(r.stderr || "ページ数が読めません");
  return Number(String(r.stdout).trim());
}

async function buildOne(id) {
  const doc = (await import(pathToFileURL(path.join(HERE, "docs", `${id}.mjs`)).href)).default;
  console.log(`\n■ ${id}（${doc.meta.title}）`);
  const dataDir = path.join(CACHE, "typst-data");
  let template = "flow.typ";
  let payload;
  if (doc.template === "koho") {
    template = "koho.typ";
    payload = prepareKoho(doc);
  } else if (doc.template === "anzen") {
    template = "anzen.typ";
    payload = prepareAnzen(doc);
  } else if (doc.template === "joho") {
    template = "joho.typ";
    const rasterDir = path.join(CACHE, "raster");
    const drawn = spawnSync(PYTHON, [path.join(HERE, "joho_raster.py"), rasterDir], { encoding: "utf8" });
    if (drawn.status !== 0) throw new Error(drawn.stderr || drawn.stdout || "写しの画像に失敗");
    const rel = (abs) => "/" + path.relative(ROOT, abs).split(path.sep).join("/");
    payload = prepareJoho(doc, rel(path.join(rasterDir, "joho-p2.jpg")), rel(path.join(rasterDir, "joho-p3.jpg")));
  } else {
    payload = prepareFlow(doc);
  }
  const dataFile = writePayload(dataDir, id, payload);
  const raw = path.join(CACHE, "raw", `${id}.pdf`);
  typstCompile(template, dataFile, raw);
  const pages = pageCount(raw);
  const c = doc.checks || {};
  runPost(
    {
      mode: "finalize",
      src: raw,
      dst: path.join(PUBLIC_PDF, doc.file),
      meta: doc.meta,
      pages,
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
