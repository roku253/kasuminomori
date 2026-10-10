import Link from "next/link";
import top from "@/content/data/top.json";

/** 緊急情報の帯（平常時は「現在、緊急情報はありません。」。UX-22）。橙赤は緊急情報だけに使う */
export function TopEmergency() {
  return (
    <section className="kn-top-emergency" aria-labelledby="top-emergency-heading">
      <h2 id="top-emergency-heading" className="kn-top-emergency__label">
        {top.emergency.label}
      </h2>
      <p className="kn-top-emergency__text">{top.emergency.text}</p>
      <Link href={top.emergency.href} className="kn-top-emergency__link">
        {top.emergency.linkLabel}
      </Link>
    </section>
  );
}
