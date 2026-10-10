import Link from "next/link";
import top from "@/content/data/top.json";

/** よく使うページ（写真の外の白い枠のボタン。UX-04）。中身は data/top.json */
export function TopPickup() {
  return (
    <section className="kn-top-section" aria-labelledby="top-pickup-heading">
      <h2 id="top-pickup-heading" className="kn-top-heading">
        {top.pickup.heading}
      </h2>
      <ul className="kn-top-pickup">
        {top.pickup.items.map((l) => (
          <li key={l.href}>
            <Link href={l.href}>{l.label}</Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
