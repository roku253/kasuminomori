"use client";

import { Menu, X } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useId, useState } from "react";
import { MEGA_COLUMNS, MEGA_TOOLS } from "@/lib/navigation";

type Props = {
  embeddedInHero?: boolean;
};

export function MegaMenu({ embeddedInHero }: Props) {
  const [open, setOpen] = useState(false);
  const panelId = useId();

  const toggle = useCallback(() => setOpen((o) => !o), []);

  useEffect(() => {
    document.body.classList.toggle("city-mega-open", open);
    return () => document.body.classList.remove("city-mega-open");
  }, [open]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && open) setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  const btnClass = embeddedInHero
    ? "min-h-[44px] rounded-full border-0 bg-[#2d8a3e] px-5 py-2.5 text-sm font-bold text-white shadow-lg hover:bg-[#247032]"
    : "min-h-[44px] shrink-0 rounded-full border-0 bg-[#2d8a3e] px-4 py-2.5 text-sm font-bold text-white shadow-md hover:bg-[#247032]";

  return (
    <>
      {open && (
        <div
          role="presentation"
          className={`fixed inset-0 cursor-default ${
            embeddedInHero ? "z-[99998] bg-black/55" : "z-[99999] bg-black/40"
          }`}
          onClick={() => setOpen(false)}
          onKeyDown={(e) => e.key === "Escape" && setOpen(false)}
        />
      )}
      <button
        type="button"
        className={`${btnClass} hero-mega-trigger relative z-[100001]`}
        aria-expanded={open}
        aria-controls={panelId}
        onClick={toggle}
      >
        <span className="flex items-center gap-2">
          {open ? <X size={18} aria-hidden /> : <Menu size={18} aria-hidden />}
          メニュー
        </span>
      </button>
      <nav
        id={panelId}
        hidden={!open}
        className={
          embeddedInHero
            ? "city-mega fixed inset-0 z-[100000] overflow-y-auto border-b-[3px] border-[var(--kasumi-blue)] bg-[var(--color-surface)] pt-16 shadow-2xl"
            : "city-mega fixed inset-x-0 top-[var(--site-header-stack,5.5rem)] z-[100000] max-h-[calc(100dvh-var(--site-header-stack,5.5rem))] overflow-y-auto border-b-[3px] border-[var(--kasumi-blue)] bg-[var(--color-surface)] shadow-2xl"
        }
      >
        <div className="mx-auto max-w-6xl border-b border-[var(--color-border)] px-4 py-4 md:px-6">
          <h2 className="city-eyebrow m-0 text-[var(--kasumi-blue)]">よく使うリンク</h2>
          <ul className="mt-3 flex flex-wrap gap-2 p-0 list-none">
            {MEGA_TOOLS.map((l) => (
              <li key={l.href}>
                <Link
                  href={l.href}
                  className="inline-flex min-h-[40px] items-center rounded-[var(--radius-sm)] border border-[var(--color-border)] bg-white px-3.5 py-2 text-sm font-medium text-[var(--kasumi-blue)] no-underline shadow-[var(--shadow-sm)] transition hover:border-[#b8cfe8] hover:bg-[#eef4fb]"
                  onClick={() => setOpen(false)}
                >
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
        <div className="mx-auto grid max-w-6xl gap-8 px-4 py-8 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 md:px-6">
          {MEGA_COLUMNS.map((col) => (
            <div key={col.href} className="min-w-0">
              <h2 className="m-0 border-b-2 border-[var(--kasumi-blue)] pb-2 text-base font-bold">
                <Link
                  href={col.href}
                  className="text-[var(--kasumi-blue)] no-underline hover:underline"
                  onClick={() => setOpen(false)}
                >
                  {col.title}
                </Link>
              </h2>
              <ul className="mt-3 space-y-0.5 p-0 list-none text-[15px] leading-relaxed">
                {col.links.map((l) => (
                  <li key={l.href}>
                    <Link
                      href={l.href}
                      className="inline-flex min-h-[40px] w-full items-center rounded-[var(--radius-sm)] px-1 py-1 text-[var(--color-text)] no-underline transition hover:bg-white hover:text-[var(--kasumi-blue)]"
                      onClick={() => setOpen(false)}
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
