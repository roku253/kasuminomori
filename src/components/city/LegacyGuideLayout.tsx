import Link from "next/link";
import type { CityPageContent } from "@/lib/content/types";
import { CityBreadcrumb } from "@/components/layout/CityBreadcrumb";
import { TOURISM_SIDEBAR } from "@/lib/navigation";

type Props = {
  page: CityPageContent;
};

export function LegacyGuideLayout({ page }: Props) {
  const mainAttrs = page.storyClueSelectors?.includes("main.content")
    ? { "data-kn-story-clue": "1" as const }
    : {};

  return (
    <div className="city-legacy-wrap bg-[#f4efe4]">
      <div className="mx-auto max-w-6xl px-4 py-8">
        <CityBreadcrumb items={page.breadcrumbs} />
        <div className="main-layout grid gap-8 lg:grid-cols-[220px_1fr]">
          <aside className="sidebar rounded border border-[#ccbda5] bg-[#faf8f4] p-4 text-sm">
            <h2 className="mt-0 text-sm text-[#2d5a27]">メニュー</h2>
            <ul className="space-y-1 p-0 list-none">
              {TOURISM_SIDEBAR.menu.map((l) => (
                <li key={l.href}>
                  <Link href={l.href} className="text-[#333] no-underline hover:text-[#1a4d80]">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
            <h2 className="text-sm text-[#2d5a27]">観光スポット</h2>
            <ul className="space-y-1 p-0 list-none">
              {TOURISM_SIDEBAR.spots.map((l) => (
                <li key={l.href}>
                  <Link href={l.href} className="text-[#333] no-underline hover:text-[#1a4d80]">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
            <h2 className="text-sm text-[#2d5a27]">町のページ</h2>
            <ul className="space-y-1 p-0 list-none">
              {TOURISM_SIDEBAR.town.map((l) => (
                <li key={l.href}>
                  <Link href={l.href} className="text-[#333] no-underline hover:text-[#1a4d80]">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
            <h2 className="text-sm text-[#2d5a27]">教育施設</h2>
            <ul className="space-y-1 p-0 list-none">
              {TOURISM_SIDEBAR.external.map((l) => (
                <li key={l.href}>
                  <a
                    href={l.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[#333] no-underline hover:text-[#1a4d80]"
                  >
                    {l.label}
                  </a>
                </li>
              ))}
            </ul>
          </aside>
          <main
            className="content legacy-prose rounded border border-[#ccbda5] bg-white p-6 md:p-8"
            id="city-main"
            {...mainAttrs}
          >
            {page.bodyHtml && (
              <div dangerouslySetInnerHTML={{ __html: page.bodyHtml }} />
            )}
            {page.extraHtml && (
              <div dangerouslySetInnerHTML={{ __html: page.extraHtml }} />
            )}
          </main>
        </div>
      </div>
    </div>
  );
}
