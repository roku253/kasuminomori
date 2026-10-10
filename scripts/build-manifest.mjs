/**
 * 正本 src/content/pages/*.json から src/content/manifest.json（生成物）を作る。
 *
 * - 町の文言の正本は pages/*.json（と src/content/data/*.json）だけ。manifest.json は手で直さない。
 * - `npm run content` / `npm run dev` / `npm run build` から呼ばれる。
 * - 書き出しは中身が変わったときだけ（開発サーバの無駄な再読み込みを避ける）。
 *
 * 実行: node scripts/build-manifest.mjs
 */
import fs from "fs";
import path from "path";
import { fileURLToPath, pathToFileURL } from "url";
import { isOfficeDay, parseIsoDate, STORY_TODAY } from "../src/lib/date-ja.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
export const ROOT = path.join(__dirname, "..");
export const PAGES_DIR = path.join(ROOT, "src", "content", "pages");
export const MANIFEST_PATH = path.join(ROOT, "src", "content", "manifest.json");

/** manifest の categories に載せる第1階層 */
const CATEGORY_KEYS = ["kurashi", "anzen", "fukushi", "kodomo", "sangyo", "bunka", "shisei"];
/** 画面の <title> の後ろ（src/lib/site.ts の TITLE_SUFFIX と同じ） */
const TITLE_SUFFIX = "｜霞ノ杜町";
/** pages/ にあっても公開ページではないもの */
const IGNORE_FILE = /^playwright-report/;

export const DATA_DIR = path.join(ROOT, "src", "content", "data");
const TOOL_NAMES_PATH = path.join(ROOT, "src", "components", "tools", "tool-names.json");
const TOOL_ATTR_RE = /data-kn-tool="([^"]*)"/g;
const TOOL_MARKER_RE = /<div\s+data-kn-tool="([a-z0-9-]+)"\s*><\/div>/;

/**
 * ツールの目印 <div data-kn-tool="名前"></div> を検査する。
 * 置ける場所: paragraphs の1項目まるごと・tableHtml まるごと・extraHtml の中。
 */
function checkToolMarkers(page, where, names) {
  const errors = [];
  const fields = [
    ...(Array.isArray(page.paragraphs) ? page.paragraphs.map((html, i) => [`paragraphs[${i}]`, html]) : []),
    ["tableHtml", page.tableHtml],
    ["extraHtml", page.extraHtml],
    ["bodyHtml", page.bodyHtml],
  ];
  for (const [field, html] of fields) {
    if (typeof html !== "string" || !html.includes("data-kn-tool")) continue;
    for (const m of html.matchAll(TOOL_ATTR_RE)) {
      if (!names.includes(m[1])) errors.push(`${where} ${field}: 未登録のツール "${m[1]}"（使える名前: ${names.join(", ")}）`);
    }
    if (field === "bodyHtml") {
      errors.push(`${where} ${field}: ツールの目印は paragraphs・tableHtml・extraHtml にだけ置けます`);
      continue;
    }
    if ((field === "tableHtml" || field.startsWith("paragraphs")) && !new RegExp(`^\\s*${TOOL_MARKER_RE.source}\\s*$`).test(html)) {
      errors.push(`${where} ${field}: ここには目印 <div data-kn-tool="名前"></div> だけを書いてください`);
    }
    if (field === "extraHtml" && (html.match(TOOL_ATTR_RE) || []).length !== (html.match(new RegExp(TOOL_MARKER_RE.source, "g")) || []).length) {
      errors.push(`${where} ${field}: 目印は <div data-kn-tool="名前"></div> の形で書いてください`);
    }
  }
  return errors;
}

const PDF_META_PATH = path.join(ROOT, "src", "generated", "pdf-meta.json");
const DATA_PDF_RE = /data-pdf=(["'])([^"']*)\1/g;

/**
 * PDF リンク部品 <a data-pdf="ファイル名"> を検査する: a 要素に付いているか、ファイル名だけか（.pdf）、
 * src/generated/pdf-meta.json（npm run pdf:meta）に登録されているか。
 * 未登録は、開発（npm run dev）では注意にとどめ、ビルド（npm run build、または --strict-pdf）では止める。
 */
function checkPdfLinks(page, where, pdfFiles, strict) {
  const errors = [];
  const warnings = [];
  const fields = [
    ...(Array.isArray(page.paragraphs) ? page.paragraphs.map((html, i) => [`paragraphs[${i}]`, html]) : []),
    ["tableHtml", page.tableHtml],
    ["extraHtml", page.extraHtml],
    ["bodyHtml", page.bodyHtml],
  ];
  for (const [field, html] of fields) {
    if (typeof html !== "string" || !html.includes("data-pdf")) continue;
    for (const m of html.matchAll(DATA_PDF_RE)) {
      const file = m[2];
      const tagStart = html.lastIndexOf("<", m.index);
      if (!/^<a\s/i.test(html.slice(tagStart, m.index + 1))) {
        errors.push(`${where} ${field}: data-pdf="${file}" は <a> に付けてください`);
      }
      if (!/^[\w.-]+\.pdf$/i.test(file)) {
        errors.push(`${where} ${field}: data-pdf にはファイル名だけを書いてください（例 data-pdf="gikai-dayori-098.pdf"。今: "${file}"）`);
      } else if (!pdfFiles || !pdfFiles.includes(file)) {
        const msg = !pdfFiles
          ? `${where} ${field}: data-pdf="${file}" — src/generated/pdf-meta.json がありません（npm run pdf:meta）`
          : `${where} ${field}: data-pdf="${file}" は pdf-meta.json に登録がありません（public/pdf に置いて npm run pdf:meta）`;
        if (strict) errors.push(msg);
        else warnings.push(msg);
      }
    }
  }
  return { errors, warnings };
}

/** organization.json（町の組織）の「課 係」の名前の一覧 */
function ownerNames() {
  const file = path.join(DATA_DIR, "organization.json");
  if (!fs.existsSync(file)) return null;
  const org = JSON.parse(fs.readFileSync(file, "utf8"));
  const names = [];
  for (const d of org.departments || []) {
    if (Array.isArray(d.sections)) for (const s of d.sections) names.push(`${d.name} ${s.name}`);
    else names.push(d.name);
  }
  return names;
}

/** 担当・更新日・お知らせの日付・印刷の仕掛けのフラグを検査する */
function checkPageFields(page, where, owners) {
  const errors = [];
  if (page.owner !== undefined && owners && !owners.includes(page.owner)) {
    errors.push(`${where}: owner "${page.owner}" は organization.json にありません（例: ${owners.slice(0, 3).join("・")}）`);
  }
  const checkDate = (value, label) => {
    if (!parseIsoDate(value)) {
      errors.push(`${where}: ${label} は "2026-08-01" の形の実在する日付で書いてください（今: ${JSON.stringify(value)}）`);
      return false;
    }
    if (value > STORY_TODAY) errors.push(`${where}: ${label} ${value} が作中の現在（${STORY_TODAY}）より後です`);
    return true;
  };
  if (page.updated !== undefined) checkDate(page.updated, "updated");
  if (page.news !== undefined) {
    if (!page.news || typeof page.news !== "object") errors.push(`${where}: news は { "date": "2026-10-09" } の形で書いてください`);
    else if (checkDate(page.news.date, "news.date") && !isOfficeDay(page.news.date)) {
      errors.push(`${where}: お知らせの日付 ${page.news.date} が土日・祝日です（開庁日にしてください）`);
    }
    if (!/^\/shisei\/koho\/[^/]+\/$/.test(page.route)) {
      errors.push(`${where}: お知らせ（news）の route は /shisei/koho/<名前>/ にしてください`);
    }
  }
  if (page.printError !== undefined && typeof page.printError !== "boolean") {
    errors.push(`${where}: printError は true か false で書いてください`);
  }
  // 印刷の仕掛けはフラグだけで置く（文は src/content/data/print-error.json、要素は PrintError.tsx）。本文の HTML に直接書かない
  const htmls = [...(page.paragraphs || []), page.bodyHtml, page.tableHtml, page.extraHtml].filter((h) => typeof h === "string");
  if (htmls.some((h) => h.includes("kn-print-error"))) {
    errors.push(`${where}: 本文に kn-print-error を書かないでください（印刷の仕掛けは "printError": true で置きます）`);
  }
  return errors;
}

/** src/content/data/*.json が JSON として読めるか */
function checkDataFiles() {
  if (!fs.existsSync(DATA_DIR)) return [];
  const errors = [];
  for (const file of fs.readdirSync(DATA_DIR)) {
    if (!file.endsWith(".json")) continue;
    try {
      JSON.parse(fs.readFileSync(path.join(DATA_DIR, file), "utf8"));
    } catch (e) {
      errors.push(`data/${file}: JSON として読めません（${e.message}）`);
    }
  }
  return errors;
}

export function pathKeyFromRoute(route) {
  return route === "/" ? "home" : route.replace(/^\/|\/$/g, "").replace(/\//g, "-");
}

/** pages/*.json を読み、最低限の形を検査して返す（route 順） */
export function loadPages() {
  const errors = [];
  const warnings = [];
  const pages = [];
  const seen = new Map();
  const toolNames = JSON.parse(fs.readFileSync(TOOL_NAMES_PATH, "utf8"));
  const owners = ownerNames();
  const strictPdf = process.env.npm_lifecycle_event === "build" || process.argv.includes("--strict-pdf");
  const pdfFiles = fs.existsSync(PDF_META_PATH)
    ? Object.keys(JSON.parse(fs.readFileSync(PDF_META_PATH, "utf8")).files || {})
    : null;
  for (const file of fs.readdirSync(PAGES_DIR).sort()) {
    if (!file.endsWith(".json") || IGNORE_FILE.test(file)) continue;
    let page;
    try {
      page = JSON.parse(fs.readFileSync(path.join(PAGES_DIR, file), "utf8"));
    } catch (e) {
      errors.push(`${file}: JSON として読めません（${e.message}）`);
      continue;
    }
    const where = `${file}`;
    if (typeof page.route !== "string" || !/^\/(.+\/)?$/.test(page.route)) {
      errors.push(`${where}: route は "/kurashi/gomi/" の形で書いてください（今: ${JSON.stringify(page.route)}）`);
      continue;
    }
    if (`${pathKeyFromRoute(page.route)}.json` !== file) {
      errors.push(`${where}: ファイル名は route から決まる名前（${pathKeyFromRoute(page.route)}.json）にしてください`);
    }
    if (seen.has(page.route)) errors.push(`${where}: route ${page.route} が ${seen.get(page.route)} と重複しています`);
    seen.set(page.route, file);
    if (page.layout !== "city") {
      errors.push(
        `${where}: layout は "city" だけです（旧型 "legacy"＝左メニューのレイアウトは廃止。全ページ CityPageTemplate＋ローカルナビ）`
      );
    }
    if (page.storyClueSelectors !== undefined) {
      errors.push(`${where}: storyClueSelectors は廃止しました。data-kn-story-clue="1" は本文の <li> などに直接書いてください`);
    }
    if (typeof page.title !== "string" || !page.title) errors.push(`${where}: title がありません`);
    // <title> は画面の h1 から作る（src/lib/content/page-label.ts）。JSON の title も「h1｜霞ノ杜町」にそろえておく
    if (typeof page.h1 === "string" && page.h1 && page.title !== `${page.h1}${TITLE_SUFFIX}`) {
      warnings.push(`${where}: title を「${page.h1}${TITLE_SUFFIX}」にしてください（今: ${page.title}。画面の <title> は h1 から作ります）`);
    }
    // 架空の注記はフッター（FICTION_NOTE）。検索に出る description には書かない
    if (typeof page.description === "string" && /架空|フィクション|デモ表示/.test(page.description)) {
      errors.push(`${where}: description に「架空」「フィクション」「デモ表示」を書かないでください（注記はフッターに出します）`);
    }
    if (page.canonical !== undefined && !(typeof page.canonical === "string" && /^\/(.+\/)?$/.test(page.canonical))) {
      errors.push(`${where}: canonical は route の形（例 "/blog/2019/"）で書いてください。ふつうは書かない（route から自動）`);
    }
    if (!Array.isArray(page.breadcrumbs)) errors.push(`${where}: breadcrumbs は配列で書いてください`);
    if (page.paragraphs !== undefined && !Array.isArray(page.paragraphs)) errors.push(`${where}: paragraphs は配列で書いてください`);
    errors.push(...checkToolMarkers(page, where, toolNames));
    errors.push(...checkPageFields(page, where, owners));
    const pdf = checkPdfLinks(page, where, pdfFiles, strictPdf);
    errors.push(...pdf.errors);
    warnings.push(...pdf.warnings);
    pages.push(page);
  }
  errors.push(...checkDataFiles());
  if (errors.length) {
    const err = new Error(`src/content（pages・data）に誤りがあります:\n  - ${errors.join("\n  - ")}`);
    err.contentErrors = errors;
    throw err;
  }
  pages.sort((a, b) => a.route.localeCompare(b.route, "ja"));
  if (warnings.length) console.warn(`[注意] src/content/pages:\n  - ${warnings.join("\n  - ")}`);
  return pages;
}

export function buildManifestFromPages(pages) {
  const categories = {};
  const spots = [];

  for (const page of pages) {
    const parts = page.route.replace(/^\/|\/$/g, "").split("/");
    if (parts[0] === "spot" && parts[1]) spots.push(parts[1]);

    const cat = parts[0];
    if (cat && CATEGORY_KEYS.includes(cat)) {
      if (!categories[cat]) categories[cat] = [];
      const slug = parts.length > 1 ? parts.slice(1).join("/") : "index";
      if (!categories[cat].includes(slug)) categories[cat].push(slug);
    }
  }

  return { pages, categories, spots: [...new Set(spots)] };
}

/** 中身が変わったときだけ書く。戻り値 true＝書いた */
export function writeIfChanged(file, text) {
  const prev = fs.existsSync(file) ? fs.readFileSync(file, "utf8") : null;
  if (prev === text) return false;
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, text, "utf8");
  return true;
}

export function buildManifest({ quiet = false } = {}) {
  const pages = loadPages();
  const manifest = buildManifestFromPages(pages);
  const changed = writeIfChanged(MANIFEST_PATH, JSON.stringify(manifest, null, 2));
  if (!quiet) {
    console.log(`manifest: ${pages.length} ページ${changed ? "（更新）" : "（変更なし）"} → src/content/manifest.json`);
  }
  return { manifest, changed };
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  try {
    buildManifest();
  } catch (e) {
    console.error(e.message);
    process.exit(1);
  }
}
