import type { ReactNode } from "react";

type CardProps = {
  children: ReactNode;
  className?: string;
};

export function Card({ children, className }: CardProps) {
  return (
    <div
      className={`rounded-xl border border-slate-300 bg-white dark:border-white/10 dark:bg-white/5 ${className ?? ""}`.trim()}
    >
      {children}
    </div>
  );
}
