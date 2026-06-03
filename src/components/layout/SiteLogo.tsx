import Link from "next/link";

type Props = {
  variant?: "hero" | "header" | "footer";
};

export function SiteLogo({ variant = "header" }: Props) {
  const isFooter = variant === "footer";
  return (
    <Link
      href="/"
      className={`flex items-center gap-2.5 no-underline ${isFooter ? "text-[#222]" : "text-white"}`}
    >
      <span
        className={`inline-block shrink-0 rounded-full border-2 border-white bg-gradient-to-br from-[#4a9e4a] to-[#1a4d80] ${
          isFooter ? "h-10 w-10" : "h-9 w-9"
        }`}
        aria-hidden
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
