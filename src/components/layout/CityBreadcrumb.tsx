import Link from "next/link";
import type { BreadcrumbItem } from "@/lib/content/types";

function resolveHref(href: string): string {
  if (href.startsWith("http") || href.startsWith("#")) return href;
  let p = href.replace(/^\.\.\//g, "").replace(/^\.\//, "").replace(/index\.html$/, "");
  if (!p) return "/";
  if (!p.startsWith("/")) p = `/${p}`;
  if (!p.endsWith("/")) p = `${p}/`;
  return p;
}

type Props = {
  items: BreadcrumbItem[];
};

export function CityBreadcrumb({ items }: Props) {
  return (
    <nav className="mb-6 text-sm text-[#666]" aria-label="パンくず">
      {items.map((item, i) => (
        <span key={`${item.label}-${i}`}>
          {i > 0 && <span className="mx-2 text-[#999]">›</span>}
          {item.href ? (
            <Link href={resolveHref(item.href)} className="text-[#1a4d80] no-underline hover:underline">
              {item.label}
            </Link>
          ) : (
            <span>{item.label}</span>
          )}
        </span>
      ))}
    </nav>
  );
}
