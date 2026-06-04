"use client";

import { Search } from "lucide-react";
import { useState } from "react";
import { GlassPanel } from "@/components/ui/GlassPanel";
import { sitePath } from "@/lib/site";

export function TopSearch() {
  const [tab, setTab] = useState<"site" | "page">("site");

  return (
    <GlassPanel className="overflow-hidden">
      <div className="flex bg-white/20" role="tablist" aria-label="検索の種類">
        <button
          type="button"
          role="tab"
          aria-selected={tab === "site"}
          className={`min-h-[44px] flex-1 border-0 px-3 py-2 text-[11px] cursor-pointer ${
            tab === "site" ? "bg-white/90 font-semibold text-[var(--kasumi-blue)]" : "bg-transparent text-white/90"
          }`}
          onClick={() => setTab("site")}
        >
          サイト内検索
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={tab === "page"}
          className={`min-h-[44px] flex-1 border-0 px-3 py-2 text-[11px] cursor-pointer ${
            tab === "page" ? "bg-white/90 font-semibold text-[var(--kasumi-blue)]" : "bg-transparent text-white/90"
          }`}
          onClick={() => setTab("page")}
        >
          ページ番号
        </button>
      </div>
      <form
        className="flex bg-white/95"
        action={sitePath("/kurashi/tetsuzuki-search/")}
        role="search"
      >
        <input
          type="search"
          name="q"
          placeholder="キーワード"
          aria-label="検索"
          className="min-w-0 flex-1 border-0 bg-transparent px-3.5 py-2.5 text-sm outline-none"
        />
        <button
          type="submit"
          className="flex min-h-[44px] shrink-0 items-center gap-1 border-0 bg-[var(--kasumi-blue)] px-4 text-white cursor-pointer hover:bg-[#153d66]"
        >
          <Search size={16} aria-hidden />
          <span className="sr-only sm:not-sr-only sm:inline">検索</span>
        </button>
      </form>
    </GlassPanel>
  );
}
