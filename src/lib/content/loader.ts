import type { CityPageContent, ContentManifest } from "./types";
import manifest from "@/content/manifest.json";
import copyEnrichment from "@/content/copy-enrichment.json";

type CopyEnrichmentEntry = {
  description?: string;
  h1?: string;
  replaceParagraphs?: boolean;
  paragraphs?: string[];
};

const enrichmentMap = copyEnrichment as Record<string, CopyEnrichmentEntry>;

function applyCopyEnrichment(page: CityPageContent): CityPageContent {
  const extra = enrichmentMap[page.route];
  if (!extra) return page;
  const paragraphs = extra.replaceParagraphs
    ? extra.paragraphs ?? page.paragraphs
    : [...(page.paragraphs ?? []), ...(extra.paragraphs ?? [])];
  return {
    ...page,
    description: extra.description ?? page.description,
    h1: extra.h1 ?? page.h1,
    paragraphs: paragraphs?.length ? paragraphs : page.paragraphs,
  };
}

const pagesMap = new Map<string, CityPageContent>();

for (const p of (manifest as ContentManifest).pages) {
  pagesMap.set(p.route, applyCopyEnrichment(p));
}

export function getManifest(): ContentManifest {
  return manifest as ContentManifest;
}

export function getPageByRoute(route: string): CityPageContent | undefined {
  const normalized = route.endsWith("/") ? route : `${route}/`;
  return pagesMap.get(normalized === "//" ? "/" : normalized);
}

export function getCategorySlugs(category: string): string[] {
  const m = getManifest();
  return m.categories[category] || [];
}

export function getSpotIds(): string[] {
  return getManifest().spots;
}
