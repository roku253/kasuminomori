"use client";

import { Search } from "lucide-react";
import { useEffect, useId, useRef } from "react";
import { SiteSearchSuggestions } from "@/components/tools/site-search/SiteSearchSuggestions";
import { SEARCH_UI, useSiteSearch } from "@/components/tools/site-search/useSiteSearch";
import { sitePath } from "@/lib/site";

type Props = {
  /** header: ヘッダー右（デスクトップ）／ menu: メニューの最上部（モバイル） */
  variant?: "header" | "menu";
  /** 候補のリンクを押したとき（メニューを閉じる等） */
  onNavigate?: () => void;
};

/**
 * 全ページ共通のサイト内検索窓（UX-01・A7）。トップの検索と同じ部品（useSiteSearch＋SiteSearchSuggestions）。
 * Enter・検索ボタンで /search/?q= へ。JS が無くても form の GET で結果ページへ行ける。
 */
export function HeaderSearch({ variant = "header", onNavigate }: Props) {
  const search = useSiteSearch(6);
  const { setOpen } = search;
  const inputId = useId();
  const statusId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, [setOpen]);

  return (
    <div
      ref={rootRef}
      className={`kn-header-search kn-header-search--${variant}`}
      onKeyDown={(e) => {
        if (e.key === "Escape" && search.open) {
          e.stopPropagation();
          setOpen(false);
          inputRef.current?.focus();
        }
      }}
    >
      <form
        role="search"
        aria-label={SEARCH_UI.formName}
        action={sitePath("/search/")}
        method="get"
        className="kn-header-search__form"
        onSubmit={(e) => {
          e.preventDefault();
          if (search.submit()) onNavigate?.();
          else inputRef.current?.focus();
        }}
      >
        <label htmlFor={inputId} className="sr-only">
          {SEARCH_UI.label}
        </label>
        <input
          ref={inputRef}
          id={inputId}
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
      <SiteSearchSuggestions
        search={search}
        statusId={statusId}
        className="kn-header-search__suggest"
        onNavigate={onNavigate}
      />
    </div>
  );
}
