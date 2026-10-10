/**
 * サイトの HTML を静的に読んで検査する（WP6 の雛形。確定版 v3 の受け入れ条件 K のうち HTML で見るもの）。
 * 期待値は `scripts/check-html.config.json`（手で書いた正本）。この中に期待値を書かない。
 *
 * 検査（規則 ID は config と同じ）:
 *   - 禁止語（K-12・K-07・K-08 ほか）: 画面の文字・alt/title/aria-label・<title>・meta・RSC ペイロード・検索索引・sitemap.xml を
 *     規則ごとの範囲（scopes）で照合する。
 *   - tel:・mailto: のリンク（K-12-tel）、「架空の町のものです」は画面にも meta にも出さない（K-12-note）。
 *   - 件数（K-09「さとう ゆう」1回・K-10「渡辺」2か所）と、そのページ（where）。必須の文（K-10-mayor）。
 *   - 物語ページ同士の相互リンク（K-11。v3 ★）: <main> の中（本文・関連するページ・ローカルナビ）のリンクを数え、
 *     パンくずと共通部（<main> の外＝ヘッダー・メガメニュー・フッター）は除く。共通部とサイトマップが物語ページへ
 *     直接リンクしていないこと（K-11-common）。
 *   - <main> が1つ・<title>＝「h1｜霞ノ杜町」（K-20）。
 *
 * 対象（--source）:
 *   auto（既定）… out/ があり src/content/manifest.json より新しければ out/、古いか無ければ開発サーバ
 *                （開発サーバが応答しなければ、古くても out/ を注意つきで使う）
 *   out        … out/**\/*.html（next build の書き出し）。検索索引・sitemap も out/ から
 *   dev        … 開発サーバ（http://localhost:<PW_PORT|3456>/kasuminomori/ ＋ manifest の全 route）。索引・sitemap は public/ から
 *
 * 実行: node scripts/check-html.mjs [--source auto|out|dev] [--dir out] [--port 3456] [--strict] [--only K-12,K-09] [--json <file>] [--max 20]
 *   （npm run check:html）
 *   --strict … config の enforce に関係なく全規則を有効にする（段階2のあとの確認用）
 *   結果の全件は test-results/check-html.json（--json で変更）。
 * 終了コード: 0＝有効な規則に失敗なし、1＝有効な規則に失敗あり、2＝対象を読めない・設定の誤り。
 */
import fs from "fs";
import path from "path";
import { fileURLToPath, pathToFileURL } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, "..");

// ---------------------------------------------------------------- 引数

function arg(name, fallback) {
  const i = process.argv.indexOf(name);
  if (i >= 0 && process.argv[i + 1] && !process.argv[i + 1].startsWith("--")) return process.argv[i + 1];
  const eq = process.argv.find((a) => a.startsWith(`${name}=`));
  return eq ? eq.slice(name.length + 1) : fallback;
}
const flag = (name) => process.argv.includes(name);

// ---------------------------------------------------------------- 簡易 HTML 解析（依存なし）
// Next.js（React）が出す整形済みの HTML を読む前提の、寛容な解析。木を作り、地域（main・パンくず・共通部）を判定する。

const VOID = new Set(["area", "base", "br", "col", "embed", "hr", "img", "input", "link", "meta", "param", "source", "track", "wbr"]);
const RAW_TEXT = new Set(["script", "style"]);
const RCDATA = new Set(["title", "textarea"]);
const SKIP_TEXT = new Set(["script", "style", "noscript", "template"]);
const BLOCK = new Set([
  "address", "article", "aside", "blockquote", "br", "button", "caption", "dd", "details", "dialog", "div", "dl", "dt",
  "fieldset", "figcaption", "figure", "footer", "form", "h1", "h2", "h3", "h4", "h5", "h6", "header", "hr", "li", "main",
  "nav", "ol", "option", "p", "pre", "section", "summary", "table", "tbody", "td", "tfoot", "th", "thead", "tr", "ul",
]);
const NAMED_ENTITIES = {
  amp: "&", lt: "<", gt: ">", quot: '"', apos: "'", nbsp: " ", copy: "©", reg: "®", hellip: "…",
  mdash: "—", ndash: "–", laquo: "«", raquo: "»", times: "×", yen: "¥", middot: "·", rarr: "→", larr: "←",
};

export function decodeEntities(s) {
  if (!s || !s.includes("&")) return s;
  return s.replace(/&(#x[0-9a-f]+|#\d+|[a-z][a-z0-9]*);/gi, (m, e) => {
    if (e[0] === "#") {
      const cp = e[1] === "x" || e[1] === "X" ? parseInt(e.slice(2), 16) : parseInt(e.slice(1), 10);
      try {
        return String.fromCodePoint(cp);
      } catch {
        return m;
      }
    }
    return NAMED_ENTITIES[e.toLowerCase()] ?? m;
  });
}

function parseAttrs(src) {
  const attrs = {};
  const re = /([^\s"'=<>/]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'=<>`]+)))?/g;
  let m;
  while ((m = re.exec(src))) attrs[m[1].toLowerCase()] = decodeEntities(m[2] ?? m[3] ?? m[4] ?? "");
  return attrs;
}

const closeRe = new Map();
function closingTagRe(tag) {
  if (!closeRe.has(tag)) closeRe.set(tag, new RegExp(`</${tag}\\s*>`, "gi"));
  return closeRe.get(tag);
}

export function parseHtml(html) {
  const root = { type: "el", tag: "#root", attrs: {}, children: [], parent: null };
  let cur = root;
  let i = 0;
  const n = html.length;
  const pushText = (t) => {
    if (t) cur.children.push({ type: "text", text: decodeEntities(t), parent: cur });
  };
  while (i < n) {
    const lt = html.indexOf("<", i);
    if (lt === -1) {
      pushText(html.slice(i));
      break;
    }
    if (lt > i) pushText(html.slice(i, lt));
    if (html.startsWith("<!--", lt)) {
      const end = html.indexOf("-->", lt + 4);
      i = end === -1 ? n : end + 3;
      continue;
    }
    const next = html[lt + 1];
    if (next === "!" || next === "?") {
      const end = html.indexOf(">", lt);
      i = end === -1 ? n : end + 1;
      continue;
    }
    if (next === "/") {
      const m = /^<\/([a-zA-Z][\w:-]*)\s*>/.exec(html.slice(lt, lt + 80));
      if (!m) {
        pushText("<");
        i = lt + 1;
        continue;
      }
      const tag = m[1].toLowerCase();
      let p = cur;
      while (p !== root && p.tag !== tag) p = p.parent;
      if (p !== root) cur = p.parent;
      i = lt + m[0].length;
      continue;
    }
    const m = /^<([a-zA-Z][\w:-]*)/.exec(html.slice(lt, lt + 80));
    if (!m) {
      pushText("<");
      i = lt + 1;
      continue;
    }
    let j = lt + m[0].length;
    let quote = null;
    for (; j < n; j++) {
      const c = html[j];
      if (quote) {
        if (c === quote) quote = null;
      } else if (c === '"' || c === "'") quote = c;
      else if (c === ">") break;
    }
    let inner = html.slice(lt + m[0].length, j);
    const selfClose = /\/\s*$/.test(inner);
    if (selfClose) inner = inner.replace(/\/\s*$/, "");
    const tag = m[1].toLowerCase();
    const el = { type: "el", tag, attrs: parseAttrs(inner), children: [], parent: cur };
    cur.children.push(el);
    i = j + 1;
    if (!selfClose && (RAW_TEXT.has(tag) || RCDATA.has(tag))) {
      const re = closingTagRe(tag);
      re.lastIndex = i;
      const cm = re.exec(html);
      const end = cm ? cm.index : n;
      const raw = html.slice(i, end);
      el.children.push({ type: "text", text: RCDATA.has(tag) ? decodeEntities(raw) : raw, parent: el });
      i = cm ? cm.index + cm[0].length : n;
      continue;
    }
    if (!selfClose && !VOID.has(tag)) cur = el;
  }
  return root;
}

function textOf(node) {
  if (node.type === "text") return node.text;
  if (SKIP_TEXT.has(node.tag)) return "";
  return node.children.map(textOf).join("");
}

const squash = (s) => s.replace(/\s+/g, " ").trim();

/** 1ページの HTML を、検査に使う形（地域ごとの文字・属性・meta・リンク・ペイロード）にする */
export function analyzePage(html, route, config) {
  const root = parseHtml(html);
  const page = {
    route,
    title: null,
    metas: [], // { key, content }
    text: { main: [], breadcrumb: [], common: [] },
    attrs: [], // { name, value, region }
    links: [], // { href, region }
    h1: [],
    mainCount: 0,
    payload: "",
    refresh: false,
  };
  const ATTRS = ["alt", "title", "aria-label", "placeholder"];

  const walk = (node, region, inSvg) => {
    if (node.type === "text") {
      page.text[region].push(node.text);
      return;
    }
    const { tag, attrs } = node;
    if (tag === "script") {
      const src = node.children[0]?.text || "";
      for (const m of src.matchAll(/self\.__next_f\.push\(\[1,("(?:[^"\\]|\\.)*")\]\)/g)) {
        try {
          page.payload += JSON.parse(m[1]);
        } catch {
          /* 途中で切れた文字列は飛ばす */
        }
      }
      return;
    }
    if (tag === "title") {
      const t = squash(textOf(node));
      if (inSvg) page.attrs.push({ name: "svg-title", value: t, region });
      else if (page.title === null) page.title = t;
      return;
    }
    if (tag === "meta") {
      const key = (attrs.name || attrs.property || "").toLowerCase();
      if ((attrs["http-equiv"] || "").toLowerCase() === "refresh") page.refresh = true;
      if (key && attrs.content !== undefined) page.metas.push({ key, content: attrs.content });
      return;
    }
    if (SKIP_TEXT.has(tag)) return;
    let r = region;
    if (tag === "main") {
      page.mainCount++;
      r = "main";
    } else if (region === "main" && tag === "nav" && attrs["aria-label"] === config.breadcrumbLabel) {
      r = "breadcrumb";
    }
    for (const name of ATTRS) {
      if (attrs[name]) page.attrs.push({ name, value: attrs[name], region: r });
    }
    if (tag === "a" && attrs.href !== undefined) page.links.push({ href: attrs.href, region: r, text: squash(textOf(node)) });
    if (tag === "h1") page.h1.push(squash(textOf(node)));
    const block = BLOCK.has(tag);
    if (block) page.text[r].push("\n");
    for (const c of node.children) walk(c, r, inSvg || tag === "svg");
    if (block) page.text[r].push("\n");
  };
  walk(root, "common", false);
  for (const k of Object.keys(page.text)) page.text[k] = page.text[k].join("").replace(/[ \t ]+/g, " ");
  return page;
}

// ---------------------------------------------------------------- 照合の道具

const nfkc = (s) => s.normalize("NFKC");
const kataToHira = (s) => s.replace(/[ァ-ヶ]/g, (c) => String.fromCharCode(c.charCodeAt(0) - 0x60));
const stripSpaces = (s) => s.replace(/[\s　]+/g, "");
const escapeRe = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

function excerpt(text, index, length, width = 20) {
  const a = Math.max(0, index - width);
  const b = Math.min(text.length, index + length + width);
  return `${a > 0 ? "…" : ""}${text.slice(a, index)}【${text.slice(index, index + length)}】${text.slice(index + length, b)}${b < text.length ? "…" : ""}`.replace(/\s+/g, " ");
}

/** 規則の語・パターンから照合用の正規表現の一覧を作る */
function compileRule(rule, { kana = false } = {}) {
  const prep = (w) => (kana ? kataToHira(nfkc(w)) : nfkc(w));
  const list = [];
  for (const w of rule.words || []) list.push({ label: w, re: new RegExp(escapeRe(prep(w)), "gu") });
  for (const w of rule.wordsIgnoreCase || []) list.push({ label: w, re: new RegExp(escapeRe(prep(w)), "giu") });
  for (const p of rule.patterns || []) list.push({ label: `/${p}/`, re: new RegExp(prep(p), "gu") });
  return list;
}

function findAll(text, matchers, { kana = false } = {}) {
  const hay = kana ? kataToHira(nfkc(text)) : nfkc(text);
  const hits = [];
  for (const { label, re } of matchers) {
    re.lastIndex = 0;
    let m;
    while ((m = re.exec(hay))) {
      hits.push({ word: label, excerpt: excerpt(hay, m.index, m[0].length) });
      if (m[0].length === 0) re.lastIndex++;
    }
  }
  return hits;
}

/** route のパターン: "/history/"＝完全一致、"/documents/*"＝前方一致、"/history/#*"＝そのページの # 付き */
function routeMatches(pattern, target) {
  const hashAt = pattern.indexOf("#");
  const p = hashAt >= 0 ? pattern.slice(0, hashAt) : pattern;
  const h = hashAt >= 0 ? pattern.slice(hashAt + 1) : null;
  const pathOk = p.endsWith("*") ? target.path.startsWith(p.slice(0, -1)) : target.path === p;
  if (!pathOk) return false;
  if (h === null) return true;
  if (h === "*") return !!target.hash;
  return target.hash === h;
}

/** リンクの href を basePath を外した path（ディレクトリは末尾 /）と hash に。サイトの外・スキームは別扱い */
function resolveLink(href, pageRoute, config) {
  const h = (href || "").trim();
  const scheme = /^([a-z][a-z0-9+.-]*):/i.exec(h);
  if (scheme && !/^https?$/i.test(scheme[1])) return { scheme: `${scheme[1].toLowerCase()}:` };
  let u;
  try {
    u = new URL(h, `http://site.invalid${config.basePath}${pageRoute}`);
  } catch {
    return null;
  }
  const own = u.host === "site.invalid" || (config.siteOrigin && u.origin === config.siteOrigin);
  if (!own) return { external: u.href };
  let p;
  try {
    p = decodeURIComponent(u.pathname);
  } catch {
    p = u.pathname;
  }
  if (p !== config.basePath && !p.startsWith(`${config.basePath}/`)) return { outside: p };
  p = p.slice(config.basePath.length) || "/";
  if (p.endsWith("/index.html")) p = p.slice(0, -"index.html".length);
  else if (p.endsWith(".html")) p = `${p.slice(0, -".html".length)}/`;
  else if (!path.posix.extname(p) && !p.endsWith("/")) p += "/";
  return { path: p, hash: u.hash ? decodeURIComponent(u.hash.slice(1)) : "" };
}

// ---------------------------------------------------------------- 対象の読み込み

function walkHtmlFiles(dir) {
  const out = [];
  const stack = [dir];
  while (stack.length) {
    const d = stack.pop();
    for (const ent of fs.readdirSync(d, { withFileTypes: true })) {
      const full = path.join(d, ent.name);
      if (ent.isDirectory()) stack.push(full);
      else if (ent.name.endsWith(".html")) out.push(full);
    }
  }
  return out.sort();
}

function routeOfFile(outDir, file) {
  const rel = path.relative(outDir, file).split(path.sep).join("/");
  if (rel === "index.html") return "/";
  if (rel.endsWith("/index.html")) return `/${rel.slice(0, -"index.html".length)}`;
  return `/${rel}`;
}

async function devAlive(origin, basePath) {
  try {
    const r = await fetch(`${origin}${basePath}/`, { signal: AbortSignal.timeout(5000) });
    return r.ok;
  } catch {
    return false;
  }
}

async function loadSource(config, opts) {
  const outDir = path.resolve(ROOT, opts.dir || "out");
  const manifestPath = path.join(ROOT, "src", "content", "manifest.json");
  const outIndex = path.join(outDir, "index.html");
  const hasOut = fs.existsSync(outIndex);
  const outFresh = hasOut && (!fs.existsSync(manifestPath) || fs.statSync(outIndex).mtimeMs >= fs.statSync(manifestPath).mtimeMs);
  const origin = `http://localhost:${opts.port}`;
  const notes = [];

  let source = opts.source;
  if (source === "auto") {
    if (outFresh) source = "out";
    else if (await devAlive(origin, config.basePath)) {
      source = "dev";
      notes.push(hasOut ? "out/ は正本（manifest）より古いので、開発サーバを対象にした" : "out/ が無いので、開発サーバを対象にした");
    } else if (hasOut) {
      source = "out";
      notes.push("注意: out/ は正本（manifest）より古い書き出し。開発サーバも応答しない。結果は今の状態と違う可能性がある");
    } else {
      throw new Error("対象がありません: out/ が無く、開発サーバも応答しません（npm run dev か npm run build を先に）");
    }
  }

  const excluded = (route) => (config.exclude || []).some((p) => routeMatches(p, { path: route, hash: "" }));
  const pages = [];
  const errors = [];
  let searchIndex = null;
  let sitemap = null;

  if (source === "out") {
    if (!hasOut) throw new Error("out/index.html がありません（npm run build を先に）");
    if (!outFresh && !notes.length) notes.push("注意: out/ は正本（manifest）より古い書き出し");
    for (const file of walkHtmlFiles(outDir)) {
      const route = routeOfFile(outDir, file);
      if (excluded(route)) continue;
      pages.push({ route, html: fs.readFileSync(file, "utf8") });
    }
    const si = path.join(outDir, "search-index.json");
    if (fs.existsSync(si)) searchIndex = JSON.parse(fs.readFileSync(si, "utf8"));
    const sm = path.join(outDir, "sitemap.xml");
    if (fs.existsSync(sm)) sitemap = fs.readFileSync(sm, "utf8");
    return { source, label: `書き出し ${path.relative(ROOT, outDir) || outDir}/`, pages, errors, searchIndex, sitemap, notes };
  }

  // dev
  if (!(await devAlive(origin, config.basePath))) throw new Error(`開発サーバが応答しません: ${origin}${config.basePath}/（npm run dev を先に）`);
  const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
  const routes = ["/", ...(manifest.pages || []).map((p) => p.route)].filter((r, i, a) => a.indexOf(r) === i && !excluded(r));
  const queue = [...routes];
  const worker = async () => {
    while (queue.length) {
      const route = queue.shift();
      try {
        const r = await fetch(`${origin}${config.basePath}${route}`, { signal: AbortSignal.timeout(120000) });
        if (!r.ok) {
          errors.push({ route, message: `HTTP ${r.status}` });
          continue;
        }
        pages.push({ route, html: await r.text() });
      } catch (e) {
        errors.push({ route, message: e.message });
      }
    }
  };
  await Promise.all(Array.from({ length: 4 }, worker));
  pages.sort((a, b) => a.route.localeCompare(b.route));
  const si = path.join(ROOT, "public", "search-index.json");
  if (fs.existsSync(si)) searchIndex = JSON.parse(fs.readFileSync(si, "utf8"));
  const sm = path.join(ROOT, "public", "sitemap.xml");
  if (fs.existsSync(sm)) sitemap = fs.readFileSync(sm, "utf8");
  return { source, label: `開発サーバ ${origin}${config.basePath}/`, pages, errors, searchIndex, sitemap, notes };
}

// ---------------------------------------------------------------- 検査

function scopeTexts(page, scope) {
  switch (scope) {
    case "text":
      return [
        { where: "main", text: page.text.main },
        { where: "パンくず", text: page.text.breadcrumb },
        { where: "共通部", text: page.text.common },
      ];
    case "attr":
      return page.attrs.map((a) => ({ where: `${a.name}属性`, text: a.value }));
    case "title":
      return page.title === null ? [] : [{ where: "<title>", text: page.title }];
    case "meta":
      return page.metas.map((m) => ({ where: `meta ${m.key}`, text: m.content }));
    case "payload":
      return page.payload ? [{ where: "RSCペイロード", text: page.payload }] : [];
    default:
      return [];
  }
}

function isAllowed(rule, route, word) {
  return (rule.allow || []).find((a) => (!a.route || routeMatches(a.route, { path: route, hash: "" })) && (!a.word || a.word === word));
}

function checkForbidden(rule, pages, extra) {
  const findings = [];
  const allowed = [];
  const matchers = compileRule(rule);
  for (const page of pages) {
    for (const scope of rule.scopes) {
      for (const { where, text } of scopeTexts(page, scope)) {
        for (const hit of findAll(text, matchers)) {
          const f = { route: page.route, where, ...hit };
          const a = isAllowed(rule, page.route, hit.word);
          (a ? allowed : findings).push(a ? { ...f, reason: a.reason } : f);
        }
      }
    }
  }
  if (rule.scopes.includes("searchIndex") && extra.searchIndex) {
    const kanaMatchers = compileRule(rule, { kana: true });
    for (const doc of extra.searchIndex.docs || []) {
      for (const [key, value] of Object.entries(doc)) {
        if (typeof value !== "string" || key === "route") continue;
        for (const hit of findAll(value, kanaMatchers, { kana: true })) findings.push({ route: doc.route, where: `検索索引 ${key}`, ...hit });
      }
    }
  }
  if (rule.scopes.includes("sitemap") && extra.sitemap) {
    for (const hit of findAll(extra.sitemap, matchers)) findings.push({ route: "sitemap.xml", where: "sitemap.xml", ...hit });
  }
  return { findings, allowed };
}

function checkLinkSchemes(rule, pages, config) {
  const findings = [];
  for (const page of pages) {
    for (const link of page.links) {
      const r = resolveLink(link.href, page.route, config);
      if (r?.scheme && rule.schemes.includes(r.scheme)) findings.push({ route: page.route, where: link.region, word: link.href, excerpt: link.text });
    }
  }
  return { findings };
}

function checkMetaNote(rule, pages) {
  const findings = [];
  const re = new RegExp(escapeRe(rule.text), "g");
  for (const page of pages) {
    for (const field of rule.fields) {
      const metas = page.metas.filter((m) => m.key === field);
      const n = metas.reduce((sum, m) => sum + (m.content.match(re) || []).length, 0);
      if (n !== rule.count) {
        findings.push({
          route: page.route,
          where: `meta ${field}`,
          word: `${rule.text}×${n}`,
          excerpt: metas.map((m) => m.content).join(" / ") || "meta が無い",
        });
      }
    }
    if (typeof rule.visible === "number") {
      const hay = `${page.text.main}\n${page.text.breadcrumb}\n${page.text.common}`;
      const n = (hay.match(re) || []).length;
      if (n !== rule.visible) findings.push({ route: page.route, where: "画面", word: `${rule.text}×${n}`, excerpt: "" });
    }
  }
  return { findings };
}

function checkCount(rule, pages) {
  const prep = (s) => (rule.ignoreSpaces ? stripSpaces(nfkc(s)) : nfkc(s));
  const matchers = (rule.patterns || []).map((p) => ({ label: p, re: new RegExp(escapeRe(prep(p)), "gu") }));
  const perRoute = {};
  const occurrences = [];
  for (const page of pages) {
    for (const scope of rule.scopes || ["text"]) {
      for (const { where, text } of scopeTexts(page, scope)) {
        const hay = prep(text);
        for (const { label, re } of matchers) {
          re.lastIndex = 0;
          let m;
          while ((m = re.exec(hay))) {
            perRoute[page.route] = (perRoute[page.route] || 0) + 1;
            occurrences.push({ route: page.route, where, word: label, excerpt: excerpt(hay, m.index, m[0].length) });
          }
        }
      }
    }
  }
  const total = occurrences.length;
  const findings = [];
  if (total !== rule.expected) findings.push({ route: "（サイト全体）", where: "件数", word: `${total}件（期待 ${rule.expected}件）`, excerpt: "" });
  if (rule.where) {
    for (const [route, n] of Object.entries(rule.where)) {
      if ((perRoute[route] || 0) !== n) findings.push({ route, where: "件数", word: `${perRoute[route] || 0}件（期待 ${n}件）`, excerpt: "" });
    }
    for (const [route, n] of Object.entries(perRoute)) {
      if (!(route in rule.where)) findings.push({ route, where: "件数", word: `${n}件（期待 0件）`, excerpt: "" });
    }
  }
  return { findings, details: occurrences };
}

function checkRequired(rule, pages) {
  const page = pages.find((p) => p.route === rule.route);
  if (!page) return { findings: [{ route: rule.route, where: "ページ", word: "ページが無い", excerpt: "" }] };
  const prep = (s) => (rule.ignoreSpaces ? stripSpaces(nfkc(s)) : nfkc(s));
  const hay = prep(page.text.main);
  const findings = rule.texts.filter((t) => !hay.includes(prep(t))).map((t) => ({ route: rule.route, where: "main", word: `「${t}」が無い`, excerpt: "" }));
  return { findings };
}

function checkStoryLinks(rule, pages, config) {
  const groupOf = (target) =>
    rule.groups.filter((g) => (g.routes || []).some((p) => routeMatches(p, target)) || (g.files || []).includes(target.path)).map((g) => g.id);
  const findings = [];
  const details = [];
  for (const page of pages) {
    const fromGroups = groupOf({ path: page.route, hash: "" });
    if (!fromGroups.length) continue;
    for (const link of page.links) {
      if (link.region !== "main") continue; // パンくず・共通部は数えない（v3 ★）
      const t = resolveLink(link.href, page.route, config);
      if (!t?.path || t.path === page.route) continue; // 同じページの中（#main など）は相互リンクではない
      const toGroups = groupOf(t);
      for (const f of rule.forbidden) {
        if (fromGroups.includes(f.from) && toGroups.includes(f.to)) {
          findings.push({ route: page.route, where: `${f.from}→${f.to}`, word: `${t.path}${t.hash ? `#${t.hash}` : ""}`, excerpt: link.text });
        }
      }
      if (toGroups.length) details.push({ route: page.route, to: t.path, text: link.text });
    }
  }
  return { findings, details };
}

function checkCommonNav(rule, pages, config) {
  const findings = [];
  for (const page of pages) {
    const wholePage = (rule.pages || []).some((p) => routeMatches(p, { path: page.route, hash: "" }));
    for (const link of page.links) {
      if (link.region !== "common" && !(wholePage && link.region === "main")) continue;
      const t = resolveLink(link.href, page.route, config);
      if (!t?.path || t.path === page.route) continue; // スキップリンク（#main）など同じページの中は除く
      if ((rule.allow || []).some((p) => routeMatches(p, t))) continue;
      if (rule.targets.some((p) => routeMatches(p, t))) {
        findings.push({ route: page.route, where: link.region === "common" ? "共通部" : "サイトマップ本文", word: `${t.path}${t.hash ? `#${t.hash}` : ""}`, excerpt: link.text });
      }
    }
  }
  // 共通部は全ページ同じなので、同じリンク先はまとめる
  const seen = new Map();
  for (const f of findings) {
    const key = `${f.where}|${f.word}`;
    if (!seen.has(key)) seen.set(key, { ...f, pages: 0 });
    seen.get(key).pages++;
  }
  return { findings: [...seen.values()].map((f) => ({ ...f, excerpt: `${f.excerpt}（${f.pages}ページ）` })) };
}

function checkStructure(rule, pages) {
  const findings = [];
  for (const page of pages) {
    if (page.mainCount !== 1) findings.push({ route: page.route, where: "<main>", word: `${page.mainCount}個`, excerpt: "" });
    if ((rule.skipTitleCheck || []).includes(page.route)) continue;
    const h1 = page.h1[0];
    if (page.h1.length !== 1) findings.push({ route: page.route, where: "<h1>", word: `${page.h1.length}個`, excerpt: page.h1.join(" / ") });
    if (h1 && page.title !== `${h1}${rule.titleSuffix}`) findings.push({ route: page.route, where: "<title>", word: page.title ?? "（無し）", excerpt: `h1＝${h1}` });
  }
  return { findings };
}

// ---------------------------------------------------------------- 本体

/** 同じページ・同じ場所・同じ語・同じ前後の指摘（RSC ペイロードに同じ文が何度も入る等）を1件にまとめ、回数を付ける */
function dedupe(findings) {
  const map = new Map();
  for (const f of findings) {
    const key = `${f.route}|${f.where}|${f.word}|${f.excerpt}`;
    if (map.has(key)) map.get(key).times++;
    else map.set(key, { ...f, times: 1 });
  }
  return [...map.values()].map((f) => (f.times > 1 ? { ...f, word: `${f.word}（×${f.times}）` } : f));
}

export async function checkHtml(opts = {}) {
  const configPath = path.resolve(ROOT, opts.config || path.join("scripts", "check-html.config.json"));
  const config = JSON.parse(fs.readFileSync(configPath, "utf8"));
  const port = opts.port || process.env.PW_PORT || config.devPort || 3456;
  const src = await loadSource(config, { source: opts.source || "auto", port, dir: opts.dir });
  const pages = [];
  let skippedRedirects = 0;
  for (const { route, html } of src.pages) {
    const page = analyzePage(html, route, config);
    if (page.refresh) {
      skippedRedirects++; // 旧 URL（*.html）の転送用ページ
      continue;
    }
    pages.push(page);
  }

  const strict = !!opts.strict || !!config.enforceAll;
  const only = opts.only ? new Set(opts.only) : null;
  const results = [];
  const run = (rule, fn) => {
    if (!rule || (only && !only.has(rule.id))) return;
    const r = fn();
    r.findings = dedupe(r.findings);
    const enforced = strict || rule.enforce !== false;
    const status = r.findings.length === 0 ? "PASS" : enforced ? "FAIL" : "PENDING";
    results.push({ id: rule.id, label: rule.label, enforced, status, ...r });
  };

  const extra = { searchIndex: src.searchIndex, sitemap: src.sitemap };
  for (const rule of config.forbidden || []) run(rule, () => checkForbidden(rule, pages, extra));
  run(config.linkSchemes, () => checkLinkSchemes(config.linkSchemes, pages, config));
  run(config.metaNote, () => checkMetaNote(config.metaNote, pages));
  for (const rule of config.counts || []) run(rule, () => checkCount(rule, pages));
  for (const rule of config.required || []) run(rule, () => checkRequired(rule, pages));
  if (config.storyLinks) {
    run(config.storyLinks, () => checkStoryLinks(config.storyLinks, pages, config));
    run(config.storyLinks.commonNav, () => checkCommonNav(config.storyLinks.commonNav, pages, config));
  }
  run(config.structure, () => checkStructure(config.structure, pages));

  if (src.errors.length) {
    results.push({
      id: "LOAD",
      label: "ページの読み込み",
      enforced: true,
      status: "FAIL",
      findings: src.errors.map((e) => ({ route: e.route, where: "読み込み", word: e.message, excerpt: "" })),
    });
  }
  return { source: src.source, label: src.label, notes: src.notes, pageCount: pages.length, skippedRedirects, strict, results };
}

function printReport(report, max) {
  console.log(`check-html: 対象 ${report.label}（${report.pageCount}ページ${report.skippedRedirects ? `、転送用ページ ${report.skippedRedirects}件は除外` : ""}）${report.strict ? "［全規則を有効］" : ""}`);
  for (const n of report.notes) console.log(`  ${n}`);
  const mark = { PASS: "PASS", FAIL: "FAIL", PENDING: "保留" };
  for (const r of report.results) {
    console.log(`\n[${mark[r.status]}] ${r.id} ${r.label}${r.findings.length ? ` — ${r.findings.length}件` : ""}${r.enforced ? "" : "（未有効: 段階2のあとで有効）"}`);
    for (const f of r.findings.slice(0, max)) {
      console.log(`    ${f.route}  ${f.where}  ${f.word}${f.excerpt ? `  ${f.excerpt}` : ""}`);
    }
    if (r.findings.length > max) console.log(`    …ほか ${r.findings.length - max}件（全件は JSON）`);
    if (r.allowed?.length) console.log(`    （許可した例外 ${r.allowed.length}件）`);
  }
  const count = (s) => report.results.filter((r) => r.status === s).length;
  console.log(`\n結果: FAIL ${count("FAIL")}・保留 ${count("PENDING")}・PASS ${count("PASS")}`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const opts = {
    source: arg("--source", flag("--out") ? "out" : flag("--dev") ? "dev" : "auto"),
    port: arg("--port", undefined),
    config: arg("--config", undefined),
    dir: arg("--dir", undefined),
    strict: flag("--strict"),
    only: arg("--only", "") ? arg("--only", "").split(",").map((s) => s.trim()) : null,
  };
  const jsonPath = path.resolve(ROOT, arg("--json", path.join("test-results", "check-html.json")));
  const max = Number(arg("--max", "20"));
  try {
    if (!["auto", "out", "dev"].includes(opts.source)) throw new Error(`--source は auto・out・dev のどれか（${opts.source}）`);
    const report = await checkHtml(opts);
    printReport(report, max);
    fs.mkdirSync(path.dirname(jsonPath), { recursive: true });
    fs.writeFileSync(jsonPath, `${JSON.stringify(report, null, 2)}\n`, "utf8");
    console.log(`全件: ${path.relative(ROOT, jsonPath)}`);
    process.exit(report.results.some((r) => r.status === "FAIL") ? 1 : 0);
  } catch (e) {
    console.error(`check-html: ${e.message}`);
    process.exit(2);
  }
}
