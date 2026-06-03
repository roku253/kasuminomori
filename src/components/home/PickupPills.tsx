import Link from "next/link";
import { PICKUP_LINKS } from "@/lib/hero-slides";

export function PickupPills() {
  return (
    <div>
      <h2 className="mb-2 text-[11px] font-normal tracking-[0.2em] text-white/90">PICK UP</h2>
      <div className="flex flex-wrap gap-2">
        {PICKUP_LINKS.map((l) => (
          <Link
            key={l.href}
            href={l.href}
            className="rounded-full bg-[#1a5fb4]/90 px-3.5 py-1.5 text-xs text-white no-underline backdrop-blur-sm transition hover:bg-[#154a9a]"
          >
            {l.label}
          </Link>
        ))}
      </div>
    </div>
  );
}
