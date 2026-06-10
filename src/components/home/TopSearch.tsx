"use client";

import { Search } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useId, useRef, useState } from "react";
import { GlassPanel } from "@/components/ui/GlassPanel";
import searchIndexData from "@/generated/search-index.json";
import { sitePath } from "@/lib/site";
import { searchSiteIndex, type SearchHit, type SearchIndex } from "@/lib/site-search";

const SITE_SEARCH_INDEX = searchIndexData as SearchIndex;

export function TopSearch() {
  const [tab, setTab] = useState<"site" | "page">("site");
  const [query, setQuery] = useState("");
  const [hits, setHits] = useState<SearchHit[]>([]);
  const [open, setOpen] = useState(false);
  const listId = useId();
  const rootRef = useRef<HTMLDivElement>(null);

  const runSearch = useCallback((q: string) => {
    if (!q.trim()) {
      setHits([]);
      return;
    }
    setHits(searchSiteIndex(SITE_SEARCH_INDEX, q));
  }, []);

  useEffect(() => {
    if (tab !== "site") {
      setHits([]);
      setOpen(false);
      return;
    }
    const t = window.setTimeout(() => runSearch(query), 120);
    return () => clearTimeout(t);
  }, [query, tab, runSearch]);

  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  return (
    <div ref={rootRef} className="relative">
      <GlassPanel className="overflow-hidden">
        <div className="flex bg-white/20" role="tablist" aria-label="検索の種類">
          <button
            type="button"
            role="tab"
            aria-selected={tab === "site"}
            className={`min-h-[44px] flex-1 border-0 px-3 py-2 text-[11px] cursor-pointer ${
              tab === "site"
                ? "bg-white/90 font-semibold text-[var(--kasumi-blue)]"
                : "bg-transparent text-white/90"
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
              tab === "page"
                ? "bg-white/90 font-semibold text-[var(--kasumi-blue)]"
                : "bg-transparent text-white/90"
            }`}
            onClick={() => setTab("page")}
          >
            手続検索
          </button>
        </div>

        {tab === "site" ? (
          <form
            className="flex bg-white/95 text-[#1a1a1a]"
            role="search"
            onSubmit={(e) => {
              e.preventDefault();
              setOpen(true);
              runSearch(query);
            }}
          >
            <input
              type="search"
              name="q"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setOpen(true);
              }}
              onFocus={() => setOpen(true)}
              placeholder="キーワード（例：ごみ・広報・観光）"
              aria-label="サイト内検索"
              aria-expanded={open && hits.length > 0}
              aria-controls={listId}
              autoComplete="off"
              className="min-w-0 flex-1 border-0 bg-transparent px-3.5 py-2.5 text-sm text-[#1a1a1a] caret-[var(--kasumi-blue)] placeholder:text-[#6b7280] outline-none"
            />
            <button
              type="submit"
              className="flex min-h-[44px] shrink-0 items-center gap-1 border-0 bg-[var(--kasumi-blue)] px-4 text-white cursor-pointer hover:bg-[#153d66]"
            >
              <Search size={16} aria-hidden />
              <span className="sr-only sm:not-sr-only sm:inline">検索</span>
            </button>
          </form>
        ) : (
          <form
            className="flex bg-white/95 text-[#1a1a1a]"
            action={sitePath("/kurashi/tetsuzuki-search/")}
            method="get"
            role="search"
          >
            <input
              type="search"
              name="q"
              placeholder="手続き名で検索"
              aria-label="手続検索"
              className="min-w-0 flex-1 border-0 bg-transparent px-3.5 py-2.5 text-sm text-[#1a1a1a] caret-[var(--kasumi-blue)] placeholder:text-[#6b7280] outline-none"
            />
            <button
              type="submit"
              className="flex min-h-[44px] shrink-0 items-center gap-1 border-0 bg-[var(--kasumi-blue)] px-4 text-white cursor-pointer hover:bg-[#153d66]"
            >
              <Search size={16} aria-hidden />
              <span className="sr-only sm:not-sr-only sm:inline">検索</span>
            </button>
          </form>
        )}
      </GlassPanel>

      {tab === "site" && open && query.trim() && (
        <div
          id={listId}
          role="listbox"
          aria-label="検索結果"
          className="absolute left-0 right-0 top-[calc(100%+6px)] z-50 max-h-[min(60vh,420px)] overflow-y-auto rounded border border-[#c5d4e8] bg-white text-[#222] shadow-lg"
        >
          {hits.length === 0 && (
            <p className="px-3 py-3 text-sm text-[#666]">
              「{query}」に一致するページが見つかりませんでした。
            </p>
          )}
          {hits.map((hit) => (
            <Link
              key={hit.route}
              href={sitePath(hit.route)}
              role="option"
              className="block border-b border-[#e8eef5] px-3 py-2.5 no-underline hover:bg-[#f4f8fc] last:border-b-0"
              onClick={() => setOpen(false)}
            >
              <div className="flex items-baseline justify-between gap-2">
                <span className="text-sm font-semibold text-[var(--kasumi-blue)]">{hit.title}</span>
                <span className="shrink-0 text-[10px] text-[#888]">{hit.category}</span>
              </div>
              <p className="mt-0.5 line-clamp-2 text-xs leading-relaxed text-[#555]">{hit.snippet}</p>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
