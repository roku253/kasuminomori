import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, "..");
const OUT = path.join(ROOT, "public");

const REDIRECT_HTML = (target) => `<!DOCTYPE html>
<html lang="ja">
<head>
  <meta charset="UTF-8">
  <meta http-equiv="refresh" content="0; url=${target}">
  <link rel="canonical" href="${target}">
  <title>移転中｜霞ノ杜町</title>
</head>
<body>
  <p><a href="${target}">こちらのURLへ移転しました</a></p>
</body>
</html>
`;

function redirectPathsFromManifest() {
  const manifestPath = path.join(ROOT, "src", "content", "manifest.json");
  if (!fs.existsSync(manifestPath)) return [];
  const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
  return (manifest.pages || [])
    .map((p) => p.path)
    .filter((p) => p && !p.endsWith("index.html"));
}

function main() {
  const base = "/kasuminomori";
  let count = 0;
  // 旧 .html の URL は manifest（正本 pages/*.json の path）から作る。
  // 以前はリポ直下の .html を探していたが、playwright-report 等の .html を拾って誤ったスタブを作るので廃止。
  const relPaths = redirectPathsFromManifest();
  for (const rel of relPaths) {
    const withoutExt = rel.replace(/\.html$/, "");
    const target = `${base}/${withoutExt}/`;
    const outPath = path.join(OUT, rel);
    fs.mkdirSync(path.dirname(outPath), { recursive: true });
    fs.writeFileSync(outPath, REDIRECT_HTML(target), "utf8");
    count++;
  }
  if (!fs.existsSync(path.join(OUT, ".nojekyll"))) {
    fs.writeFileSync(path.join(OUT, ".nojekyll"), "");
  }
  const robots = path.join(ROOT, "robots.txt");
  if (fs.existsSync(robots)) {
    fs.copyFileSync(robots, path.join(OUT, "robots.txt"));
  }
  const sitemap = path.join(ROOT, "sitemap.xml");
  if (fs.existsSync(sitemap)) {
    fs.copyFileSync(sitemap, path.join(OUT, "sitemap.xml"));
  }
  console.log(`Generated ${count} .html redirect stubs in public/`);
}

main();
