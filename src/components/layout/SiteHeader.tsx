import Link from "next/link";
import { TOWN } from "@/lib/site";
import { HeaderCategoryNav } from "./HeaderCategoryNav";
import { HeaderSearch } from "./HeaderSearch";
import { MegaMenu, type MegaMenuMode } from "./MegaMenu";
import { SiteLogo } from "./SiteLogo";

type Props = {
  /** ヘッダー右の検索窓（デスクトップ）。トップは本文に検索があるので出さない */
  showSearch?: boolean;
  /** メニューの中身。下層は split（lg 以上はカテゴリを上の帯に任せる）、トップは full（全分類を出す） */
  menuMode?: MegaMenuMode;
};

/**
 * 全ページ共通のヘッダー（トップも同じ。DR-22）。
 * 上段の帯（サイト名・サイトマップ・代表電話）→ ロゴ・検索窓・メニュー（スクロールしても上に残る）→ 主要カテゴリ（lg 以上）。
 * 電話はリンクにしない（B-2）。架空の注記はフッター（SiteFooter）。
 */
export function SiteHeader({ showSearch = true, menuMode = "split" }: Props) {
  return (
    <>
      <div className="kn-utility">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-x-4 px-4">
          <p className="kn-utility__name hidden sm:block">{TOWN.name}公式ホームページ</p>
          <ul className="kn-utility__links">
            <li>
              <Link href="/sitemap/">サイトマップ</Link>
            </li>
            <li>
              <span>代表電話 {TOWN.tel}</span>
            </li>
          </ul>
        </div>
      </div>
      <header className="kn-header" data-site-header>
        <div className="mx-auto flex max-w-6xl items-center gap-3 px-4 py-2">
          <SiteLogo variant="header" />
          {showSearch && (
            <div className="ml-auto hidden w-[min(26rem,40vw)] lg:block">
              <HeaderSearch />
            </div>
          )}
          <div className={showSearch ? "ml-auto shrink-0 lg:ml-2" : "ml-auto shrink-0"}>
            <MegaMenu mode={menuMode} />
          </div>
        </div>
      </header>
      <HeaderCategoryNav />
    </>
  );
}
