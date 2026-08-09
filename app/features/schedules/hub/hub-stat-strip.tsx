import { Card } from "~/components/ui/card";
import type { StatusCounts } from "~/features/schedules/hub/scheduling-stages";

type Stat = { label: string; value: string; hint: string; tone: string };

/** Term-wide KPI cards for the scheduling hub — built, drafts, pending, published. Hue signals status. */
export function HubStatStrip({
  built,
  total,
  counts,
}: {
  built: number;
  total: number;
  counts: StatusCounts;
}) {
  const unscheduled = Math.max(total - built, 0);
  const stats: Stat[] = [
    {
      label: "Sections built",
      value: `${built} / ${total}`,
      hint: built < total ? `${unscheduled} still need a timetable` : "All sections built",
      tone: built < total ? "text-amber-700 dark:text-gold-300" : "text-emerald-700 dark:text-emerald-300",
    },
    {
      label: "Drafts",
      value: String(counts.draft + counts.rejected),
      hint: counts.rejected > 0 ? `${counts.rejected} returned by dean` : "Ready to submit",
      tone: counts.rejected > 0 ? "text-red-600 dark:text-red-300" : "text-navy-700 dark:text-mist-100",
    },
    {
      label: "Pending dean",
      value: String(counts.pending_approval),
      hint: "Awaiting approval",
      tone: counts.pending_approval > 0 ? "text-sky-700 dark:text-sky-300" : "text-slate-500 dark:text-slate-400",
    },
    {
      label: "Published",
      value: String(counts.approved),
      hint: "Live for instructors & students",
      tone: counts.approved > 0 ? "text-emerald-700 dark:text-emerald-300" : "text-slate-500 dark:text-slate-400",
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      {stats.map((stat) => (
        <Card key={stat.label} className="p-4">
          <p className="font-body text-xs uppercase tracking-wide text-slate-400 dark:text-slate-500">
            {stat.label}
          </p>
          <p className={`mt-1 font-display text-2xl leading-none tracking-wide tabular-nums ${stat.tone}`}>
            {stat.value}
          </p>
          <p className="mt-1 font-body text-xs text-slate-500 dark:text-slate-400">{stat.hint}</p>
        </Card>
      ))}
    </div>
  );
}
