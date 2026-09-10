import { useEffect, useMemo, useState } from "react";
import { Badge } from "~/components/ui/badge";
import { ClockIcon, MapPinIcon, UserSmallIcon } from "~/components/ui/icons";
import {
  compareScheduleStartTime,
  formatTime12h,
  getClassStatus,
} from "~/lib/time";
import type { StudentScheduleEntry } from "~/types/student-analytics";

interface StudentUpNextCardProps {
  schedule?: StudentScheduleEntry[];
  isApproved?: boolean;
}

const DAY_NAMES = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

export function StudentUpNextCard({
  schedule = [],
  isApproved = false,
}: StudentUpNextCardProps) {
  const [now, setNow] = useState(() => new Date());

  // Update countdown every 30 seconds
  useEffect(() => {
    const timer = setInterval(() => {
      setNow(new Date());
    }, 30000);
    return () => clearInterval(timer);
  }, []);

  const todayIndex = now.getDay();
  const todayName = DAY_NAMES[todayIndex];

  // Filter & sort today's classes
  const todayClasses = useMemo(() => {
    if (!isApproved || !schedule.length) return [];

    return schedule
      .filter((item) => item.day.toLowerCase() === todayName.toLowerCase())
      .sort(compareScheduleStartTime);
  }, [schedule, isApproved, todayName]);

  // Find either the currently ongoing class, or the next upcoming class today
  const activeMeeting = useMemo(() => {
    if (!todayClasses.length) return null;

    // Check for an ongoing class first
    for (const entry of todayClasses) {
      const status = getClassStatus(entry.start_time, entry.end_time, now);
      if (status.status === "ongoing") {
        return { entry, status };
      }
    }

    // Otherwise check for the first upcoming class
    for (const entry of todayClasses) {
      const status = getClassStatus(entry.start_time, entry.end_time, now);
      if (status.status === "upcoming") {
        return { entry, status };
      }
    }

    return null;
  }, [todayClasses, now]);

  if (!activeMeeting) {
    return null;
  }

  const { entry, status } = activeMeeting;
  const isOngoing = status.status === "ongoing";
  const title = entry.descriptive_title;
  const room = entry.room || "TBA";
  const instructor = entry.instructor;
  const isLab = entry.mode?.toUpperCase() === "LAB";

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white p-5 shadow-xs transition-shadow hover:shadow-sm dark:border-surface-overlay dark:bg-surface">
      {/* Top row: Status indicator + Badge */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          {isOngoing ? (
            <span className="relative flex size-2.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex size-2.5 rounded-full bg-emerald-500" />
            </span>
          ) : (
            <span className="size-2.5 rounded-full bg-slate-400 dark:bg-slate-500" />
          )}
          <span className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
            {isOngoing ? "Class in Session" : "Up Next Today"}
          </span>
        </div>

        <Badge tone={isOngoing ? "emerald" : "slate"}>
          {status.label}
        </Badge>
      </div>

      {/* Subject Information */}
      <div className="mt-3 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="font-heading text-lg font-extrabold tracking-tight text-navy-700 dark:text-mist-100">
            {entry.subject_code}
          </h3>
          {title && (
            <p className="mt-0.5 line-clamp-1 text-xs font-medium text-slate-600 dark:text-slate-400">
              {title}
            </p>
          )}
        </div>

        {entry.mode && (
          <span
            className={`shrink-0 rounded-md px-2 py-0.5 text-[10px] font-extrabold uppercase ${
              isLab
                ? "border border-amber-200 bg-amber-50 text-gold-600 dark:border-amber-800/40 dark:bg-amber-950/40 dark:text-gold-300"
                : "border border-slate-200 bg-slate-100 text-slate-700 dark:border-surface-overlay dark:bg-white/5 dark:text-slate-300"
            }`}
          >
            {entry.mode}
          </span>
        )}
      </div>

      {/* Metadata Row: Time, Room, Instructor */}
      <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-slate-100 pt-3 text-xs text-slate-500 dark:border-white/5 dark:text-slate-400">
        <div className="flex items-center gap-1.5 font-semibold text-slate-700 dark:text-slate-300">
          <ClockIcon size={13} className="shrink-0 text-slate-400 dark:text-slate-500" />
          <span>
            {formatTime12h(entry.start_time)} – {formatTime12h(entry.end_time)}
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          <MapPinIcon size={13} className="shrink-0 text-slate-400 dark:text-slate-500" />
          <span className="font-medium text-slate-700 dark:text-slate-300">{room}</span>
        </div>

        {instructor && (
          <div className="flex items-center gap-1.5">
            <UserSmallIcon size={13} className="shrink-0 text-slate-400 dark:text-slate-500" />
            <span className="truncate font-medium text-slate-600 dark:text-slate-400">
              {instructor}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
