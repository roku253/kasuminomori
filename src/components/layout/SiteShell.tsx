import { PrintError } from "./PrintError";
import { SiteFooter } from "./SiteFooter";
import { SiteHeader } from "./SiteHeader";
import { SkipLink } from "./SkipLink";

type Props = {
  children: React.ReactNode;
  /** ページ JSON の printError。true なら印刷時にエラー文だけが出る（PrintError.tsx） */
  printError?: boolean;
};

/** 下層ページの枠: 本文へ移動 → ヘッダー → <main id="main">（1つだけ）→ フッター */
export function SiteShell({ children, printError = false }: Props) {
  return (
    <>
      {printError && <PrintError />}
      <SkipLink />
      <SiteHeader />
      <main id="main" tabIndex={-1} className="kn-main min-h-[50vh] bg-[var(--color-page-bg)]">
        {children}
      </main>
      <SiteFooter />
    </>
  );
}
