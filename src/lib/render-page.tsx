import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CityPageTemplate } from "@/components/city/CityPageTemplate";
import { SiteShell } from "@/components/layout/SiteShell";
import { getPageByRoute } from "@/lib/content/loader";
import { pageLabel } from "@/lib/content/page-label";
import type { CityPageContent } from "@/lib/content/types";
import { OG_IMAGE, SITE_NAME, TITLE_SUFFIX, withFictionNote } from "@/lib/site";

/** description が空のページの既定（JSON の description は WP3 が埋める） */
function defaultDescription(label: string): string {
  return `霞ノ杜町の「${label}」のページです。`;
}

/**
 * 下層ページの meta（ページ JSON から一か所で作る）。
 * - `<title>` と og:title は「h1｜霞ノ杜町」（layout.tsx の title.template）。
 * - description・og:description・twitter:description の末尾に架空の注記（site.ts の FICTION_NOTE）。
 * - canonical・og:url は route から自動（metadataBase＝SITE_URL と結合。JSON の canonical があればそれを優先）。
 */
export function pageMetadata(page: CityPageContent): Metadata {
  const label = pageLabel(page);
  const fullTitle = `${label}${TITLE_SUFFIX}`;
  const description = withFictionNote(page.description?.trim() || defaultDescription(label));
  const url = page.canonical ?? page.route;
  return {
    title: label,
    description,
    alternates: { canonical: url },
    openGraph: {
      type: "article",
      locale: "ja_JP",
      siteName: SITE_NAME,
      title: fullTitle,
      description,
      url,
      images: [OG_IMAGE],
    },
    twitter: {
      card: "summary_large_image",
      title: fullTitle,
      description,
      images: [OG_IMAGE.url],
    },
  };
}

export function RenderPage({ route }: { route: string }) {
  const page = getPageByRoute(route);
  if (!page) notFound();

  return (
    <SiteShell printError={page.printError === true}>
      <CityPageTemplate page={page} />
    </SiteShell>
  );
}

export function createPageMetadata(route: string): Metadata | undefined {
  const page = getPageByRoute(route);
  if (!page) return undefined;
  return pageMetadata(page);
}
