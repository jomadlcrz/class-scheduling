import { CopyIcon, EditIcon, MapPinIcon, TrashIcon, UserSmallIcon } from "~/components/ui/icons";
import { Popover } from "~/components/ui/popover";
import { DAYS, DAY_LABELS, formatTime, type Day, type Schedule } from "~/types/schedule";
import { DAY_ACCENT } from "~/features/schedules/day-accent";
import { ModeBadge } from "~/features/schedules/mode-badge";

type ScheduleTableProps = {
  schedules: Schedule[];
  /** Omit all handlers to render a read-only table (no actions column). */
  onEdit?: (schedule: Schedule) => void;
  onDelete?: (schedule: Schedule) => void;
  /** Called with the chosen target day from the duplicate popover. */
  onDuplicate?: (schedule: Schedule, day: Day) => void;
};

const actionBtn =
  "grid size-7 cursor-pointer place-items-center rounded-lg text-slate-400 transition-colors duration-150 hover:bg-slate-200/60 hover:text-navy-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-400 dark:text-slate-500 dark:hover:bg-white/10 dark:hover:text-white";

const th =
  "px-3 py-2.5 font-body text-[0.65rem] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400";

/** Schedule table: stacked cards on mobile, a single grouped table on sm and up. */
export function ScheduleTable({ schedules, onEdit, onDelete, onDuplicate }: ScheduleTableProps) {
  const showActions = Boolean(onEdit || onDelete || onDuplicate);

  // Days the same subject isn't already scheduled on (excluding its current day).
  function availableDays(sched: Schedule): Day[] {
    const occupied = new Set(
      schedules.filter((s) => s.subjectId === sched.subjectId).map((s) => s.day),
    );
    return DAYS.filter((d) => d !== sched.day && !occupied.has(d));
  }

  const groups = DAYS.map((day) => ({
    day,
    slots: schedules
      .filter((s) => s.day === day)
      .sort((a, b) => a.startTime.localeCompare(b.startTime)),
  })).filter((g) => g.slots.length > 0);

  return (
    <>
      {/* Mobile: stacked cards grouped by day */}
      <div className="flex flex-col gap-3 sm:hidden">
        {groups.map(({ day, slots }) => (
          <MobileDayCard
            key={day}
            day={day}
            slots={slots}
            onEdit={onEdit}
            onDelete={onDelete}
            onDuplicate={onDuplicate}
            availableDays={availableDays}
          />
        ))}
      </div>

      {/* sm+: single grouped table (scrolls horizontally if cramped) */}
      <div className="scrollbar-thin hidden overflow-x-auto rounded-xl border border-slate-200 bg-white/60 sm:block dark:border-white/10 dark:bg-white/5">
        <table className="w-full min-w-176 border-collapse text-left font-body text-sm">
          <thead className="border-b border-slate-200 bg-slate-50 dark:border-white/10 dark:bg-white/5">
            <tr>
              <th className={`${th} text-center`}>Day</th>
              <th className={`${th} whitespace-nowrap`}>Time</th>
              <th className={`${th} text-center`}>Subject Code</th>
              <th className={th}>Descriptive Title</th>
              <th className={`${th} text-center`}>Mode</th>
              <th className={th}>Instructor</th>
              <th className={`${th} text-center`}>Room</th>
              {showActions && (
                <th className={th}>
                  <span className="sr-only">Actions</span>
                </th>
              )}
            </tr>
          </thead>
          <tbody>
            {groups.map(({ day, slots }) => {
              const accent = DAY_ACCENT[day];
              return slots.map((sched, i) => (
                <tr
                  key={sched.id}
                  className={`group transition-colors duration-150 hover:bg-slate-50 dark:hover:bg-white/5 ${
                    i === 0 ? `border-t-2 ${accent.topBorder}` : "border-t border-slate-100 dark:border-white/5"
                  }`}
                >
                  {i === 0 && (
                    <td
                      rowSpan={slots.length}
                      className={`whitespace-nowrap px-3 py-2.5 text-center align-middle font-body text-xs font-semibold ${accent.cellBg} ${accent.text}`}
                    >
                      {DAY_LABELS[day]}
                    </td>
                  )}
                  <td className="whitespace-nowrap px-3 py-2.5 text-center text-slate-600 dark:text-slate-300">
                    {formatTime(sched.startTime)} – {formatTime(sched.endTime)}
                  </td>
                  <td className="px-3 py-2.5 text-center font-semibold text-navy-700 dark:text-white">
                    {sched.subjectCode}
                  </td>
                  <td className="px-3 py-2.5 text-slate-600 dark:text-slate-300">
                    {sched.subjectTitle}
                  </td>
                  <td className="px-3 py-2.5 text-center">
                    <ModeBadge mode={sched.mode} />
                  </td>
                  <td className="whitespace-nowrap px-3 py-2.5 text-slate-700 dark:text-slate-300">
                    {sched.facultyName}
                  </td>
                  <td className="whitespace-nowrap px-3 py-2.5 text-center text-slate-600 dark:text-slate-300">
                    {sched.roomName}
                  </td>
                  {showActions && (
                    <td className="px-3 py-2.5">
                      <div className="flex justify-end gap-1 opacity-0 transition-opacity duration-150 group-hover:opacity-100 focus-within:opacity-100">
                        {onDuplicate && (
                          <DuplicateButton
                            days={availableDays(sched)}
                            onPick={(d) => onDuplicate(sched, d)}
                          />
                        )}
                        {onEdit && (
                          <button
                            type="button"
                            onClick={() => onEdit(sched)}
                            aria-label={`Edit ${sched.subjectCode} ${sched.setCode}`}
                            title="Edit"
                            className={actionBtn}
                          >
                            <EditIcon />
                          </button>
                        )}
                        {onDelete && (
                          <button
                            type="button"
                            onClick={() => onDelete(sched)}
                            aria-label={`Delete ${sched.subjectCode} ${sched.setCode}`}
                            title="Delete"
                            className={actionBtn}
                          >
                            <TrashIcon />
                          </button>
                        )}
                      </div>
                    </td>
                  )}
                </tr>
              ));
            })}
          </tbody>
        </table>
      </div>
    </>
  );
}

function MobileDayCard({
  day,
  slots,
  onEdit,
  onDelete,
  onDuplicate,
  availableDays,
}: {
  day: Day;
  slots: Schedule[];
  onEdit?: (schedule: Schedule) => void;
  onDelete?: (schedule: Schedule) => void;
  onDuplicate?: (schedule: Schedule, day: Day) => void;
  availableDays: (schedule: Schedule) => Day[];
}) {
  const accent = DAY_ACCENT[day];
  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white/60 dark:border-white/10 dark:bg-white/5">
      <div
        className={`border-l-4 px-4 py-2 font-body text-sm font-semibold ${accent.borderL} ${accent.cellBg} ${accent.text}`}
      >
        {DAY_LABELS[day]}
      </div>
      <ul className="divide-y divide-slate-100 dark:divide-white/5">
        {slots.map((sched) => (
          <li key={sched.id} className="flex flex-col gap-1.5 p-3">
            <div className="flex items-center justify-between gap-2">
              <span className="whitespace-nowrap font-body text-xs text-slate-600 dark:text-slate-300">
                {formatTime(sched.startTime)} – {formatTime(sched.endTime)}
              </span>
              <div className="flex items-center gap-1.5">
                <ModeBadge mode={sched.mode} />
                {onDuplicate && (
                  <DuplicateButton
                    days={availableDays(sched)}
                    onPick={(d) => onDuplicate(sched, d)}
                  />
                )}
                {onEdit && (
                  <button
                    type="button"
                    onClick={() => onEdit(sched)}
                    aria-label={`Edit ${sched.subjectCode} ${sched.setCode}`}
                    title="Edit"
                    className={actionBtn}
                  >
                    <EditIcon />
                  </button>
                )}
                {onDelete && (
                  <button
                    type="button"
                    onClick={() => onDelete(sched)}
                    aria-label={`Delete ${sched.subjectCode} ${sched.setCode}`}
                    title="Delete"
                    className={actionBtn}
                  >
                    <TrashIcon />
                  </button>
                )}
              </div>
            </div>
            <div className="flex flex-wrap items-baseline gap-x-2">
              <span className="font-body text-sm font-semibold text-navy-700 dark:text-white">
                {sched.subjectCode}
              </span>
              <span className="font-body text-xs text-slate-600 dark:text-slate-300">
                {sched.subjectTitle}
              </span>
            </div>
            <div className="flex flex-col gap-1 font-body text-xs text-slate-500 dark:text-slate-400">
              <span className="flex items-center gap-1.5">
                <UserSmallIcon />
                {sched.facultyName}
              </span>
              <span className="flex items-center gap-1.5">
                <MapPinIcon />
                {sched.roomName}
              </span>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

/** Copy action that opens an anchored popover to pick the target day. */
function DuplicateButton({ days, onPick }: { days: Day[]; onPick: (day: Day) => void }) {
  return (
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
          {days.length === 0 ? (
            <p className="px-3 py-1.5 font-body text-xs text-slate-400 dark:text-slate-500">
              Already on every day
            </p>
          ) : (
            days.map((d) => (
              <button
                key={d}
                type="button"
                role="menuitem"
                onClick={() => {
                  close();
                  onPick(d);
                }}
                className="flex w-full cursor-pointer items-center px-3 py-1.5 text-left font-body text-sm text-slate-600 transition-colors duration-150 hover:bg-slate-100 hover:text-navy-700 focus-visible:bg-slate-100 focus-visible:outline-none dark:text-slate-300 dark:hover:bg-white/5 dark:hover:text-white"
              >
                {DAY_LABELS[d]}
              </button>
            ))
          )}
        </>
      )}
    </Popover>
  );
}
