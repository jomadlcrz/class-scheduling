import type { ReactNode } from "react";
import { Card } from "~/components/ui/card";

type StatCardProps = {
  label: ReactNode;
  value: ReactNode;
  hint?: ReactNode;
  adornment?: ReactNode;
  children?: ReactNode;
  className?: string;
  valueClassName?: string;
};

/** Shared summary-stat card. Its visual hierarchy matches the scheduling overview. */
export function StatCard({
  label,
  value,
  hint,
  adornment,
  children,
  className,
  valueClassName,
}: StatCardProps) {
  return (
    <Card className={`p-4 ${className ?? ""}`.trim()}>
      <div className="flex items-start justify-between gap-2">
        <p className="font-body text-xs font-semibold uppercase tracking-wide text-slate-400 dark:text-slate-500">
          {label}
        </p>
        {adornment}
      </div>
      <p
        className={`mt-1 font-display text-2xl leading-none tracking-wide tabular-nums ${
          valueClassName ?? "text-navy-700 dark:text-mist-100"
        }`}
      >
        {value}
      </p>
      {hint !== undefined && (
        <p className="mt-1 font-body text-xs text-slate-500 dark:text-slate-400">{hint}</p>
      )}
      {children && <div className="mt-3">{children}</div>}
    </Card>
  );
}
