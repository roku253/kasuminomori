/**
 * サイト内検索の索引 public/search-index.json を作る（ブラウザが検索を始めるときに読み込む）。
 *
 * - 対象: manifest（正本 pages/*.json）の全ページ。`"searchExclude": true` のページは入れない。
 * - 照合に使う文: 題名・検索語（searchKeywords）・見出し・説明文（description）・本文の全文
 *   （h1・paragraphs・bodyHtml・tableHtml・extraHtml。ツールの目印はツールが画面に出す文に置き換える）。
 * - **PDF の中身は入れない**（資料は資料室から開く。合意 v1 割れ目 A）。
 * - 結果に出すのは 題名・分類・説明文 だけ（本文の抜粋は出さない）。
 * - 分類はパンくずの2つ目（例「くらし・環境」）。手書きの説明文・物語へ誘導する語・順位の減点は持たない。
 * - 同義語は src/content/data/search.json（日常語だけ）。
 * - 文字の正規化は src/lib/normalize.ts と同じ（NFKC・小文字・カタカナ→ひらがな・空白1つ）。
 *
 * 実行: node scripts/build-search-index.mjs（npm run content / dev / build から呼ばれる）
 */
import fs from "fs";
import path from "path";
import { fileURLToPath, pathToFileURL } from "url";
import { writeIfChanged } from "./build-manifest.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, "..");
const MANIFEST = path.join(ROOT, "src/content/manifest.json");
const DATA_DIR = path.join(ROOT, "src/content/data");
const OUT_PUBLIC = path.join(ROOT, "public/search-index.json");

/** src/lib/normalize.ts の normalizeForMatch と同じ */
export function normalizeForMatch(text) {
  return String(text ?? "")
    .normalize("NFKC")
    .toLowerCase()
    .replace(/[ァ-ヶ]/g, (ch) => String.fromCharCode(ch.charCodeAt(0) - 0x60))
    .replace(/\s+/g, " ")
    .trim();
}

function decodeEntities(text) {
  return text
    .replace(/&nbsp;/g, " ")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&amp;/g, "&");
}

function stripHtml(html) {
  if (!html) return "";
  return decodeEntities(
    html
      .replace(/<script[\s\S]*?<\/script>/gi, " ")
      .replace(/<style[\s\S]*?<\/style>/gi, " ")
      .replace(/<aside\s+class="city-related"[\s\S]*?(<\/aside>|$)/gi, " ")
      .replace(/<[^>]+>/g, " ")
  )
    .replace(/\s+/g, " ")
    .trim();
}

function headingsOf(html) {
  if (!html) return [];
  const body = html.replace(/<aside\s+class="city-related"[\s\S]*?(<\/aside>|$)/gi, " ");
  return [...body.matchAll(/<h[2-4][^>]*>([\s\S]*?)<\/h[2-4]>/gi)].map((m) => stripHtml(m[1])).filter(Boolean);
}

function readData(name) {
  const file = path.join(DATA_DIR, `${name}.json`);
  return fs.existsSync(file) ? JSON.parse(fs.readFileSync(file, "utf8")) : null;
}

/** ツールの目印を、そのツールが最初から画面に出す文に置き換えるための文（検索結果に出る文ではなく照合用） */
function toolTexts() {
  const gomi = readData("gomi");
  const procedures = readData("procedures");
  const bus = readData("bus");
  const facilities = readData("facilities");
  const rows = (list, a, b) => (list || []).map((r) => `${r[a]} ${r[b]}`).join(" ");
  return {
    "gomi-calendar": rows(gomi?.calendar, "area", "schedule"),
    "gomi-search": gomi ? `${gomi.ui.label} ${rows(gomi.items, "name", "bin")}` : "",
    "procedure-search": procedures ? `${procedures.search.ui.label} ${rows(procedures.search.items, "name", "office")}` : "",
    "procedure-navi": rows(procedures?.navi, "scene", "steps"),
    "online-procedures": rows(procedures?.online, "label", "value"),
    "bus-timetable": rows(bus?.timetable, "label", "value"),
    "bus-status": rows(bus?.status, "label", "value"),
    "facility-finder": facilities
      ? `${facilities.ui.label} ${(facilities.items || []).map((f) => (f.area ? `${f.name}（${f.area}）` : f.name)).join(" ")}`
      : "",
    "site-search": "",
    sitemap: "",
    "news-list": "",
  };
}

function expandTools(html, tools) {
  if (!html) return "";
  return html.replace(/<div\s+data-kn-tool="([a-z0-9-]+)"\s*><\/div>/g, (_m, name) => ` ${tools[name] ?? ""} `);
}

function titleLabel(title) {
  return (title || "").replace(/｜霞ノ杜町$/, "").trim();
}

/** 分類: パンくずの2つ目（トップの次）。無ければ「その他」 */
function categoryOf(page) {
  const crumbs = page.breadcrumbs || [];
  return crumbs.length >= 2 && crumbs[1].label ? crumbs[1].label : "その他";
}

export function buildSearchIndex({ quiet = false } = {}) {
  const manifest = JSON.parse(fs.readFileSync(MANIFEST, "utf8"));
  const searchData = readData("search") || { synonyms: {} };
  const tools = toolTexts();

  const synonyms = {};
  for (const [key, list] of Object.entries(searchData.synonyms || {})) {
    const k = normalizeForMatch(key);
    const merged = new Set([...(synonyms[k] || []), ...list.map(normalizeForMatch)]);
    merged.delete(k);
    synonyms[k] = [...merged];
  }

  const docs = [];
  for (const page of manifest.pages) {
    if (!page.route || page.searchExclude) continue;
    // 題名は画面の h1（＝<title> の前半。src/lib/content/page-label.ts と同じ規則）
    const title = titleLabel(page.h1 || page.title || page.route);
    const htmlParts = [...(page.paragraphs || []), page.bodyHtml, page.tableHtml, page.extraHtml]
      .filter(Boolean)
      .map((html) => expandTools(html, tools));
    const text = [page.h1, ...htmlParts.map(stripHtml)].filter(Boolean).join(" ");
    const headings = htmlParts.flatMap(headingsOf);
    docs.push({
      route: page.route,
      title,
      category: categoryOf(page),
      description: page.description || "",
      t: normalizeForMatch(`${title} ${page.h1 || ""}`),
      k: normalizeForMatch((page.searchKeywords || []).join(" ")),
      h: normalizeForMatch(headings.join(" ")),
      d: normalizeForMatch(page.description || ""),
      x: normalizeForMatch(text),
    });
  }

  const payload = { version: 2, synonyms, docs };
  const changed = writeIfChanged(OUT_PUBLIC, JSON.stringify(payload));
  if (!quiet) {
    console.log(`検索索引: ${docs.length} ページ${changed ? "（更新）" : "（変更なし）"} → public/search-index.json`);
  }
  return { payload, changed };
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  buildSearchIndex();
}
