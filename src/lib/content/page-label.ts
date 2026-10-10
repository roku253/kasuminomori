import type { CityPageContent } from "./types";
import { TITLE_SUFFIX } from "@/lib/site";

/**
 * ページの名前（h1）。`<title>`（「名前｜霞ノ杜町」）・og:title・ローカルナビ・検索結果の題名はすべてこれを使う。
 * h1 の無い旧型ページは JSON の title から「｜霞ノ杜町」を除いたもの。
 * JSON の title は h1＋「｜霞ノ杜町」にそろえる（build-manifest.mjs が食い違いを注意として出す）。
 */
export function pageLabel(page: Pick<CityPageContent, "h1" | "title">): string {
  return (page.h1 ?? page.title).replace(new RegExp(`${TITLE_SUFFIX}$`), "").trim();
}
