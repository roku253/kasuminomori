"use client";

import { Menu, X } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useId, useLayoutEffect, useRef, useState } from "react";
import { MEGA_COLUMNS, MEGA_TOOLS } from "@/lib/navigation";
import { HeaderSearch } from "./HeaderSearch";

/** full: カテゴリ列＋ツール / split: lg 以上はツールだけ（カテゴリは画面上部のナビ）、lg 未満は full */
export type MegaMenuMode = "full" | "split";

type Props = {
  mode?: MegaMenuMode;
};

/**
 * 「メニュー」ボタンと、その下に開くサイトメニュー（全ページ共通）。
 * - パネルはヘッダー（[data-site-header]）のすぐ下に固定表示。開いている間は本文のスクロールを止める。
 * - モバイル（lg 未満）はパネルの先頭にサイト内検索（UX-01）。
 * - Esc・背景のクリック・リンクで閉じる。Esc のときはボタンにフォーカスを戻す（UX-13）。
 * - 開いている間、ボタンは「閉じる」（読み上げ名「メニューを閉じる」）。
 */
export function MegaMenu({ mode = "full" }: Props) {
  const [open, setOpen] = useState(false);
  const [top, setTop] = useState<number | null>(null);
  const panelId = useId();
  const buttonRef = useRef<HTMLButtonElement>(null);
  const showCategoryGuide = mode === "split";

  const close = useCallback((restoreFocus = false) => {
    setOpen(false);
    if (restoreFocus) buttonRef.current?.focus();
  }, []);

  useEffect(() => {
    document.body.classList.toggle("city-mega-open", open);
    return () => document.body.classList.remove("city-mega-open");
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close(true);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, close]);

  // パネルの上端＝ヘッダーの下端（スクロール位置で変わるので開くたびに測る）
  useLayoutEffect(() => {
    if (!open) return;
    const measure = () => {
      const header = buttonRef.current?.closest("[data-site-header]");
      setTop(header ? Math.max(0, header.getBoundingClientRect().bottom) : null);
    };
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, [open]);

  const columnsGridClass =
    mode === "split"
      ? "city-mega-columns mx-auto grid max-w-6xl gap-8 px-4 py-8 sm:grid-cols-2 lg:hidden md:px-6"
      : "city-mega-columns mx-auto grid max-w-6xl gap-8 px-4 py-8 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 md:px-6";

  return (
    <>
      {open && (
        <div
          role="presentation"
          className="fixed inset-0 z-[99999] cursor-default bg-black/40"
          style={top !== null ? { top } : undefined}
          onClick={() => close()}
        />
      )}
      <button
        ref={buttonRef}
        type="button"
        className="kn-menu-button relative z-[100001]"
        aria-expanded={open}
        aria-controls={panelId}
        aria-label={open ? "メニューを閉じる" : "メニュー"}
        onClick={() => setOpen((o) => !o)}
      >
        {open ? <X size={18} aria-hidden /> : <Menu size={18} aria-hidden />}
        <span aria-hidden>{open ? "閉じる" : "メニュー"}</span>
      </button>
      <nav
        id={panelId}
        hidden={!open}
        aria-label="サイトメニュー"
        className="city-mega fixed inset-x-0 z-[100000] overflow-y-auto border-b-[3px] border-[var(--kasumi-blue)] bg-[var(--color-surface)] text-[var(--color-text)] shadow-2xl"
        style={
          top !== null
            ? { top, maxHeight: `calc(100dvh - ${top}px)` }
            : { top: "var(--site-header-stack, 5.5rem)", maxHeight: "calc(100dvh - var(--site-header-stack, 5.5rem))" }
        }
      >
        <div className="mx-auto max-w-6xl px-4 pt-4 md:px-6 lg:hidden">
          <HeaderSearch variant="menu" onNavigate={() => close()} />
        </div>
        <div className="mx-auto max-w-6xl border-b border-[var(--color-border)] px-4 py-4 md:px-6">
          <h2 className="city-eyebrow m-0 text-[var(--kasumi-blue)]">よく使うリンク</h2>
          <ul className="mt-3 flex flex-wrap gap-2 p-0 list-none">
            {MEGA_TOOLS.map((l) => (
              <li key={l.href}>
                <Link
                  href={l.href}
                  className="inline-flex min-h-[44px] items-center rounded-[var(--radius-sm)] border border-[var(--color-border)] bg-white px-3.5 py-2 text-[15px] font-medium text-[var(--kasumi-blue)] no-underline shadow-[var(--shadow-sm)] transition hover:border-[#b8cfe8] hover:bg-[#eef4fb]"
                  onClick={() => close()}
                >
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
        {showCategoryGuide && (
          <p className="mx-auto hidden max-w-6xl px-4 pb-2 pt-3 text-sm leading-relaxed text-[#555] lg:block md:px-6">
            カテゴリの案内は、画面上部のメニューからお選びください。
          </p>
        )}
        <div className={columnsGridClass}>
          {MEGA_COLUMNS.map((col) => (
            <div key={col.href} className="min-w-0">
              <h2 className="m-0 border-b-2 border-[var(--kasumi-blue)] pb-2 text-base font-bold">
                <Link
                  href={col.href}
                  className="inline-flex min-h-[44px] items-center text-[var(--kasumi-blue)] no-underline hover:underline"
                  onClick={() => close()}
                >
                  {col.title}
                </Link>
              </h2>
              <ul className="mt-3 space-y-0.5 p-0 list-none text-[15px] leading-relaxed">
                {col.links.map((l) => (
                  <li key={l.href}>
                    <Link
                      href={l.href}
                      className="inline-flex min-h-[44px] w-full items-center rounded-[var(--radius-sm)] px-1 py-1 text-[var(--color-text)] no-underline transition hover:bg-white hover:text-[var(--kasumi-blue)]"
                      onClick={() => close()}
                    >
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </nav>
    </>
  );
}
