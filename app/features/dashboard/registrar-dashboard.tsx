import { AnimatePresence, motion } from "motion/react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "~/components/ui/table";
import { registrarService } from "~/services/registrar.service";
import type { RegistrarAnalyticsResponse } from "~/types/registrar-analytics";
import {
  ChartCard,
  EnrollmentDonut,
  IRREGULAR_PENDING,
  LabCapacityMeters,
  ScheduleCompletionChart,
  StaffingByDepartmentChart,
  StatTile,
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

type Tile = {
  title: string;
  displayValue: string;
  unit?: string;
  hint?: string;
  tone?: string;
  color?: string;
  badge?: string;
  meterPercent?: number;
};

function pct(count: number, of: number): number {
  return of > 0 ? Math.round((count / of) * 100) : 0;
}

/** A lower-is-better gap: 0 is done, under a quarter is on track, past half
 * needs attention. */
function gapTone(count: number, of: number): string {
  if (count <= 0) return "good";
  const percent = pct(count, of);
  if (percent >= 50) return "critical";
  if (percent >= 25) return "warning";
  return "good";
}

/** Deliberately scoped to students who ARE enrolled but have no seat yet —
 * "not yet enrolled" is a different question, answered by the Enrollment
 * status donut above instead. Keeping the two apart is the point: an
 * enrollment gap and a scheduling gap are not the same kind of problem. */
function buildNotYetScheduledTiles(data: RegistrarAnalyticsResponse): Tile[] {
  const en = data.enrollment;
  return [
    {
      title: "Regular — no schedule",
      displayValue: String(en.regular_pending_count),
      unit: `of ${en.regular_count} regular students`,
      tone: gapTone(en.regular_pending_count, en.regular_count),
      badge: `${pct(en.regular_pending_count, en.regular_count)}% of regulars`,
    },
    {
      title: "Irregular — no schedule",
      displayValue: String(en.irregular_pending_count),
      unit: `of ${en.irregular_count} irregular students`,
      // Irregular's own identity color (same amber as its donut slice)
      // once there's a real gap, rather than the shared warning ladder —
      // a glance at the color alone says which group it is.
      color: en.irregular_pending_count > 0 ? IRREGULAR_PENDING : undefined,
      tone: gapTone(en.irregular_pending_count, en.irregular_count),
      badge: `${pct(en.irregular_pending_count, en.irregular_count)}% of irregulars`,
    },
  ];
}

function buildTiles(data: RegistrarAnalyticsResponse): Tile[] {
  const sc = data.schedule_completion;
  const lab = data.lab_capacity;
  const en = data.enrollment;
  const st = data.staffing;
  return [
    {
      title: "Sets scheduled",
      displayValue: `${sc.scheduled_percent}%`,
      unit: `${sc.scheduled_sets} of ${sc.total_sets} active sets`,
      tone: ratioTone(sc.scheduled_percent),
      badge: sc.unscheduled_sets_count > 0 ? `${sc.unscheduled_sets_count} unscheduled` : "All scheduled",
      meterPercent: sc.scheduled_percent,
    },
    {
      title: "Lab hours used",
      displayValue: `${lab.hour_utilization_percent}%`,
      unit: `${lab.booked_hours} h of ${lab.window_capacity_hours} h window`,
      tone: loadBandTone(lab.hour_utilization_percent),
      badge:
        lab.fully_booked_laboratories > 0
          ? `${lab.fully_booked_laboratories} fully booked`
          : "Capacity free",
      meterPercent: lab.hour_utilization_percent,
    },
    {
      title: "Students enrolled",
      displayValue: String(en.total_students),
      unit: `${en.regular_count} regular · ${en.irregular_count} irregular`,
      tone:
        en.total_pending_count > 0
          ? en.total_pending_count >= en.total_students
            ? "critical"
            : "warning"
          : "good",
      badge:
        en.total_pending_count > 0
          ? `${en.total_pending_count} awaiting seats`
          : "All seated",
    },
    {
      title: "Teaching capacity used",
      displayValue: `${st.capacity_used_percent}%`,
      unit: `${st.capacity_booked_hours} h of ${st.capacity_total_hours} h cap`,
      tone: loadBandTone(st.capacity_used_percent),
      badge: st.instructors_over_cap > 0 ? `${st.instructors_over_cap} over cap` : "Within caps",
      meterPercent: st.capacity_used_percent,
    },
    {
      title: "Instructors staffed",
      displayValue: `${st.instructors_staffed} of ${st.roster_size}`,
      unit: "carry at least one subject",
      tone:
        st.roster_size > 0 && st.instructors_staffed === st.roster_size
          ? "good"
          : st.instructors_staffed > 0
            ? "warning"
            : "critical",
      badge: st.instructors_idle > 0 ? `${st.instructors_idle} idle` : "Fully staffed",
      meterPercent: st.roster_size > 0 ? (st.instructors_staffed / st.roster_size) * 100 : 0,
    },
    {
      title: "Lab seat-slots used",
      displayValue: `${lab.slot_utilization_percent}%`,
      unit: `${lab.laboratories_with_free_slots} of ${lab.laboratories_total} labs have free slots`,
      tone: ratioTone(lab.slot_utilization_percent),
      badge: lab.conflicts > 0 ? `${lab.conflicts} conflicts` : "No conflicts",
    },
  ];
}

function UnscheduledSetsTable({ sets }: { sets: RegistrarAnalyticsResponse["schedule_completion"]["unscheduled_sets"] }) {
  if (sets.length === 0) {
    return (
      <motion.div
        variants={popCard}
        className="flex h-44 items-center justify-center rounded-lg border border-slate-200 bg-white p-6 text-center text-sm text-slate-400 dark:border-white/10 dark:bg-navy-900 dark:text-slate-500"
      >
        Every active set has a schedule this term.
      </motion.div>
    );
  }
  const shown = sets.slice(0, 12);
  const overflow = sets.length - shown.length;
  return (
    <motion.div variants={popCard}>
      <Table>
        <TableHead>
          <TableHeader>Set</TableHeader>
          <TableHeader>Program</TableHeader>
          <TableHeader>Year</TableHeader>
        </TableHead>
        <TableBody>
          {shown.map((set) => (
            <TableRow key={set.set_id}>
              <TableCell>
                <span className="font-medium text-slate-800 dark:text-slate-200">{set.set_code}</span>
              </TableCell>
              <TableCell>
                <span className="text-xs text-slate-500 dark:text-slate-400">{set.program_abbrev}</span>
              </TableCell>
              <TableCell>
                <span className="text-xs text-slate-500 dark:text-slate-400">{set.year_level}</span>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      {overflow > 0 && (
        <p className="mt-2 text-[11px] text-slate-400 dark:text-slate-500">
          +{overflow} more unscheduled sets.
        </p>
      )}
    </motion.div>
  );
}

function NotEnrolledStudentsTable({ students }: { students: RegistrarAnalyticsResponse["enrollment"]["not_enrolled_students"] }) {
  if (students.length === 0) {
    return (
      <motion.div
        variants={popCard}
        className="flex h-44 items-center justify-center rounded-lg border border-slate-200 bg-white p-6 text-center text-sm text-slate-400 dark:border-white/10 dark:bg-navy-900 dark:text-slate-500"
      >
        Every active student has enrolled this term.
      </motion.div>
    );
  }
  const shown = students.slice(0, 12);
  const overflow = students.length - shown.length;
  return (
    <motion.div variants={popCard}>
      <Table>
        <TableHead>
          <TableHeader>Student</TableHeader>
          <TableHeader>Student ID</TableHeader>
        </TableHead>
        <TableBody>
          {shown.map((student) => (
            <TableRow key={student.student_profile_id}>
              <TableCell>
                <span className="font-medium text-slate-800 dark:text-slate-200">{student.full_name}</span>
              </TableCell>
              <TableCell>
                <span className="text-xs text-slate-500 dark:text-slate-400">{student.student_id ?? "—"}</span>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      {overflow > 0 && (
        <p className="mt-2 text-[11px] text-slate-400 dark:text-slate-500">
          +{overflow} more not-yet-enrolled students.
        </p>
      )}
    </motion.div>
  );
}

export function RegistrarDashboard() {
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
  } = useTermData<RegistrarAnalyticsResponse>((sy, sem) => registrarService.getAnalytics(sy, sem));

  const tiles = data ? buildTiles(data) : [];
  const notYetScheduledTiles = data ? buildNotYetScheduledTiles(data) : [];

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
                    Registration overview
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

              {/* ─── Schedule completion + enrollment ─── */}
              <motion.section variants={fadeSlideUp}>
                <motion.div
                  variants={staggerWidgets}
                  initial="hidden"
                  animate="visible"
                  className="grid grid-cols-1 gap-4 lg:grid-cols-3"
                >
                  <div className="lg:col-span-2">
                    <ChartCard
                      title="Schedule completion by program"
                      subtitle="Active sets per program with at least one saved session this term."
                    >
                      <ScheduleCompletionChart programs={data.schedule_completion.by_program} />
                    </ChartCard>
                  </div>
                  <ChartCard
                    title="Enrollment status"
                    subtitle="Who's on the roster this term — regular, irregular, or not yet enrolled."
                  >
                    <EnrollmentDonut enrollment={data.enrollment} />
                  </ChartCard>
                </motion.div>
              </motion.section>

              {/* ─── Not yet enrolled students ─── */}
              <motion.section variants={fadeSlideUp}>
                <h3 className="mb-3 text-base font-bold text-slate-800 dark:text-slate-200">
                  Not yet enrolled students
                </h3>
                <NotEnrolledStudentsTable students={data.enrollment.not_enrolled_students} />
              </motion.section>

              {/* ─── Not yet scheduled ─── */}
              <motion.section variants={fadeSlideUp}>
                <h3 className="text-base font-bold text-slate-800 dark:text-slate-200">
                  Not yet scheduled
                </h3>
                <p className="mb-3 text-xs text-slate-500 dark:text-slate-400">
                  Already enrolled, but still without a seat — separate from the not-yet-enrolled count above.
                </p>
                <motion.div
                  variants={staggerWidgets}
                  initial="hidden"
                  animate="visible"
                  className="grid grid-cols-1 gap-4 sm:grid-cols-2"
                >
                  {notYetScheduledTiles.map((tile) => (
                    <StatTile key={tile.title} {...tile} />
                  ))}
                </motion.div>
              </motion.section>

              {/* ─── Lab capacity + teaching capacity ─── */}
              <motion.section variants={fadeSlideUp}>
                <motion.div
                  variants={staggerWidgets}
                  initial="hidden"
                  animate="visible"
                  className="grid grid-cols-1 gap-4 lg:grid-cols-2"
                >
                  <ChartCard
                    title="Lab capacity"
                    subtitle={`${data.lab_capacity.laboratories.length} lab room${data.lab_capacity.laboratories.length === 1 ? "" : "s"} this term, booked hours against the operating-day window.`}
                  >
                    <LabCapacityMeters laboratories={data.lab_capacity.laboratories} />
                  </ChartCard>
                  <ChartCard
                    title="Teaching capacity by department"
                    subtitle="Booked hours against the weekly caps each dean set, per department."
                  >
                    <StaffingByDepartmentChart departments={data.staffing.by_department} />
                  </ChartCard>
                </motion.div>
              </motion.section>

              {/* ─── Unscheduled sets ─── */}
              <motion.section variants={fadeSlideUp}>
                <h3 className="mb-3 text-base font-bold text-slate-800 dark:text-slate-200">
                  Unscheduled sets
                </h3>
                <UnscheduledSetsTable sets={data.schedule_completion.unscheduled_sets} />
              </motion.section>
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
