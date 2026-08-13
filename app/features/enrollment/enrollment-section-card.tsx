import type { ReactNode } from "react";
import { Card } from "~/components/ui/card";

type EnrollmentSectionCardProps = {
  title: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
};

/** White section card with icon header — shared chrome for Add Student wizard steps. */
export function EnrollmentSectionCard({
  title,
  action,
  children,
  className,
}: EnrollmentSectionCardProps) {
  return (
    <Card
      className={`overflow-hidden shadow-sm shadow-slate-900/5 dark:shadow-none ${className ?? ""}`.trim()}
    >
      <div className="flex items-center justify-between gap-3 border-b border-slate-200/80 px-5 py-3.5 dark:border-white/10">
        <h2 className="font-display text-lg tracking-wide text-navy-800 dark:text-mist-100">{title}</h2>
        {action}
      </div>
      <div className="p-5">{children}</div>
    </Card>
  );
}

type InfoFieldProps = {
  label: string;
  children: ReactNode;
};

export function InfoField({ label, children }: InfoFieldProps) {
  return (
    <div className="min-w-0">
      <dt className="font-body text-[11px] font-medium uppercase tracking-wider text-slate-400 dark:text-slate-500">
        {label}
      </dt>
      <dd className="mt-0.5 font-body text-sm text-navy-800 dark:text-slate-100">{children}</dd>
    </div>
  );
}
