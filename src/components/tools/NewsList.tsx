import Link from "next/link";
import { getNewsItems } from "@/lib/news";

/** お知らせの一覧（ページ JSON の <div data-kn-tool="news-list"></div>。/shisei/koho/）。新しい順。 */
export function NewsList() {
  const items = getNewsItems();
  return (
    <ul className="kn-news-list">
      {items.map((n) => (
        <li key={n.route}>
          <time dateTime={n.date}>{n.dateText}</time>
          <Link href={n.route}>{n.title}</Link>
        </li>
      ))}
    </ul>
  );
}
