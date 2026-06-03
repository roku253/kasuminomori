import Link from "next/link";
import type { CityPageContent } from "@/lib/content/types";
import { CityBreadcrumb } from "@/components/layout/CityBreadcrumb";
import { ScrollReveal } from "@/components/motion/ScrollReveal";

function normalizeRelatedHref(href: string): string {
  if (href.startsWith("http") || href.startsWith("#")) return href;
  let p = href;
  while (p.startsWith("../")) p = p.slice(3);
  while (p.startsWith("./")) p = p.slice(2);
  p = p.replace(/index\.html$/, "");
  if (!p.startsWith("/")) p = `/${p}`;
  if (!p.endsWith("/")) p = `${p}/`;
  return p;
}

type Props = {
  page: CityPageContent;
};

export function CityPageTemplate({ page }: Props) {
  return (
    <main className="city-page mx-auto max-w-3xl px-4 py-10 md:py-14" id="city-main">
      <CityBreadcrumb items={page.breadcrumbs} />
      <ScrollReveal>
        {page.h1 && (
          <h1 className="mb-6 font-[family-name:var(--font-display)] text-3xl font-bold text-[#1a4d80] md:text-4xl">
            {page.h1}
          </h1>
        )}
      </ScrollReveal>
      {page.paragraphs?.map((html, i) => (
        <ScrollReveal key={i}>
          <div
            className="prose-city mb-4 text-[15px] leading-relaxed text-[#333]"
            dangerouslySetInnerHTML={{ __html: html }}
          />
        </ScrollReveal>
      ))}
      {page.tableHtml && (
        <ScrollReveal>
          <div className="prose-city overflow-x-auto" dangerouslySetInnerHTML={{ __html: page.tableHtml }} />
        </ScrollReveal>
      )}
      {page.extraHtml && (
        <ScrollReveal>
          <div className="prose-city" dangerouslySetInnerHTML={{ __html: page.extraHtml }} />
        </ScrollReveal>
      )}
      {page.related && page.related.length > 0 && (
        <aside className="mt-12 rounded-lg border border-[#dde3e8] bg-[#f8fafc] p-6">
          <h2 className="mb-3 text-base font-bold text-[#1a4d80]">関連するページ</h2>
          <ul className="space-y-2 p-0 list-none">
            {page.related.map((r) => (
              <li key={r.href} {...(r.storyClue ? { "data-kn-story-clue": "1" } : {})}>
                <Link href={normalizeRelatedHref(r.href)} className="text-[#1a4d80] no-underline hover:underline">
                  {r.label}
                </Link>
              </li>
            ))}
          </ul>
        </aside>
      )}
    </main>
  );
}
