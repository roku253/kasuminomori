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
 * 旧 HTML 由来の相対 href（gomi.html, ../contact/）を App Router の route（/kurashi/gomi/）に変換。
 * pageRoute は現在ページの route（例: /kurashi/）。
 */
export function resolveContentHref(href: string, pageRoute: string): string {
  if (!href || href.startsWith("#") || href.startsWith("mailto:")) return href;
  if (/^https?:\/\//i.test(href)) return href;

  const dir = pageRoute.startsWith("/") ? pageRoute : `/${pageRoute}`;
  const base = dir.endsWith("/") ? dir : `${dir}/`;

  let path = new URL(href, `https://internal.invalid${base}`).pathname;
  path = path.replace(/\/index\.html$/i, "").replace(/\.html$/i, "");
  if (!path.endsWith("/")) path = `${path}/`;
  return path === "//" ? "/" : path;
}
