import { Card } from "~/components/ui/card";
import type { EnrollmentStats } from "~/services/report.service";
import { useYearLevels } from "~/hooks/use-year-levels";

export function EnrollmentReport({ data }: { data: EnrollmentStats }) {
  const { yearLevelLabel } = useYearLevels();
  const programEntries = Object.entries(data.byProgram).sort((a, b) => b[1] - a[1]);
  const yearEntries = Object.entries(data.byYearLevel)
    .sort(([a], [b]) => Number(a) - Number(b));
  const maxProgram = Math.max(...programEntries.map(([, n]) => n), 1);

  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatCard label="Total Students" value={data.total} />
        <StatCard label="Enrolled" value={data.enrolled} accent />
        <StatCard
          label="Inactive"
          value={data.total - data.enrolled}
        />
        <StatCard label="Programs" value={programEntries.length} />
      </div>

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
                    <span className="font-body text-sm font-medium text-navy-700 dark:text-mist-100">
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
            By Year Level
          </h3>
          {yearEntries.length === 0 ? (
            <p className="font-body text-sm text-slate-400">No data.</p>
          ) : (
            <ul className="flex flex-col gap-3">
              {yearEntries.map(([year, count]) => {
                const maxYear = Math.max(...yearEntries.map(([, n]) => n), 1);
                return (
                  <li key={year}>
                    <div className="mb-1 flex items-center justify-between">
                      <span className="font-body text-sm text-slate-700 dark:text-slate-300">
                        {yearLevelLabel(Number(year))}
                      </span>
                      <span className="font-body text-sm font-medium text-navy-700 dark:text-mist-100">
                        {count}
                      </span>
                    </div>
                    <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-white/10">
                      <div
                        className="h-2 rounded-full bg-gold-500 dark:bg-gold-400"
                        style={{ width: `${(count / maxYear) * 100}%` }}
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

function StatCard({
  label,
  value,
  accent = false,
}: {
  label: string;
  value: number;
  accent?: boolean;
}) {
  return (
    <Card className="p-4">
      <p className="font-body text-xs uppercase tracking-wider text-slate-400 dark:text-slate-500">
        {label}
      </p>
      <p
        className={`mt-1 font-display text-3xl font-bold ${
          accent ? "text-navy-700 dark:text-gold-400" : "text-slate-800 dark:text-mist-100"
        }`}
      >
        {value}
      </p>
    </Card>
  );
}
