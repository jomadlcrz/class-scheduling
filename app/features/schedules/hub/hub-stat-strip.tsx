import { StatCard } from "~/components/ui/stat-card";
import type { StatusCounts } from "~/features/schedules/hub/scheduling-stages";

type Stat = { label: string; value: string; hint: string; tone: string };

/** Term-wide stat cards for the scheduling hub — built, drafts, pending, published. Hue signals status. */
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
        <StatCard
          key={stat.label}
          label={stat.label}
          value={stat.value}
          hint={stat.hint}
          valueClassName={stat.tone}
        />
      ))}
    </div>
  );
}
