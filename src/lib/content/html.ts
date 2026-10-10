import { rewriteContentHtml } from "@/lib/site";
import { applyPdfLinks } from "./pdf-links";

/** 地図などの埋め込み（iframe）は、画面に近づいてから読み込む（loading="lazy" が無ければ付ける） */
export function lazyIframes(html: string): string {
  if (!html.includes("<iframe")) return html;
  return html.replace(/<iframe\b(?![^>]*\sloading=)/gi, '<iframe loading="lazy"');
}

/**
 * ページ JSON の HTML を画面用に整える（サーバー側だけで使う）。
 *   1. <a data-pdf="…"> に PDF の書誌と新しいタブの表示を付ける（pdf-links.ts）
 *   2. 旧 .html 形式・ルート形式のリンクと画像の参照に basePath を付ける（site.ts の rewriteContentHtml）
 *   3. iframe に loading="lazy"
 */
export function renderContentHtml(html: string, pageRoute: string, sourcePath?: string): string {
  return lazyIframes(rewriteContentHtml(applyPdfLinks(html), pageRoute, sourcePath));
}
