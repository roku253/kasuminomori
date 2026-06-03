import type { HubCard } from "@/components/ui/CategoryHub";

export function parseHubCardsFromHtml(html: string): HubCard[] {
  if (!html.includes("city-hub-card")) return [];
  const cards: HubCard[] = [];
  const re =
    /<a\s+class="city-hub-card"[^>]*href="([^"]*)"[^>]*>[\s\S]*?<strong>([^<]*)<\/strong>[\s\S]*?<span>([^<]*)<\/span>/gi;
  let m;
  while ((m = re.exec(html)) !== null) {
    cards.push({
      href: m[1],
      title: m[2].trim(),
      description: m[3].trim(),
      storyClue: /data-kn-story-clue/.test(m[0]),
    });
  }
  return cards;
}

export function stripHubHtml(html: string): string {
  return html.replace(/<div class="city-hub-cards">[\s\S]*?<\/div>/i, "").trim();
}

export function isHubExtraHtml(html?: string): boolean {
  return Boolean(html?.includes("city-hub-cards"));
}
