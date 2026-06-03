import { MegaMenu } from "./MegaMenu";
import { SiteLogo } from "./SiteLogo";

export function SiteHeader() {
  return (
    <>
      <a
        href="#city-main"
        className="city-skip absolute -left-[9999px] z-[100000] focus:left-2 focus:top-2 focus:bg-white focus:px-2 focus:py-2"
      >
        本文へスキップ
      </a>
      <header className="relative bg-[#1a4d80] text-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-2.5">
          <SiteLogo variant="header" />
        </div>
        <MegaMenu />
      </header>
    </>
  );
}
