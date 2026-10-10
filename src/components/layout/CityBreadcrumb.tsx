import Link from "next/link";
import type { BreadcrumbItem } from "@/lib/content/types";
import { resolveContentHref } from "@/lib/site";

type Props = {
  items: BreadcrumbItem[];
  pageRoute: string;
  sourcePath?: string;
};

export function CityBreadcrumb({ items, pageRoute, sourcePath }: Props) {
  return (
    <nav className="kn-breadcrumb mb-4 text-sm text-[#555]" aria-label="パンくず">
      <ol className="m-0 flex list-none flex-wrap items-center p-0">
        {items.map((item, i) => (
          <li key={`${item.label}-${i}`} className="inline-flex items-center">
            {i > 0 && (
              <span className="mx-2 text-[#767676]" aria-hidden="true">
                ›
              </span>
            )}
            {item.href ? (
              <Link
                href={item.label === "トップ" ? "/" : resolveContentHref(item.href, pageRoute, sourcePath)}
                className="inline-flex min-h-[44px] items-center py-0.5 text-[var(--kasumi-blue)] underline underline-offset-2 hover:decoration-2"
              >
                {item.label}
              </Link>
            ) : (
              <span aria-current="page">{item.label}</span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}
