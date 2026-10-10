"use client";

import Link from "next/link";
import { fillTemplate } from "@/lib/normalize";
import { SEARCH_UI, searchPageHref, type SiteSearchState } from "./useSiteSearch";

type Props = {
  search: SiteSearchState;
  /** 入力欄の aria-describedby に渡す id（候補の件数を読み上げる欄） */
  statusId: string;
  className?: string;
  /** 候補のリンクを押したとき（ヘッダーのメニューを閉じる等） */
  onNavigate?: () => void;
};

/** 入力中の候補。件数は読み上げ欄（aria-live）で伝え、候補はふつうのリンクの一覧にする。 */
export function SiteSearchSuggestions({ search, statusId, className = "", onNavigate }: Props) {
  const q = search.query.trim();
  const close = () => {
    search.setOpen(false);
    onNavigate?.();
  };
  return (
    <>
      <p id={statusId} role="status" aria-live="polite" className="sr-only">
        {search.open ? search.status : ""}
      </p>
      {search.open && (
        <div
          className={`max-h-[min(60vh,420px)] overflow-y-auto rounded border border-[#c5d4e8] bg-white text-[#222] shadow-lg ${className}`}
        >
          {search.hits.length === 0 ? (
            <p className="m-0 px-3 py-3 text-sm text-[#555]">{search.status}</p>
          ) : (
            <>
              <ul className="m-0 list-none p-0">
                {search.hits.map((hit) => (
                  <li key={hit.route} className="border-b border-[#e8eef5] last:border-b-0">
                    <Link
                      href={hit.route}
                      className="block px-3 py-2.5 no-underline hover:bg-[#f4f8fc] focus-visible:bg-[#f4f8fc]"
                      onClick={close}
                    >
                      <span className="flex items-baseline justify-between gap-2">
                        <span className="text-sm font-semibold text-[var(--kasumi-blue)]">{hit.title}</span>
                        <span className="shrink-0 text-xs text-[#555]">{hit.category}</span>
                      </span>
                      {hit.description && (
                        <span className="mt-0.5 line-clamp-2 block text-xs leading-relaxed text-[#555]">
                          {hit.description}
                        </span>
                      )}
                    </Link>
                  </li>
                ))}
              </ul>
              <Link
                href={searchPageHref(q)}
                className="block border-t border-[#d5dde6] bg-[#f6f9fc] px-3 py-2.5 text-sm font-semibold text-[var(--kasumi-blue)] no-underline hover:underline"
                onClick={close}
              >
                {fillTemplate(SEARCH_UI.showAll, { n: search.total })}
              </Link>
            </>
          )}
        </div>
      )}
    </>
  );
}
