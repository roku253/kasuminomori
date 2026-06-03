import type { CityPageContent } from "@/lib/content/types";
import Link from "next/link";
import { ExternalLink, MapPin } from "lucide-react";
import { TOURISM_SIDEBAR } from "@/lib/navigation";
import { PageHero } from "@/components/ui/PageHero";
import { RelatedPanel } from "@/components/ui/RelatedPanel";
import { ScrollReveal } from "@/components/motion/ScrollReveal";

type Props = {
  page: CityPageContent;
};

export function LegacyGuideLayout({ page }: Props) {
  const mainAttrs = page.storyClueSelectors?.includes("main.content")
    ? { "data-kn-story-clue": "1" as const }
    : {};

  return (
    <article className="mx-auto w-full max-w-6xl px-4 py-8 md:py-12" id="city-main">
      <PageHero
        title={page.h1 ?? page.title.replace(/｜霞ノ杜町$/, "")}
        breadcrumbs={page.breadcrumbs}
      />

      <div className="grid gap-8 lg:grid-cols-[minmax(200px,240px)_1fr]">
        <ScrollReveal className="order-1 lg:order-2">
          <div
            className="legacy-prose rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-white p-6 shadow-[var(--shadow-sm)] md:p-8"
            {...mainAttrs}
          >
            {page.bodyHtml && <div dangerouslySetInnerHTML={{ __html: page.bodyHtml }} />}
            {page.extraHtml && <div dangerouslySetInnerHTML={{ __html: page.extraHtml }} />}
          </div>
        </ScrollReveal>

        <nav
          className="order-2 h-fit rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-white p-4 shadow-[var(--shadow-sm)] lg:order-1 lg:sticky lg:top-24"
          aria-label="観光・町案内メニュー"
        >
          <p className="mb-3 flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[var(--kasumi-blue)]">
            <MapPin size={14} aria-hidden />
            町のご案内
          </p>
          <SidebarBlock title="メニュー" links={TOURISM_SIDEBAR.menu} />
          <SidebarBlock title="観光スポット" links={TOURISM_SIDEBAR.spots} />
          <SidebarBlock title="町のページ" links={TOURISM_SIDEBAR.town} />
          <div className="mt-4 border-t border-[var(--color-border)] pt-4">
            <p className="mb-2 text-xs font-bold text-[#666]">教育施設</p>
            <ul className="m-0 list-none space-y-1.5 p-0 text-sm">
              {TOURISM_SIDEBAR.external.map((l) => (
                <li key={l.href}>
                  <a
                    href={l.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-[var(--kasumi-blue)] no-underline hover:underline"
                  >
                    {l.label}
                    <ExternalLink size={12} aria-hidden />
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </nav>
      </div>

      {page.related && page.related.length > 0 && <RelatedPanel links={page.related} className="mt-8" />}
    </article>
  );
}

function SidebarBlock({
  title,
  links,
}: {
  title: string;
  links: readonly { href: string; label: string }[];
}) {
  return (
    <div className="mb-4">
      <p className="mb-2 text-xs font-bold text-[#666]">{title}</p>
      <ul className="m-0 list-none space-y-1.5 p-0 text-sm">
        {links.map((l) => (
          <li key={l.href}>
            <Link
              href={l.href}
              className="inline-flex min-h-[44px] items-center py-1 text-[#333] no-underline hover:text-[var(--kasumi-blue)] hover:underline"
            >
              {l.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
