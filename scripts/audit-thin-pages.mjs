/**
 * 本文の薄いページ（city レイアウトで本文が400字未満）を一覧にする。WP3 の手がかり用。
 * 旧 audit-enriched.mjs（copy-enrichment の差し替え後を数えていた）を、正本一本化（段階1a）に合わせて整理したもの。
 * 実行: node scripts/audit-thin-pages.mjs   （先に npm run content で manifest を最新にする）
 */
import manifest from "../src/content/manifest.json" with { type: "json" };

const thin = manifest.pages
  .filter((p) => p.layout === "city")
  .filter((p) => {
    const textLen =
      (p.paragraphs?.join("")?.length ?? 0) +
      (p.bodyHtml?.length ?? 0) +
      (p.extraHtml?.length ?? 0);
    return textLen < 400;
  })
  .map((p) => p.route);

console.log("Thin pages:", thin.length, thin);
