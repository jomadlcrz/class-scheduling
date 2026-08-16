import { AnimatePresence, motion } from "motion/react";
import { Badge } from "~/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "~/components/ui/table";
import {
  scheduleReleaseStatusLabel,
  scheduleReleaseStatusTone,
} from "~/features/academic-terms/status-badges";
import { selfAnalyticsService } from "~/services/self-analytics.service";
import type { DailyLoadHour } from "~/types/dean-analytics";
import type {
  StudentAnalytics,
  StudentScheduleEntry,
  StudentSubject,
} from "~/types/student-analytics";
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
  popCard,
  staggerSections,
  staggerWidgets,
  useTermData,
} from "~/features/dashboard/dashboard-shared";

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
      unit: "approved schedules are visible",
      tone:
        m.scheduleReleaseStatus === "approved"
          ? "good"
          : m.scheduleReleaseStatus === "pending_approval"
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

function SubjectsTable({ subjects }: { subjects: StudentSubject[] }) {
  if (subjects.length === 0) {
    return (
      <motion.div
        variants={popCard}
        className="flex h-44 items-center justify-center rounded-xl border border-slate-300 bg-white p-6 text-center text-sm text-slate-400 dark:border-white/10 dark:bg-white/5 dark:text-slate-500"
      >
        No subjects are on your timetable this term.
      </motion.div>
    );
  }
  const shown = subjects.slice(0, 12);
  const overflow = subjects.length - shown.length;
  return (
    <motion.div variants={popCard}>
      <Table>
        <TableHead>
          <TableHeader>Subject</TableHeader>
          <TableHeader>Units</TableHeader>
          <TableHeader>Status</TableHeader>
        </TableHead>
        <TableBody>
          {shown.map((subject) => (
            <TableRow key={subject.subject_id}>
              <TableCell>
                <span className="block font-medium text-slate-800 dark:text-slate-200">
                  {subject.subject_code}
                </span>
                <span className="block text-xs text-slate-500 dark:text-slate-400">
                  {subject.descriptive_title}
                </span>
              </TableCell>
              <TableCell>
                <span className="text-xs text-slate-500 dark:text-slate-400">{subject.units}</span>
              </TableCell>
              <TableCell>
                {subject.is_scheduled ? (
                  <Badge tone="emerald">Scheduled</Badge>
                ) : (
                  <Badge tone="slate">Pending</Badge>
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      {overflow > 0 && (
        <p className="mt-2 text-[11px] text-slate-400 dark:text-slate-500">
          +{overflow} more subjects.
        </p>
      )}
    </motion.div>
  );
}

function ScheduleTable({ schedule }: { schedule: StudentScheduleEntry[] }) {
  if (schedule.length === 0) {
    return (
      <motion.div
        variants={popCard}
        className="flex h-44 items-center justify-center rounded-xl border border-slate-300 bg-white p-6 text-center text-sm text-slate-400 dark:border-white/10 dark:bg-white/5 dark:text-slate-500"
      >
        No sessions are on your timetable this term yet.
      </motion.div>
    );
  }
  const shown = schedule.slice(0, 12);
  const overflow = schedule.length - shown.length;
  return (
    <motion.div variants={popCard}>
      <Table>
        <TableHead>
          <TableHeader>Day</TableHeader>
          <TableHeader>Time</TableHeader>
          <TableHeader>Subject</TableHeader>
          <TableHeader className="hidden md:table-cell">Room</TableHeader>
          <TableHeader className="hidden lg:table-cell">Instructor</TableHeader>
          <TableHeader className="hidden xl:table-cell">Mode</TableHeader>
        </TableHead>
        <TableBody>
          {shown.map((entry, i) => (
            <TableRow key={i}>
              <TableCell>
                <span className="font-medium text-slate-800 dark:text-slate-200">{entry.day}</span>
              </TableCell>
              <TableCell>
                <span className="text-xs tabular-nums text-slate-600 dark:text-slate-300">
                  {entry.start_time} – {entry.end_time}
                </span>
              </TableCell>
              <TableCell>
                <span className="block font-medium text-slate-800 dark:text-slate-200">
                  {entry.subject_code}
                </span>
                <span className="block text-xs text-slate-500 dark:text-slate-400">
                  {entry.descriptive_title}
                </span>
              </TableCell>
              <TableCell className="hidden md:table-cell">
                <span className="text-xs text-slate-500 dark:text-slate-400">{entry.room}</span>
              </TableCell>
              <TableCell className="hidden lg:table-cell">
                <span className="text-xs text-slate-500 dark:text-slate-400">{entry.instructor}</span>
              </TableCell>
              <TableCell className="hidden xl:table-cell">
                <span className="text-xs text-slate-500 dark:text-slate-400">{entry.mode}</span>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      {overflow > 0 && (
        <p className="mt-2 text-[11px] text-slate-400 dark:text-slate-500">
          +{overflow} more sessions.
        </p>
      )}
    </motion.div>
  );
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
          <motion.div
            key="error"
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-400"
          >
            {error}
          </motion.div>
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
                  <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                    {[
                      data.meta.student_name,
                      data.meta.set_name || data.meta.program_abbrev,
                    ].filter(Boolean).join(" · ")}
                  </p>
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
                      subtitle="Weekly class load, Mon–Sat. The peak day is highlighted in gold."
                    >
                      <DailyHoursChart days={dayHours} />
                    </ChartCard>
                  </div>
                  <ChartCard
                    title="Schedule coverage"
                    subtitle="Subjects on your timetable with at least one saved session."
                  >
                    <SubjectCoverageDonut subjects={data.subjects} />
                  </ChartCard>
                </motion.div>
              </motion.section>

              {/* ─── My schedule (stacked, full width) ─── */}
              <motion.section variants={fadeSlideUp}>
                <motion.div variants={staggerWidgets} initial="hidden" animate="visible" className="space-y-4">
                  <ChartCard
                    title="My schedule"
                    subtitle="Every saved session for this term."
                  >
                    <ScheduleTable schedule={data.schedule} />
                  </ChartCard>
                  <ChartCard
                    title="Assigned subjects"
                    subtitle={`${data.subjects.length} subject${data.subjects.length === 1 ? "" : "s"} this term, with scheduled status.`}
                  >
                    <SubjectsTable subjects={data.subjects} />
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
