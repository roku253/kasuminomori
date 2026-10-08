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
export function getContentBaseDir(pageRoute: string, sourcePath?: string): string {
  const normalized = pageRoute.startsWith("/") ? pageRoute : `/${pageRoute}`;
  const withSlash = normalized.endsWith("/") ? normalized : `${normalized}/`;
  if (withSlash === "/") return "/";
  const parts = withSlash.split("/").filter(Boolean);
  if (parts.length <= 1) return withSlash;
  const last = parts[parts.length - 1];
  // index.html や spot/1/ は、そのフォルダ自身が基準
  if (/index\.html$/i.test(sourcePath || "") || /^\d+$/.test(last)) return withSlash;
  return `/${parts.slice(0, -1).join("/")}/`;
}

/**
 * 旧 HTML 由来の相対 href（gomi.html, ../contact/）を App Router の route（/kurashi/gomi/）に変換。
 * pageRoute は現在ページの route（例: /kurashi/bus-jikan/）。
 */
export function resolveContentHref(href: string, pageRoute: string, sourcePath?: string): string {
  if (!href || href.startsWith("#") || href.startsWith("mailto:")) return href;
  if (/^https?:\/\//i.test(href)) return href;

  const base = getContentBaseDir(pageRoute, sourcePath);

  const url = new URL(href, `https://internal.invalid${base}`);
  let path = url.pathname;
  path = path.replace(/\/index\.html$/i, "").replace(/\.html$/i, "");
  if (!path.endsWith("/")) path = `${path}/`;
  const route = path === "//" ? "/" : path;
  return url.hash ? `${route}${url.hash}` : route;
}

/** bodyHtml / extraHtml 内の href を App Router + basePath 向け URL に書き換える */
function rewriteAssetRef(ref: string, pageRoute: string, sourcePath?: string): string {
  if (!ref || ref.startsWith("#") || ref.startsWith("mailto:") || ref.startsWith("data:") || /^https?:\/\//i.test(ref)) {
    return ref;
  }
  if (/\.(png|jpe?g|gif|webp|svg|pdf|csv)(\?|#|$)/i.test(ref)) {
    const route = resolveContentHref(ref, pageRoute, sourcePath);
    const file = route.replace(/\/$/, "");
    return `${BASE_PATH}${file}`;
  }
  return sitePath(resolveContentHref(ref, pageRoute, sourcePath));
}

export function rewriteContentHtml(html: string, pageRoute: string, sourcePath?: string): string {
  const withHref = html.replace(/href=(["'])([^"']+)\1/gi, (match, quote, href) => {
    if (!href || href.startsWith("#") || href.startsWith("mailto:") || /^https?:\/\//i.test(href)) {
      return match;
    }
    return `href=${quote}${rewriteAssetRef(href, pageRoute, sourcePath)}${quote}`;
  });
  const withSrc = withHref.replace(/\bsrc=(["'])([^"']+)\1/gi, (match, quote, src) => {
    if (!src || src.startsWith("data:") || /^https?:\/\//i.test(src)) return match;
    return `src=${quote}${rewriteAssetRef(src, pageRoute, sourcePath)}${quote}`;
  });
  return withSrc.replace(/url\((["']?)([^"')]+)\1\)/gi, (match, quote, ref) => {
    if (!ref || ref.startsWith("data:") || /^https?:\/\//i.test(ref)) return match;
    return `url(${quote}${rewriteAssetRef(ref, pageRoute, sourcePath)}${quote})`;
  });
}
