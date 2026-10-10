/**
 * 組版の検査（ブラウザの中で実行する。print のメディアで測る）。問題の一覧（文字列の配列）を返す。
 *
 * - 1 ページ＝ .page（210×297mm）。ページの寸法が違う、ページの数が違う → 問題。
 * - はみ出し: overflow を切っている要素（.page・枠・段組）と data-fit の要素で、中身が箱より大きい → 問題。
 *   段組（column）の箱は、溢れると右へ段が増えるので scrollWidth で分かる。
 * - 区画の外: 要素の外形がページの外に出ている → 問題（.bleed は裁ち落としとしてページの縁まで可）。
 * - 安全域: .page の中の文字は、ページの縁から 6mm の内側（.bleed・.page-art の中は除く）。
 * - 画像が読めていない、フォントが読めていない → 問題。
 */
export function layoutCheck({ expectedPages } = {}) {
  const MM = 96 / 25.4;
  const problems = [];
  const desc = (el) => {
    const id = el.id ? `#${el.id}` : "";
    const cls = typeof el.className === "string" && el.className ? `.${el.className.trim().split(/\s+/).join(".")}` : "";
    const txt = (el.textContent || "").replace(/\s+/g, "").slice(0, 24);
    return `${el.tagName.toLowerCase()}${id}${cls}「${txt}」`;
  };
  const pages = [...document.querySelectorAll(".page")];
  if (expectedPages && pages.length !== expectedPages) problems.push(`ページ数 ${pages.length}（予定 ${expectedPages}）`);
  pages.forEach((pg, i) => {
    const n = i + 1;
    const pr = pg.getBoundingClientRect();
    if (Math.abs(pr.width - 210 * MM) > 1 || Math.abs(pr.height - 297 * MM) > 1) {
      problems.push(`p${n}: 寸法が A4 でない（${pr.width.toFixed(1)}×${pr.height.toFixed(1)}px）`);
    }
    const safe = 6 * MM;
    for (const el of [pg, ...pg.querySelectorAll("*")]) {
      if (el.closest("svg") && el.tagName.toLowerCase() !== "svg") continue;
      const cs = getComputedStyle(el);
      if (cs.display === "none") continue;
      const clips = /hidden|clip|auto|scroll/.test(`${cs.overflowX} ${cs.overflowY}`) || el.hasAttribute("data-fit");
      if (clips) {
        if (el.scrollHeight > el.clientHeight + 1) problems.push(`p${n}: はみ出し（縦 ${el.scrollHeight - el.clientHeight}px） ${desc(el)}`);
        if (el.scrollWidth > el.clientWidth + 1) problems.push(`p${n}: はみ出し（横 ${el.scrollWidth - el.clientWidth}px） ${desc(el)}`);
      }
      const r = el.getBoundingClientRect();
      if (!r.width || !r.height) continue;
      if (r.left < pr.left - 0.5 || r.right > pr.right + 0.5 || r.top < pr.top - 0.5 || r.bottom > pr.bottom + 0.5) {
        problems.push(`p${n}: 区画の外 ${desc(el)}`);
        continue;
      }
      // 文字の安全域（裁ち落としの飾りは除く）
      if (el.closest(".bleed, .page-art")) continue;
      const hasOwnText = [...el.childNodes].some((c) => c.nodeType === 3 && c.textContent.trim());
      if (hasOwnText) {
        if (r.left < pr.left + safe - 0.5 || r.right > pr.right - safe + 0.5 || r.top < pr.top + safe - 0.5 || r.bottom > pr.bottom - safe + 0.5) {
          problems.push(`p${n}: 文字が縁から6mm以内 ${desc(el)}`);
        }
      }
    }
  });
  for (const img of document.images) {
    if (!img.complete || !img.naturalWidth) problems.push(`画像が読めない: ${img.getAttribute("src")?.slice(-60)}`);
  }
  for (const f of document.fonts) {
    if (f.status !== "loaded" && f.status !== "unloaded") problems.push(`フォント ${f.family} ${f.weight}: ${f.status}`);
    if (f.status === "error") problems.push(`フォントが読めない: ${f.family} ${f.weight}`);
  }
  return problems;
}
