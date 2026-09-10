import { useEffect, useMemo, useState } from "react";
import { Badge } from "~/components/ui/badge";
import { Card } from "~/components/ui/card";
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
    <Card className="p-5 transition-shadow hover:shadow-sm">
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
          <h3 className="text-lg font-bold tracking-tight text-navy-700 dark:text-mist-100">
            {entry.subject_code}
          </h3>
          {title && (
            <p className="mt-0.5 line-clamp-1 text-xs font-medium text-slate-600 dark:text-slate-400">
              {title}
            </p>
          )}
        </div>

        {entry.mode && (
          <Badge tone={isLab ? "gold" : "slate"}>
            {entry.mode}
          </Badge>
        )}
      </div>

      {/* Metadata Row: Time, Room, Instructor */}
      <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-slate-100 pt-3 text-xs dark:border-white/5">
        <div className="flex items-center gap-1.5 font-medium text-slate-700 dark:text-slate-300">
          <ClockIcon size={13} className="shrink-0 text-slate-400 dark:text-slate-500" />
          <span className="tabular-nums">
            {formatTime12h(entry.start_time)} – {formatTime12h(entry.end_time)}
          </span>
        </div>

        <div className="flex items-center gap-1.5 font-medium text-slate-700 dark:text-slate-300">
          <MapPinIcon size={13} className="shrink-0 text-slate-400 dark:text-slate-500" />
          <span>{room}</span>
        </div>

        {instructor && (
          <div className="flex items-center gap-1.5 font-medium text-slate-700 dark:text-slate-300">
            <UserSmallIcon size={13} className="shrink-0 text-slate-400 dark:text-slate-500" />
            <span className="truncate">{instructor}</span>
          </div>
        )}
      </div>
    </Card>
  );
}
