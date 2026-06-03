"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { MEGA_COLUMNS } from "@/lib/navigation";

function isCategoryActive(pathname: string, href: string): boolean {
  const normalized = pathname.endsWith("/") ? pathname : `${pathname}/`;
  return normalized === href || normalized.startsWith(href);
}

export function HeaderCategoryNav() {
  const pathname = usePathname() ?? "/";

  return (
    <nav
      className="hidden min-w-0 flex-1 flex-wrap items-center justify-end gap-0.5 lg:flex"
      aria-label="主要カテゴリ"
    >
      {MEGA_COLUMNS.map((col) => {
        const active = isCategoryActive(pathname, col.href);
        return (
          <Link
            key={col.href}
            href={col.href}
            aria-current={active ? "page" : undefined}
            className={`rounded-md px-2.5 py-2 text-[13px] font-medium no-underline transition ${
              active
                ? "bg-white/20 text-white shadow-inner ring-1 ring-white/25"
                : "text-white/95 hover:bg-white/15"
            }`}
          >
            {col.title}
          </Link>
        );
      })}
    </nav>
  );
}
