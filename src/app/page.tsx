import type { Metadata } from "next";
import top from "@/content/data/top.json";
import { TopAds } from "@/components/home/TopAds";
import { TopCategories } from "@/components/home/TopCategories";
import { TopEmergency } from "@/components/home/TopEmergency";
import { TopFeatured } from "@/components/home/TopFeatured";
import { TopNews } from "@/components/home/TopNews";
import { TopPickup } from "@/components/home/TopPickup";
import { TopSearch } from "@/components/home/TopSearch";
import { TopVisual } from "@/components/home/TopVisual";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { SkipLink } from "@/components/layout/SkipLink";

export const metadata: Metadata = {
  alternates: { canonical: "/" },
};

/**
 * トップページ（1b で作り直し）。ヘッダーとナビは下層と同じ（DR-22）。
 * 並び: 写真（静止画1枚）→ 緊急情報 → 検索・お知らせ・注目情報 → よく使うページ → 分類から探す → 広告。
 * モバイルは 写真 → 緊急情報 → 検索 → お知らせ → 注目情報 の順で、お知らせが最初の画面に入る（UX-05）。
 */
export default function HomePage() {
  return (
    <>
      <SkipLink />
      <SiteHeader showSearch={false} menuMode="full" />
      <main id="main" tabIndex={-1} className="kn-main kn-top bg-[var(--color-page-bg)]">
        <h1 className="sr-only">{top.title}</h1>
        <TopVisual />
        <div className="mx-auto max-w-6xl px-4 pb-12">
          <TopEmergency />
          <div className="kn-top-grid">
            <div className="kn-top-grid__search">
              <TopSearch />
            </div>
            <div className="kn-top-grid__news">
              <TopNews />
            </div>
            <div className="kn-top-grid__featured">
              <TopFeatured />
            </div>
          </div>
          <TopPickup />
          <TopCategories />
          <TopAds />
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
