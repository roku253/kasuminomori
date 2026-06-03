import Link from "next/link";
import { PICKUP_LINKS } from "@/lib/hero-slides";

export function PickupPills() {
  return (
    <div className="hero-pickup-pills-inner">
      <h2 className="city-eyebrow mb-2.5 text-white/90">よく使うページ</h2>
      <div className="flex flex-wrap gap-2">
        {PICKUP_LINKS.map((l) => (
          <Link
            key={l.href}
            href={l.href}
            className="inline-flex min-h-[44px] items-center rounded-[var(--radius-sm)] border border-white/30 bg-white/10 px-3.5 py-2 text-sm font-medium text-white no-underline backdrop-blur-md transition hover:border-white/50 hover:bg-white/20"
          >
            {l.label}
          </Link>
        ))}
      </div>
    </div>
  );
}
