/**
 * manifest の route から sitemap.xml を作る（末尾スラッシュ。旧 .html は入れない）。
 * public/sitemap.xml（書き出しに載る）と、リポジトリ直下の sitemap.xml を同じ内容にする。
 */
import fs from "fs";
import path from "path";
import { fileURLToPath, pathToFileURL } from "url";
import { MANIFEST_PATH, ROOT } from "./build-manifest.mjs";

const SITE = "https://roku253.github.io/kasuminomori";

function esc(s) {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

export function buildSitemap() {
  const manifest = JSON.parse(fs.readFileSync(MANIFEST_PATH, "utf8"));
  const routes = ["/", ...manifest.pages.map((p) => p.route)].filter((r) => !r.includes("playwright-report"));
  const unique = [...new Set(routes)].sort((a, b) => a.localeCompare(b, "ja"));
  const body = unique
    .map((route) => {
      const loc = route === "/" ? `${SITE}/` : `${SITE}${route}`;
      const priority = route === "/" ? "1.0" : route.split("/").filter(Boolean).length === 1 ? "0.8" : "0.6";
      return `  <url><loc>${esc(loc)}</loc><changefreq>monthly</changefreq><priority>${priority}</priority></url>`;
    })
    .join("\n");
  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${body}\n</urlset>\n`;
  const targets = [path.join(ROOT, "public", "sitemap.xml"), path.join(ROOT, "sitemap.xml")];
  let changed = false;
  for (const file of targets) {
    const prev = fs.existsSync(file) ? fs.readFileSync(file, "utf8") : "";
    if (prev !== xml) {
      fs.writeFileSync(file, xml, "utf8");
      changed = true;
    }
  }
  const outFile = path.join(ROOT, "out", "sitemap.xml");
  if (fs.existsSync(path.join(ROOT, "out"))) fs.writeFileSync(outFile, xml, "utf8");
  console.log(`sitemap: ${unique.length} URL${changed ? "（更新）" : "（変更なし）"}`);
  return { count: unique.length, changed };
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  buildSitemap();
}
