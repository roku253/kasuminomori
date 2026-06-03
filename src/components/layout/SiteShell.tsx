import { SiteFooter } from "./SiteFooter";
import { SiteHeader } from "./SiteHeader";

type Props = {
  children: React.ReactNode;
};

export function SiteShell({ children }: Props) {
  return (
    <>
      <SiteHeader />
      <div className="city-page-wrap bg-[#f4f6f8] min-h-[50vh]">{children}</div>
      <SiteFooter variant="inner" />
    </>
  );
}
