import { getManifest } from "@/lib/content/loader";
import { pageLabel } from "@/lib/content/page-label";
import type { CityPageContent } from "@/lib/content/types";
import {
  isNewsDetailRoute,
  LOCAL_NAV_EXCLUDE,
  MEGA_COLUMNS,
  SITEMAP_NO_CHILDREN,
  STORY_LINK_GROUPS,
} from "@/lib/navigation";
import { isHubExtraHtml, parseHubCardsFromHtml } from "@/lib/parse-hub";
import { resolveContentHref } from "@/lib/site";

/**
 * ローカルナビ（カテゴリ内の下位ページ一覧）のデータを manifest から作る（サーバー側だけで使う）。
 * 親子関係はページ JSON のパンくず（breadcrumbs）から決める: 親＝最後から2番目、カテゴリ＝2番目。
 * 並び順はカテゴリの入口ページのカード（city-hub-card）の順、カードに無いものは route 順。
 * 規則（除外・物語ページの群）は src/lib/navigation.ts。
 */
export type LocalNavItem = {
  route: string;
  label: string;
  current: boolean;
  children?: LocalNavItem[];
};

export type LocalNavData = {
  category: { route: string; label: string; current: boolean };
  items: LocalNavItem[];
};

type Node = { page: CityPageContent; parent: string | null; chain: string[] };

let cache: Map<string, Node> | null = null;

function normalizeRoute(href: string, page: CityPageContent): string {
  const r = resolveContentHref(href, page.route, page.path).replace(/#.*$/, "");
  return r.endsWith("/") ? r : `${r}/`;
}

/** パンくずの href を route にした列（トップ "/" を除く）＋自分 */
function crumbChain(page: CityPageContent): string[] {
  const chain: string[] = [];
  for (const item of page.breadcrumbs ?? []) {
    if (!item.href) continue;
    const route = item.label === "トップ" ? "/" : normalizeRoute(item.href, page);
    if (route !== "/" && route !== page.route && !chain.includes(route)) chain.push(route);
  }
  chain.push(page.route);
  return chain;
}

function nodes(): Map<string, Node> {
  if (cache) return cache;
  const map = new Map<string, Node>();
  for (const page of getManifest().pages) {
    const chain = crumbChain(page);
    map.set(page.route, { page, chain, parent: chain.length >= 2 ? chain[chain.length - 2] : null });
  }
  cache = map;
  return map;
}

function matchesPrefix(route: string, prefixes: readonly string[]): boolean {
  return prefixes.some((p) => route.startsWith(p));
}

function storyGroup(route: string): number {
  return STORY_LINK_GROUPS.findIndex((group) => matchesPrefix(route, group));
}

function childrenOf(parent: string): Node[] {
  const list = [...nodes().values()].filter((n) => n.parent === parent);
  const parentPage = nodes().get(parent)?.page;
  const order = new Map<string, number>();
  if (parentPage?.extraHtml && isHubExtraHtml(parentPage.extraHtml)) {
    parseHubCardsFromHtml(parentPage.extraHtml).forEach((card, i) => {
      order.set(normalizeRoute(card.href, parentPage), i);
    });
  }
  return list.sort((a, b) => {
    const ia = order.get(a.page.route) ?? Number.MAX_SAFE_INTEGER;
    const ib = order.get(b.page.route) ?? Number.MAX_SAFE_INTEGER;
    return ia - ib || a.page.route.localeCompare(b.page.route, "ja");
  });
}

/**
 * page のローカルナビ。出さないとき（カテゴリが無い・カテゴリの入口ページ自身・並べるページが無い）は null。
 */
export function getLocalNav(page: CityPageContent): LocalNavData | null {
  const self = nodes().get(page.route);
  if (!self || self.chain.length < 2) return null; // トップ直下の単独ページ・カテゴリの入口
  const categoryRoute = self.chain[0];
  const category = nodes().get(categoryRoute)?.page;
  if (!category) return null;

  const myGroup = storyGroup(page.route);
  const visible = (route: string) => {
    if (matchesPrefix(route, LOCAL_NAV_EXCLUDE) || isNewsDetailRoute(route)) return false;
    const g = storyGroup(route);
    return !(myGroup >= 0 && g >= 0 && g !== myGroup);
  };

  const build = (n: Node): LocalNavItem => {
    const item: LocalNavItem = { route: n.page.route, label: pageLabel(n.page), current: n.page.route === page.route };
    // 今いる枝（自分の祖先か自分）だけ、下位ページを入れ子で出す
    if (self.chain.includes(n.page.route)) {
      const kids = childrenOf(n.page.route).filter((k) => visible(k.page.route));
      if (kids.length) item.children = kids.map(build);
    }
    return item;
  };

  const items = childrenOf(categoryRoute)
    .filter((n) => visible(n.page.route))
    .map(build);
  if (!items.length) return null;
  return {
    category: { route: categoryRoute, label: pageLabel(category), current: false },
    items,
  };
}

export type SitemapGroup = { route: string; label: string; items: { route: string; label: string }[] };

/**
 * サイトマップ（/sitemap/）の中身。主要カテゴリ（MEGA_COLUMNS の順）ごとに直下のページ、最後に「サイトのご利用について」。
 * 並べない: LOCAL_NAV_EXCLUDE（過去の記事・検索）、お知らせの詳細、SITEMAP_NO_CHILDREN の下位（資料室の文書）。
 */
export function getSitemap(): SitemapGroup[] {
  const show = (route: string) =>
    !matchesPrefix(route, LOCAL_NAV_EXCLUDE) &&
    !isNewsDetailRoute(route) &&
    !SITEMAP_NO_CHILDREN.some((p) => route !== p && route.startsWith(p));
  const group = (route: string): SitemapGroup | null => {
    const page = nodes().get(route)?.page;
    if (!page) return null;
    const items = childrenOf(route)
      .filter((n) => show(n.page.route))
      .map((n) => ({ route: n.page.route, label: pageLabel(n.page) }));
    return { route, label: pageLabel(page), items };
  };
  const groups = [...MEGA_COLUMNS.map((c) => c.href), "/site/"].map(group);
  return groups.filter((g): g is SitemapGroup => g !== null);
}
