import type { Student } from "../../types/student";

type EnrollmentSummaryProps = {
  students: Student[];
};

export function EnrollmentSummary({ students }: EnrollmentSummaryProps) {
  const total = students.length;
  const enrolled = students.filter((s) => s.status === "enrolled").length;
  const inactive = students.filter((s) => s.status === "inactive").length;
  const graduated = students.filter((s) => s.status === "graduated").length;

  const byProgram = students.reduce<Record<string, number>>((acc, s) => {
    acc[s.program] = (acc[s.program] ?? 0) + 1;
    return acc;
  }, {});

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <StatCard label="Total Students" value={total} color="text-navy-700 dark:text-white" />
      <StatCard label="Enrolled" value={enrolled} color="text-emerald-600 dark:text-emerald-400" />
      <StatCard label="Inactive" value={inactive} color="text-slate-500 dark:text-slate-400" />
      <StatCard label="Graduated" value={graduated} color="text-sky-600 dark:text-sky-400" />

      {Object.entries(byProgram).length > 0 && (
        <div className="col-span-full rounded-xl border border-slate-200 bg-white p-4 dark:border-white/10 dark:bg-white/3">
          <p className="font-body text-xs font-medium uppercase tracking-wider text-slate-400 dark:text-slate-500">
            By Program
          </p>
          <div className="mt-3 flex flex-wrap gap-3">
            {Object.entries(byProgram)
              .sort(([, a], [, b]) => b - a)
              .map(([code, count]) => (
                <div key={code} className="flex items-baseline gap-1.5">
                  <span className="font-body text-sm font-semibold text-navy-700 dark:text-white">
                    {count}
                  </span>
                  <span className="font-body text-xs text-slate-400 dark:text-slate-500">
                    {code}
                  </span>
                </div>
              ))}
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 dark:border-white/10 dark:bg-white/3">
      <p className="font-body text-xs font-medium uppercase tracking-wider text-slate-400 dark:text-slate-500">
        {label}
      </p>
      <p className={`mt-1 font-display text-3xl tracking-wide ${color}`}>{value}</p>
    </div>
  );
}
