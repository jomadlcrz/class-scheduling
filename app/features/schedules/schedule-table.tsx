import { Badge } from "../../components/ui/badge";
import { EditIcon, TrashIcon } from "../../components/ui/icons";
import { getBuildingTone } from "../../types/building";
import { getProgramTone, type Program } from "../../types/program";
import { DAY_LABELS, DAYS, formatTime, type Day, type Schedule } from "../../types/schedule";
import { YEAR_LEVEL_LABELS } from "../../types/subject";

type ScheduleTableProps = {
  schedules: Schedule[];
  programs: Program[];
  onEdit: (schedule: Schedule) => void;
  onDelete: (schedule: Schedule) => void;
};

const DAY_ACCENT: Record<Day, { border: string; bg: string; text: string }> = {
  M:  { border: "border-l-navy-500",   bg: "bg-navy-50 dark:bg-navy-900/30",     text: "text-navy-700 dark:text-navy-300"     },
  T:  { border: "border-l-emerald-500", bg: "bg-emerald-50 dark:bg-emerald-900/20", text: "text-emerald-700 dark:text-emerald-400" },
  W:  { border: "border-l-amber-500",  bg: "bg-amber-50 dark:bg-amber-900/20",   text: "text-amber-700 dark:text-amber-400"   },
  Th: { border: "border-l-sky-500",    bg: "bg-sky-50 dark:bg-sky-900/20",       text: "text-sky-700 dark:text-sky-400"       },
  F:  { border: "border-l-rose-500",   bg: "bg-rose-50 dark:bg-rose-900/20",     text: "text-rose-700 dark:text-rose-400"     },
  S:  { border: "border-l-slate-400",  bg: "bg-slate-50 dark:bg-slate-800/40",   text: "text-slate-600 dark:text-slate-400"   },
};

const actionBtn =
  "grid size-8 cursor-pointer place-items-center rounded-lg text-slate-400 transition-colors duration-150 hover:bg-slate-200/60 hover:text-navy-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-400 dark:text-slate-500 dark:hover:bg-white/10 dark:hover:text-white";

export function ScheduleTable({ schedules, programs, onEdit, onDelete }: ScheduleTableProps) {
  // Group by day, preserving canonical day order.
  const groups = DAYS.map((day) => ({
    day,
    slots: schedules
      .filter((s) => s.day === day)
      .sort((a, b) => a.startTime.localeCompare(b.startTime)),
  })).filter((g) => g.slots.length > 0);

  if (groups.length === 0) return null;

  return (
    <div className="flex flex-col gap-3">
      {groups.map(({ day, slots }) => {
        const accent = DAY_ACCENT[day];
        return (
          <div
            key={day}
            className="overflow-hidden rounded-xl border border-slate-200 bg-white/60 dark:border-white/10 dark:bg-white/5"
          >
            {/* Day header */}
            <div
              className={`flex items-center gap-3 border-l-4 px-4 py-2.5 ${accent.border} ${accent.bg}`}
            >
              <span className={`font-display text-sm font-semibold tracking-wide ${accent.text}`}>
                {DAY_LABELS[day]}
              </span>
              <span className="text-xs text-slate-400 dark:text-slate-500">
                {slots.length} slot{slots.length !== 1 ? "s" : ""}
              </span>
            </div>

            {/* Slots */}
            <div className="scrollbar-thin overflow-x-auto">
              <table className="w-full text-left font-sans text-sm">
                <thead className="border-b border-slate-100 dark:border-white/5">
                  <tr>
                    <th className="px-4 py-2 text-xs font-medium uppercase tracking-wider text-slate-400 dark:text-slate-500">
                      Time
                    </th>
                    <th className="px-4 py-2 text-xs font-medium uppercase tracking-wider text-slate-400 dark:text-slate-500">
                      Subject
                    </th>
                    <th className="hidden px-4 py-2 text-xs font-medium uppercase tracking-wider text-slate-400 dark:text-slate-500 sm:table-cell">
                      Set
                    </th>
                    <th className="hidden px-4 py-2 text-xs font-medium uppercase tracking-wider text-slate-400 dark:text-slate-500 md:table-cell">
                      Faculty
                    </th>
                    <th className="hidden px-4 py-2 text-xs font-medium uppercase tracking-wider text-slate-400 dark:text-slate-500 sm:table-cell">
                      Room
                    </th>
                    <th className="px-4 py-2">
                      <span className="sr-only">Actions</span>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                  {slots.map((sched) => (
                    <tr
                      key={sched.id}
                      className="transition-colors duration-150 hover:bg-slate-50 dark:hover:bg-white/5"
                    >
                      <td className="whitespace-nowrap px-4 py-3 text-slate-600 dark:text-slate-300">
                        {formatTime(sched.startTime)} – {formatTime(sched.endTime)}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-col gap-0.5">
                          <span className="font-medium text-navy-700 dark:text-white">
                            {sched.subjectCode}
                          </span>
                          <span className="hidden text-xs text-slate-500 dark:text-slate-400 sm:block">
                            {sched.subjectTitle}
                          </span>
                        </div>
                      </td>
                      <td className="hidden px-4 py-3 sm:table-cell">
                        <div className="flex items-center gap-1.5">
                          <Badge tone={getProgramTone(sched.program, programs)}>
                            {sched.program}
                          </Badge>
                          <span className="text-xs text-slate-600 dark:text-slate-300">
                            {YEAR_LEVEL_LABELS[sched.yearLevel as 1]} · {sched.setCode}
                          </span>
                        </div>
                      </td>
                      <td className="hidden px-4 py-3 text-slate-700 dark:text-slate-300 md:table-cell">
                        {sched.facultyName}
                      </td>
                      <td className="hidden px-4 py-3 sm:table-cell">
                        <div className="flex items-center gap-1.5">
                          <Badge tone={getBuildingTone(sched.buildingCode)}>
                            {sched.buildingCode}
                          </Badge>
                          <span className="text-slate-600 dark:text-slate-300">{sched.roomName}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex justify-end gap-1">
                          <button
                            type="button"
                            onClick={() => onEdit(sched)}
                            aria-label={`Edit ${sched.subjectCode} ${sched.setCode}`}
                            title="Edit"
                            className={actionBtn}
                          >
                            <EditIcon />
                          </button>
                          <button
                            type="button"
                            onClick={() => onDelete(sched)}
                            aria-label={`Delete ${sched.subjectCode} ${sched.setCode}`}
                            title="Delete"
                            className={actionBtn}
                          >
                            <TrashIcon />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        );
      })}
    </div>
  );
}
