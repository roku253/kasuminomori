/**
 * manifest + copy-enrichment + search-config からサイト内検索用 JSON を生成する。
 * 実行: node scripts/build-search-index.mjs
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, "..");
const MANIFEST = path.join(ROOT, "src/content/manifest.json");
const ENRICHMENT = path.join(ROOT, "src/content/copy-enrichment.json");
const SEARCH_CONFIG = path.join(ROOT, "src/content/search-config.json");
const OUT = path.join(ROOT, "public/search-index.json");

const SKIP_ROUTE_RE =
  /playwright|blog\/2021|blog\/2016|spot\/5\.html|legacy/i;

function stripHtml(html) {
  if (!html) return "";
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function truncate(s, max = 160) {
  if (!s || s.length <= max) return s;
  return `${s.slice(0, max)}…`;
}

function titleLabel(title) {
  return (title || "").replace(/｜霞ノ杜町$/, "").trim();
}

function inferTier(route, routeTiers) {
  if (routeTiers[route]) return routeTiers[route];
  if (route.startsWith("/spot/")) return "noise";
  if (route.startsWith("/kurashi/")) return "noise";
  if (route.startsWith("/anzen/")) return "noise";
  if (route.startsWith("/fukushi/")) return "noise";
  if (route.startsWith("/bunka/")) return "noise";
  if (route.startsWith("/sangyo/")) return "noise";
  if (route.startsWith("/kodomo/")) return "noise";
  if (route.startsWith("/shisei/")) return "hub";
  return "noise";
}

function inferCategory(route) {
  if (route.startsWith("/shisei/") || route === "/documents/") return "市政";
  if (route.startsWith("/kurashi/")) return "くらし";
  if (route.startsWith("/anzen/")) return "安全";
  if (route.startsWith("/fukushi/")) return "福祉";
  if (route.startsWith("/kodomo/")) return "子ども";
  if (route.startsWith("/bunka/") || route.startsWith("/spot/")) return "観光";
  if (route.startsWith("/sangyo/")) return "産業";
  if (route === "/history/" || route === "/guide/" || route === "/events/") return "観光";
  if (route.startsWith("/blog/")) return "市政";
  return "その他";
}

/** 核心ページの本文は索引から薄くする（タイトル・カテゴリ語のみ残す） */
function indexableText(route, parts) {
  const joined = parts.filter(Boolean).join(" ");
  if (route === "/documents/") {
    return truncate("公報・資料室 公開資料の索引 議会だより 地域安全通信 広報誌", 160);
  }
  if (route === "/documents/gikai-dayori/") {
    return truncate("議会だより 町議会 公報 公開抜粋", 120);
  }
  if (route === "/shisei/koho-kasumi/") {
    return truncate(
      "広報誌 霞ノ杜 町民 祭り ごみ くらし 行事 バス 健康診断",
      200
    );
  }
  if (route === "/blog/2019/") {
    return truncate(
      "2019年の出来事 地域表彰 安全啓発 烏啼山道周辺 ローカルニュース",
      200
    );
  }
  return truncate(joined, 320);
}

function tokenizeForIdf(text) {
  const tokens = new Set();
  const normalized = text.normalize("NFKC").toLowerCase();
  const words = normalized.match(/[\p{Script=Han}\p{Script=Hiragana}\p{Script=Katakana}A-Za-z0-9]{2,}/gu);
  if (words) words.forEach((w) => tokens.add(w));
  for (const ch of normalized.replace(/\s+/g, "")) {
    if (/[\p{Script=Han}]/u.test(ch)) tokens.add(ch);
  }
  return tokens;
}

function main() {
  const manifest = JSON.parse(fs.readFileSync(MANIFEST, "utf8"));
  const enrichment = JSON.parse(fs.readFileSync(ENRICHMENT, "utf8"));
  const config = JSON.parse(fs.readFileSync(SEARCH_CONFIG, "utf8"));
  const { routeTiers, routeKeywords, storyQueryTerms } = config;

  const docs = [];

  for (const page of manifest.pages) {
    const route = page.route;
    if (!route || SKIP_ROUTE_RE.test(route) || SKIP_ROUTE_RE.test(page.path || "")) {
      continue;
    }

    const extra = enrichment[route] || {};
    const title = titleLabel(page.title || page.h1 || route);
    const description = extra.description || page.description || "";
    const paragraphs = extra.replaceParagraphs
      ? extra.paragraphs || page.paragraphs || []
      : [...(page.paragraphs || []), ...(extra.paragraphs || [])];
    const bodyText = stripHtml(page.bodyHtml || "");
    const snippet = indexableText(route, [
      title,
      description,
      page.h1,
      ...paragraphs,
      bodyText,
    ]);
    const extraKw = routeKeywords[route] || [];
    const keywords = [
      title,
      inferCategory(route),
      ...extraKw,
      ...(page.breadcrumbs || []).map((b) => b.label).filter(Boolean),
    ].filter((v, i, a) => v && a.indexOf(v) === i);

    docs.push({
      route,
      title,
      category: inferCategory(route),
      snippet,
      keywords,
      tier: inferTier(route, routeTiers),
    });
  }

  const df = new Map();
  for (const doc of docs) {
    const blob = `${doc.title} ${doc.snippet} ${doc.keywords.join(" ")}`;
    for (const t of tokenizeForIdf(blob)) {
      df.set(t, (df.get(t) || 0) + 1);
    }
  }
  const n = docs.length;
  const idf = {};
  for (const [term, count] of df.entries()) {
    idf[term] = Math.log((n + 1) / (count + 1)) + 1;
  }

  const payload = {
    generatedAt: new Date().toISOString(),
    pageCount: docs.length,
    storyQueryTerms,
    idf,
    docs,
  };

  fs.mkdirSync(path.dirname(OUT), { recursive: true });
  fs.writeFileSync(OUT, JSON.stringify(payload), "utf8");
  console.log(`Wrote ${docs.length} entries → ${OUT}`);
}

main();
