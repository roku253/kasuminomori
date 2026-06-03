import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CityPageTemplate } from "@/components/city/CityPageTemplate";
import { LegacyGuideLayout } from "@/components/city/LegacyGuideLayout";
import { SiteShell } from "@/components/layout/SiteShell";
import { getPageByRoute } from "@/lib/content/loader";
import type { CityPageContent } from "@/lib/content/types";

export function pageMetadata(page: CityPageContent): Metadata {
  return {
    title: page.title.replace(/｜霞ノ杜町$/, ""),
    description: page.description || undefined,
    alternates: page.canonical ? { canonical: page.canonical } : undefined,
  };
}

export function RenderPage({ route }: { route: string }) {
  const page = getPageByRoute(route);
  if (!page) notFound();

  const inner =
    page.layout === "legacy" ? (
      <LegacyGuideLayout page={page} />
    ) : (
      <CityPageTemplate page={page} />
    );

  return <SiteShell>{inner}</SiteShell>;
}

export function createPageMetadata(route: string): Metadata | undefined {
  const page = getPageByRoute(route);
  if (!page) return undefined;
  return pageMetadata(page);
}
