import Link from "next/link";
import type { LocalNavData, LocalNavItem } from "@/lib/local-nav";

/**
 * ローカルナビ（同じ分類の下位ページ一覧）。デスクトップは本文の右、モバイルは本文の下に出る
 * （並べ方は CityPageTemplate の .kn-page--with-nav と globals.css）。データは src/lib/local-nav.ts。
 * 見出しは分類の入口ページへのリンク、今いるページは aria-current="page"。
 */
export function LocalNav({ data }: { data: LocalNavData }) {
  const headingId = `local-nav-${data.category.route.replace(/[^a-z0-9]+/gi, "-")}`;
  return (
    <nav aria-labelledby={headingId} className="kn-local-nav">
      <h2 id={headingId} className="kn-local-nav__title">
        <Link href={data.category.route}>{data.category.label}</Link>
      </h2>
      <NavList items={data.items} />
    </nav>
  );
}

function NavList({ items, nested = false }: { items: LocalNavItem[]; nested?: boolean }) {
  return (
    <ul className={nested ? "kn-local-nav__sub" : "kn-local-nav__list"}>
      {items.map((item) => (
        <li key={item.route}>
          <Link href={item.route} aria-current={item.current ? "page" : undefined}>
            {item.label}
          </Link>
          {item.children && <NavList items={item.children} nested />}
        </li>
      ))}
    </ul>
  );
}
