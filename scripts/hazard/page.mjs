/**
 * ハザードマップのページ（src/content/pages/anzen-hazard.json）の本文 HTML を config.json から作る。
 *
 *   node scripts/hazard/page.mjs          （npm run hazard:build の中で finish.py の後に呼ばれる）
 *
 * - 書き換えるのは anzen-hazard.json の "bodyHtml" だけ（題名・説明・導入文・関連リンクなどは手で書く。他の欄は保つ）。
 * - 地図の画像・拡大用画像・PDF へのリンク、凡例、避難所の一覧、地区別の見方、地図の見方、配布、出典を、
 *   地図・PDF と同じ config.json の語と ○× で出す（受け入れ条件 H4: 名称と ○× が一致）。
 * - 画像の寸法・容量は .cache/out/images.json（finish.py）から取る。PDF は <a data-pdf> で書き、容量の表示は
 *   サイトの PDF リンク部品（src/lib/content/pdf-links.ts）に任せる。
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(HERE, "..", "..");
const PAGE = path.join(ROOT, "src", "content", "pages", "anzen-hazard.json");
const config = JSON.parse(fs.readFileSync(path.join(HERE, "config.json"), "utf8"));
const imagesPath = path.join(HERE, ".cache", "out", "images.json");
if (!fs.existsSync(imagesPath)) {
  console.error("先に finish.py を実行する（.cache/out/images.json がありません）");
  process.exit(1);
}
const images = JSON.parse(fs.readFileSync(imagesPath, "utf8"));

const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
/** pdf-links.ts の formatBytes と同じ書式 */
function formatBytes(bytes) {
  if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)}MB`;
  return `${Math.max(1, Math.round(bytes / 1024))}KB`;
}
/** pdf-links.ts と同じ「新しいタブ」の表示 */
const NEW_TAB =
  '<span class="sr-only">（新しいタブで開きます）</span><svg class="kn-newtab-icon" aria-hidden="true" focusable="false" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="display:inline-block;vertical-align:-0.125em;margin-left:0.2em"><path d="M15 3h6v6"/><path d="M10 14 21 3"/><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/></svg>';

const ST = config.style;
const PAT = ST.patterns;
let uid = 0;
function patternDef(id, p) {
  const s = p.size;
  const w = p.width;
  let d = "";
  if (p.kind === "slash" || p.kind === "cross") d += `M${-s},${s}L0,0M0,${s}L${s},0M${s},${s}L${2 * s},0`;
  if (p.kind === "back" || p.kind === "cross") d += `M${-s},0L0,${s}M0,0L${s},${s}M${s},0L${2 * s},${s}`;
  if (p.kind === "vert") d += `M${s / 2},0L${s / 2},${s}`;
  if (p.kind === "horiz") d += `M0,${s / 2}L${s},${s / 2}`;
  return `<pattern id="${id}" width="${s}" height="${s}" patternUnits="userSpaceOnUse"><path d="${d}" stroke="${p.color}" stroke-width="${w}"/></pattern>`;
}
function swatch(w, h, { fills = [], pattern, line = "#999", lineWidth = 1, dash } = {}) {
  const id = `hz-sw${++uid}`;
  let defs = "";
  let body = `<rect width="${w}" height="${h}" fill="#f3f2ee"/>`;
  for (const [c, o] of fills) body += `<rect width="${w}" height="${h}" fill="${c}" fill-opacity="${o}"/>`;
  if (pattern) {
    defs = `<defs>${patternDef(id, PAT[pattern])}</defs>`;
    body += `<rect width="${w}" height="${h}" fill="url(#${id})"/>`;
  }
  const lw = lineWidth;
  body += `<rect x="${lw / 2}" y="${lw / 2}" width="${w - lw}" height="${h - lw}" fill="none" stroke="${line}" stroke-width="${lw}"${dash ? ` stroke-dasharray="${dash}"` : ""}/>`;
  return `<svg width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" aria-hidden="true" focusable="false" style="flex:none">${defs}${body}</svg>`;
}
function icon(kind, label) {
  const fill = kind === "hq" ? "#1a4d80" : "#0a7a36";
  const shape =
    kind === "outdoor"
      ? `<circle cx="11" cy="11" r="9.5" fill="#fff" stroke="${fill}" stroke-width="2.2"/>`
      : `<rect x="1.5" y="1.5" width="19" height="19" rx="3" fill="${fill}"/>`;
  const color = kind === "outdoor" ? fill : "#fff";
  return `<svg width="22" height="22" viewBox="0 0 22 22" aria-hidden="true" focusable="false" style="flex:none">${shape}<text x="11" y="15.5" text-anchor="middle" font-size="12.5" font-weight="700" fill="${color}" font-family="sans-serif">${esc(label)}</text></svg>`;
}
const LIST = 'style="list-style:none;padding-left:0"';
const ROW = 'style="display:flex;align-items:center;gap:8px;margin:6px 0"';

function legendHtml() {
  const L = config.legend;
  const D = ST.dosha;
  let h = "<h2>凡例</h2>";
  h += "<h3>洪水浸水想定区域（想定最大規模）</h3>";
  h += `<ul ${LIST}>`;
  for (const f of L.flood.filter((x) => x.inTown)) {
    h += `<li ${ROW}>${swatch(40, 18, { fills: [[f.color, ST.floodOpacity]] })}<span>${esc(f.range)}　${esc(f.desc)}</span></li>`;
  }
  const outside = L.flood.filter((x) => !x.inTown).map((x) => x.range);
  h += `</ul><p>${esc(outside.join("・"))}の区域は、町内にはありません。</p>`;
  h += "<h3>土砂災害警戒区域等</h3>";
  h += "<p>種類は模様（土石流＝右上がりの斜線、急傾斜地の崩壊＝縦線、地すべり＝右下がりの斜線）で、警戒区域（黄）と特別警戒区域（赤）は色と輪郭の太さで区別しています。</p>";
  h += `<ul ${LIST}>`;
  for (const d of L.dosha) {
    const k = swatch(48, 18, { fills: [[D.keikai.fill, D.keikai.opacity]], pattern: `pat-${d.id}`, line: D.keikai.line, lineWidth: D.keikai.lineWidth });
    let item = `${k}<span>${esc(d.name)}の警戒区域</span>`;
    if (d.tokubetsuInTown) {
      const t = swatch(48, 18, {
        fills: [[D.keikai.fill, D.keikai.opacity], [D.tokubetsu.fill, D.tokubetsu.opacity]],
        pattern: `pat-${d.id}`, line: D.tokubetsu.line, lineWidth: D.tokubetsu.lineWidth,
      });
      item += `<span style="display:inline-flex;align-items:center;gap:8px;margin-left:8px">${t}<span>特別警戒区域</span></span>`;
    } else {
      item += `<span>（特別警戒区域は町内なし）</span>`;
    }
    h += `<li ${ROW.replace("align-items:center;", "align-items:center;flex-wrap:wrap;")}>${item}</li>`;
  }
  h += "</ul>";
  h += "<h3>避難所・その他</h3>";
  h += `<ul ${LIST}>`;
  h += `<li ${ROW}>${icon("indoor", "1")}<span>${esc(L.shelterIndoor)}</span></li>`;
  h += `<li ${ROW}>${icon("outdoor", "6")}<span>${esc(L.shelterOutdoor)}</span></li>`;
  h += `<li ${ROW}>${icon("hq", "本")}<span>${esc(L.hq)}</span></li>`;
  const ban = swatch(40, 18, { fills: [["#ffffff", 0.55]], pattern: "pat-ban", line: "#a8001c", lineWidth: 1.6, dash: "3 1.6" });
  h += `<li ${ROW}>${ban}<span>${esc(config.ban.name)}：${esc(config.ban.reason)}</span></li>`;
  h += "</ul>";
  return h;
}

const NW = (s) => `<span style="white-space:nowrap">${esc(s)}</span>`;
/** 空白の所でだけ折り返す（「旧三日月中央小学校 体育館」を語の途中で切らない） */
const words = (s) => String(s).split(" ").map(NW).join(" ");
const C = 'style="text-align:center;white-space:nowrap"';
function shelterTable() {
  let rows = "";
  for (const s of config.shelters) {
    rows += `<tr><td ${C}>${esc(s.no)}</td><th scope="row">${words(s.name)}</th><td>${NW(s.town)}${NW(`（${s.district}地区）`)}</td>` +
      `<td ${C}>${esc(s.flood)}</td><td ${C}>${esc(s.dosha)}</td><td ${C}>${esc(s.quake)}</td><td>${esc(s.note || "")}</td></tr>`;
  }
  const hq = config.hq;
  rows += `<tr><td ${C}>${esc(hq.no)}</td><th scope="row">${words(hq.name)}</th><td>${NW(hq.town)}${NW(`（${hq.district}地区）`)}</td><td colspan="3" ${C}>―</td><td>災害時に町の対策本部を置きます</td></tr>`;
  const th = (s) => `<th scope="col" style="white-space:nowrap">${esc(s)}</th>`;
  return (
    "<h2>指定避難所・指定緊急避難場所の一覧</h2>" +
    "<p>番号は地図の番号と同じです。1〜5は建物の指定避難所、6〜8は屋外の指定緊急避難場所です。</p>" +
    '<div class="table-scroll"><table class="data-table">' +
    `<caption class="sr-only">指定避難所・指定緊急避難場所の一覧（${esc(config.meta.made)}）</caption>` +
    `<thead><tr>${["番号", "名称", "所在（地区）", "洪水", "土砂災害", "地震", "備考"].map(th).join("")}</tr></thead>` +
    `<tbody>${rows}</tbody></table></div>` +
    `<p>${esc(config.legend.symbolNote)}</p>`
  );
}

function districtTable() {
  let rows = "";
  for (const d of config.districts) {
    rows += `<tr><th scope="row">${NW(`${d.name}地区`)}<br><span style="font-size:0.85em;font-weight:400">（${d.towns.map(NW).join("・")}）</span></th><td>${esc(d.flood)}</td><td>${esc(d.dosha)}</td><td>${esc(d.shelters)}</td></tr>`;
  }
  return (
    "<h2>地区別の見方</h2>" +
    "<p>4つの地区ごとの、おもな区域と避難先の目安です。ご自宅の場所は、地図で確かめてください。</p>" +
    '<div class="table-scroll"><table class="data-table">' +
    '<caption class="sr-only">地区別の見方</caption>' +
    `<thead><tr>${["地区（町名）", "洪水（想定最大規模）", "土砂災害", "主な避難先"].map((s) => `<th scope="col" style="white-space:nowrap">${esc(s)}</th>`).join("")}</tr></thead>` +
    `<tbody>${rows}</tbody></table></div>`
  );
}

function bodyHtml() {
  const P = config.page;
  const M = config.meta;
  const w = images.web;
  const a3 = images.a3;
  let h = `<h2>${esc(M.title)}（${esc(M.made)}）</h2>`;
  h += `<div class="hazard-sheet"><img src="/${w.file}" width="${w.width}" height="${w.height}" alt="${esc(P.imageAlt)}" decoding="async"></div>`;
  h += "<ul>";
  h += `<li><a href="/${a3.file}" target="_blank" rel="noopener">${esc(P.enlargeText)}（JPEG画像・${formatBytes(a3.bytes)}）${NEW_TAB}</a></li>`;
  h += `<li><a data-pdf="hazard-map.pdf">${esc(P.pdfText)}</a></li>`;
  h += "</ul>";
  h += legendHtml();
  h += shelterTable();
  h += districtTable();
  h += "<h2>地図の見方と避難のポイント</h2><ul>" + config.notes.map((t) => `<li>${esc(t)}</li>`).join("") + "</ul>";
  h += "<h2>情報の入手と問い合わせ</h2><ul>" + config.info.map((t) => `<li>${esc(t)}</li>`).join("") + "</ul>";
  h += `<p>問い合わせ：${esc(M.publisher)} ${esc(M.dept)}（${esc(M.deptPlace)}）　電話 ${esc(M.telDept)}</p>`;
  h += `<h2>紙のハザードマップ</h2><p>${esc(P.distribution)}</p>`;
  const S = config.sources;
  h += "<h2>出典</h2>";
  h += `<p>${esc(S.source)}</p><p>加工：${esc(S.processing)}</p><p>${esc(S.basemap)}</p>`;
  h += `<p style="font-size:0.875em;color:#555">${esc(config.disclaimer)}</p>`;
  return h;
}

const raw = fs.readFileSync(PAGE, "utf8");
const crlf = raw.includes("\r\n");
const page = JSON.parse(raw);
const html = bodyHtml();
if (page.bodyHtml === html) {
  console.log("page: anzen-hazard.json unchanged");
} else {
  page.bodyHtml = html;
  let out = JSON.stringify(page, null, 2) + "\n";
  if (crlf) out = out.replace(/\n/g, "\r\n");
  fs.writeFileSync(PAGE, out, "utf8");
  console.log(`page: anzen-hazard.json bodyHtml updated (${html.length} chars)`);
}
