import { Badge } from "~/components/ui/badge";
import { Card } from "~/components/ui/card";
import { useYearLevels } from "~/hooks/use-year-levels";
import type { StudentAnalytics } from "~/types/student-analytics";

interface LoadSummaryCardProps {
  data: StudentAnalytics;
}

export function LoadSummaryCard({ data }: LoadSummaryCardProps) {
  const { yearLevelLabel } = useYearLevels();
  const m = data.meta;
  const s = data.summary;
  const totalUnits = data.subjects.reduce((sum, subject) => sum + (subject.units || 0), 0);

  const isIrregular = m.enrolled_status?.toLowerCase() === "irregular";
  const isApproved =
    m.scheduleReleaseStatus === "approved" ||
    (isIrregular && (s.subjects_scheduled > 0 || s.sessions > 0));

  const rawYear = m.year_level;
  const resolvedYearLevel =
    typeof rawYear === "number" && rawYear > 0 ? yearLevelLabel(rawYear) : "";

  const sectionOrYear = m.set_name
    ? m.set_name
    : m.program_abbrev
    ? `${m.program_abbrev}${resolvedYearLevel ? ` · ${resolvedYearLevel}` : ""}`
    : resolvedYearLevel || m.enrolled_status || "Enrolled";

  const scheduleBadgeLabel = isApproved
    ? "Official & approved"
    : isIrregular
    ? s.subjects_scheduled > 0
      ? "Official & approved"
      : "Pending schedule"
    : "Pending approval";

  return (
    <Card className="p-5">
      {/* Top row: Section & Program with Enrollment Badge */}
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <h3 className="text-lg font-bold tracking-tight text-navy-700 dark:text-mist-100">
            {sectionOrYear}
          </h3>
          <p className="truncate text-xs font-medium text-slate-500 dark:text-slate-400">
            {m.program_name || m.program_abbrev || "Student Program"}
          </p>
        </div>
        {m.enrolled_status && (
          <Badge tone={isIrregular ? "gold" : "navy"}>
            {m.enrolled_status}
          </Badge>
        )}
      </div>

      {/* Schedule status banner */}
      <div className="mt-3 flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50/70 px-3 py-2 text-xs dark:border-white/5 dark:bg-white/5">
        <span className="font-medium text-slate-500 dark:text-slate-400">
          Schedule status:
        </span>
        <Badge tone={isApproved ? "emerald" : "gold"}>
          {scheduleBadgeLabel}
        </Badge>
      </div>

      {/* 4-Metric Grid */}
      <div className="mt-4 grid grid-cols-4 divide-x divide-slate-100 rounded-xl border border-slate-100 bg-slate-50/40 py-2.5 text-center dark:divide-white/5 dark:border-white/5 dark:bg-white/3">
        <div className="px-1">
          <span className="text-base font-bold tabular-nums text-navy-700 dark:text-mist-100">
            {s.subjects_scheduled}/{s.total_subjects}
          </span>
          <p className="text-[10px] font-medium text-slate-400 dark:text-slate-500">
            Subjects
          </p>
        </div>

        <div className="px-1">
          <span className="text-base font-bold tabular-nums text-navy-700 dark:text-mist-100">
            {s.total_weekly_hours}h
          </span>
          <p className="text-[10px] font-medium text-slate-400 dark:text-slate-500">
            Weekly
          </p>
        </div>

        <div className="px-1">
          <span className="text-base font-bold tabular-nums text-navy-700 dark:text-mist-100">
            {s.sessions}
          </span>
          <p className="text-[10px] font-medium text-slate-400 dark:text-slate-500">
            Sessions
          </p>
        </div>

        <div className="px-1">
          <span className="text-base font-bold tabular-nums text-navy-700 dark:text-mist-100">
            {totalUnits}
          </span>
          <p className="text-[10px] font-medium text-slate-400 dark:text-slate-500">
            Units
          </p>
        </div>
      </div>
    </Card>
  );
}
