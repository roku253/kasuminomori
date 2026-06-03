import { type ReactNode } from "react";

type Props = {
  children: ReactNode;
  className?: string;
};

export function GlassPanel({ children, className = "" }: Props) {
  return (
    <div
      className={`rounded-xl border border-white/20 bg-white/10 shadow-lg backdrop-blur-xl ${className}`}
    >
      {children}
    </div>
  );
}
