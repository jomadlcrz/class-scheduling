import { useMemo, useState } from "react";
import { Card } from "~/components/ui/card";
import {
  CalendarIcon,
  ClockIcon,
  MapPinIcon,
  UserSmallIcon,
} from "~/components/ui/icons";
import { SectionHeader } from "~/components/ui/section-header";
import { formatTime, type Day, type Schedule } from "~/types/schedule";

type MobileWeeklyScheduleProps = {
  schedules: Schedule[];
  /** Hide the instructor name (for the instructor's own view). */
  hideInstructor?: boolean;
  /** Show the Set column; defaults to true. */
  showSet?: boolean;
};

const DAY_LABELS: { day: Day; short: string; full: string }[] = [
  { day: "M", short: "Mon", full: "Monday" },
  { day: "T", short: "Tue", full: "Tuesday" },
  { day: "W", short: "Wed", full: "Wednesday" },
  { day: "Th", short: "Thu", full: "Thursday" },
  { day: "F", short: "Fri", full: "Friday" },
  { day: "S", short: "Sat", full: "Saturday" },
];

function getInitialDay(): Day {
  const jsDay = new Date().getDay(); // 0 is Sun, 1 is Mon, 6 is Sat
  if (jsDay === 1) return "M";
  if (jsDay === 2) return "T";
  if (jsDay === 3) return "W";
  if (jsDay === 4) return "Th";
  if (jsDay === 5) return "F";
  if (jsDay === 6) return "S";
  return "M"; // default to Monday on Sunday
}

export function MobileWeeklySchedule({
  schedules,
  hideInstructor,
  showSet = true,
}: MobileWeeklyScheduleProps) {
  const [selectedDay, setSelectedDay] = useState<Day>(getInitialDay);

  // Count classes per day
  const dayCounts = useMemo(() => {
    const counts: Partial<Record<Day, number>> = {};
    for (const item of schedules) {
      if (item.day) {
        counts[item.day] = (counts[item.day] ?? 0) + 1;
      }
    }
    return counts;
  }, [schedules]);

  // Filter & sort classes for selected day
  const activeClasses = useMemo(() => {
    return schedules
      .filter((s) => s.day === selectedDay)
      .sort((a, b) => a.startTime.localeCompare(b.startTime));
  }, [schedules, selectedDay]);

  const selectedDayLabel =
    DAY_LABELS.find((d) => d.day === selectedDay)?.full ?? "Selected Day";

  return (
    <div className="flex flex-col gap-4">
      {/* Horizontal Day Tab Bar */}
      <div>
        <SectionHeader title="Weekly Days" />

        <div className="flex gap-1.5 overflow-x-auto pb-1 no-scrollbar">
          {DAY_LABELS.map(({ day, short }) => {
            const isSelected = selectedDay === day;
            const count = dayCounts[day] ?? 0;

            return (
              <button
                key={day}
                type="button"
                onClick={() => setSelectedDay(day)}
                className={`relative flex flex-1 min-w-13 cursor-pointer flex-col items-center justify-center rounded-xl py-2 px-1 text-center transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-400 ${
                  isSelected
                    ? "bg-gwc-blue text-white shadow-xs dark:bg-gwc-blue-bright"
                    : "border border-slate-200/80 bg-white text-slate-600 hover:border-slate-300 dark:border-white/10 dark:bg-surface dark:text-slate-300 dark:hover:border-white/20"
                }`}
              >
                <span className={`text-[11px] font-bold ${isSelected ? "text-white" : "text-slate-800 dark:text-slate-200"}`}>
                  {short}
                </span>
                <span
                  className={`mt-1 flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[10px] font-extrabold ${
                    isSelected
                      ? "bg-white/20 text-white"
                      : count > 0
                        ? "bg-blue-50 text-gwc-blue dark:bg-gwc-blue-deep/60 dark:text-gwc-blue-soft"
                        : "text-slate-400 dark:text-slate-500"
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Classes for Selected Day */}
      <div className="flex flex-col gap-3">
        {activeClasses.length === 0 ? (
          <Card className="flex flex-col items-center justify-center p-8 text-center">
            <div className="flex size-10 items-center justify-center rounded-full bg-slate-100 text-slate-500 dark:bg-surface-raised dark:text-slate-400">
              <CalendarIcon />
            </div>
            <p className="mt-3 text-sm font-semibold text-slate-800 dark:text-slate-200">
              No classes scheduled
            </p>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              You have no class meetings on {selectedDayLabel}.
            </p>
          </Card>
        ) : (
          activeClasses.map((item) => {
            const room = item.roomName || "TBA";
            const instructor = item.facultyName || "TBA";
            const timeStr = `${formatTime(item.startTime)} – ${formatTime(item.endTime)}`;

            return (
              <div
                key={item.id}
                className="overflow-hidden rounded-2xl border border-slate-200 bg-white p-4 shadow-xs transition-shadow hover:shadow-sm dark:border-surface-overlay dark:bg-surface"
              >
                {/* Time & Badges */}
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-gwc-blue dark:text-gwc-blue-bright">
                    <ClockIcon size={13} className="text-slate-400 dark:text-slate-500 shrink-0" />
                    <span>{timeStr}</span>
                  </div>

                  <div className="flex items-center gap-1">
                    {item.sessionMode && (
                      <span
                        className={`rounded-md px-1.5 py-0.5 text-[10px] font-extrabold uppercase ${
                          item.sessionMode === "LAB"
                            ? "border border-amber-200 bg-amber-50 text-gold-600 dark:border-amber-800/40 dark:bg-amber-950/40 dark:text-gold-300"
                            : "border border-blue-200 bg-blue-50 text-gwc-blue dark:border-blue-900/40 dark:bg-gwc-blue-deep/60 dark:text-gwc-blue-soft"
                        }`}
                      >
                        {item.sessionMode}
                      </span>
                    )}
                    {typeof item.units === "number" && item.units > 0 && (
                      <span className="rounded-md bg-slate-100 px-1.5 py-0.5 text-[10px] font-semibold text-slate-600 dark:bg-white/10 dark:text-slate-400">
                        {item.units} {item.units === 1 ? "unit" : "units"}
                      </span>
                    )}
                  </div>
                </div>

                {/* Subject Info */}
                <div className="mt-2.5">
                  <p className="font-heading text-base font-extrabold tracking-tight text-navy-700 dark:text-mist-100">
                    {item.subjectCode}
                  </p>
                  <p className="line-clamp-2 text-xs font-medium text-slate-600 dark:text-slate-400">
                    {item.subjectTitle}
                  </p>
                </div>

                {/* Metadata Row */}
                <div className="mt-3 flex flex-wrap items-center gap-3 border-t border-slate-100 pt-3 text-xs text-slate-500 dark:border-white/5 dark:text-slate-400">
                  <div className="flex items-center gap-1">
                    <MapPinIcon size={13} className="text-slate-400 dark:text-slate-500 shrink-0" />
                    <span className="font-medium text-slate-700 dark:text-slate-300">
                      {room}
                    </span>
                  </div>

                  {!hideInstructor && (
                    <div className="flex items-center gap-1">
                      <UserSmallIcon className="text-slate-400 dark:text-slate-500 shrink-0" />
                      <span className="font-medium text-slate-700 dark:text-slate-300">
                        {instructor}
                      </span>
                    </div>
                  )}

                  {showSet && item.setCode && (
                    <span className="ml-auto rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-600 dark:bg-slate-800 dark:text-slate-400">
                      Set {item.setCode}
                    </span>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
