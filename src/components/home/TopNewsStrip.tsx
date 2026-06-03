import Link from "next/link";
import { AlertTriangle, ChevronRight } from "lucide-react";
import { TOP_NEWS } from "@/lib/top-news";

export function TopNewsStrip() {
  return (
    <section
      className="border-b border-[var(--color-border)] bg-white shadow-[var(--shadow-sm)]"
      aria-labelledby="top-news-heading"
    >
      <div className="mx-auto flex max-w-6xl flex-col gap-3 px-4 py-4 md:flex-row md:items-stretch md:gap-6 md:py-5">
        <div className="flex shrink-0 items-center gap-2 md:w-40 md:flex-col md:items-start md:justify-center">
          <span className="inline-flex items-center gap-1.5 rounded bg-[var(--kasumi-blue)] px-2.5 py-1 text-xs font-bold text-white">
            お知らせ
          </span>
          <Link
            href="/anzen/saigai/"
            className="inline-flex items-center gap-1 text-xs font-bold text-[#b45309] no-underline hover:underline"
          >
            <AlertTriangle size={14} aria-hidden />
            緊急・災害
          </Link>
        </div>
        <h2 id="top-news-heading" className="sr-only">
          最新のお知らせ
        </h2>
        <ul className="m-0 flex-1 list-none space-y-2 p-0" aria-labelledby="top-news-heading">
          {TOP_NEWS.map((item) => (
            <li key={item.date + item.title}>
              <Link
                href={item.href}
                className="group flex flex-wrap items-baseline gap-2 text-[15px] text-[#222] no-underline hover:text-[var(--kasumi-blue)] md:gap-3"
              >
                <time className="shrink-0 text-xs font-medium text-[#666]">{item.date}</time>
                <span className="flex-1">{item.title}</span>
                <ChevronRight
                  size={16}
                  className="shrink-0 opacity-40 transition group-hover:opacity-100"
                  aria-hidden
                />
              </Link>
            </li>
          ))}
        </ul>
        <div className="shrink-0 md:flex md:items-center">
          <Link
            href="/shisei/koho/"
            className="inline-flex items-center gap-1 rounded border border-[var(--kasumi-blue)] px-3 py-2 text-sm font-medium text-[var(--kasumi-blue)] no-underline hover:bg-[#e8f0fa]"
          >
            一覧を見る
            <ChevronRight size={16} aria-hidden />
          </Link>
        </div>
      </div>
    </section>
  );
}
