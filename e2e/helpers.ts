import type { Locator } from "@playwright/test";

/**
 * 要素が画面上で最前面か（ほかの要素に覆われていないか）を、要素の見えている範囲の中心で調べる。
 * Playwright の toBeVisible は「重なって隠れている」を見ないので、メニューを開いたときの重なりはこれで確かめる。
 * - true: 中心点のいちばん上がその要素（か子孫）
 * - false: 別の要素（メニューの背景など）に覆われている
 * - null: 画面の外にある（判定できない）
 */
export async function isOnTop(locator: Locator): Promise<boolean | null> {
  return locator.first().evaluate((el) => {
    const r = el.getBoundingClientRect();
    const left = Math.max(r.left, 0);
    const right = Math.min(r.right, window.innerWidth);
    const top = Math.max(r.top, 0);
    const bottom = Math.min(r.bottom, window.innerHeight);
    if (right <= left || bottom <= top) return null;
    const hit = document.elementFromPoint((left + right) / 2, (top + bottom) / 2);
    return !!hit && (hit === el || el.contains(hit));
  });
}
