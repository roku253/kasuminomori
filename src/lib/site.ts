export const BASE_PATH = "/kasuminomori";

export function assetPath(path: string): string {
  const p = path.startsWith("/") ? path : `/${path}`;
  return `${BASE_PATH}${p}`;
}

export function sitePath(path: string): string {
  if (!path || path === "/") return `${BASE_PATH}/`;
  const hashIndex = path.indexOf("#");
  const hash = hashIndex >= 0 ? path.slice(hashIndex) : "";
  const pathOnly = hashIndex >= 0 ? path.slice(0, hashIndex) : path;
  const p = pathOnly.startsWith("/") ? pathOnly : `/${pathOnly}`;
  const normalized = p.endsWith("/") ? p : `${p}/`;
  return `${BASE_PATH}${normalized}${hash}`;
}

/**
 * 旧 HTML と同じ基準ディレクトリ（例: kurashi/bus-jikan.html → /kurashi/）。
 */
export function getContentBaseDir(pageRoute: string): string {
  const normalized = pageRoute.startsWith("/") ? pageRoute : `/${pageRoute}`;
  const withSlash = normalized.endsWith("/") ? normalized : `${normalized}/`;
  if (withSlash === "/") return "/";
  const parts = withSlash.split("/").filter(Boolean);
  if (parts.length <= 1) return withSlash;
  const last = parts[parts.length - 1];
  // spot/1/index.html や blog/2019/index.html 系 — 相対リンクは当該ディレクトリ基準
  if (/^\d+$/.test(last)) return withSlash;
  return `/${parts.slice(0, -1).join("/")}/`;
}

/**
 * 旧 HTML 由来の相対 href（gomi.html, ../contact/）を App Router の route（/kurashi/gomi/）に変換。
 * pageRoute は現在ページの route（例: /kurashi/bus-jikan/）。
 */
export function resolveContentHref(href: string, pageRoute: string): string {
  if (!href || href.startsWith("#") || href.startsWith("mailto:")) return href;
  if (/^https?:\/\//i.test(href)) return href;

  const base = getContentBaseDir(pageRoute);

  const url = new URL(href, `https://internal.invalid${base}`);
  let path = url.pathname;
  path = path.replace(/\/index\.html$/i, "").replace(/\.html$/i, "");
  if (!path.endsWith("/")) path = `${path}/`;
  const route = path === "//" ? "/" : path;
  return url.hash ? `${route}${url.hash}` : route;
}

/** bodyHtml / extraHtml 内の href を App Router + basePath 向け URL に書き換える */
export function rewriteContentHtml(html: string, pageRoute: string): string {
  return html.replace(/href=(["'])([^"']+)\1/gi, (match, quote, href) => {
    if (!href || href.startsWith("#") || href.startsWith("mailto:") || /^https?:\/\//i.test(href)) {
      return match;
    }
    const route = resolveContentHref(href, pageRoute);
    return `href=${quote}${sitePath(route)}${quote}`;
  });
}
