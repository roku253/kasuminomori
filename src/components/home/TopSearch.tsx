"use client";

import { Search } from "lucide-react";
import { useState } from "react";
import { GlassPanel } from "@/components/ui/GlassPanel";

export function TopSearch() {
  const [tab, setTab] = useState<"site" | "page">("site");

  return (
    <GlassPanel className="overflow-hidden">
      <div className="flex bg-white/20" role="tablist" aria-label="検索の種類">
        <button
          type="button"
          role="tab"
          aria-selected={tab === "site"}
          className={`flex-1 border-0 px-3 py-2 text-[11px] cursor-pointer ${
            tab === "site" ? "bg-white/90 font-bold text-[#1a5fb4]" : "bg-transparent text-white/90"
          }`}
          onClick={() => setTab("site")}
        >
          サイト内検索
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={tab === "page"}
          className={`flex-1 border-0 px-3 py-2 text-[11px] cursor-pointer ${
            tab === "page" ? "bg-white/90 font-bold text-[#1a5fb4]" : "bg-transparent text-white/90"
          }`}
          onClick={() => setTab("page")}
        >
          ページ番号
        </button>
      </div>
      <form
        className="flex bg-white/95"
        action="/kurashi/tetsuzuki-search/"
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
          className="flex shrink-0 items-center gap-1 border-0 bg-[#1a5fb4] px-4 text-white cursor-pointer hover:bg-[#154a9a]"
        >
          <Search size={16} aria-hidden />
          <span className="sr-only sm:not-sr-only sm:inline">検索</span>
        </button>
      </form>
    </GlassPanel>
  );
}
