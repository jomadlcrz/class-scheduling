import { AnimatePresence, motion } from "motion/react";
import { DataLoadAlert } from "~/components/feedback/data-load-alert";
import {
  scheduleReleaseStatusLabel,
} from "~/features/academic-terms/status-badges";
import {
  ChartCard,
  DailyHoursChart,
  StatTile,
  SubjectCoverageDonut,
  ratioTone,
} from "~/features/dashboard/dashboard-charts";
import {
  LoadingSkeleton,
  TermSelectors,
  UpdateIndicator,
  fadeSlideUp,
  staggerSections,
  staggerWidgets,
  useTermData,
} from "~/features/dashboard/dashboard-shared";
import { selfAnalyticsService } from "~/services/self-analytics.service";
import type { DailyLoadHour } from "~/types/dean-analytics";
import type {
  StudentAnalytics,
  StudentScheduleEntry,
} from "~/types/student-analytics";

const DAY_ORDER = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

type Tile = {
  title: string;
  displayValue: string;
  unit?: string;
  hint?: string;
  tone?: string;
  badge?: string;
  meterPercent?: number;
};

function pct(count: number, of: number): number {
  return of > 0 ? Math.round((count / of) * 100) : 0;
}

function buildTiles(data: StudentAnalytics): Tile[] {
  const s = data.summary;
  const m = data.meta;
  const units = data.subjects.reduce((sum, subject) => sum + subject.units, 0);
  const scheduledPct = pct(s.subjects_scheduled, s.total_subjects);
  const section = m.set_name || m.program_abbrev;
  return [
    {
      title: "Subjects scheduled",
      displayValue: `${s.subjects_scheduled} of ${s.total_subjects}`,
      unit: "subjects on the timetable",
      tone: ratioTone(scheduledPct),
      badge: s.subjects_pending > 0 ? `${s.subjects_pending} pending` : "All scheduled",
      meterPercent: scheduledPct,
    },
    {
      title: "Weekly hours",
      displayValue: `${s.total_weekly_hours} h`,
      unit: "of class hours per week",
      tone: s.total_weekly_hours > 0 ? "good" : "warning",
    },
    {
      title: "Sessions",
      displayValue: String(s.sessions),
      unit: "class sessions this term",
      tone: s.sessions > 0 ? "good" : "warning",
      badge: s.sessions > 0 ? "On the board" : "None yet",
    },
    {
      title: "Units",
      displayValue: String(units),
      unit: "course units",
      tone: "neutral",
    },
    {
      title: "Enrollment",
      displayValue: m.enrolled_status,
      unit: section || "no section assigned",
      tone: m.enrolled_status === "Regular" ? "good" : "warning",
    },
    {
      title: "Schedule release",
      displayValue: scheduleReleaseStatusLabel(m.scheduleReleaseStatus),
      unit:
        m.scheduleReleaseStatus === "approved"
          ? "official timetable is visible"
          : "visible after Registrar term publication",
      tone:
        m.scheduleReleaseStatus === "approved"
          ? "good"
          : ["pending_dean_review", "instructor_review", "pending_final_approval", "pending_publication"].includes(m.scheduleReleaseStatus)
            ? "warning"
            : "critical",
      badge: m.scheduleReleaseStatus === "approved" ? "Available" : "Waiting",
    },
  ];
}

/** Sums session hours per weekday, Mon–Sat, in calendar order. */
function buildDayHours(schedule: StudentScheduleEntry[]): DailyLoadHour[] {
  const totals = new Map<string, number>();
  for (const entry of schedule) {
    totals.set(entry.day, (totals.get(entry.day) ?? 0) + entry.hours);
  }
  return DAY_ORDER.filter((day) => totals.has(day)).map((day, i) => ({
    day_of_week: i,
    day_name: day,
    hours: totals.get(day) ?? 0,
  }));
}

/** The student's term-scoped dashboard — weekly load by day, schedule coverage
 * and their own timetable for the selected school term. */
export function StudentDashboard() {
  const {
    data,
    syId,
    semesterNumber,
    setSyId,
    setSemesterNumber,
    loading,
    error,
    refreshing,
    years,
    sems,
  } = useTermData<StudentAnalytics>("student-analytics", (sy, sem) =>
    selfAnalyticsService.getStudent(sy, sem),
  );

  const tiles = data ? buildTiles(data) : [];
  const dayHours = data ? buildDayHours(data.schedule) : [];

  return (
    <div className="space-y-6">
      <UpdateIndicator visible={refreshing} />

      <AnimatePresence mode="wait">
        {loading ? (
          <motion.div
            key="loading"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, transition: { duration: 0.15 } }}
          >
            <LoadingSkeleton />
          </motion.div>
        ) : error ? (
          <DataLoadAlert title="Dashboard unavailable" message={error} permission={error.toLowerCase().includes("permission")} />
        ) : data ? (
          <motion.div
            key="data"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
          >
            <motion.div
              variants={staggerSections}
              initial="hidden"
              animate="visible"
              className="space-y-6"
            >
              {/* ─── Header + term selects ─── */}
              <motion.div
                variants={fadeSlideUp}
                className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between"
              >
                <div>
                  <h2 className="font-display text-xl tracking-wide text-navy-700 dark:text-mist-100">
                    Overview
                  </h2>
                </div>
                <TermSelectors
                  years={years}
                  sems={sems}
                  syId={syId}
                  semesterNumber={semesterNumber}
                  onSyId={setSyId}
                  onSemesterNumber={setSemesterNumber}
                />
              </motion.div>

              {/* ─── Headline numbers ─── */}
              <motion.section variants={fadeSlideUp}>
                <motion.div
                  variants={staggerWidgets}
                  initial="hidden"
                  animate="visible"
                  className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3"
                >
                  {tiles.map((tile) => (
                    <StatTile key={tile.title} {...tile} />
                  ))}
                </motion.div>
              </motion.section>

              {/* ─── Booked hours + schedule coverage ─── */}
              <motion.section variants={fadeSlideUp}>
                <motion.div
                  variants={staggerWidgets}
                  initial="hidden"
                  animate="visible"
                  className="grid grid-cols-1 gap-4 lg:grid-cols-3"
                >
                  <div className="lg:col-span-2">
                    <ChartCard
                      title="Class hours by day"
                    >
                      <DailyHoursChart days={dayHours} />
                    </ChartCard>
                  </div>
                  <ChartCard
                    title="Schedule coverage"
                  >
                    <SubjectCoverageDonut subjects={data.subjects} />
                  </ChartCard>
                </motion.div>
              </motion.section>

            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
