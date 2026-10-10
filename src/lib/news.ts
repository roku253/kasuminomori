import { getManifest } from "@/lib/content/loader";
import { pageLabel } from "@/lib/content/page-label";
import { formatJaDate } from "@/lib/date-ja.mjs";

/**
 * お知らせの一覧（サーバー側だけで使う）。正本はページ JSON（src/content/pages/shisei-koho-*.json の `news.date`）。
 * トップの「お知らせ」と /shisei/koho/ の一覧（ツール news-list）はここから作る（手書きの配列は持たない）。
 */
export type NewsItem = {
  route: string;
  title: string;
  /** ISO（2026-10-09） */
  date: string;
  /** 令和8年10月9日 */
  dateText: string;
};

export function getNewsItems(limit?: number): NewsItem[] {
  const items = getManifest()
    .pages.filter((p) => p.news?.date)
    .map((p) => ({
      route: p.route,
      title: pageLabel(p),
      date: p.news!.date,
      dateText: formatJaDate(p.news!.date),
    }))
    .sort((a, b) => b.date.localeCompare(a.date) || a.route.localeCompare(b.route));
  return typeof limit === "number" ? items.slice(0, limit) : items;
}
