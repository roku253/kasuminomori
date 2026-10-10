export const BASE_PATH = "/kasuminomori";

/** 公開 URL（metadataBase・canonical・og:url の基準。basePath を含む） */
export const SITE_URL = "https://roku253.github.io/kasuminomori/";
export const SITE_NAME = "霞ノ杜町";
export const TITLE_SUFFIX = "｜霞ノ杜町";

/**
 * 架空の町である旨の注記。**画面には出さず**、meta の description・og:description・twitter:description の
 * 末尾にだけ、ここ一か所から付ける（render-page.tsx の pageMetadata・layout.tsx）。各ページ JSON には書かない
 * （build-manifest.mjs が description の「架空」「【フィクション】」を検出して止める）。
 */
export const FICTION_NOTE = "（架空の町のサイトです）";

export function withFictionNote(description: string): string {
  return `${description.trim()}${FICTION_NOTE}`;
}

/** SNS などで共有されたときの画像（1200×630、町章入り） */
export const OG_IMAGE = { url: "img/og.png", width: 1200, height: 630, alt: "霞ノ杜町公式ホームページ" } as const;

/**
 * 役場の住所・電話・開庁時間の正本（r2-director B-1〜B-3。ヘッダー・フッター・お問い合わせ欄はここから描く）。
 * - 電話は tel: リンクにしない（layout.tsx の format-detection で自動リンクも止めている）。メールアドレスは載せない。
 * - 郵便番号 392-0391 は日本郵便の検索（zipcloud、2026-10-10）で該当なし。392-0001 は諏訪市に実在する。
 */
export const TOWN = {
  name: "霞ノ杜町",
  office: "霞ノ杜町役場",
  postalCode: "〒392-0391",
  address: "長野県霞郡霞ノ杜町三日月中央2丁目8番1号",
  tel: "0266-12-2111",
  fax: "0266-12-2190",
  /** 開庁時間（画面の表記） */
  hours: "平日 8時30分〜17時15分（土日祝日・12月29日〜1月3日を除く）",
  copyright: "Copyright © Kasuminomori Town. All Rights Reserved.",
} as const;

/** 「電話 0266-12-2111（代表）」「電話 0266-12-2111（内線 215）」の形 */
export function telText(extension?: string | number): string {
  return extension ? `電話 ${TOWN.tel}（内線 ${extension}）` : `電話 ${TOWN.tel}（代表）`;
}

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
