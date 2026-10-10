"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { fillTemplate } from "@/lib/normalize";
import { loadSearchIndex, searchSiteIndex, type SearchIndex } from "@/lib/site-search";
import { ToolForm, ToolStatus } from "../ToolForm";
import { SEARCH_UI, searchPageHref } from "./useSiteSearch";

/** /search/ の結果（?q= を読む）。結果は 題名・分類・説明文 だけを出す（本文の抜粋は出さない）。 */
export function SiteSearchResults() {
  const params = useSearchParams();
  return <SiteSearchPanel query={params.get("q") ?? ""} />;
}

export function SiteSearchPanel({ query }: { query: string }) {
  const router = useRouter();
  const [value, setValue] = useState(query);
  const [index, setIndex] = useState<SearchIndex | null>(null);
  const [failed, setFailed] = useState(false);
  const [emptySubmit, setEmptySubmit] = useState(false);

  useEffect(() => {
    setValue(query);
    setEmptySubmit(false);
  }, [query]);

  useEffect(() => {
    loadSearchIndex()
      .then(setIndex)
      .catch(() => setFailed(true));
  }, []);

  const q = query.trim();
  const hits = useMemo(() => (index && q ? searchSiteIndex(index, q) : []), [index, q]);

  const status = emptySubmit
    ? SEARCH_UI.empty
    : !q
      ? ""
      : failed
        ? SEARCH_UI.loadError
        : !index
          ? SEARCH_UI.loading
          : hits.length
            ? fillTemplate(SEARCH_UI.resultCount, { q, n: hits.length })
            : fillTemplate(SEARCH_UI.resultNone, { q });

  return (
    <div className="kn-tool" data-kn-tool-ui="site-search">
      <ToolForm
        name={SEARCH_UI.formName}
        label={SEARCH_UI.label}
        placeholder={SEARCH_UI.placeholder}
        button={SEARCH_UI.button}
        value={value}
        onChange={setValue}
        onSubmit={(v) => {
          const next = v.trim();
          setEmptySubmit(!next);
          if (next) router.push(searchPageHref(next));
        }}
      />
      <ToolStatus message={status} />
      {hits.length > 0 && (
        <ol className="kn-search-results m-0 mt-2 list-none p-0">
          {hits.map((hit) => (
            <li key={hit.route} className="border-b border-[#e3e8ee] py-4 last:border-b-0">
              <Link
                href={hit.route}
                className="text-lg font-semibold text-[var(--kasumi-blue)] underline underline-offset-2 hover:no-underline"
              >
                {hit.title}
              </Link>
              <span className="ml-2 inline-block rounded bg-[#eef3f8] px-2 py-0.5 align-middle text-xs text-[#33475b]">
                {hit.category}
              </span>
              {hit.description && <p className="m-0 mt-1 text-sm leading-relaxed text-[#444]">{hit.description}</p>}
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}
