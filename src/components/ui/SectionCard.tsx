import { type ReactNode } from "react";

type Props = {
  title?: string;
  children: ReactNode;
  className?: string;
  as?: "section" | "div";
};

export function SectionCard({ title, children, className = "", as: Tag = "section" }: Props) {
  return (
    <Tag
      className={`rounded-[var(--radius-md)] border border-[var(--color-border)] bg-white p-[var(--space-5)] shadow-[var(--shadow-sm)] ${className}`}
    >
      {title && (
        <h2 className="mb-3 mt-0 text-lg font-bold text-[var(--kasumi-green,#2d5a27)]">{title}</h2>
      )}
      {children}
    </Tag>
  );
}
