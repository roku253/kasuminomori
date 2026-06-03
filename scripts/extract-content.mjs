import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, "..");
const ARCHIVE = path.join(ROOT, "archive");
const OUT_DIR = path.join(ROOT, "src", "content", "pages");
const MANIFEST_PATH = path.join(ROOT, "src", "content", "manifest.json");

const SKIP = new Set(["partials", "node_modules", ".next", "out", "public", "src", "legacy", "archive"]);
const SKIP_FILES = new Set(["index.html"]);

function walkHtml(dir, base = "") {
  const results = [];
  if (!fs.existsSync(dir)) return results;
  for (const name of fs.readdirSync(dir)) {
    const full = path.join(dir, name);
    const rel = base ? `${base}/${name}` : name;
    if (fs.statSync(full).isDirectory()) {
      if (SKIP.has(name)) continue;
      results.push(...walkHtml(full, rel));
    } else if (name.endsWith(".html")) {
      results.push(rel.replace(/\\/g, "/"));
    }
  }
  return results;
}

function collectHtmlSources() {
  const fromRoot = walkHtml(ROOT).filter((f) => {
    if (f.startsWith("partials/")) return false;
    if (f === "index.html") return false;
    const top = f.split("/")[0];
    if (SKIP.has(top)) return false;
    return true;
  });
  const fromArchive = fs.existsSync(ARCHIVE)
    ? walkHtml(ARCHIVE, "archive").filter((f) => !f.endsWith("/index.html") && f !== "archive/index.html")
    : [];
  return [...fromRoot, ...fromArchive];
}

function stripTags(html) {
  return html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
}

function extractTitle(html) {
  const m = html.match(/<title>([^<]*)<\/title>/i);
  return m ? m[1].trim() : "";
}

function extractMetaDesc(html) {
  const m = html.match(/<meta\s+name="description"\s+content="([^"]*)"/i);
  return m ? m[1].trim() : "";
}

function extractCanonical(html) {
  const m = html.match(/<link\s+rel="canonical"\s+href="([^"]*)"/i);
  return m ? m[1].trim() : undefined;
}

function parseBreadcrumbs(bcHtml) {
  const items = [];
  const parts = bcHtml.split(/&nbsp;›&nbsp;|›/);
  for (const part of parts) {
    const trimmed = part.trim();
    if (!trimmed) continue;
    const link = trimmed.match(/<a\s+href="([^"]*)"[^>]*>([^<]*)<\/a>/i);
    if (link) items.push({ label: link[2].trim(), href: link[1] });
    else items.push({ label: stripTags(trimmed) });
  }
  return items;
}

function parseRelated(html) {
  const m = html.match(/<aside class="city-related">([\s\S]*?)<\/aside>/i);
  if (!m) return [];
  const links = [];
  const re = /<li([^>]*)><a\s+href="([^"]*)"[^>]*>([^<]*)<\/a>/gi;
  let match;
  while ((match = re.exec(m[1])) !== null) {
    links.push({
      href: match[2],
      label: match[3].trim(),
      storyClue: /data-kn-story-clue/.test(match[1]),
    });
  }
  return links;
}

function normalizeRoute(filePath) {
  const normalized = filePath.replace(/^archive\//, "");
  if (normalized === "index.html") return "/";
  let p = normalized.replace(/index\.html$/, "").replace(/\.html$/, "");
  if (!p.endsWith("/")) p += "/";
  return `/${p}`;
}

function pathKeyFromRoute(route) {
  return route === "/" ? "home" : route.replace(/^\/|\/$/g, "").replace(/\//g, "-");
}

function extractCityMain(mainHtml) {
  const h1m = mainHtml.match(/<h1[^>]*>([^<]*)<\/h1>/i);
  const h1 = h1m ? h1m[1].trim() : undefined;
  const paras = [];
  const re = /<p[^>]*>([\s\S]*?)<\/p>/gi;
  let pm;
  while ((pm = re.exec(mainHtml)) !== null) {
    const text = stripTags(pm[1]);
    if (text) paras.push(pm[1].trim());
  }
  const tableM = mainHtml.match(/<table class="city-data"[\s\S]*?<\/table>/i);
  const tableHtml = tableM ? tableM[0] : undefined;
  const asideIdx = mainHtml.indexOf('<aside class="city-related"');
  let extraHtml = mainHtml;
  if (h1m) extraHtml = extraHtml.replace(h1m[0], "");
  for (const p of paras) extraHtml = extraHtml.replace(`<p>${p}</p>`, "").replace(p, "");
  if (tableHtml) extraHtml = extraHtml.replace(tableHtml, "");
  if (asideIdx >= 0) extraHtml = extraHtml.slice(0, asideIdx);
  extraHtml = extraHtml
    .replace(/<nav class="city-breadcrumb"[\s\S]*?<\/nav>/i, "")
    .replace(/<h1[^>]*>[\s\S]*?<\/h1>/i, "")
    .trim();
  const extra = extraHtml.length > 10 ? extraHtml : undefined;
  return { h1, paragraphs: paras.length ? paras : undefined, tableHtml, extraHtml: extra };
}

function extractLegacyMain(html) {
  const contentM = html.match(/<main class="content"([^>]*)>([\s\S]*?)<\/main>/i);
  if (!contentM) return { bodyHtml: "" };
  const attrs = contentM[1];
  const storyClue = /data-kn-story-clue/.test(attrs);
  return {
    bodyHtml: contentM[2].trim(),
    storyClueOnMain: storyClue,
  };
}

function processFile(relPath) {
  const normalized = relPath.replace(/^archive\//, "");
  if (normalized === "index.html") return null;
  const full = relPath.startsWith("archive/")
    ? path.join(ROOT, relPath)
    : path.join(ROOT, relPath);
  const html = fs.readFileSync(full, "utf8");
  const title = extractTitle(html);
  if (/リダイレクト/.test(title)) return null;
  const route = normalizeRoute(relPath);
  let layout = /city-legacy-wrap|class="content"/.test(html) ? "legacy" : "city";
  if (/^\/spot\//.test(route)) layout = "legacy";
  const bcM = html.match(/<nav class="city-breadcrumb"[^>]*>([\s\S]*?)<\/nav>/i);
  const breadcrumbs = bcM ? parseBreadcrumbs(bcM[1]) : [];

  const page = {
    path: normalized,
    route,
    layout,
    title,
    description: extractMetaDesc(html),
    canonical: extractCanonical(html),
    breadcrumbs,
    related: parseRelated(html),
  };

  if (layout === "legacy") {
    const leg = extractLegacyMain(html);
    page.bodyHtml = leg.bodyHtml;
    if (leg.storyClueOnMain) page.storyClueSelectors = ["main.content"];
  } else {
    const mainM = html.match(/<main class="city-page"[^>]*>([\s\S]*?)<\/main>/i);
    if (mainM) {
      const city = extractCityMain(mainM[1]);
      Object.assign(page, city);
    }
  }

  const knErr = html.match(/<p class="kn-print-error"[\s\S]*?<\/p>/i);
  if (knErr) {
    page.extraHtml = (page.extraHtml || "") + knErr[0];
  }

  return page;
}

function buildManifestFromPages(pages) {
  const categories = {};
  const spots = [];
  const legacyRoutes = [];

  for (const page of pages) {
    const parts = page.route.replace(/^\/|\/$/g, "").split("/");
    if (parts[0] === "spot" && parts[1]) spots.push(parts[1]);
    if (page.layout === "legacy") legacyRoutes.push(page.route);

    const cat = parts[0];
    if (cat && ["kurashi", "anzen", "fukushi", "kodomo", "sangyo", "bunka", "shisei"].includes(cat)) {
      if (!categories[cat]) categories[cat] = [];
      const slug = parts.length > 1 ? parts.slice(1).join("/") : "index";
      if (!categories[cat].includes(slug)) categories[cat].push(slug);
    }
  }

  return { pages, categories, spots: [...new Set(spots)], legacyRoutes };
}

function rebuildManifestFromJson() {
  if (!fs.existsSync(OUT_DIR)) {
    console.warn("No JSON pages in src/content/pages — manifest unchanged.");
    return;
  }
  const pages = fs
    .readdirSync(OUT_DIR)
    .filter((f) => f.endsWith(".json"))
    .map((f) => JSON.parse(fs.readFileSync(path.join(OUT_DIR, f), "utf8")));
  pages.sort((a, b) => a.route.localeCompare(b.route, "ja"));
  const manifest = buildManifestFromPages(pages);
  fs.writeFileSync(MANIFEST_PATH, JSON.stringify(manifest, null, 2), "utf8");
  console.log(
    `Rebuilt manifest from ${pages.length} JSON files (HTML source unavailable; edit src/content/pages/*.json directly).`
  );
}

function main() {
  fs.mkdirSync(OUT_DIR, { recursive: true });
  const files = collectHtmlSources();

  if (files.length === 0) {
    rebuildManifestFromJson();
    return;
  }

  const pages = [];
  for (const f of files) {
    const page = processFile(f);
    if (!page) continue;
    pages.push(page);
    const key = pathKeyFromRoute(page.route);
    fs.writeFileSync(path.join(OUT_DIR, `${key}.json`), JSON.stringify(page, null, 2), "utf8");
  }

  const manifest = buildManifestFromPages(pages);
  fs.writeFileSync(MANIFEST_PATH, JSON.stringify(manifest, null, 2), "utf8");
  console.log(`Extracted ${pages.length} pages to ${OUT_DIR}`);
}

main();
