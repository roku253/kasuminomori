import Link from "next/link";
import type { BreadcrumbItem } from "@/lib/content/types";
import { resolveContentHref } from "@/lib/site";

type Props = {
  items: BreadcrumbItem[];
  pageRoute: string;
};

export function CityBreadcrumb({ items, pageRoute }: Props) {
  return (
    <nav className="mb-6 text-sm text-[#666]" aria-label="パンくず">
      {items.map((item, i) => (
        <span key={`${item.label}-${i}`}>
          {i > 0 && <span className="mx-2 text-[#999]">›</span>}
          {item.href ? (
            <Link
              href={item.label === "トップ" ? "/" : resolveContentHref(item.href, pageRoute)}
              className="inline-flex min-h-[44px] items-center py-0.5 text-[#1a4d80] no-underline hover:underline"
            >
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
