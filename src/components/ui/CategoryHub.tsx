import Link from "next/link";

export type HubCard = {
  href: string;
  title: string;
  description: string;
  storyClue?: boolean;
};

function normalizeHref(href: string): string {
  if (href.startsWith("http") || href.startsWith("#")) return href;
  let p = href;
  while (p.startsWith("../")) p = p.slice(3);
  while (p.startsWith("./")) p = p.slice(2);
  p = p.replace(/index\.html$/, "").replace(/\.html$/, "");
  if (!p.startsWith("/")) p = `/${p}`;
  if (!p.endsWith("/")) p = `${p}/`;
  return p;
}

type Props = {
  cards: HubCard[];
  className?: string;
};

export function CategoryHub({ cards, className = "" }: Props) {
  if (!cards.length) return null;

  return (
    <div
      className={`grid gap-4 [grid-template-columns:repeat(auto-fill,minmax(240px,1fr))] my-6 ${className}`}
    >
      {cards.map((card) => (
        <Link
          key={card.href}
          href={normalizeHref(card.href)}
          className="group flex min-h-[120px] flex-col rounded-[var(--radius-md)] border border-[var(--color-border)] bg-white p-5 text-inherit no-underline shadow-[var(--shadow-sm)] transition hover:border-[var(--kasumi-blue)] hover:shadow-[var(--shadow-md)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--kasumi-blue)]"
          {...(card.storyClue ? { "data-kn-story-clue": "1" } : {})}
        >
          <strong className="mb-2 block text-base text-[var(--kasumi-blue)] group-hover:underline">
            {card.title}
          </strong>
          <span className="text-sm leading-relaxed text-[#555]">{card.description}</span>
        </Link>
      ))}
    </div>
  );
}
