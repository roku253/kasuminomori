"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import data from "@/content/data/search.json";
import { fillTemplate } from "@/lib/normalize";
import { loadSearchIndex, searchSiteIndex, type SearchHit, type SearchIndex } from "@/lib/site-search";

export const SEARCH_UI = data.ui;
export const SEARCH_PATH = "/search/";

export function searchPageHref(q: string): string {
  return q ? `${SEARCH_PATH}?q=${encodeURIComponent(q)}` : SEARCH_PATH;
}

/**
 * サイト内検索の入力欄（トップ・ヘッダー用）の状態。
 * 入力中は候補（最大 limit 件）を出し、Enter・検索ボタンで結果ページ /search/?q= へ移る。
 * 索引は最初に入力欄に触れたときに読み込む（JS に同梱しない）。
 */
export function useSiteSearch(limit = 8) {
  const router = useRouter();
  const [query, setQueryState] = useState("");
  const [index, setIndex] = useState<SearchIndex | null>(null);
  const [failed, setFailed] = useState(false);
  const [open, setOpen] = useState(false);
  const [hits, setHits] = useState<SearchHit[]>([]);
  const [total, setTotal] = useState(0);

  const ensureIndex = useCallback(() => {
    if (index) return;
    loadSearchIndex()
      .then((loaded) => {
        setIndex(loaded);
        setFailed(false);
      })
      .catch(() => setFailed(true));
  }, [index]);

  useEffect(() => {
    if (!index) return;
    const timer = window.setTimeout(() => {
      const all = query.trim() ? searchSiteIndex(index, query) : [];
      setTotal(all.length);
      setHits(all.slice(0, limit));
    }, 120);
    return () => window.clearTimeout(timer);
  }, [index, query, limit]);

  const setQuery = useCallback(
    (value: string) => {
      setQueryState(value);
      setOpen(true);
      ensureIndex();
    },
    [ensureIndex]
  );

  const submit = useCallback(() => {
    const q = query.trim();
    if (!q) return false;
    setOpen(false);
    router.push(searchPageHref(q));
    return true;
  }, [query, router]);

  const q = query.trim();
  const status = !q
    ? ""
    : failed
      ? SEARCH_UI.loadError
      : !index
        ? SEARCH_UI.loading
        : total
          ? fillTemplate(SEARCH_UI.suggestCount, { n: total })
          : fillTemplate(SEARCH_UI.suggestNone, { q });

  return { query, setQuery, hits, total, status, open: open && q.length > 0, setOpen, ensureIndex, submit };
}

export type SiteSearchState = ReturnType<typeof useSiteSearch>;
