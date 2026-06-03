import Link from "next/link";
import { Phone } from "lucide-react";
import { MEGA_COLUMNS } from "@/lib/navigation";
import { MegaMenu } from "./MegaMenu";
import { SiteLogo } from "./SiteLogo";

export function SiteHeader() {
  return (
    <>
      <a
        href="#city-main"
        className="city-skip absolute -left-[9999px] z-[100000] bg-white px-3 py-2 text-sm font-medium text-[var(--kasumi-blue)] focus:left-3 focus:top-3 focus:rounded focus:shadow-md"
      >
        本文へスキップ
      </a>
      <div className="border-b border-[#0d3a66] bg-[#0f3d6b] text-xs text-white/90">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-2 px-4 py-1.5">
          <span>霞ノ杜町公式ホームページ【フィクション】</span>
          <a
            href="tel:0123456700"
            className="inline-flex items-center gap-1 text-white/95 no-underline hover:underline"
          >
            <Phone size={12} aria-hidden />
            代表 0123-45-6700
          </a>
        </div>
      </div>
      <header className="sticky top-0 z-[99990] bg-[var(--kasumi-blue)] text-white shadow-md">
        <div className="mx-auto flex max-w-6xl items-center gap-4 px-4 py-2.5">
          <SiteLogo variant="header" />
          <nav className="ml-auto hidden flex-wrap items-center gap-1 lg:flex" aria-label="主要カテゴリ">
            {MEGA_COLUMNS.map((col) => (
              <Link
                key={col.href}
                href={col.href}
                className="rounded px-2.5 py-1.5 text-[13px] font-medium text-white/95 no-underline transition hover:bg-white/15"
              >
                {col.title}
              </Link>
            ))}
          </nav>
          <MegaMenu />
        </div>
      </header>
    </>
  );
}
