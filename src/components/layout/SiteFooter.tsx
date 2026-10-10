import Link from "next/link";
import { TOWN } from "@/lib/site";
import { SiteLogo } from "./SiteLogo";

/** フッターの案内（自治体サイトの定番。DR-04）。方針ページは src/content/pages/site*.json・sitemap.json */
const FOOTER_LINKS = [
  { href: "/sitemap/", label: "サイトマップ" },
  { href: "/site/", label: "サイトのご利用について" },
  { href: "/site/privacy/", label: "個人情報の取扱い" },
  { href: "/site/accessibility/", label: "ウェブアクセシビリティ方針" },
  { href: "/shisei/yakuba/", label: "庁舎案内" },
  { href: "/contact/", label: "お問い合わせ" },
] as const;

/**
 * 全ページ共通のフッター。役場の住所・電話・FAX・開庁時間は src/lib/site.ts の TOWN から（B-1・B-2）。
 * 電話はリンクにしない。メールアドレスは載せない。
 * フォトギャラリーと広告は 1b で外した（広告はトップだけ。src/components/home/TopAds.tsx）。
 */
export function SiteFooter() {
  return (
    <footer className="kn-footer">
      <nav aria-label="フッターメニュー" className="kn-footer__nav">
        <ul className="mx-auto max-w-6xl px-4">
          {FOOTER_LINKS.map((l) => (
            <li key={l.href}>
              <Link href={l.href}>{l.label}</Link>
            </li>
          ))}
        </ul>
      </nav>
      <div className="kn-footer__main mx-auto max-w-6xl px-4">
        <SiteLogo variant="footer" />
        <address className="kn-footer__address">
          <strong>{TOWN.office}</strong>
          <span>
            {TOWN.postalCode}　{TOWN.address}
          </span>
          <span>
            電話 {TOWN.tel}（代表）　FAX {TOWN.fax}
          </span>
          <span>開庁時間　{TOWN.hours}</span>
        </address>
      </div>
      <p className="kn-footer__copy">{TOWN.copyright}</p>
    </footer>
  );
}
