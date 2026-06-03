import Link from "next/link";
import type { RelatedLink } from "@/lib/content/types";

function normalizeRelatedHref(href: string): string {
  if (href.startsWith("http") || href.startsWith("#")) return href;
  let p = href;
  while (p.startsWith("../")) p = p.slice(3);
  while (p.startsWith("./")) p = p.slice(2);
  p = p.replace(/index\.html$/, "");
  if (!p.startsWith("/")) p = `/${p}`;
  if (!p.endsWith("/")) p = `${p}/`;
  return p;
}

type Props = {
  links: RelatedLink[];
  title?: string;
  className?: string;
};

export function RelatedPanel({ links, title = "関連するページ", className = "" }: Props) {
  if (!links.length) return null;

  return (
    <aside
      className={`mt-8 border-l-4 border-[var(--kasumi-blue)] bg-[#f6f8fa] p-4 md:p-5 ${className}`}
    >
      <h2 className="mb-2.5 mt-0 text-[15px] font-bold text-[var(--kasumi-blue)]">{title}</h2>
      <ul className="m-0 list-none p-0">
        {links.map((r) => (
          <li key={r.href} className="my-1.5" {...(r.storyClue ? { "data-kn-story-clue": "1" } : {})}>
            <Link
              href={normalizeRelatedHref(r.href)}
              className="text-[var(--kasumi-blue)] no-underline hover:underline"
            >
              {r.label}
            </Link>
          </li>
        ))}
      </ul>
    </aside>
  );
}
