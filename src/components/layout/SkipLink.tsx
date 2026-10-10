/**
 * 「本文へ移動」（WCAG 2.4.1）。ページの最初のリンクで、キーボードで触れたときだけ見える。
 * 行き先は SiteShell・トップの <main id="main" tabIndex={-1}>。
 */
export function SkipLink() {
  return (
    <a href="#main" className="kn-skip-link">
      本文へ移動
    </a>
  );
}
