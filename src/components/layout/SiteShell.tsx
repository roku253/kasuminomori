import { SiteFooter } from "./SiteFooter";
import { SiteHeader } from "./SiteHeader";

type Props = {
  children: React.ReactNode;
};

export function SiteShell({ children }: Props) {
  return (
    <>
      <SiteHeader />
      <div className="min-h-[50vh] bg-[var(--color-page-bg)]">{children}</div>
      <SiteFooter variant="inner" enableScrollMotion />
    </>
  );
}
