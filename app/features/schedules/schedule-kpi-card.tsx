import type { ReactNode } from "react";
import { Card } from "~/components/ui/card";

type ScheduleKpiCardProps = {
  icon: ReactNode;
  label: string;
  value: ReactNode;
};

export function ScheduleKpiCard({ icon, label, value }: ScheduleKpiCardProps) {
  return (
    <Card className="flex items-center gap-3 p-4">
      <span aria-hidden="true" className="text-navy-700 dark:text-white">
        {icon}
      </span>
      <span className="min-w-0">
        <span className="block font-body text-xs font-medium uppercase tracking-wider text-slate-400 dark:text-slate-500">
          {label}
        </span>
        <span className="mt-0.5 block truncate font-display text-lg tracking-wide text-navy-700 dark:text-mist-100">
          {value}
        </span>
      </span>
    </Card>
  );
}
