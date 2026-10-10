import { Fragment, type ReactNode } from "react";
import type { CityPageContent } from "@/lib/content/types";
import { isHubExtraHtml, parseHubCardsFromHtml, stripHubHtml, stripRelatedAside } from "@/lib/parse-hub";
import { renderContentHtml } from "@/lib/content/html";
import { getLocalNav } from "@/lib/local-nav";
import { pageLabel } from "@/lib/content/page-label";
import { CategoryHub } from "@/components/ui/CategoryHub";
import { DataTable } from "@/components/ui/DataTable";
import { PageHero } from "@/components/ui/PageHero";
import { RelatedPanel } from "@/components/ui/RelatedPanel";
import { SectionCard } from "@/components/ui/SectionCard";
import { LocalNav } from "@/components/layout/LocalNav";
import { KasumiTownMapEmbed } from "@/components/city/KasumiTownMapEmbed";
import { PageContact } from "@/components/city/PageContact";
import { ScrollReveal } from "@/components/motion/ScrollReveal";
import { renderTool, splitToolMarkers, toolMarkerName } from "@/components/tools/registry";

type Props = {
  page: CityPageContent;
};

/** アクセスのページの本文（bodyHtml）にある町内マップの目印。ここに地図の埋め込みを入れる */
const TOWN_MAP_MARKER = "<!--KASUMI_TOWN_MAP-->";

/**
 * 下層ページの共通テンプレート（全ページこの1種類。旧 LegacyGuideLayout＝左の観光メニューは 1b で廃止）。
 * 並び: パンくず → h1 → 導入文 →（カテゴリの入口ならカード）→ 本文 →（表）→ 関連するページ
 * ＋ ローカルナビ（同じ分類のページ一覧。デスクトップは本文の右、モバイルは本文の下）。
 */
function renderBodyHtml(html: string, key: number, page: CityPageContent) {
  const tool = toolMarkerName(html);
  if (tool) {
    return <Fragment key={key}>{renderTool(tool, { caption: page.h1 })}</Fragment>;
  }
  if (html.trim().startsWith("<")) {
    return (
      <div
        key={key}
        className="prose-city text-base"
        dangerouslySetInnerHTML={{ __html: renderContentHtml(html, page.route, page.path) }}
      />
    );
  }
  return (
    <p key={key} className="m-0 text-base leading-relaxed text-[#333]">
      {html}
    </p>
  );
}

/** HTML（bodyHtml・extraHtml）を描く。ツールの目印（data-kn-tool）・町内マップの目印があれば、その位置に部品を入れる。 */
function renderRichHtml(html: string, page: CityPageContent): ReactNode[] {
  const nodes: ReactNode[] = [];
  html.split(TOWN_MAP_MARKER).forEach((chunk, c) => {
    if (c > 0) nodes.push(<KasumiTownMapEmbed key={`map-${c}`} />);
    splitToolMarkers(chunk).forEach((part, i) => {
      nodes.push(
        part.type === "tool" ? (
          <Fragment key={`${c}-${i}`}>{renderTool(part.name, { caption: page.h1 })}</Fragment>
        ) : (
          <div
            key={`${c}-${i}`}
            className="prose-city"
            dangerouslySetInnerHTML={{ __html: renderContentHtml(part.html, page.route, page.path) }}
          />
        )
      );
    });
  });
  return nodes;
}

export function CityPageTemplate({ page }: Props) {
  const hubCards = page.extraHtml && isHubExtraHtml(page.extraHtml) ? parseHubCardsFromHtml(page.extraHtml) : [];
  let extraAfterHub = page.extraHtml && hubCards.length ? stripHubHtml(page.extraHtml) : page.extraHtml;
  if (extraAfterHub && page.related?.length) {
    extraAfterHub = stripRelatedAside(extraAfterHub);
  }
  const bodyHtml = page.bodyHtml && page.related?.length ? stripRelatedAside(page.bodyHtml) : page.bodyHtml;
  const lead = page.paragraphs?.[0];
  const moreParagraphs = page.paragraphs?.slice(1) ?? [];
  const leadIsHtml = lead?.trim().startsWith("<");
  const tableTool = toolMarkerName(page.tableHtml);
  const localNav = getLocalNav(page);

  const article = (
    <article className="city-page min-w-0" id="city-main">
      <PageHero
        title={pageLabel(page)}
        breadcrumbs={page.breadcrumbs}
        pageRoute={page.route}
        sourcePath={page.path}
        subtitle={lead && !leadIsHtml ? lead : undefined}
      />

      {lead && leadIsHtml && <SectionCard className="mb-8">{renderBodyHtml(lead, 0, page)}</SectionCard>}

      {hubCards.length > 0 && (
        <ScrollReveal>
          <SectionCard title="目的から探す" className="mb-8">
            <CategoryHub cards={hubCards} pageRoute={page.route} sourcePath={page.path} />
          </SectionCard>
        </ScrollReveal>
      )}

      {moreParagraphs.length > 0 && (
        <SectionCard className="mb-8">
          {moreParagraphs.map((html, i) => renderBodyHtml(html, i, page))}
        </SectionCard>
      )}

      {bodyHtml && bodyHtml.trim() && <SectionCard className="mb-8">{renderRichHtml(bodyHtml, page)}</SectionCard>}

      {page.tableHtml && (
        <ScrollReveal>
          <SectionCard title={page.tableTitle} className="mb-8">
            {tableTool ? (
              renderTool(tableTool, { caption: page.tableTitle ?? page.h1 })
            ) : (
              <DataTable tableHtml={page.tableHtml} caption={page.tableTitle ?? page.h1} />
            )}
          </SectionCard>
        </ScrollReveal>
      )}

      {extraAfterHub && extraAfterHub.length > 10 && (
        <ScrollReveal>
          <SectionCard className="mb-8">{renderRichHtml(extraAfterHub, page)}</SectionCard>
        </ScrollReveal>
      )}

      {page.related && page.related.length > 0 && (
        <RelatedPanel links={page.related} pageRoute={page.route} sourcePath={page.path} />
      )}

      <PageContact page={page} />
    </article>
  );

  return (
    <div className={`kn-page mx-auto w-full max-w-6xl px-4 py-8 md:py-10 ${localNav ? "kn-page--with-nav" : ""}`}>
      {article}
      {localNav && <LocalNav data={localNav} />}
    </div>
  );
}
