"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { MEGA_COLUMNS } from "@/lib/navigation";

function isCategoryActive(pathname: string, href: string): boolean {
  const normalized = pathname.endsWith("/") ? pathname : `${pathname}/`;
  return normalized === href || normalized.startsWith(href);
}

/** 主要カテゴリ（7分類）の帯。lg 以上で表示（モバイルはメニューの中）。今いる分類は aria-current="page" */
export function HeaderCategoryNav() {
  const pathname = usePathname() ?? "/";

  return (
    <nav className="kn-gnav hidden lg:block" aria-label="主要カテゴリ">
      <ul className="mx-auto flex max-w-6xl list-none p-0 px-4">
        {MEGA_COLUMNS.map((col) => {
          const active = isCategoryActive(pathname, col.href);
          return (
            <li key={col.href} className="flex-1">
              <Link href={col.href} aria-current={active ? "page" : undefined} className="kn-gnav__link">
                {col.title}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
