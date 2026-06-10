import { Phone } from "lucide-react";
import { HeaderCategoryNav } from "./HeaderCategoryNav";
import { MegaMenu } from "./MegaMenu";
import { SiteLogo } from "./SiteLogo";

export function SiteHeader() {
  return (
    <>
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
      <header
        className="sticky top-0 z-[99990] bg-[var(--kasumi-blue)] text-white shadow-md [--site-header-stack:5.75rem]"
        data-site-header
      >
        <div className="mx-auto flex max-w-6xl items-center gap-2 px-4 py-2.5 sm:gap-3">
          <SiteLogo variant="header" />
          <HeaderCategoryNav />
          <div className="ml-auto shrink-0 lg:ml-2">
            <MegaMenu mode="split" />
          </div>
        </div>
      </header>
    </>
  );
}
