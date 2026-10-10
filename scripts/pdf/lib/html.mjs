/**
 * PDF 用 HTML の組み立て（文字列）。テンプレート（templates/*.mjs）が使う。
 *
 * - h`...` はタグ付きテンプレート。差し込んだ文字列はエスケープし、配列はつなぎ、safe() はそのまま入れる。
 * - t("...") は本文の小さな記法を HTML にする: **太字**、改行（\n）は <br>。それ以外はエスケープ。
 * - documentHtml() は 1 文書の HTML（@font-face と CSS を中に入れる）。1 ページ＝ <section class="page">（210×297mm）。
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const HERE = path.dirname(fileURLToPath(import.meta.url));
export const PDF_ROOT = path.join(HERE, "..");
export const REPO_ROOT = path.join(PDF_ROOT, "..", "..");

class Safe {
  constructor(s) {
    this.s = String(s);
  }
  toString() {
    return this.s;
  }
}
export const safe = (s) => new Safe(s);
export const isSafe = (v) => v instanceof Safe;

export function esc(s) {
  return String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
}

function piece(v) {
  if (v == null || v === false) return "";
  if (v instanceof Safe) return v.s;
  if (Array.isArray(v)) return v.map(piece).join("");
  return esc(v);
}

/** タグ付きテンプレート（差し込みはエスケープ、safe と配列はそのまま） */
export function h(strings, ...values) {
  let out = strings[0];
  values.forEach((v, i) => {
    out += piece(v) + strings[i + 1];
  });
  return safe(out);
}

/** 本文の記法: **太字** と改行 */
export function t(text) {
  const s = esc(text)
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/\n/g, "<br>");
  return safe(s);
}

/** フォント（OFL 版 BIZ UDP。Windows 同梱の同名フォントと取り違えないよう別名にする） */
export const FONTS = [
  { family: "KN Gothic", weight: 400, file: "fonts/bizudpgothic/BIZUDPGothic-Regular.ttf" },
  { family: "KN Gothic", weight: 700, file: "fonts/bizudpgothic/BIZUDPGothic-Bold.ttf" },
  { family: "KN Mincho", weight: 400, file: "fonts/bizudpmincho/BIZUDPMincho-Regular.ttf" },
];
/** PDF に埋め込まれてよいフォント（PostScript 名） */
export const FONT_NAME_PATTERN = "^(?:[A-Z]{6}\\+)?BIZUDP(?:Gothic|Mincho)-(?:Regular|Bold)$";

function fontFaceCss() {
  return FONTS.map(
    (f) =>
      `@font-face{font-family:"${f.family}";src:url("${pathToFileURL(path.join(PDF_ROOT, f.file)).href}") format("truetype");font-weight:${f.weight};font-style:normal;font-display:block;}`,
  ).join("\n");
}

/** styles/ の CSS を読む */
export function css(...names) {
  return names.map((n) => fs.readFileSync(path.join(PDF_ROOT, "styles", n), "utf8")).join("\n");
}

/** 画像の file:// URL（public/ からの相対） */
export function publicFile(rel) {
  const p = path.join(REPO_ROOT, "public", rel);
  if (!fs.existsSync(p)) throw new Error(`画像がありません: public/${rel}`);
  return pathToFileURL(p).href;
}

export function fileUrl(abs) {
  return pathToFileURL(abs).href;
}

/**
 * 1 文書の HTML。
 * @param {{title: string, styles: string, pages: any[], bodyClass?: string}} o
 */
export function documentHtml({ title, styles, pages, bodyClass = "" }) {
  return `<!doctype html>
<html lang="ja">
<head>
<meta charset="utf-8">
<title>${esc(title)}</title>
<style>
${fontFaceCss()}
${styles}
</style>
</head>
<body class="${esc(bodyClass)}">
${pages.map(piece).join("\n")}
</body>
</html>
`;
}
