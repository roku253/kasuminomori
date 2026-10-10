import pdfMeta from "@/generated/pdf-meta.json";

/**
 * PDF リンク部品（ページ JSON の HTML 用）。
 *
 * ページ JSON に
 *   <a data-pdf="gikai-dayori-098.pdf">霞ノ杜町議会だより 第98号</a>
 * と書くと、表示のときに
 *   - href（/pdf/ファイル名。basePath は後段の rewriteContentHtml が付ける）・target="_blank"・rel="noopener"
 *   - リンク文の後ろに「（PDF：8ページ・3.1MB）」（A3 なら「（PDF：A3判・1ページ・2.3MB）」）
 *   - 読み上げ用の「（新しいタブで開きます）」と、新しいタブのアイコン（aria-hidden）
 * を付ける。値は src/generated/pdf-meta.json（npm run pdf:meta で作る）から取る。
 * a 要素の他の属性（data-kn-story-clue など）はそのまま残す。li などの親要素には触らない。
 * pdf-meta.json に無いファイル名は scripts/build-manifest.mjs が検出して止める（ここでは「（PDF）」とだけ出す）。
 */
export type PdfMetaEntry = {
  bytes: number;
  sha256: string;
  pages: number;
  paper: string | null;
  pageSizes: number[][];
  title: string;
};

const FILES = (pdfMeta as { files: Record<string, PdfMetaEntry> }).files;

export function getPdfMeta(file: string): PdfMetaEntry | undefined {
  return FILES[file];
}

/** 1MB 以上は小数1桁の MB、未満は整数の KB（1024 で割って切り上げ。受け入れ条件 K-18 の式と同じ） */
export function formatBytes(bytes: number): string {
  if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)}MB`;
  return `${Math.max(1, Math.ceil(bytes / 1024))}KB`;
}

/** 「（PDF：8ページ・3.1MB）」。A4 以外の決まった用紙（A3）は「A3判・」を前に付ける */
export function formatPdfInfo(entry: PdfMetaEntry | undefined): string {
  if (!entry) return "（PDF）";
  const paper = entry.paper && entry.paper !== "A4" ? `${entry.paper}判・` : "";
  return `（PDF：${paper}${entry.pages}ページ・${formatBytes(entry.bytes)}）`;
}

export const NEW_TAB_TEXT = "（新しいタブで開きます）";

const NEW_TAB_ICON =
  '<svg class="kn-newtab-icon" aria-hidden="true" focusable="false" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="display:inline-block;vertical-align:-0.125em;margin-left:0.2em"><path d="M15 3h6v6"/><path d="M10 14 21 3"/><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/></svg>';

const PDF_LINK_RE = /<a\b([^>]*?\sdata-pdf=(["'])([^"']+)\2[^>]*)>([\s\S]*?)<\/a>/gi;

function addAttr(attrs: string, name: string, value: string): string {
  return new RegExp(`\\s${name}=`, "i").test(attrs) ? attrs : `${attrs} ${name}="${value}"`;
}

function addClass(attrs: string, className: string): string {
  const m = attrs.match(/\sclass=(["'])([^"']*)\1/i);
  if (!m) return `${attrs} class="${className}"`;
  if (m[2].split(/\s+/).includes(className)) return attrs;
  return attrs.replace(m[0], ` class=${m[1]}${m[2]} ${className}${m[1]}`);
}

/** HTML 中の <a data-pdf="…"> に書誌・新しいタブの表示を付ける（data-pdf が無い a には触らない） */
export function applyPdfLinks(html: string): string {
  if (!html.includes("data-pdf")) return html;
  return html.replace(PDF_LINK_RE, (_m, rawAttrs: string, _q: string, file: string, inner: string) => {
    let attrs = rawAttrs;
    attrs = addAttr(attrs, "href", `/pdf/${file}`);
    attrs = addAttr(attrs, "target", "_blank");
    attrs = addAttr(attrs, "rel", "noopener");
    attrs = addClass(attrs, "kn-pdf-link");
    const info = formatPdfInfo(getPdfMeta(file));
    return `<a${attrs}>${inner}${info}<span class="sr-only">${NEW_TAB_TEXT}</span>${NEW_TAB_ICON}</a>`;
  });
}
