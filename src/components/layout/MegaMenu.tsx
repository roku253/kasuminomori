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
    ? "rounded-full border-0 bg-[#2d8a3e] px-5 py-2.5 text-sm font-bold text-white shadow-lg hover:bg-[#247032]"
    : "fixed top-3 right-5 z-[100001] rounded-full border-0 bg-[#2d8a3e] px-5 py-2.5 text-sm font-bold text-white shadow-lg hover:bg-[#247032]";

  return (
    <>
      <button
        type="button"
        className={btnClass}
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
        className="city-mega fixed inset-x-0 top-0 z-[100000] max-h-[85vh] overflow-auto border-b-[3px] border-[#1a4d80] bg-[#f5f5f5] pt-[52px] shadow-2xl"
      >
        <div className="mx-auto max-w-6xl border-b border-[#ccc] px-4 py-3">
          <h2 className="m-0 text-sm font-bold text-[#1a4d80]">よく使うリンク</h2>
          <ul className="mt-2 flex flex-wrap gap-2 p-0 list-none">
            {MEGA_TOOLS.map((l) => (
              <li key={l.href}>
                <Link
                  href={l.href}
                  className="inline-block rounded bg-white px-3 py-1.5 text-xs text-[#1a4d80] no-underline hover:bg-[#e8f0fa]"
                  onClick={() => setOpen(false)}
                >
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
        <div className="mx-auto grid max-w-6xl gap-6 px-4 py-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {MEGA_COLUMNS.map((col) => (
            <div key={col.href}>
              <h2 className="m-0 border-b border-[#ccc] pb-2 text-base">
                <Link href={col.href} className="text-[#1a4d80] no-underline" onClick={() => setOpen(false)}>
                  {col.title}
                </Link>
              </h2>
              <ul className="mt-2 space-y-1 p-0 list-none text-sm">
                {col.links.map((l) => (
                  <li key={l.href}>
                    <Link href={l.href} className="text-[#333] no-underline hover:text-[#1a4d80]" onClick={() => setOpen(false)}>
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
