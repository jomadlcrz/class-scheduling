import { AnimatePresence, motion } from "motion/react";
import { useCallback, useEffect, useState } from "react";
import { Skeleton } from "~/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "~/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import { deanService } from "~/services/dean.service";
import { schoolYearService } from "~/services/school-year.service";
import { semesterService } from "~/services/semester.service";
import type { AttentionItem, DeanAnalyticsResponse, Insight } from "~/types/dean-analytics";
import {
  ChartCard,
  CoverageStackedChart,
  DailyHoursChart,
  InstructorLoadMeters,
  LoadBandChart,
  SpreadCard,
  StatTile,
  chartStatusColor,
} from "~/features/dashboard/dashboard-charts";

const EASE_OUT = [0.22, 1, 0.36, 1] as const;

const staggerSections = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.1 } },
};

const staggerWidgets = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.05 } },
};

const fadeSlideUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: EASE_OUT } },
};

const popCard = {
  hidden: { opacity: 0, scale: 0.96 },
  visible: { opacity: 1, scale: 1, transition: { duration: 0.4, ease: EASE_OUT } },
};

const insightVariant = {
  hidden: { opacity: 0, y: 12, scale: 0.97 },
  visible: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.35, ease: EASE_OUT } },
};

const SEVERITY_COLORS: Record<string, string> = {
  critical: chartStatusColor("critical"),
  serious: chartStatusColor("serious"),
  warning: chartStatusColor("warning"),
  info: "var(--color-navy-500)",
  good: chartStatusColor("good"),
};

/** Load band ladder: the same thresholds the backend uses for its bands. */
function bandTone(pct: number): string {
  if (pct > 100) return "critical";
  if (pct >= 90) return "serious";
  if (pct >= 50) return "good";
  if (pct > 0) return "warning";
  return "neutral";
}

function ratioTone(pct: number): string {
  if (pct >= 90) return "good";
  if (pct >= 50) return "warning";
  return "serious";
}

function formatGeneratedAt(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" });
}

type Tile = {
  title: string;
  displayValue: string;
  unit?: string;
  hint?: string;
  tone?: string;
  badge?: string;
  meterPercent?: number;
};

function buildTiles(
  summary: DeanAnalyticsResponse["summary"],
  definitions: Record<string, string>,
): Tile[] {
  const s = summary;
  const d = definitions;
  return [
    {
      title: "Instructors staffed",
      displayValue: `${s.instructors_staffed} of ${s.roster_size}`,
      unit: "carry at least one subject",
      hint: d.instructors_staffed,
      tone:
        s.roster_size > 0 && s.instructors_staffed === s.roster_size
          ? "good"
          : s.instructors_staffed > 0
            ? "warning"
            : "critical",
      badge: s.instructors_idle > 0 ? `${s.instructors_idle} idle` : "Fully staffed",
      meterPercent: s.roster_size > 0 ? (s.instructors_staffed / s.roster_size) * 100 : 0,
    },
    {
      title: "Curriculum covered",
      displayValue: `${s.curriculum_staffed_percent}%`,
      unit: `${s.curriculum_subjects_staffed} of ${s.curriculum_subjects_total} subjects`,
      hint: d.curriculum_staffed_percent,
      tone: ratioTone(s.curriculum_staffed_percent),
      badge:
        s.curriculum_subjects_unstaffed > 0
          ? `${s.curriculum_subjects_unstaffed} unstaffed`
          : "Complete",
      meterPercent: s.curriculum_staffed_percent,
    },
    {
      title: "Capacity used",
      displayValue: `${s.capacity_used_percent}%`,
      unit: `${s.capacity_booked_hours} h of ${s.capacity_total_hours} h cap`,
      hint: d.capacity_used_percent,
      tone: bandTone(s.capacity_used_percent),
      badge: s.instructors_over_cap > 0 ? `${s.instructors_over_cap} over cap` : "Within caps",
      meterPercent: s.capacity_used_percent,
    },
    {
      title: "Curriculum hours assigned",
      displayValue: `${s.curriculum_hours_assigned} h`,
      unit: "one section per subject",
      hint: d.curriculum_hours_assigned,
      tone: "neutral",
    },
    {
      title: "Assignments scheduled",
      displayValue: `${s.assignments_scheduled_percent}%`,
      unit: `${s.assignments_scheduled} of ${s.assignments_total} on the board`,
      hint: d.assignments_scheduled_percent,
      tone: ratioTone(s.assignments_scheduled_percent),
      badge:
        s.assignments_total > 0 && s.assignments_scheduled_percent < 100
          ? `${s.assignments_total - s.assignments_scheduled} unscheduled`
          : "All placed",
      meterPercent: s.assignments_scheduled_percent,
    },
    {
      title: "Instructors over cap",
      displayValue: String(s.instructors_over_cap),
      unit: "booked past weekly cap",
      hint: d.instructors_over_cap,
      tone: s.instructors_over_cap > 0 ? "critical" : "good",
      badge: s.instructors_over_cap > 0 ? "Needs attention" : "None",
    },
  ];
}

function LoadingSkeleton() {
  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-2">
          <Skeleton className="h-7 w-56" />
          <Skeleton className="h-4 w-80" />
        </div>
        <div className="flex gap-3">
          <Skeleton className="h-9 w-44 rounded-lg" />
          <Skeleton className="h-9 w-44 rounded-lg" />
        </div>
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="rounded-lg border border-slate-200 bg-white p-4 dark:border-white/10 dark:bg-navy-900">
            <Skeleton className="mb-3 h-3 w-1/3" />
            <Skeleton className="mb-2 h-8 w-1/2" />
            <Skeleton className="mb-3 h-3 w-1/4" />
            <Skeleton className="h-1.5 w-full" />
          </div>
        ))}
      </div>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Skeleton className="h-64 rounded-lg" />
        <Skeleton className="h-64 rounded-lg" />
        <Skeleton className="h-64 rounded-lg" />
      </div>
    </div>
  );
}

function UpdateIndicator({ visible }: { visible: boolean }) {
  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.8, transition: { duration: 0.15 } }}
          className="fixed bottom-4 right-4 z-50 flex items-center gap-2 rounded-full bg-navy-800 px-3 py-1.5 text-xs text-white shadow-lg dark:bg-navy-600"
        >
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ repeat: Infinity, duration: 1.2, ease: "linear" }}
            className="size-3 rounded-full border-2 border-white border-t-transparent"
          />
          Updating…
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function InsightCards({ insights }: { insights: Insight[] }) {
  return (
    <motion.div
      variants={staggerWidgets}
      initial="hidden"
      animate="visible"
      className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3"
    >
      {insights.map((insight, i) => (
        <motion.div
          key={i}
          variants={insightVariant}
          whileHover={{
            y: -3,
            boxShadow: "0 8px 20px -8px rgba(0,0,0,0.1)",
            transition: { duration: 0.2 },
          }}
          className="rounded-lg border border-slate-200 bg-white p-3 shadow-sm transition-shadow duration-200 hover:shadow-md dark:border-white/10 dark:bg-navy-900"
        >
          <motion.span
            initial={{ opacity: 0, x: -4 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.08 + i * 0.03, duration: 0.3 }}
            className="text-[10px] font-semibold uppercase tracking-wider"
            style={{ color: SEVERITY_COLORS[insight.severity] ?? SEVERITY_COLORS.info }}
          >
            {insight.severity}
          </motion.span>
          <p className="mt-1 text-sm font-medium text-slate-800 dark:text-slate-200">
            {insight.title}
          </p>
          <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">{insight.message}</p>
          {insight.action && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.15 + i * 0.03, duration: 0.3 }}
              className="mt-1 text-[11px] font-medium text-navy-600 dark:text-navy-400"
            >
              {insight.action}
            </motion.p>
          )}
        </motion.div>
      ))}
    </motion.div>
  );
}

function AttentionTable({ items }: { items: AttentionItem[] }) {
  if (items.length === 0) {
    return (
      <motion.div
        variants={popCard}
        className="flex h-64 items-center justify-center rounded-lg border border-slate-200 bg-white p-6 text-center text-sm text-slate-400 dark:border-white/10 dark:bg-navy-900 dark:text-slate-500"
      >
        Nothing needs a decision right now.
      </motion.div>
    );
  }
  const shown = items.slice(0, 12);
  const overflow = items.length - shown.length;
  return (
    <motion.div variants={popCard}>
      <Table>
        <TableHead>
          <TableRow>
            <TableHeader>Who</TableHeader>
            <TableHeader>Issue</TableHeader>
            <TableHeader className="hidden md:table-cell">Action</TableHeader>
          </TableRow>
        </TableHead>
        <TableBody>
          {shown.map((item, i) => (
            <TableRow key={i}>
              <TableCell>
                <span className="font-medium text-slate-800 dark:text-slate-200">
                  {item.instructor_name ?? item.subject_code ?? "—"}
                </span>
                {item.program_abbrev && (
                  <span className="ml-1 text-xs text-slate-400">({item.program_abbrev})</span>
                )}
              </TableCell>
              <TableCell>
                <span className="flex items-center gap-2">
                  <span
                    className="inline-flex shrink-0 items-center rounded-full px-2 py-0.5 text-[10px] font-medium"
                    style={{
                      backgroundColor: `${SEVERITY_COLORS[item.severity] ?? "#8b8f9c"}1f`,
                      color: SEVERITY_COLORS[item.severity] ?? "#8b8f9c",
                    }}
                  >
                    {item.severity}
                  </span>
                  <span className="font-medium text-slate-700 dark:text-slate-300">
                    {item.issue}
                  </span>
                </span>
                <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">{item.detail}</p>
              </TableCell>
              <TableCell className="hidden md:table-cell">
                <span className="text-xs text-slate-600 dark:text-slate-300">{item.action}</span>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      {overflow > 0 && (
        <p className="mt-2 text-[11px] text-slate-400 dark:text-slate-500">
          +{overflow} more in the full list.
        </p>
      )}
    </motion.div>
  );
}

export function DeanDashboard() {
  const [data, setData] = useState<DeanAnalyticsResponse | null>(null);
  const [syId, setSyId] = useState<number>(0);
  const [semId, setSemId] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [years, setYears] = useState<{ id: number; schoolYear: string }[]>([]);
  const [sems, setSems] = useState<{ id: number; semester: string; semesterNumber: number }[]>([]);

  const fetchTerms = useCallback(async () => {
    try {
      const [y, s] = await Promise.all([
        schoolYearService.list(),
        semesterService.list(),
      ]);
      setYears(y);
      setSems(s);
      const current = y.at(0);
      const first = s.find((s) => s.semesterNumber !== 3) ?? s.at(0);
      if (current) setSyId(current.id);
      if (first) setSemId(first.id);
    } catch {
      setYears([]);
      setSems([]);
    }
  }, []);

  useEffect(() => {
    fetchTerms();
  }, [fetchTerms]);

  useEffect(() => {
    if (!syId || !semId) return;
    let cancelled = false;
    const isInitial = !data;
    if (!isInitial) setRefreshing(true);
    if (isInitial) setLoading(true);
    setError(null);
    deanService
      .getAnalytics(syId, semId)
      .then((d) => {
        if (!cancelled) setData(d);
      })
      .catch((err) => {
        if (!cancelled) setError(err instanceof Error ? err.message : "Failed to load dashboard data.");
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false);
          setRefreshing(false);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [syId, semId]);

  const tiles = data ? buildTiles(data.summary, data.definitions) : [];

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
                  <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                    {data.meta.department ?? "Department"}
                  </h2>
                  <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                    {data.meta.school_year} · {data.meta.semester} · updated{" "}
                    {formatGeneratedAt(data.meta.generated_at)}
                  </p>
                </div>
                <motion.div
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1, duration: 0.3 }}
                  className="flex shrink-0 gap-3"
                >
                  <div className="w-44">
                    <Select
                      items={years.map((y) => ({ value: String(y.id), label: y.schoolYear }))}
                      value={syId ? String(syId) : ""}
                      onValueChange={(v) => {
                        if (v) setSyId(Number(v));
                      }}
                    >
                      <SelectTrigger id="dashboard-sy">
                        <SelectValue placeholder="School year" />
                      </SelectTrigger>
                      <SelectContent>
                        {years.map((y) => (
                          <SelectItem key={y.id} value={String(y.id)}>
                            {y.schoolYear}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="w-44">
                    <Select
                      items={sems.map((s) => ({ value: String(s.id), label: s.semester }))}
                      value={semId ? String(semId) : ""}
                      onValueChange={(v) => {
                        if (v) setSemId(Number(v));
                      }}
                    >
                      <SelectTrigger id="dashboard-sem">
                        <SelectValue placeholder="Semester" />
                      </SelectTrigger>
                      <SelectContent>
                        {sems.map((s) => (
                          <SelectItem key={s.id} value={String(s.id)}>
                            {s.semester}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </motion.div>
              </motion.div>

              {/* ─── Insights ─── */}
              {data.insights.length > 0 && (
                <motion.section variants={fadeSlideUp}>
                  <InsightCards insights={data.insights} />
                </motion.section>
              )}

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

              {/* ─── Load spread + fairness ─── */}
              <motion.section variants={fadeSlideUp}>
                <motion.div
                  variants={staggerWidgets}
                  initial="hidden"
                  animate="visible"
                  className="grid grid-cols-1 gap-4 lg:grid-cols-3"
                >
                  <div className="lg:col-span-2">
                    <ChartCard
                      title="Load spread by band"
                      subtitle="Instructors sorted into one band — the same ladder the meters and tile tones use."
                    >
                      <LoadBandChart bands={data.load_bands} />
                    </ChartCard>
                  </div>
                  <SpreadCard spread={data.spread} />
                </motion.div>
              </motion.section>

              {/* ─── Scheduling picture ─── */}
              <motion.section variants={fadeSlideUp}>
                <motion.div
                  variants={staggerWidgets}
                  initial="hidden"
                  animate="visible"
                  className="grid grid-cols-1 gap-4 md:grid-cols-2"
                >
                  <ChartCard
                    title="Booked hours by day"
                    subtitle="Department-wide booked load, Mon–Sat. The peak day is highlighted in gold."
                  >
                    <DailyHoursChart days={data.daily_load_hours} />
                  </ChartCard>
                  <ChartCard
                    title="Curriculum coverage by program"
                    subtitle="Subjects with at least one instructor assigned this term, split staffed vs unstaffed."
                  >
                    <CoverageStackedChart rows={data.curriculum_coverage.by_program} />
                  </ChartCard>
                </motion.div>
              </motion.section>

              {/* ─── Instructor loads + attention ─── */}
              <motion.section variants={fadeSlideUp}>
                <motion.div
                  variants={staggerWidgets}
                  initial="hidden"
                  animate="visible"
                  className="grid grid-cols-1 gap-4 lg:grid-cols-2"
                >
                  <ChartCard
                    title="Instructor load"
                    subtitle={`${data.instructor_loads.length} teaching term${data.instructor_loads.length === 1 ? "" : "s"} this term, heaviest first — booked hours against the cap.`}
                  >
                    <InstructorLoadMeters loads={data.instructor_loads} />
                  </ChartCard>
                  <div>
                    <h3 className="mb-3 text-base font-bold text-slate-800 dark:text-slate-200">
                      Needs attention
                    </h3>
                    <AttentionTable items={data.attention} />
                  </div>
                </motion.div>
              </motion.section>
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
