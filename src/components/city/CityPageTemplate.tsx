import type { CityPageContent } from "@/lib/content/types";
import { isHubExtraHtml, parseHubCardsFromHtml, stripHubHtml, stripRelatedAside } from "@/lib/parse-hub";
import { CategoryHub } from "@/components/ui/CategoryHub";
import { DataTable } from "@/components/ui/DataTable";
import { PageHero } from "@/components/ui/PageHero";
import { RelatedPanel } from "@/components/ui/RelatedPanel";
import { SectionCard } from "@/components/ui/SectionCard";
import { ScrollReveal } from "@/components/motion/ScrollReveal";

type Props = {
  page: CityPageContent;
};

function renderBodyHtml(html: string, key: number) {
  if (html.trim().startsWith("<")) {
    return <div key={key} className="prose-city text-base" dangerouslySetInnerHTML={{ __html: html }} />;
  }
  return (
    <p key={key} className="m-0 text-base leading-relaxed text-[#333]">
      {html}
    </p>
  );
}

export function CityPageTemplate({ page }: Props) {
  const hubCards = page.extraHtml && isHubExtraHtml(page.extraHtml) ? parseHubCardsFromHtml(page.extraHtml) : [];
  let extraAfterHub = page.extraHtml && hubCards.length ? stripHubHtml(page.extraHtml) : page.extraHtml;
  if (extraAfterHub && page.related?.length) {
    extraAfterHub = stripRelatedAside(extraAfterHub);
  }
  const lead = page.paragraphs?.[0];
  const moreParagraphs = page.paragraphs?.slice(1) ?? [];
  const leadIsHtml = lead?.trim().startsWith("<");

  return (
    <article className="city-page mx-auto w-full max-w-6xl px-4 py-8 md:py-12" id="city-main">
      <PageHero
        title={page.h1 ?? page.title.replace(/｜霞ノ杜町$/, "")}
        breadcrumbs={page.breadcrumbs}
        subtitle={lead && !leadIsHtml ? lead : undefined}
      />

      {lead && leadIsHtml && <SectionCard className="mb-8">{renderBodyHtml(lead, 0)}</SectionCard>}

      {hubCards.length > 0 && (
        <ScrollReveal>
          <SectionCard title="目的から探す" className="mb-8">
            <CategoryHub cards={hubCards} />
          </SectionCard>
        </ScrollReveal>
      )}

      {moreParagraphs.length > 0 && (
        <SectionCard className="mb-8">
          {moreParagraphs.map((html, i) => renderBodyHtml(html, i))}
        </SectionCard>
      )}

      {page.tableHtml && (
        <ScrollReveal>
          <SectionCard title="一覧・詳細" className="mb-8">
            <DataTable tableHtml={page.tableHtml} caption={page.h1} />
          </SectionCard>
        </ScrollReveal>
      )}

      {extraAfterHub && extraAfterHub.length > 10 && (
        <ScrollReveal>
          <SectionCard className="mb-8">
            <div className="prose-city" dangerouslySetInnerHTML={{ __html: extraAfterHub }} />
          </SectionCard>
        </ScrollReveal>
      )}

      {page.related && page.related.length > 0 && <RelatedPanel links={page.related} />}
    </article>
  );
}
