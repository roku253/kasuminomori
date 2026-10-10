import printError from "@/content/data/print-error.json";

/**
 * 謎解きの印刷の仕掛け（AGENTS.md「維持必須」の .kn-print-error）。
 * ページ JSON に "printError": true があるページだけ、#site-root の先頭にこの要素を置く（SiteShell）。
 * 画面では表示しない（globals.css）。印刷すると、このページだけ本文・ヘッダー・フッターが消えてこの文だけが出る。
 * ほかのページは普通に印刷できる（確定版 v3 §1-F）。文は src/content/data/print-error.json。
 */
export function PrintError() {
  return (
    <p className="kn-print-error" aria-hidden="true">
      {printError.text}
    </p>
  );
}
