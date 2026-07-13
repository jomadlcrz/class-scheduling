import { Card } from "~/components/ui/card";
import { useDays } from "~/hooks/use-days";
import type { ScheduleSummary } from "~/services/report.service";
import { DAYS } from "~/types/schedule";

export function ScheduleReport({ data }: { data: ScheduleSummary }) {
  const { dayLabels } = useDays();
  const programEntries = Object.entries(data.byProgram).sort((a, b) => b[1] - a[1]);
  const maxProgram = Math.max(...programEntries.map(([, n]) => n), 1);

  return (
    <div className="flex flex-col gap-6">
      <Card className="p-5">
        <p className="font-body text-xs uppercase tracking-wider text-slate-400 dark:text-slate-500">
          Total Schedules
        </p>
        <p className="mt-1 font-display text-4xl font-bold text-navy-700 dark:text-white">
          {data.totalSchedules}
        </p>
      </Card>

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="p-5">
          <h3 className="mb-4 font-body text-sm font-semibold text-slate-700 dark:text-slate-200">
            By Program
          </h3>
          {programEntries.length === 0 ? (
            <p className="font-body text-sm text-slate-400">No data.</p>
          ) : (
            <ul className="flex flex-col gap-3">
              {programEntries.map(([program, count]) => (
                <li key={program}>
                  <div className="mb-1 flex items-center justify-between">
                    <span className="font-body text-sm text-slate-700 dark:text-slate-300">
                      {program}
                    </span>
                    <span className="font-body text-sm font-medium text-navy-700 dark:text-white">
                      {count}
                    </span>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-white/10">
                    <div
                      className="h-2 rounded-full bg-navy-700 dark:bg-gold-400"
                      style={{ width: `${(count / maxProgram) * 100}%` }}
                    />
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card className="p-5">
          <h3 className="mb-4 font-body text-sm font-semibold text-slate-700 dark:text-slate-200">
            By Day
          </h3>
          {Object.keys(data.byDay).length === 0 ? (
            <p className="font-body text-sm text-slate-400">No data.</p>
          ) : (
            <ul className="flex flex-col gap-3">
              {DAYS.filter((d) => data.byDay[d]).map((day) => {
                const count = data.byDay[day] ?? 0;
                const maxDay = Math.max(...Object.values(data.byDay), 1);
                return (
                  <li key={day}>
                    <div className="mb-1 flex items-center justify-between">
                      <span className="font-body text-sm text-slate-700 dark:text-slate-300">
                        {dayLabels[day]}
                      </span>
                      <span className="font-body text-sm font-medium text-navy-700 dark:text-white">
                        {count}
                      </span>
                    </div>
                    <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-white/10">
                      <div
                        className="h-2 rounded-full bg-gold-500 dark:bg-gold-400"
                        style={{ width: `${(count / maxDay) * 100}%` }}
                      />
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </Card>
      </div>
    </div>
  );
}
