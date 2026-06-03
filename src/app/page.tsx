import { CinematicHero } from "@/components/home/CinematicHero";
import { SiteFooter } from "@/components/layout/SiteFooter";

export default function HomePage() {
  return (
    <main className="city-body--top bg-[#0a0f14]">
      <CinematicHero />
      <SiteFooter variant="top" enableScrollMotion />
    </main>
  );
}
