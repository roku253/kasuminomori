import Image from "next/image";
import Link from "next/link";
import { assetPath } from "@/lib/site";

/** 町章（180×180。646px・227KB の原寸画像は使わない） */
const TOWN_MON = "/img/kasuminomori-mon-180.png";

type Props = {
  variant?: "header" | "footer";
};

/** 町章＋町名。トップへのリンク（町章は飾りなので alt なし。リンク名は「霞ノ杜町 KASUMINOMORI TOWN」） */
export function SiteLogo({ variant = "header" }: Props) {
  const isFooter = variant === "footer";
  const size = isFooter ? 40 : 44;

  return (
    <Link href="/" className="kn-logo flex min-h-[44px] items-center gap-2.5 text-[#173f68] no-underline">
      <Image src={assetPath(TOWN_MON)} alt="" width={size} height={size} className="shrink-0" aria-hidden />
      <span className="min-w-0">
        <span className="block text-xl font-bold leading-tight tracking-widest">霞ノ杜町</span>
        <span className="block text-[11px] font-semibold tracking-[0.2em] text-[#3f5f80]">KASUMINOMORI TOWN</span>
      </span>
    </Link>
  );
}
