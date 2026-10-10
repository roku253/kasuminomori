/**
 * ハザードマップを Playwright でヘッドレス描画する（npm run hazard:build の中で呼ばれる。build には入れない）。
 *
 *   node scripts/hazard/render.mjs web              → .cache/out/web.png（地図＋出典帯。960px 幅×2倍）
 *   node scripts/hazard/render.mjs a3               → .cache/out/a3-map.jpg（地図＋縁取り 300dpi）, a3-raw.pdf（A3 横1ページ）
 *   node scripts/hazard/render.mjs diag <lng> <lat> [縮尺の分母]  → 指定点の周りの建物・公園の一覧と拡大図（置き場所を決める用）
 *
 * - 材料: config.json（正本）、style/liberty.json（下地の写し）、data/flood_l2.png、.cache/work/dosha.geojson（prepare.py）。
 * - 下地は OpenFreeMap（OSM）を描画のたびに取る。MapLibre GL JS は CDN から版固定＋SRI。どちらもネットが要る。
 * - A3 は2回描く: 1回目は地図と文字の白い縁取りだけを 300dpi の画像にし、2回目はその画像の上に縁取りなしの文字を置いて
 *   page.pdf にする（PDF から地名の文字が1回ずつだけ取り出せる）。
 * - 止める条件（終了コード1）: ページのエラー、取得の失敗、文字・記号の重なり、地図枠・右欄・出典帯からのはみ出し。
 */
import { createRequire } from "node:module";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const require = createRequire(import.meta.url);
const { chromium } = require("playwright");

const HERE = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.join(HERE, ".cache", "out");
const WORK = path.join(HERE, ".cache", "work");
const readJson = (p) => JSON.parse(fs.readFileSync(p, "utf8"));

const [, , mode = "web", ...rest] = process.argv;
if (!["web", "a3", "diag"].includes(mode)) {
  console.error("usage: node render.mjs web|a3|diag <lng> <lat> [scaleDenom]");
  process.exit(2);
}
fs.mkdirSync(OUT, { recursive: true });

const config = readJson(path.join(HERE, "config.json"));
const snapshot = readJson(path.join(HERE, "data", "snapshot.json"));
const doshaPath = path.join(WORK, "dosha.geojson");
if (!fs.existsSync(doshaPath)) {
  console.error("先に python scripts/hazard/prepare.py を実行する（.cache/work/dosha.geojson がありません）");
  process.exit(1);
}
const isA3 = mode === "a3";
let view = isA3 ? config.views.a3 : config.views.web;
let diagPoint = null;
if (mode === "diag") {
  const [lng, lat, denom] = rest.map(Number);
  diagPoint = [lng, lat];
  view = { center: [lng, lat], scaleDenom: denom || 2500, scaleBarMeters: 50 };
}
const DPR = isA3 ? 300 / 96 : 2;

const cfg = {
  mode: isA3 ? "a3" : "web",
  view,
  config,
  style: readJson(path.join(HERE, "style", "liberty.json")),
  floodUrl: "data:image/png;base64," + fs.readFileSync(path.join(HERE, "data", "flood_l2.png")).toString("base64"),
  corners: snapshot.corners,
  dosha: readJson(doshaPath),
  floodOpacity: config.style.floodOpacity,
  doshaStyle: config.style.dosha,
  patterns: config.style.patterns,
};

// ブラウザはこの PC の Chrome（Playwright 同梱版は入れ直さない）。WebGL はソフトウェア描画（SwiftShader）
const browser = await chromium.launch({
  channel: "chrome",
  headless: true,
  args: ["--use-angle=swiftshader", "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist"],
});
const viewport = isA3 ? { width: 1587, height: 1122 } : { width: 960, height: 1000 };
const ctx = await browser.newContext({ viewport, deviceScaleFactor: DPR, locale: "ja-JP" });
const log = { mode, view, dpr: DPR, console: [], failed: [], hosts: {}, planet: new Set(), when: new Date().toISOString() };
let mapJpg = null;
await ctx.route("https://hazard.local/**", (route) => {
  if (route.request().url().endsWith("/a3-map.jpg") && mapJpg) return route.fulfill({ status: 200, body: mapJpg, headers: { "Content-Type": "image/jpeg" } });
  return route.fulfill({ status: 404, body: "" });
});
const page = await ctx.newPage();
page.on("console", (m) => {
  if (m.type() === "error" || m.type() === "warning") log.console.push(`${m.type()}: ${m.text()}`.slice(0, 300));
});
page.on("pageerror", (e) => log.console.push(`pageerror: ${e.message}`.slice(0, 300)));
page.on("requestfailed", (r) => log.failed.push(`${r.failure()?.errorText} ${r.url()}`.slice(0, 300)));
page.on("response", (r) => {
  try {
    const u = new URL(r.url());
    if (u.protocol === "data:") return;
    const k = `${u.host} ${r.status()}`;
    log.hosts[k] = (log.hosts[k] || 0) + 1;
    const m = u.pathname.match(/^\/planet\/([^/]+)\//);
    if (m) log.planet.add(m[1]);
  } catch {}
});
await page.addInitScript((c) => {
  window.__CFG = c;
}, cfg);
await page.goto(pathToFileURL(path.join(HERE, "map.html")).href, { waitUntil: "load" });
await page.waitForFunction(() => window.__state && window.__state.ready, null, { timeout: 180000 });
await page.waitForTimeout(500);

const state = await page.evaluate(() => window.__state);
const layout = await page.evaluate(() => window.__layoutCheck());
log.state = state;
log.layout = layout;
const problems = [];
if (state.errors.length) problems.push(`地図のエラー: ${state.errors.join(" / ")}`);
if (log.failed.length) problems.push(`取得の失敗: ${log.failed.length} 件`);
if (log.console.some((c) => /^(error|pageerror)/.test(c))) problems.push("コンソールのエラー");
if (mode !== "diag") {
  if (state.missingShelters) problems.push(`図の範囲の外に出た避難所: ${state.missingShelters.join(",")}`);
  if (layout.overlaps.length) problems.push(`文字・記号の重なり ${layout.overlaps.length} 件: ${layout.overlaps.join(" / ")}`);
  if (layout.outside.length) problems.push(`地図枠からはみ出す文字・記号: ${layout.outside.join(" / ")}`);
  if (layout.overflow.length) problems.push(`欄のはみ出し: ${layout.overflow.join(" / ")}`);
  const want = view.scaleDenom;
  if (Math.abs(state.scaleDenom - want) / want > 0.01) problems.push(`縮尺が 1:${want} から1%以上ずれています（1:${state.scaleDenom}）`);
}

if (mode === "web") {
  const sheet = await page.$("#sheet");
  await sheet.screenshot({ path: path.join(OUT, "web.png") });
} else if (mode === "diag") {
  const near = await page.evaluate(([pt]) => window.__diag([pt], 150), [diagPoint]);
  fs.writeFileSync(path.join(OUT, "diag.json"), JSON.stringify(near, null, 1));
  const sheet = await page.$("#mapwrap");
  await sheet.screenshot({ path: path.join(OUT, "diag.png") });
  console.log(`diag: ${near.length} features within 150m -> .cache/out/diag.json, diag.png`);
} else {
  // 1回目: 地図と白い縁取りだけ（文字の塗り・記号は消す）を 300dpi の画像に
  await page.evaluate(() => document.body.classList.add("halo"));
  await page.waitForTimeout(300);
  const clip = await page.evaluate(() => {
    const r = document.getElementById("mapwrap").getBoundingClientRect();
    return { x: r.left, y: r.top, width: r.width, height: r.height };
  });
  log.clip = clip;
  mapJpg = await page.screenshot({ type: "jpeg", quality: 90, clip });
  fs.writeFileSync(path.join(OUT, "a3-map.jpg"), mapJpg);
  // 2回目: 画像に差し替え、文字は縁取りなしで重ねて PDF に
  const w = await page.evaluate(() => {
    document.body.classList.remove("halo");
    document.body.classList.add("print");
    return window.__useMapImage("https://hazard.local/a3-map.jpg");
  });
  log.mapImagePx = w;
  await page.waitForTimeout(300);
  await page.pdf({
    path: path.join(OUT, "a3-raw.pdf"),
    width: "420mm",
    height: "297mm",
    printBackground: true,
    margin: { top: 0, right: 0, bottom: 0, left: 0 },
    tagged: true,
    outline: false,
  });
}

log.planet = [...log.planet];
log.problems = problems;
fs.writeFileSync(path.join(OUT, `${mode}.log.json`), JSON.stringify(log, null, 1));
await browser.close();
console.log(`render ${mode}: scale 1:${state.scaleDenom}, view ${JSON.stringify(state.view)}, planet ${log.planet.join(",")}, hosts ${JSON.stringify(log.hosts)}`);
if (problems.length) {
  console.error(`render ${mode}: 問題 ${problems.length} 件\n  - ${problems.join("\n  - ")}`);
  if (mode !== "diag") process.exit(1);
}
