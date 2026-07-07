import { useMemo } from "react";
import { Badge } from "~/components/ui/badge";
import { Card } from "~/components/ui/card";
import { formatTime, timeToMinutes, type Day, type Schedule } from "~/types/schedule";

type TodayClassesProps = {
  /** Schedules already filtered to the selected school year + semester. */
  schedules: Schedule[];
};

type Occurrence = {
  schedule: Schedule;
  start: number;
  end: number;
};

const JS_DAY_TO_DAY: Record<number, Day | null> = {
  0: null,
  1: "M",
  2: "T",
  3: "W",
  4: "Th",
  5: "F",
  6: "S",
};

function buildTodayOccurrences(schedules: Schedule[]): Occurrence[] {
  const day = JS_DAY_TO_DAY[new Date().getDay()];
  if (!day) return [];
  return schedules
    .filter((s) => s.day === day)
    .map((s) => ({ schedule: s, start: timeToMinutes(s.startTime), end: timeToMinutes(s.endTime) }))
    .sort((a, b) => a.start - b.start);
}

function formatStartsIn(startMinutes: number, nowMinutes: number): string {
  const diff = startMinutes - nowMinutes;
  if (diff <= 0) return "Starts soon";
  const hours = Math.floor(diff / 60);
  const mins = diff % 60;
  if (hours > 0) return mins > 0 ? `Starts in ${hours}h ${mins}m` : `Starts in ${hours}h`;
  return `Starts in ${mins}m`;
}

/** Current/next class highlight for today, with a mobile timeline fallback. */
export function TodayClasses({ schedules }: TodayClassesProps) {
  const now = new Date();
  const nowMinutes = now.getHours() * 60 + now.getMinutes();

  const occurrences = useMemo(() => buildTodayOccurrences(schedules), [schedules]);

  const current = occurrences.find((o) => o.start <= nowMinutes && nowMinutes < o.end);
  const next = occurrences.find((o) => o.start > nowMinutes && o !== current);

  return (
    <div className="flex flex-col gap-3">
      {/* Mobile-only heading */}
      <p className="font-display text-sm tracking-wide text-navy-700 sm:hidden dark:text-white">
        Today • {now.toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" })}
      </p>

      {/* Current / next cards — shown on both mobile and desktop */}
      <div className="grid gap-3 sm:grid-cols-2">
        <TodayCard
          kind="current"
          occurrence={current}
          emptyMessage="No class is ongoing."
          nowMinutes={nowMinutes}
        />
        <TodayCard
          kind="next"
          occurrence={next}
          emptyMessage="No upcoming class today."
          nowMinutes={nowMinutes}
        />
      </div>

      {/* Mobile-only: full chronological timeline of today's classes */}
      <div className="sm:hidden">
        <p className="font-body text-xs font-medium uppercase tracking-wider text-slate-400 dark:text-slate-500">
          Today&apos;s Schedule
        </p>
        {occurrences.length === 0 ? (
          <Card className="mt-2 p-4">
            <p className="font-body text-sm text-slate-500 dark:text-slate-400">
              No classes scheduled today.
            </p>
          </Card>
        ) : (
          <Card className="mt-2 overflow-hidden border-l-4 border-l-orange-400 p-0 dark:border-l-orange-500/70">
            <ul className="divide-y divide-slate-100 dark:divide-white/8">
              {occurrences.map((o) => (
                <li key={o.schedule.id} className="flex items-center gap-3 p-3">
                  <span className="w-16 shrink-0 font-body text-xs font-semibold text-orange-500 dark:text-orange-400">
                    <span className="block">{formatTime(o.schedule.startTime)}</span>
                    <span className="block">{formatTime(o.schedule.endTime)}</span>
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-display text-sm text-navy-700 dark:text-white">
                      {o.schedule.subjectCode} — {o.schedule.subjectTitle}
                    </span>
                    <span className="block truncate font-body text-xs text-slate-500 dark:text-slate-400">
                      {o.schedule.roomName}
                    </span>
                  </span>
                </li>
              ))}
            </ul>
          </Card>
        )}
      </div>
    </div>
  );
}

function TodayCard({
  kind,
  occurrence,
  emptyMessage,
  nowMinutes,
}: {
  kind: "current" | "next";
  occurrence: Occurrence | undefined;
  emptyMessage: string;
  nowMinutes: number;
}) {
  if (!occurrence) {
    return (
      <Card className="p-4">
        <p className="font-body text-xs font-medium uppercase tracking-wider text-slate-400 dark:text-slate-500">
          {kind === "current" ? "Current Class" : "Next Class"}
        </p>
        <p className="mt-2 font-body text-sm text-slate-500 dark:text-slate-400">{emptyMessage}</p>
      </Card>
    );
  }

  const { schedule, start } = occurrence;
  const accentClassName =
    kind === "current"
      ? "border-emerald-300 bg-emerald-50/60 dark:border-emerald-400/30 dark:bg-emerald-400/5"
      : "border-gold-400/40 bg-gold-50/60 dark:border-gold-400/30 dark:bg-gold-400/5";

  return (
    <Card className={`p-4 ${accentClassName}`}>
      <div className="flex items-start justify-between gap-2">
        <p className="font-body text-xs font-medium uppercase tracking-wider text-slate-400 dark:text-slate-500">
          {kind === "current" ? "Current Class" : "Next Class"}
        </p>
        {kind === "current" ? (
          <Badge tone="emerald">Ongoing</Badge>
        ) : (
          <Badge tone="gold">{formatStartsIn(start, nowMinutes)}</Badge>
        )}
      </div>
      <p className="mt-2 truncate font-display text-base tracking-wide text-navy-700 dark:text-white">
        {schedule.subjectCode} — {schedule.subjectTitle}
      </p>
      <p className="mt-1 font-body text-sm text-slate-500 dark:text-slate-400">
        {formatTime(schedule.startTime)}–{formatTime(schedule.endTime)} · {schedule.roomName}
      </p>
      {kind === "current" && (
        <p className="mt-0.5 font-body text-sm text-slate-500 dark:text-slate-400">
          {schedule.facultyName}
        </p>
      )}
    </Card>
  );
}
