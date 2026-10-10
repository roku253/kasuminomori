import type { CityPageContent, ContentManifest } from "./types";
import manifest from "@/content/manifest.json";

/**
 * 実行時のページ一覧。manifest.json は src/content/pages/*.json（正本）から
 * scripts/build-manifest.mjs が作る生成物（npm run dev / build / content で更新）。
 */
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
