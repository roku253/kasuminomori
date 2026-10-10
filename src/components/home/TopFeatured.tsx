import Link from "next/link";
import top from "@/content/data/top.json";

/** 注目情報（リニューアル告知を固定。B-6・DR-16）。中身は data/top.json */
export function TopFeatured() {
  return (
    <section className="kn-top-featured" aria-labelledby="top-featured-heading">
      <h2 id="top-featured-heading" className="kn-top-heading">
        {top.featured.heading}
      </h2>
      <ul className="kn-top-featured__list">
        {top.featured.items.map((item) => (
          <li key={item.href}>
            <Link href={item.href}>
              <span className="kn-top-featured__title">{item.title}</span>
              {item.note && <span className="kn-top-featured__note">{item.note}</span>}
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
