"use client";

import { useEffect, useRef } from "react";

/** ページを開いたときの ?q= を一度だけ渡す（トップの「手続検索」などから来たとき用） */
export function useInitialQuery(onQuery: (q: string) => void) {
  const done = useRef(false);
  useEffect(() => {
    if (done.current) return;
    done.current = true;
    const q = new URLSearchParams(window.location.search).get("q");
    if (q && q.trim()) onQuery(q.trim());
  }, [onQuery]);
}

/** 検索した語を URL の ?q= に残す（再読み込み・共有で同じ結果になる） */
export function replaceQueryParam(q: string) {
  const url = new URL(window.location.href);
  if (q) url.searchParams.set("q", q);
  else url.searchParams.delete("q");
  window.history.replaceState(window.history.state, "", url);
}
