"use client";

import { Search } from "lucide-react";
import { useEffect, useId, useRef, useState, type KeyboardEvent } from "react";
import top from "@/content/data/top.json";
import { SiteSearchSuggestions } from "@/components/tools/site-search/SiteSearchSuggestions";
import { SEARCH_UI, useSiteSearch } from "@/components/tools/site-search/useSiteSearch";
import { sitePath } from "@/lib/site";

type Tab = "site" | "procedure";
const TABS: { id: Tab; label: string }[] = [
  { id: "site", label: top.search.siteTab },
  { id: "procedure", label: top.search.procedureTab },
];

/**
 * トップの検索（写真の外・白地。UX-04）。「サイト内検索」と「手続きを探す」をタブで切り替える。
 * サイト内検索は入力中に候補を出し、Enter・ボタンで /search/?q=。手続きは /kurashi/tetsuzuki-search/?q= へ。
 * タブは矢印キーで切り替えられる（WAI-ARIA のタブの作法）。
 */
export function TopSearch() {
  const [tab, setTab] = useState<Tab>("site");
  const search = useSiteSearch();
  const { setOpen } = search;
  const baseId = useId();
  const statusId = useId();
  const siteInputId = useId();
  const procInputId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const tabRefs = useRef<Record<Tab, HTMLButtonElement | null>>({ site: null, procedure: null });

  useEffect(() => {
    if (tab !== "site") setOpen(false);
  }, [tab, setOpen]);

  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, [setOpen]);

  function onTabKey(e: KeyboardEvent<HTMLButtonElement>) {
    if (e.key !== "ArrowLeft" && e.key !== "ArrowRight" && e.key !== "Home" && e.key !== "End") return;
    e.preventDefault();
    const i = TABS.findIndex((t) => t.id === tab);
    const next =
      e.key === "Home" ? 0 : e.key === "End" ? TABS.length - 1 : (i + (e.key === "ArrowRight" ? 1 : -1) + TABS.length) % TABS.length;
    setTab(TABS[next].id);
    tabRefs.current[TABS[next].id]?.focus();
  }

  return (
    <div
      ref={rootRef}
      className="kn-top-search"
      onKeyDown={(e) => {
        if (e.key === "Escape" && search.open) {
          setOpen(false);
          inputRef.current?.focus();
        }
      }}
    >
      <h2 className="sr-only">{top.search.heading}</h2>
      <div className="kn-top-search__tabs" role="tablist" aria-label="検索の種類">
        {TABS.map((t) => (
          <button
            key={t.id}
            ref={(el) => {
              tabRefs.current[t.id] = el;
            }}
            type="button"
            role="tab"
            id={`${baseId}-tab-${t.id}`}
            aria-selected={tab === t.id}
            aria-controls={`${baseId}-panel-${t.id}`}
            tabIndex={tab === t.id ? 0 : -1}
            className="kn-top-search__tab"
            onClick={() => setTab(t.id)}
            onKeyDown={onTabKey}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "site" ? (
        <div role="tabpanel" id={`${baseId}-panel-site`} aria-labelledby={`${baseId}-tab-site`} className="kn-top-search__panel">
          <form
            key="site"
            className="kn-header-search__form"
            role="search"
            aria-label={SEARCH_UI.formName}
            action={sitePath("/search/")}
            method="get"
            onSubmit={(e) => {
              e.preventDefault();
              if (!search.submit()) inputRef.current?.focus();
            }}
          >
            <label htmlFor={siteInputId} className="sr-only">
              {SEARCH_UI.label}
            </label>
            <input
              ref={inputRef}
              id={siteInputId}
              type="search"
              name="q"
              value={search.query}
              onChange={(e) => search.setQuery(e.target.value)}
              onFocus={() => {
                search.ensureIndex();
                if (search.query.trim()) setOpen(true);
              }}
              placeholder={SEARCH_UI.placeholder}
              aria-describedby={statusId}
              autoComplete="off"
              className="kn-header-search__input"
            />
            <button type="submit" className="kn-header-search__button">
              <Search size={18} aria-hidden />
              <span>{SEARCH_UI.button}</span>
            </button>
          </form>
          <SiteSearchSuggestions search={search} statusId={statusId} className="kn-header-search__suggest" />
        </div>
      ) : (
        <div
          role="tabpanel"
          id={`${baseId}-panel-procedure`}
          aria-labelledby={`${baseId}-tab-procedure`}
          className="kn-top-search__panel"
        >
          <form
            key="procedure"
            className="kn-header-search__form"
            role="search"
            aria-label={top.search.procedureLabel}
            action={sitePath("/kurashi/tetsuzuki-search/")}
            method="get"
          >
            <label htmlFor={procInputId} className="sr-only">
              {top.search.procedureLabel}
            </label>
            <input
              id={procInputId}
              type="search"
              name="q"
              placeholder={top.search.procedurePlaceholder}
              autoComplete="off"
              className="kn-header-search__input"
            />
            <button type="submit" className="kn-header-search__button">
              <Search size={18} aria-hidden />
              <span>{top.search.procedureButton}</span>
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
