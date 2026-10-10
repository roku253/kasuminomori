import { type ReactNode } from "react";
import { CityBreadcrumb } from "@/components/layout/CityBreadcrumb";
import type { BreadcrumbItem } from "@/lib/content/types";
type Props = {
  title: string;
  subtitle?: string;
  breadcrumbs?: BreadcrumbItem[];
  pageRoute?: string;
  sourcePath?: string;
  children?: ReactNode;
  className?: string;
};

export function PageHero({ title, subtitle, breadcrumbs, pageRoute = "/", sourcePath, children, className = "" }: Props) {
  return (
    <header className={`mb-8 ${className}`}>
      {breadcrumbs && breadcrumbs.length > 0 && pageRoute && (
        <CityBreadcrumb items={breadcrumbs} pageRoute={pageRoute} sourcePath={sourcePath} />
      )}
      <h1 className="kn-page-title m-0 border-b-2 border-[var(--kasumi-blue)] pb-3 text-[26px] font-bold leading-snug text-[#173f68] md:text-[32px]">
        {title}
      </h1>
      {subtitle && <p className="mt-4 max-w-[46em] text-base leading-relaxed text-[#333]">{subtitle}</p>}
      {children}
    </header>
  );
}
