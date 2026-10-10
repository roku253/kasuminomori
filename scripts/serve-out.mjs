/**
 * `out/`（next build の静的書き出し）を GitHub Pages と同じ形で配る、依存なしの小さなサーバー（WP6）。
 *
 * - URL の先頭の basePath `/kasuminomori` を外して out/ のファイルを返す（`npx serve out` は basePath を扱えない）。
 * - ディレクトリは index.html、末尾スラッシュの無いディレクトリは「/」付きへ 301（next.config の trailingSlash と同じ形）。
 * - 拡張子の無い URL で同名の .html があればそれを返す（GitHub Pages と同じ）。旧 URL の `*.html` の転送用ページもそのまま返る。
 * - 見つからなければ out/404.html を 404 で返す。basePath の外（/ など）も 404（本番の github.io/ 直下と同じ扱い）。
 * - MIME は拡張子から（html・js・css・json・txt〔RSC〕・svg・png・jpg・webp・pdf・フォントなど）。キャッシュはさせない。
 * - 本番相当の確認（TokenGate が開発モードの bypass に頼らない・icon.png・コンソールエラー）と、
 *   e2e の static project（playwright.config.ts）、`scripts/check-html.mjs` の対象に使う。
 *
 * 実行: node scripts/serve-out.mjs [--port 3457] [--dir out] [--log]     （npm run serve:out）
 *   ポートは --port → 環境変数 PW_STATIC_PORT → 3457 の順。
 * 先に `npm run build` で out/ を作ること（開発サーバと .next を共有するので、開発サーバを止めてから。段階3）。
 */
import fs from "fs";
import http from "http";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, "..");
const BASE_PATH = "/kasuminomori";

function arg(name, fallback) {
  const i = process.argv.indexOf(name);
  return i >= 0 && process.argv[i + 1] ? process.argv[i + 1] : fallback;
}

const PORT = Number(arg("--port", process.env.PW_STATIC_PORT || "3457"));
const DIR = path.resolve(ROOT, arg("--dir", "out"));
const LOG = process.argv.includes("--log");

const TYPES = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".map": "application/json; charset=utf-8",
  ".txt": "text/plain; charset=utf-8",
  ".xml": "application/xml; charset=utf-8",
  ".webmanifest": "application/manifest+json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".gif": "image/gif",
  ".webp": "image/webp",
  ".avif": "image/avif",
  ".ico": "image/x-icon",
  ".pdf": "application/pdf",
  ".csv": "text/csv; charset=utf-8",
  ".geojson": "application/geo+json; charset=utf-8",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
  ".ttf": "font/ttf",
  ".otf": "font/otf",
  ".mp4": "video/mp4",
  ".webm": "video/webm",
};

function send(req, res, status, file) {
  const type = TYPES[path.extname(file).toLowerCase()] || "application/octet-stream";
  const body = fs.readFileSync(file);
  res.writeHead(status, { "Content-Type": type, "Content-Length": body.length, "Cache-Control": "no-cache" });
  res.end(req.method === "HEAD" ? undefined : body);
}

function notFound(req, res) {
  const page = path.join(DIR, "404.html");
  if (fs.existsSync(page)) return send(req, res, 404, page);
  res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
  res.end(req.method === "HEAD" ? undefined : "404 Not Found");
}

/** URL のパス（basePath の後ろ・復号済み）から out/ の中のファイルを決める。out/ の外に出るパスは null */
function resolveFile(rel) {
  const full = path.resolve(DIR, `.${rel}`);
  if (full !== DIR && !full.startsWith(DIR + path.sep)) return null;
  return full;
}

function isDir(p) {
  try {
    return fs.statSync(p).isDirectory();
  } catch {
    return false;
  }
}

function isFile(p) {
  try {
    return fs.statSync(p).isFile();
  } catch {
    return false;
  }
}

function handle(req, res) {
  if (req.method !== "GET" && req.method !== "HEAD") {
    res.writeHead(405, { Allow: "GET, HEAD" });
    return res.end();
  }
  let url;
  let pathname;
  try {
    url = new URL(req.url || "/", "http://localhost");
    pathname = decodeURIComponent(url.pathname);
  } catch {
    return notFound(req, res);
  }
  if (pathname !== BASE_PATH && !pathname.startsWith(`${BASE_PATH}/`)) return notFound(req, res);
  const file = resolveFile(pathname.slice(BASE_PATH.length) || "/");
  if (!file) return notFound(req, res);

  if (isDir(file)) {
    if (!pathname.endsWith("/")) {
      // Location は符号化したままのパスで返す（日本語のパスを生で入れるとヘッダーの不正文字になる）
      res.writeHead(301, { Location: `${url.pathname}/${url.search}` });
      return res.end();
    }
    const index = path.join(file, "index.html");
    return isFile(index) ? send(req, res, 200, index) : notFound(req, res);
  }
  if (isFile(file)) return send(req, res, 200, file);
  if (!path.extname(file) && isFile(`${file}.html`)) return send(req, res, 200, `${file}.html`);
  return notFound(req, res);
}

const server = http.createServer((req, res) => {
  if (LOG) res.on("finish", () => console.log(`[serve-out] ${res.statusCode} ${req.method} ${req.url}`));
  try {
    handle(req, res);
  } catch (e) {
    console.error(`[serve-out] ${req.method} ${req.url}: ${e.message}`);
    if (!res.headersSent) res.writeHead(500, { "Content-Type": "text/plain; charset=utf-8" });
    res.end("500 Internal Server Error");
  }
});

const indexHtml = path.join(DIR, "index.html");
if (!isFile(indexHtml)) {
  console.error(`[serve-out] ${path.relative(ROOT, DIR) || "."}/index.html がありません。先に npm run build で書き出してください（開発サーバを止めてから）。`);
  process.exit(1);
}

// out/ が正本の生成物（manifest）より古いときは注意だけ出す（古い書き出しで検査しても今の状態は分からない）
const manifest = path.join(ROOT, "src", "content", "manifest.json");
if (isFile(manifest) && fs.statSync(indexHtml).mtimeMs < fs.statSync(manifest).mtimeMs) {
  console.warn(`[serve-out] 注意: out/ は src/content/manifest.json より古い書き出しです（${fs.statSync(indexHtml).mtime.toLocaleString("ja-JP")}）。今の状態を見るには npm run build で作り直してください。`);
}

server.on("error", (e) => {
  console.error(`[serve-out] 起動できません: ${e.message}${e.code === "EADDRINUSE" ? `（port ${PORT} は使用中。--port で変えられます）` : ""}`);
  process.exit(1);
});

server.listen(PORT, () => {
  console.log(`[serve-out] ${path.relative(ROOT, DIR) || "."}/ を http://localhost:${PORT}${BASE_PATH}/ で配信中（Ctrl+C で終了）`);
});

for (const sig of ["SIGINT", "SIGTERM"]) {
  process.on(sig, () => server.close(() => process.exit(0)));
}
