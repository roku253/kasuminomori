import Link from "next/link";
import { Baby, Building2, Factory, HeartPulse, Home, Landmark, ShieldAlert, type LucideIcon } from "lucide-react";
import top from "@/content/data/top.json";
import { MEGA_COLUMNS } from "@/lib/navigation";

const ICONS: Record<string, LucideIcon> = {
  "/kurashi/": Home,
  "/anzen/": ShieldAlert,
  "/fukushi/": HeartPulse,
  "/kodomo/": Baby,
  "/sangyo/": Factory,
  "/bunka/": Landmark,
  "/shisei/": Building2,
};

/** 分類から探す（7分類の入口。DR-16）。分類と主なページは src/lib/navigation.ts（ヘッダー・メニューと同じ） */
export function TopCategories() {
  return (
    <section className="kn-top-section" aria-labelledby="top-categories-heading">
      <h2 id="top-categories-heading" className="kn-top-heading">
        {top.categories.heading}
      </h2>
      <ul className="kn-top-categories">
        {MEGA_COLUMNS.map((col) => {
          const Icon = ICONS[col.href] ?? Home;
          return (
            <li key={col.href} className="kn-top-category">
              <h3 className="kn-top-category__title">
                <Link href={col.href}>
                  <Icon size={22} aria-hidden />
                  {col.title}
                </Link>
              </h3>
              <ul className="kn-top-category__links">
                {col.links.map((l) => (
                  <li key={l.href}>
                    <Link href={l.href}>{l.label}</Link>
                  </li>
                ))}
              </ul>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
