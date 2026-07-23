import { CopyIcon, EditIcon, MapPinIcon, TrashIcon, UserSmallIcon } from "~/components/ui/icons";
import { Popover } from "~/components/ui/popover";
import { useDays } from "~/hooks/use-days";
import { DAYS, formatTime, type Day, type Schedule } from "~/types/schedule";
import { DAY_ACCENT } from "~/features/schedules/day-accent";
import { ModeBadge } from "~/features/schedules/mode-badge";

type ScheduleGridProps = {
  schedules: Schedule[];
  onEdit?: (schedule: Schedule) => void;
  onDelete?: (schedule: Schedule) => void;
  onDuplicate?: (schedule: Schedule, day: Day) => void;
  /** Show the Set (Section) label in each grid card. */
  showSet?: boolean;
};

const GRID_TEMPLATE = "5.75rem repeat(6, minmax(8.25rem, 1fr))";
const actionBtn =
  "grid size-6 cursor-pointer place-items-center rounded-md text-slate-400 transition-colors duration-150 hover:bg-slate-200/60 hover:text-navy-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-400 dark:text-slate-500 dark:hover:bg-white/10 dark:hover:text-white";

export function ScheduleGrid({ schedules, onEdit, onDelete, onDuplicate, showSet }: ScheduleGridProps) {
  const { dayLabels } = useDays();
  const timeRows = [...new Map(schedules.map((s) => [`${s.startTime}|${s.endTime}`, s])).values()]
    .map((s) => ({ startTime: s.startTime, endTime: s.endTime }))
    .sort((a, b) => a.startTime.localeCompare(b.startTime) || a.endTime.localeCompare(b.endTime));

  // Days the same subject isn't already scheduled on (excluding its current day).
  function availableDays(sched: Schedule): Day[] {
    const occupied = new Set(
      schedules.filter((s) => s.subjectId === sched.subjectId).map((s) => s.day),
    );
    return DAYS.filter((d) => d !== sched.day && !occupied.has(d));
  }

  const showActions = Boolean(onEdit || onDelete || onDuplicate);

  return (
    <div className="scrollbar-thin overflow-x-auto rounded-xl border border-slate-300 bg-white dark:border-white/10 dark:bg-white/5">
      <div className="min-w-4xl">
        {/* Header row */}
        <div
          className="grid border-b-2 border-slate-200 bg-slate-50 dark:border-white/10 dark:bg-surface-raised"
          style={{ gridTemplateColumns: GRID_TEMPLATE }}
        >
          <HeaderCell>Time</HeaderCell>
          {DAYS.map((day) => (
            <HeaderCell key={day}>{dayLabels[day]}</HeaderCell>
          ))}
        </div>

        {/* Body rows */}
        {timeRows.map((row) => (
          <div
            key={`${row.startTime}-${row.endTime}`}
            className="grid"
            style={{ gridTemplateColumns: GRID_TEMPLATE }}
          >
            <div className="flex flex-col items-center justify-center gap-0.5 border-b border-r border-slate-200 p-2 text-center font-body text-xs font-semibold text-slate-600 dark:border-white/8 dark:text-slate-300">
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
                  className="flex min-h-26 flex-col gap-1.5 border-b border-r border-slate-200 p-2 last:border-r-0 dark:border-white/8"
                >
                  {cellEntries.map((entry) => (
                    <GridClassCard
                      key={entry.id}
                      entry={entry}
                      dayLabels={dayLabels}
                      onEdit={onEdit}
                      onDelete={onDelete}
                      onDuplicate={onDuplicate}
                      availableDays={availableDays(entry)}
                      showActions={showActions}
                      showSet={showSet}
                    />
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
    <div className="border-r border-slate-200 px-2 py-2 text-center font-body text-[0.65rem] font-bold uppercase tracking-wider text-slate-500 last:border-r-0 dark:border-white/10 dark:text-slate-400">
      {children}
    </div>
  );
}

function GridClassCard({
  entry,
  dayLabels,
  onEdit,
  onDelete,
  onDuplicate,
  availableDays,
  showActions,
  showSet,
}: {
  entry: Schedule;
  dayLabels: Record<Day, string>;
  onEdit?: (schedule: Schedule) => void;
  onDelete?: (schedule: Schedule) => void;
  onDuplicate?: (schedule: Schedule, day: Day) => void;
  availableDays: Day[];
  showActions: boolean;
  showSet?: boolean;
}) {
  const accent = DAY_ACCENT[entry.day as Day];
  return (
    <article
      className={`flex flex-col gap-1 rounded-lg border border-l-4 border-slate-300 p-2 dark:border-white/10 ${accent.borderL} ${accent.cardBg}`}
    >
      <div className="flex items-start justify-between gap-1.5">
        <strong className="font-body text-xs font-semibold text-navy-700 dark:text-mist-100">
          {entry.subjectCode}
        </strong>
        <ModeBadge mode={entry.mode} />
      </div>
      <p className="font-body text-[0.7rem] leading-snug text-slate-600 dark:text-slate-300">
        {entry.subjectTitle}
      </p>
      {showSet && (
        <small className="font-body text-[0.68rem] text-slate-500 dark:text-slate-400">
          {entry.setCode}
        </small>
      )}
      <small className="flex items-center gap-1 font-body text-[0.68rem] text-slate-500 dark:text-slate-400">
        <UserSmallIcon />
        {entry.facultyName}
      </small>
      <small className="flex items-center gap-1 font-body text-[0.68rem] text-slate-500 dark:text-slate-400">
        <MapPinIcon />
        {entry.roomName}
      </small>
      {showActions && (
        <div className="mt-0.5 flex items-center justify-end gap-0.5 border-t border-slate-200 pt-1 dark:border-white/8">
          {onDuplicate && (
            <Popover
              label="Duplicate to another day"
              triggerClassName={actionBtn}
              trigger={<CopyIcon />}
              className="w-44"
            >
              {(close) => (
                <>
                  <p className="px-3 py-1 font-body text-[0.65rem] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                    Duplicate to
                  </p>
                  {availableDays.length === 0 ? (
                    <p className="px-3 py-1.5 font-body text-xs text-slate-400 dark:text-slate-500">
                      Already on every day
                    </p>
                  ) : (
                    availableDays.map((d) => (
                      <button
                        key={d}
                        type="button"
                        role="menuitem"
                        onClick={() => {
                          close();
                          onDuplicate(entry, d);
                        }}
                        className="flex w-full cursor-pointer items-center px-3 py-1.5 text-left font-body text-sm text-slate-600 transition-colors duration-150 hover:bg-slate-100 hover:text-navy-700 focus-visible:bg-slate-100 focus-visible:outline-none dark:text-slate-300 dark:hover:bg-white/5 dark:hover:text-white"
                      >
                        {dayLabels[d]}
                      </button>
                    ))
                  )}
                </>
              )}
            </Popover>
          )}
          {onEdit && (
            <button
              type="button"
              onClick={() => onEdit(entry)}
              aria-label={`Edit ${entry.subjectCode} ${entry.setCode}`}
              title="Edit"
              className={actionBtn}
            >
              <EditIcon />
            </button>
          )}
          {onDelete && (
            <button
              type="button"
              onClick={() => onDelete(entry)}
              aria-label={`Delete ${entry.subjectCode} ${entry.setCode}`}
              title="Delete"
              className={actionBtn}
            >
              <TrashIcon />
            </button>
          )}
        </div>
      )}
    </article>
  );
}
