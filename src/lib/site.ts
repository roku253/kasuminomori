export const BASE_PATH = "/kasuminomori";

export function assetPath(path: string): string {
  const p = path.startsWith("/") ? path : `/${path}`;
  return `${BASE_PATH}${p}`;
}

export function sitePath(path: string): string {
  if (!path || path === "/") return `${BASE_PATH}/`;
  const p = path.startsWith("/") ? path : `/${path}`;
  const normalized = p.endsWith("/") ? p : `${p}/`;
  return `${BASE_PATH}${normalized}`;
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

  let path = new URL(href, `https://internal.invalid${base}`).pathname;
  path = path.replace(/\/index\.html$/i, "").replace(/\.html$/i, "");
  if (!path.endsWith("/")) path = `${path}/`;
  return path === "//" ? "/" : path;
}
