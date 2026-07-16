import { useState } from "react";
import { Card } from "~/components/ui/card";
import { BriefcaseIcon, CalendarIcon, ClockIcon, MapPinIcon, UserSmallIcon } from "~/components/ui/icons";
import { DAYS, formatTime, type Schedule } from "~/types/schedule";

type MobileWeeklyScheduleProps = {
  schedules: Schedule[];
};

type SubjectGroup = {
  subjectCode: string;
  subjectTitle: string;
  units: number | undefined;
  facultyName: string;
  setCode: string;
  dayPattern: string;
  timeLabel: string;
  roomLabel: string;
};

/** Joins per-slot values in day order; collapses to a single value when every slot agrees. */
function joinBySlot(values: string[]): string {
  const unique = [...new Set(values)];
  return unique.length === 1 ? unique[0] : values.join(" / ");
}

function groupBySubject(schedules: Schedule[]): SubjectGroup[] {
  const groups = new Map<string, Schedule[]>();
  for (const s of schedules) {
    const slots = groups.get(s.subjectCode);
    if (slots) slots.push(s);
    else groups.set(s.subjectCode, [s]);
  }

  return [...groups.entries()]
    .map(([subjectCode, slots]) => {
      const sorted = [...slots].sort(
        (a, b) => DAYS.indexOf(a.day) - DAYS.indexOf(b.day) || a.startTime.localeCompare(b.startTime),
      );
      const first = sorted[0];
      return {
        subjectCode,
        subjectTitle: first.subjectTitle,
        units: first.units,
        facultyName: first.facultyName,
        setCode: first.setCode,
        dayPattern: sorted.map((s) => s.day).join(""),
        timeLabel: joinBySlot(sorted.map((s) => `${formatTime(s.startTime)} - ${formatTime(s.endTime)}`)),
        roomLabel: joinBySlot(sorted.map((s) => s.roomName)),
      };
    })
    .sort((a, b) => a.subjectCode.localeCompare(b.subjectCode));
}

/** Mobile-only "View weekly schedule" disclosure with subject-grouped cards, mirroring the production student portal's mobile layout. */
export function MobileWeeklySchedule({ schedules }: MobileWeeklyScheduleProps) {
  const [expanded, setExpanded] = useState(false);
  const groups = groupBySubject(schedules);

  return (
    <div>
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        aria-expanded={expanded}
        className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-lg bg-navy-500 px-4 py-3 font-body text-sm font-semibold text-white shadow-lg shadow-navy-500/25 transition-colors duration-150 hover:bg-navy-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-400"
      >
        <CalendarIcon />
        <span>{expanded ? "Hide Weekly Schedule" : "View Weekly Schedule"}</span>
      </button>

      {expanded && (
        <div className="mt-3 flex flex-col gap-3">
          {groups.map((group) => (
            <Card key={group.subjectCode} className="overflow-hidden border-l-4 border-l-navy-400 p-4 dark:border-l-navy-300/50">
              <p className="truncate font-display text-base tracking-wide text-navy-700 dark:text-white">
                {group.subjectCode}
              </p>
              <p className="truncate font-body text-sm text-slate-500 dark:text-slate-400">
                {group.subjectTitle}
              </p>
              {group.units !== undefined && (
                <p className="mt-1 font-body text-xs text-slate-500 dark:text-slate-400">
                  Units: {group.units}
                </p>
              )}
              <div className="mt-3 flex flex-col gap-1.5 border-t border-slate-100 pt-3 dark:border-white/8">
                <DetailRow icon={<UserSmallIcon />}>{group.facultyName}</DetailRow>
                <DetailRow icon={<CalendarIcon />}>{group.dayPattern}</DetailRow>
                <DetailRow icon={<ClockIcon />}>{group.timeLabel}</DetailRow>
                <DetailRow icon={<MapPinIcon />}>{group.roomLabel}</DetailRow>
                <DetailRow icon={<BriefcaseIcon />}>Set: {group.setCode}</DetailRow>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

function DetailRow({ icon, children }: { icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2 font-body text-xs text-slate-600 dark:text-slate-300">
      <span aria-hidden="true" className="shrink-0 text-slate-400 dark:text-slate-500">
        {icon}
      </span>
      <span className="truncate">{children}</span>
    </div>
  );
}
