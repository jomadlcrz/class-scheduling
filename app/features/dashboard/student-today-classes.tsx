import { useNavigate } from "react-router";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { Card } from "~/components/ui/card";
import {
  CalendarIcon,
  ClockIcon,
  MapPinIcon,
  UserSmallIcon,
} from "~/components/ui/icons";
import { SectionHeader } from "~/components/ui/section-header";
import { formatTime } from "~/types/schedule";
import type { StudentScheduleEntry } from "~/types/student-analytics";

interface StudentTodayClassesProps {
  schedule: StudentScheduleEntry[];
  releaseStatus?: string;
  enrolledStatus?: string;
  onViewFullSchedule?: () => void;
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

function AlertCircleIcon() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="8" x2="12" y2="12" />
      <line x1="12" y1="16" x2="12.01" y2="16" />
    </svg>
  );
}

export function StudentTodayClasses({
  schedule,
  releaseStatus,
  enrolledStatus,
  onViewFullSchedule,
}: StudentTodayClassesProps) {
  const navigate = useNavigate();
  const todayIndex = new Date().getDay();
  const todayName = DAY_NAMES[todayIndex];

  // Filter today's meetings & sort chronologically
  const todayClasses = schedule
    .filter((item) => item.day.toLowerCase() === todayName.toLowerCase())
    .sort((a, b) => a.start_time.localeCompare(b.start_time));

  const isIrregular = enrolledStatus?.toLowerCase() === "irregular";
  const isApproved =
    releaseStatus === "approved" || (isIrregular && schedule.length > 0);

  const handleViewSchedule = () => {
    if (onViewFullSchedule) {
      onViewFullSchedule();
    } else {
      navigate("/student-schedule");
    }
  };

  return (
    <div className="space-y-3">
      <SectionHeader title="Today's Classes" badge={todayName} />

      {!isApproved ? (
        <div className="rounded-xl border border-amber-200/80 bg-amber-50/50 p-5 text-center dark:border-amber-800/40 dark:bg-amber-950/20">
          <div className="mx-auto flex size-10 items-center justify-center rounded-full bg-slate-100 text-slate-500 dark:bg-surface-raised dark:text-slate-400">
            <AlertCircleIcon />
          </div>
          <p className="mt-2 text-sm font-bold text-slate-800 dark:text-slate-200">
            {isIrregular ? "No Schedule Assigned Yet" : "Schedule Not Published"}
          </p>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            {isIrregular
              ? "Your enrolled subjects have not been assigned to class schedules yet. Please check back once the Registrar completes your class assignments."
              : "Your section timetable is awaiting review and final publication."}
          </p>
        </div>
      ) : todayClasses.length === 0 ? (
        <Card className="p-6 text-center">
          <div className="mx-auto flex size-10 items-center justify-center rounded-full bg-slate-100 text-slate-500 dark:bg-surface-raised dark:text-slate-400">
            <CalendarIcon />
          </div>
          <p className="mt-2 text-sm font-bold text-navy-700 dark:text-mist-100">
            No Classes Today
          </p>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            You have no scheduled classes for {todayName}. Enjoy your day!
          </p>
          <div className="mt-4 flex justify-center">
            <Button
              type="button"
              variant="outline"
              block={false}
              onClick={handleViewSchedule}
            >
              View full timetable
            </Button>
          </div>
        </Card>
      ) : (
        <div className="space-y-2.5">
          {todayClasses.map((entry, idx) => {
            const isLab = entry.mode?.toUpperCase() === "LAB";
            return (
              <Card
                key={`${entry.subject_code}-${entry.start_time}-${idx}`}
                className="p-4 transition-shadow hover:shadow-sm"
              >
                {/* Time & Session Mode */}
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700 dark:text-slate-300">
                    <ClockIcon size={13} className="shrink-0 text-slate-400 dark:text-slate-500" />
                    <span className="tabular-nums">
                      {formatTime(entry.start_time)} – {formatTime(entry.end_time)}
                    </span>
                  </div>

                  {entry.mode && (
                    <Badge tone={isLab ? "gold" : "slate"}>
                      {entry.mode}
                    </Badge>
                  )}
                </div>

                {/* Subject Info */}
                <div className="mt-2">
                  <p className="text-base font-bold tracking-tight text-navy-700 dark:text-mist-100">
                    {entry.subject_code}
                  </p>
                  {entry.descriptive_title && (
                    <p className="line-clamp-2 text-xs font-medium text-slate-600 dark:text-slate-400">
                      {entry.descriptive_title}
                    </p>
                  )}
                </div>

                {/* Details Row */}
                <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-slate-100 pt-3 text-xs dark:border-white/5">
                  <div className="flex items-center gap-1.5 font-medium text-slate-700 dark:text-slate-300">
                    <MapPinIcon size={13} className="shrink-0 text-slate-400 dark:text-slate-500" />
                    <span>
                      {entry.room || "TBA"}
                    </span>
                  </div>

                  {entry.instructor && (
                    <div className="flex items-center gap-1.5 font-medium text-slate-700 dark:text-slate-300">
                      <UserSmallIcon size={13} className="shrink-0 text-slate-400 dark:text-slate-500" />
                      <span className="truncate">
                        {entry.instructor}
                      </span>
                    </div>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
