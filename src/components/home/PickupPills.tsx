import Link from "next/link";
import { PICKUP_LINKS } from "@/lib/hero-slides";

export function PickupPills() {
  return (
    <div>
      <h2 className="mb-2 text-[11px] font-bold tracking-[0.15em] text-white/95">よく使うページ</h2>
      <div className="flex flex-wrap gap-2">
        {PICKUP_LINKS.map((l) => (
          <Link
            key={l.href}
            href={l.href}
            className="inline-flex min-h-[44px] items-center rounded-full bg-[#1a5fb4]/90 px-4 py-2 text-xs font-medium text-white no-underline backdrop-blur-sm transition hover:bg-[#154a9a]"
          >
            {l.label}
          </Link>
        ))}
      </div>
    </div>
  );
}
