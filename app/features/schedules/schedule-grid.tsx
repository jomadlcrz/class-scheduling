import { MapPinIcon, UserSmallIcon } from "~/components/ui/icons";
import { DAYS, DAY_LABELS, formatTime, type Day, type Schedule } from "~/types/schedule";
import { DAY_ACCENT } from "~/features/schedules/day-accent";
import { ModeBadge } from "~/features/schedules/mode-badge";

type ScheduleGridProps = {
  schedules: Schedule[];
};

const GRID_TEMPLATE = "5.75rem repeat(6, minmax(8.25rem, 1fr))";

/** Weekly timetable: a Time column plus one column per day, rows = unique time slots. */
export function ScheduleGrid({ schedules }: ScheduleGridProps) {
  // Unique {start,end} pairs, sorted chronologically, become the grid rows.
  const timeRows = [...new Map(schedules.map((s) => [`${s.startTime}|${s.endTime}`, s])).values()]
    .map((s) => ({ startTime: s.startTime, endTime: s.endTime }))
    .sort((a, b) => a.startTime.localeCompare(b.startTime) || a.endTime.localeCompare(b.endTime));

  return (
    <div className="scrollbar-thin overflow-x-auto rounded-xl border border-slate-200 bg-white/60 dark:border-white/10 dark:bg-white/5">
      <div className="min-w-4xl">
        {/* Header row */}
        <div
          className="grid border-b border-slate-200 bg-slate-50 dark:border-white/10 dark:bg-white/5"
          style={{ gridTemplateColumns: GRID_TEMPLATE }}
        >
          <HeaderCell>Time</HeaderCell>
          {DAYS.map((day) => (
            <HeaderCell key={day}>{DAY_LABELS[day]}</HeaderCell>
          ))}
        </div>

        {/* Body rows */}
        {timeRows.map((row) => (
          <div
            key={`${row.startTime}-${row.endTime}`}
            className="grid border-b border-slate-100 last:border-b-0 dark:border-white/5"
            style={{ gridTemplateColumns: GRID_TEMPLATE }}
          >
            <div className="flex flex-col items-center justify-center gap-0.5 border-r border-slate-100 px-2 py-3 text-center font-body text-xs font-semibold text-slate-600 dark:border-white/5 dark:text-slate-300">
              <span>{formatTime(row.startTime)}</span>
              <span className="text-slate-400 dark:text-slate-500">{formatTime(row.endTime)}</span>
            </div>

            {DAYS.map((day) => {
              const cellEntries = schedules.filter(
                (s) => s.day === day && s.startTime === row.startTime && s.endTime === row.endTime,
              );
              return (
                <div
                  key={day}
                  className="flex min-h-26 flex-col gap-1.5 border-r border-slate-100 p-1.5 last:border-r-0 dark:border-white/5"
                >
                  {cellEntries.map((entry) => (
                    <GridClassCard key={entry.id} entry={entry} />
                  ))}
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}

function HeaderCell({ children }: { children: React.ReactNode }) {
  return (
    <div className="border-r border-slate-200 px-2 py-2.5 text-center font-body text-[0.65rem] font-semibold uppercase tracking-wider text-slate-500 last:border-r-0 dark:border-white/10 dark:text-slate-400">
      {children}
    </div>
  );
}

function GridClassCard({ entry }: { entry: Schedule }) {
  const accent = DAY_ACCENT[entry.day as Day];
  return (
    <article
      className={`flex flex-col gap-1 rounded-lg border border-l-4 border-slate-200 p-2 dark:border-white/10 ${accent.borderL} ${accent.cardBg}`}
    >
      <div className="flex items-start justify-between gap-1.5">
        <strong className="font-body text-xs font-semibold text-navy-700 dark:text-white">
          {entry.subjectCode}
        </strong>
        <ModeBadge mode={entry.mode} />
      </div>
      <p className="font-body text-[0.7rem] leading-snug text-slate-600 dark:text-slate-300">
        {entry.subjectTitle}
      </p>
      <small className="flex items-center gap-1 font-body text-[0.68rem] text-slate-500 dark:text-slate-400">
        <UserSmallIcon />
        {entry.facultyName}
      </small>
      <small className="flex items-center gap-1 font-body text-[0.68rem] text-slate-500 dark:text-slate-400">
        <MapPinIcon />
        {entry.roomName}
      </small>
    </article>
  );
}
