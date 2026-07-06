import { Link } from "react-router";
import { Badge } from "../../components/ui/badge";
import { EmptyState } from "../../components/ui/empty-state";
import type { Conflict } from "../../services/conflict.service";

type FacultyConflictsProps = {
  conflicts: Conflict[];
};

export function FacultyConflicts({ conflicts }: FacultyConflictsProps) {
  const facultyConflicts = conflicts.filter((c) => c.type === "faculty");

  if (facultyConflicts.length === 0) {
    return <EmptyState title="No faculty conflicts">All faculty schedules are clear.</EmptyState>;
  }

  return (
    <div className="flex flex-col gap-3">
      {facultyConflicts.map((c) => (
        <ConflictCard key={c.id} conflict={c} highlightLabel="Faculty" />
      ))}
    </div>
  );
}

export function ConflictCard({
  conflict,
  highlightLabel,
}: {
  conflict: Conflict;
  highlightLabel: string;
}) {
  const { scheduleA: a, scheduleB: b } = conflict;

  return (
    <div className="rounded-xl border border-red-200 bg-red-50 p-4 dark:border-red-500/20 dark:bg-red-500/10">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <p className="font-body text-sm font-semibold text-red-700 dark:text-red-300">
            {highlightLabel}: {conflict.label}
          </p>
          <p className="mt-0.5 font-body text-xs text-red-600 dark:text-red-400">
            {conflict.description}
          </p>
        </div>
        <Badge tone="red">Conflict</Badge>
      </div>

      <div className="mt-3 grid gap-2 sm:grid-cols-2">
        <ScheduleChip schedule={a} />
        <ScheduleChip schedule={b} />
      </div>
    </div>
  );
}

function ScheduleChip({ schedule: s }: { schedule: Conflict["scheduleA"] }) {
  return (
    <Link
      to="/schedules"
      className="rounded-lg border border-red-200 bg-white p-3 transition-colors hover:border-red-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-400 dark:border-red-500/20 dark:bg-white/5 dark:hover:border-red-400/30"
    >
      <p className="font-body text-xs font-semibold text-navy-700 dark:text-white">
        {s.subjectCode}
      </p>
      <p className="font-body text-xs text-slate-500 dark:text-slate-400">{s.subjectTitle}</p>
      <p className="mt-1 font-body text-xs text-slate-400 dark:text-slate-500">
        {s.day} · {s.startTime}–{s.endTime}
      </p>
    </Link>
  );
}
