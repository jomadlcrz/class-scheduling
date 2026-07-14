import type { ReactNode } from "react";
import type { BadgeTone } from "~/components/ui/badge";
import { Card } from "~/components/ui/card";

type ScheduleKpiCardProps = {
  icon: ReactNode;
  tone: BadgeTone;
  label: string;
  value: ReactNode;
};

const DISC_TONES: Record<BadgeTone, string> = {
  navy: "bg-blue-100 text-blue-800 dark:bg-navy-300/10 dark:text-navy-300",
  gold: "bg-amber-100 text-amber-800 dark:bg-gold-400/10 dark:text-gold-300",
  emerald: "bg-green-100 text-green-800 dark:bg-emerald-400/10 dark:text-emerald-300",
  blue: "bg-blue-100 text-blue-800 dark:bg-blue-400/10 dark:text-blue-300",
  green: "bg-green-100 text-green-800 dark:bg-green-400/10 dark:text-green-300",
  red: "bg-red-100 text-red-800 dark:bg-red-400/10 dark:text-red-300",
  sky: "bg-sky-50 text-sky-700 dark:bg-sky-400/10 dark:text-sky-300",
  slate: "bg-slate-100 text-slate-500 dark:bg-white/10 dark:text-slate-300",
  violet: "bg-violet-100 text-violet-800 dark:bg-violet-400/10 dark:text-violet-300",
};

/** Icon-disc stat tile used in the student schedule's KPI row. */
export function ScheduleKpiCard({ icon, tone, label, value }: ScheduleKpiCardProps) {
  return (
    <Card className="flex items-center gap-3 p-4">
      <span
        aria-hidden="true"
        className={`grid size-10 shrink-0 place-items-center rounded-full ${DISC_TONES[tone]}`}
      >
        {icon}
      </span>
      <span className="min-w-0">
        <span className="block font-body text-xs font-medium uppercase tracking-wider text-slate-400 dark:text-slate-500">
          {label}
        </span>
        <span className="mt-0.5 block truncate font-display text-lg tracking-wide text-navy-700 dark:text-white">
          {value}
        </span>
      </span>
    </Card>
  );
}
