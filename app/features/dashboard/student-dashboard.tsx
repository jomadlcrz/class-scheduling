import { AnimatePresence, motion } from "motion/react";
import { useEffect, useMemo, useState } from "react";
import { DataLoadAlert } from "~/components/feedback/data-load-alert";
import { EmptyState } from "~/components/feedback/empty-state";
import { Skeleton } from "~/components/ui/skeleton";
import { TermSelector, type EnrolledTermItem } from "~/components/ui/term-selector";
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
import { LoadSummaryCard } from "~/features/dashboard/load-summary-card";
import { StudentTodayClasses } from "~/features/dashboard/student-today-classes";
import { StudentUpNextCard } from "~/features/dashboard/student-up-next-card";
import { selfAnalyticsService } from "~/services/self-analytics.service";
import { studentService } from "~/services/student.service";
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

  const [enrolledTermsList, setEnrolledTermsList] = useState<EnrolledTermItem[]>([]);

  useEffect(() => {
    studentService
      .getEnrollmentTerms()
      .then((terms) => {
        if (terms && terms.length > 0) {
          setEnrolledTermsList(terms);
        }
      })
      .catch(() => {});
  }, []);

  const availableTerms = useMemo<EnrolledTermItem[]>(() => {
    if (enrolledTermsList.length > 0) return enrolledTermsList;
    const list: EnrolledTermItem[] = [];
    for (const y of years) {
      for (const s of sems) {
        list.push({
          sy_id: y.id,
          semester_number: s.semesterNumber,
          school_year: y.schoolYear,
          semester_name: s.semester,
        });
      }
    }
    return list;
  }, [enrolledTermsList, years, sems]);

  const tiles = data ? buildTiles(data) : [];
  const dayHours = data ? buildDayHours(data.schedule) : [];

  return (
    <div className="space-y-6">
      <UpdateIndicator visible={refreshing} />

      {/* ─── Mobile Term Selector (< lg screens) ─── */}
      <div className="lg:hidden">
        <TermSelector
          terms={availableTerms}
          selectedSyId={syId}
          selectedSemester={semesterNumber}
          onSelectTerm={(nextSy, nextSem) => {
            setSyId(nextSy);
            setSemesterNumber(nextSem);
          }}
        />
      </div>

      <AnimatePresence mode="wait">
        {loading && !data ? (
          <motion.div
            key="loading"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, transition: { duration: 0.15 } }}
          >
            {/* Desktop Loading Skeleton */}
            <div className="hidden lg:block">
              <LoadingSkeleton />
            </div>

            {/* Mobile Loading Skeleton (State 1) */}
            <div className="space-y-4 lg:hidden">
              <Skeleton className="h-36 w-full rounded-2xl" />
              <Skeleton className="h-48 w-full rounded-2xl" />
            </div>
          </motion.div>
        ) : error ? (
          <DataLoadAlert title="Dashboard unavailable" message={error} permission={error.toLowerCase().includes("permission")} />
        ) : (
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
              {/* ─── Desktop Header + term selects (>= lg) ─── */}
              <motion.div
                variants={fadeSlideUp}
                className="hidden lg:flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between"
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

              {/* ─── Mobile View (< lg screens): Matches class-scheduling-mobile 3 States ─── */}
              <motion.section variants={fadeSlideUp} className="space-y-4 lg:hidden">
                {!data ? (
                  /* State 3: Empty State */
                  <EmptyState title="No Enrollment Data">
                    Check back once the Registrar encodes your enrollment.
                  </EmptyState>
                ) : (
                  /* State 2: Content State */
                  <>
                    <LoadSummaryCard data={data} />
                    <StudentUpNextCard
                      schedule={data.schedule}
                      isApproved={
                        data.meta.scheduleReleaseStatus === "approved" ||
                        (data.meta.enrolled_status?.toLowerCase() === "irregular" &&
                          Boolean(data.schedule && data.schedule.length > 0))
                      }
                    />
                    <StudentTodayClasses
                      schedule={data.schedule}
                      releaseStatus={data.meta.scheduleReleaseStatus}
                      enrolledStatus={data.meta.enrolled_status}
                    />
                  </>
                )}
              </motion.section>

              {/* ─── Desktop View (>= lg screens): Headline numbers + Charts ─── */}
              {data && (
                <div className="hidden space-y-6 lg:block">
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

                <motion.section variants={fadeSlideUp}>
                  <motion.div
                    variants={staggerWidgets}
                    initial="hidden"
                    animate="visible"
                    className="grid grid-cols-1 gap-4 lg:grid-cols-3"
                  >
                    <div className="lg:col-span-2">
                      <ChartCard title="Class hours by day">
                        <DailyHoursChart days={dayHours} />
                      </ChartCard>
                    </div>
                    <ChartCard title="Schedule coverage">
                      <SubjectCoverageDonut subjects={data.subjects} />
                    </ChartCard>
                  </motion.div>
                </motion.section>
              </div>
              )}

            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
