import Image from "next/image";
import Link from "next/link";
import { assetPath } from "@/lib/site";

const TOWN_MON = "/img/kasuminomori-mon.png";

type Props = {
  variant?: "hero" | "header" | "footer";
};

export function SiteLogo({ variant = "header" }: Props) {
  const isFooter = variant === "footer";
  const size = isFooter ? 40 : 36;

  return (
    <Link
      href="/"
      className={`flex items-center gap-2.5 no-underline ${isFooter ? "text-[#222]" : "text-white"}`}
    >
      <Image
        src={assetPath(TOWN_MON)}
        alt=""
        width={size}
        height={size}
        className="shrink-0"
        aria-hidden
        priority={variant === "hero"}
      />
      <span className="min-w-0">
        <span className="block text-lg font-bold tracking-widest">霞ノ杜町</span>
        <span className={`block text-[10px] tracking-widest ${isFooter ? "text-[#666]" : "opacity-85"}`}>
          KASUMINOMORI TOWN
        </span>
      </span>
    </Link>
  );
}
