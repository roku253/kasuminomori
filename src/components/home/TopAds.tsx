import Image from "next/image";
import Link from "next/link";
import top from "@/content/data/top.json";
import { assetPath } from "@/lib/site";

/**
 * バナー広告（トップだけ。B-4・DR-18）。民間事業者だけ・小さな枠・「広告」表示・免責文・掲載の案内。
 * 広告主のサイトは無いので、枠はリンクにしない（押しても何も起きない偽の手応えを作らない）。
 */
export function TopAds() {
  return (
    <section className="kn-top-section kn-top-ads" aria-labelledby="top-ads-heading">
      <h2 id="top-ads-heading" className="kn-top-heading kn-top-heading--small">
        {top.ads.heading}
      </h2>
      <ul className="kn-top-ads__list">
        {top.ads.items.map((ad) => (
          <li key={ad.name} className="kn-top-ad">
            <Image src={assetPath(ad.image)} alt="" width={80} height={60} className="kn-top-ad__img" />
            <span className="kn-top-ad__text">
              <span className="kn-top-ad__tag">広告</span>
              <span className="kn-top-ad__name">{ad.name}</span>
              <span className="kn-top-ad__line">{ad.line}</span>
            </span>
          </li>
        ))}
      </ul>
      <p className="kn-top-ads__note">
        {top.ads.disclaimer}
        <Link href={top.ads.recruitHref}>{top.ads.recruitLabel}</Link>
      </p>
    </section>
  );
}
