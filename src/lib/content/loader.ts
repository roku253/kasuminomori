import type { CityPageContent, ContentManifest } from "./types";
import manifest from "@/content/manifest.json";

const pagesMap = new Map<string, CityPageContent>();

for (const p of (manifest as ContentManifest).pages) {
  pagesMap.set(p.route, p);
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
