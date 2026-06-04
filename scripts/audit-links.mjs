import manifest from "../src/content/manifest.json" with { type: "json" };

const routes = new Set(manifest.pages.map((p) => p.route));

function getContentBaseDir(pageRoute) {
  const withSlash = pageRoute.endsWith("/") ? pageRoute : `${pageRoute}/`;
  if (withSlash === "/") return "/";
  const parts = withSlash.split("/").filter(Boolean);
  if (parts.length <= 1) return withSlash;
  return `/${parts.slice(0, -1).join("/")}/`;
}

function resolveContentHref(href, pageRoute) {
  if (!href || href.startsWith("#") || href.startsWith("mailto:")) return null;
  if (/^https?:\/\//i.test(href)) return null;
  const base = getContentBaseDir(pageRoute);
  let path = new URL(href, `https://internal.invalid${base}`).pathname;
  path = path.replace(/\/index\.html$/i, "").replace(/\.html$/i, "");
  if (!path.endsWith("/")) path = `${path}/`;
  return path === "//" ? "/" : path;
}

const hrefRe = /href=["']([^"'#]+)["']/gi;
const broken = new Map();

for (const page of manifest.pages) {
  const sources = [
    ...(page.related ?? []).map((r) => ({ href: r.href, via: "related" })),
    ...(page.breadcrumbs ?? [])
      .filter((b) => b.href)
      .map((b) => ({ href: b.href, via: "breadcrumb" })),
  ];
  const html = page.extraHtml ?? "";
  let m;
  while ((m = hrefRe.exec(html)) !== null) {
    sources.push({ href: m[1], via: "extraHtml" });
  }

  for (const { href, via } of sources) {
    const route = resolveContentHref(href, page.route);
    if (!route || route === "/" || routes.has(route)) continue;
    const key = `${page.route} → ${href} ⇒ ${route}`;
    if (!broken.has(key)) broken.set(key, { page: page.route, href, resolved: route, via });
  }
}

console.log("Broken internal links:", broken.size);
for (const item of broken.values()) {
  console.log(`  [${item.via}] ${item.page} | ${item.href} → ${item.resolved}`);
}
