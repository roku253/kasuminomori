import Link from "next/link";
import top from "@/content/data/top.json";
import { getNewsItems } from "@/lib/news";

/** トップの「お知らせ」（新しい順に8件。正本はお知らせのページ JSON の news.date）。id="top-news" は e2e が使う */
export function TopNews() {
  const items = getNewsItems(top.news.count);
  return (
    <section id="top-news" className="kn-top-news" aria-labelledby="top-news-heading">
      <h2 id="top-news-heading" className="kn-top-heading">
        {top.news.heading}
      </h2>
      <ul className="kn-news-list">
        {items.map((n) => (
          <li key={n.route}>
            <time dateTime={n.date}>{n.dateText}</time>
            <Link href={n.route}>{n.title}</Link>
          </li>
        ))}
      </ul>
      <p className="kn-top-more">
        <Link href={top.news.moreHref}>{top.news.moreLabel}</Link>
      </p>
    </section>
  );
}
