import type { CityPageContent } from "@/lib/content/types";
import { formatJaDate } from "@/lib/date-ja.mjs";
import { CONTACT_UI, pageOwner, pageUpdated } from "@/lib/organization";
import { TOWN } from "@/lib/site";

/**
 * 「このページに関するお問い合わせ（課・係・階・電話・内線）」と「更新日」（全下層ページの末尾。DR-01・K-21）。
 * 担当と更新日はページ JSON の owner・updated、無ければ src/content/data/organization.json の既定値。
 * 電話はリンクにしない（B-2）。メールアドレスは載せない。
 */
export function PageContact({ page }: { page: CityPageContent }) {
  const owner = pageOwner(page);
  const updated = pageUpdated(page);
  return (
    <section className="kn-page-contact" aria-labelledby="page-contact-heading">
      <h2 id="page-contact-heading" className="kn-page-contact__title">
        {CONTACT_UI.heading}
      </h2>
      <dl className="kn-page-contact__body">
        <div>
          <dt>担当</dt>
          <dd>
            {CONTACT_UI.office} {owner.name}（{owner.floor}）
          </dd>
        </div>
        <div>
          <dt>電話</dt>
          <dd>
            {TOWN.tel}（内線 {owner.ext}）
          </dd>
        </div>
        <div>
          <dt>FAX</dt>
          <dd>{TOWN.fax}</dd>
        </div>
      </dl>
      <p className="kn-page-contact__updated">
        {CONTACT_UI.updated}：<time dateTime={updated}>{formatJaDate(updated)}</time>
      </p>
    </section>
  );
}
