import Link from "next/link";
import { PICKUP_LINKS } from "@/lib/hero-slides";

type Props = {
  showLabel?: boolean;
};

export function PickupPills({ showLabel = true }: Props) {
  return (
    <div className="hero-pickup-pills-inner flex h-full min-w-0 flex-col">
      {showLabel && <h2 className="city-eyebrow mb-3 text-white/95">よく使うページ</h2>}
      <ul className="hero-pickup-grid m-0 h-full list-none gap-2 p-0">
        {PICKUP_LINKS.map((l) => (
          <li key={l.href} className="min-h-0">
            <Link
              href={l.href}
              className="flex h-full min-h-[44px] w-full items-center justify-center rounded-[var(--radius-sm)] border border-white/35 bg-white/12 px-3 py-2.5 text-center text-sm font-medium leading-snug text-white no-underline backdrop-blur-md transition hover:border-white/55 hover:bg-white/22"
            >
              {l.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
