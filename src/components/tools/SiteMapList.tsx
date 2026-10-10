import Link from "next/link";
import { getSitemap } from "@/lib/local-nav";

/** サイトマップ（ページ JSON の <div data-kn-tool="sitemap"></div>）。中身は manifest から作る（src/lib/local-nav.ts） */
export function SiteMapList() {
  const groups = getSitemap();
  return (
    <div className="kn-sitemap">
      {groups.map((g) => (
        <section key={g.route} className="kn-sitemap__group" aria-labelledby={`sitemap-${g.route.replace(/[^a-z0-9]+/gi, "-")}`}>
          <h2 id={`sitemap-${g.route.replace(/[^a-z0-9]+/gi, "-")}`} className="kn-sitemap__title">
            <Link href={g.route}>{g.label}</Link>
          </h2>
          {g.items.length > 0 && (
            <ul className="kn-sitemap__list">
              {g.items.map((item) => (
                <li key={item.route}>
                  <Link href={item.route}>{item.label}</Link>
                </li>
              ))}
            </ul>
          )}
        </section>
      ))}
    </div>
  );
}
