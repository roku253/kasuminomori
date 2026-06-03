import { CinematicHero } from "@/components/home/CinematicHero";
import { TopNewsStrip } from "@/components/home/TopNewsStrip";
import { SiteFooter } from "@/components/layout/SiteFooter";

export default function HomePage() {
  return (
    <main className="city-body--top bg-[var(--color-page-bg)]">
      <CinematicHero />
      <div id="top-news">
        <TopNewsStrip />
      </div>
      <SiteFooter variant="top" enableScrollMotion />
    </main>
  );
}
