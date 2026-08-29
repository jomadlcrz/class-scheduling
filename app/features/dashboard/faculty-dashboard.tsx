import { AnimatePresence, motion } from "motion/react";
import { DataLoadAlert } from "~/components/feedback/data-load-alert";
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
  ChartCard,
  DailyHoursChart,
  StatTile,
  SubjectCoverageDonut,
  loadBandTone,
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
import { selfAnalyticsService } from "~/services/self-analytics.service";
import type { DailyLoadHour } from "~/types/dean-analytics";
import type {
  InstructorAnalytics,
  InstructorScheduleEntry,
  InstructorSubject,
  InstructorSummary,
} from "~/types/instructor-analytics";

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

function buildTiles(s: InstructorSummary): Tile[] {
  const scheduledPct = pct(s.scheduled_subjects, s.assigned_subjects);
  const unscheduled = s.assigned_subjects - s.scheduled_subjects;
  const hoursPct = pct(s.booked_hours, s.expected_weekly_hours);
  return [
    {
      title: "Weekly load",
      displayValue: `${s.load_percent}%`,
      unit: `${s.booked_hours} h of ${s.max_weekly_hours} h cap`,
      tone: loadBandTone(s.load_percent),
      badge: s.remaining_hours > 0 ? `${s.remaining_hours} h left` : "Cap reached",
      meterPercent: s.load_percent,
    },
    {
      title: "Subjects scheduled",
      displayValue: `${s.scheduled_subjects} of ${s.assigned_subjects}`,
      unit: "assigned subjects on the board",
      tone: ratioTone(scheduledPct),
      badge: unscheduled > 0 ? `${unscheduled} unscheduled` : "All scheduled",
      meterPercent: scheduledPct,
    },
    {
      title: "Sessions booked",
      displayValue: String(s.sessions),
      unit: "class sessions this term",
      tone: s.sessions > 0 ? "good" : "warning",
      badge: s.sessions > 0 ? "On the board" : "None yet",
    },
    {
      title: "Units assigned",
      displayValue: String(s.units),
      unit: "course units",
      tone: "neutral",
    },
    {
      title: "Hours booked",
      displayValue: `${s.booked_hours} h`,
      unit: `of ${s.expected_weekly_hours} h expected`,
      tone: hoursPct >= 100 ? "good" : hoursPct > 0 ? "warning" : "neutral",
      badge: hoursPct >= 100 ? "On track" : "Under expected",
      meterPercent: hoursPct,
    },
    {
      title: "Capacity remaining",
      displayValue: `${s.remaining_hours} h`,
      unit: "free in the weekly cap",
      tone: s.remaining_hours > 0 ? "good" : "critical",
      badge: s.remaining_hours > 0 ? "Available" : "Cap reached",
    },
  ];
}

/** Sums session hours per weekday, Mon–Sat, in calendar order. */
function buildDayHours(subjects: InstructorSubject[]): DailyLoadHour[] {
  const totals = new Map<string, number>();
  for (const subject of subjects) {
    for (const session of subject.sessions) {
      totals.set(session.day, (totals.get(session.day) ?? 0) + session.hours);
    }
  }
  return DAY_ORDER.filter((day) => totals.has(day)).map((day, i) => ({
    day_of_week: i,
    day_name: day,
    hours: totals.get(day) ?? 0,
  }));
}

function SubjectsTable({ subjects = [] }: { subjects?: InstructorSubject[] }) {
  const safeSubjects = subjects ?? [];
  if (safeSubjects.length === 0) {
    return (
      <motion.div
        variants={popCard}
        className="flex h-44 items-center justify-center rounded-xl border border-slate-300 bg-white p-6 text-center text-sm text-slate-400 dark:border-white/10 dark:bg-white/5 dark:text-slate-500"
      >
        No subjects assigned this term.
      </motion.div>
    );
  }
  const shown = safeSubjects.slice(0, 12);
  const overflow = safeSubjects.length - shown.length;
  return (
    <motion.div variants={popCard}>
      <Table>
        <TableHead>
          <TableHeader>Subject</TableHeader>
          <TableHeader>Program</TableHeader>
          <TableHeader className="hidden md:table-cell">Year</TableHeader>
          <TableHeader className="hidden sm:table-cell">Units</TableHeader>
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
                <span className="text-xs text-slate-500 dark:text-slate-400">
                  {subject.program_abbrev}
                </span>
              </TableCell>
              <TableCell className="hidden md:table-cell">
                <span className="text-xs text-slate-500 dark:text-slate-400">
                  {subject.year_level}
                </span>
              </TableCell>
              <TableCell className="hidden sm:table-cell">
                <span className="text-xs text-slate-500 dark:text-slate-400">
                  {subject.units}
                </span>
              </TableCell>
              <TableCell>
                {subject.is_scheduled ? (
                  <Badge tone="emerald">Scheduled</Badge>
                ) : (
                  <Badge tone="slate">Unscheduled</Badge>
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

function ScheduleTable({ schedule = [] }: { schedule?: InstructorScheduleEntry[] }) {
  const safeSchedule = schedule ?? [];
  if (safeSchedule.length === 0) {
    return (
      <motion.div
        variants={popCard}
        className="flex h-44 items-center justify-center rounded-xl border border-slate-300 bg-white p-6 text-center text-sm text-slate-400 dark:border-white/10 dark:bg-white/5 dark:text-slate-500"
      >
        No sessions are booked for this term yet.
      </motion.div>
    );
  }
  const shown = safeSchedule.slice(0, 12);
  const overflow = safeSchedule.length - shown.length;
  return (
    <motion.div variants={popCard}>
      <Table>
        <TableHead>
          <TableHeader>Day</TableHeader>
          <TableHeader>Time</TableHeader>
          <TableHeader>Subject</TableHeader>
          <TableHeader className="hidden md:table-cell">Room</TableHeader>
          <TableHeader className="hidden sm:table-cell">Program</TableHeader>
          <TableHeader className="hidden lg:table-cell">Mode</TableHeader>
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
              <TableCell className="hidden sm:table-cell">
                <span className="text-xs text-slate-500 dark:text-slate-400">{entry.program}</span>
              </TableCell>
              <TableCell className="hidden lg:table-cell">
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

/** The instructor's term-scoped dashboard — weekly load, schedule coverage and
 * their own timetable for the selected school term. */
export function FacultyDashboard() {
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
  } = useTermData<InstructorAnalytics>("faculty-analytics", (sy, sem) =>
    selfAnalyticsService.getFaculty(sy, sem),
  );

  const tiles = data ? buildTiles(data.summary) : [];
  const dayHours = data ? buildDayHours(data.subjects) : [];

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
                  <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                    {[data.meta.instructor_name, data.meta.school_year, data.meta.semester_name].filter(Boolean).join(" · ")}
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
                      title="Booked hours by day"
                      subtitle="Weekly booked load, Mon–Sat. The peak day is highlighted in gold."
                    >
                      <DailyHoursChart days={dayHours} />
                    </ChartCard>
                  </div>
                  <ChartCard
                    title="Schedule coverage"
                    subtitle="Assigned subjects with at least one saved session this term."
                  >
                    <SubjectCoverageDonut subjects={data.subjects} />
                  </ChartCard>
                </motion.div>
              </motion.section>

              {/* ─── Subjects + schedule (stacked, full width) ─── */}
              <motion.section variants={fadeSlideUp}>
                <motion.div
                  variants={staggerWidgets}
                  initial="hidden"
                  animate="visible"
                  className="space-y-4"
                >
                  <ChartCard
                    title="Assigned subjects"
                    subtitle={`${data.subjects.length} subject${data.subjects.length === 1 ? "" : "s"} this term, with scheduled status.`}
                  >
                    <SubjectsTable subjects={data.subjects} />
                  </ChartCard>
                  <ChartCard
                    title="My schedule"
                    subtitle="Every saved session for this term."
                  >
                    <ScheduleTable schedule={data.schedule} />
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
