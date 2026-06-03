import { type ReactNode } from "react";
import { CityBreadcrumb } from "@/components/layout/CityBreadcrumb";
import type { BreadcrumbItem } from "@/lib/content/types";
type Props = {
  title: string;
  subtitle?: string;
  breadcrumbs?: BreadcrumbItem[];
  children?: ReactNode;
  className?: string;
};

export function PageHero({ title, subtitle, breadcrumbs, children, className = "" }: Props) {
  return (
    <header className={`mb-8 ${className}`}>
      {breadcrumbs && breadcrumbs.length > 0 && <CityBreadcrumb items={breadcrumbs} />}
      <h1 className="m-0 border-b-[3px] border-[var(--kasumi-gold,#c9a227)] pb-3 font-[family-name:var(--font-display)] text-[28px] font-bold text-[var(--kasumi-blue)] md:text-4xl">
        {title}
      </h1>
      {subtitle && <p className="mt-4 text-base leading-relaxed text-[#444]">{subtitle}</p>}
      {children}
    </header>
  );
}
