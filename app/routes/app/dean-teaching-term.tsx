import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router";
import { RoleGuard } from "~/auth/role-guard";
import { deanService } from "~/services/dean.service";
import type {
  TeachingTermDetail,
  TeachingTermDetailSubjectAssignment,
  TeachingTermDetailScheduledSession,
  TeachingTermDetailUnassignedSubject,
} from "~/types/faculty-load";
import { PageHeader } from "~/layouts/page-header";
import {
  ArrowLeftIcon,
  AlertTriangleIcon,
  ChevronDownIcon,
  ChevronRightIcon,
  ClockIcon,
  BookOpenIcon,
  LayersIcon,
} from "~/components/ui/icons";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { Table, TableHead, TableHeader, TableBody, TableCell } from "~/components/ui/table";
import { Skeleton } from "~/components/ui/skeleton";

function TermSkeleton() {
  return (
    <div className="mx-auto max-w-7xl space-y-6 px-4 py-8 sm:px-6">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <Skeleton className="h-7 w-72" />
          <Skeleton className="h-4 w-48" />
        </div>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="rounded-xl border border-slate-200 bg-white p-4 dark:border-white/10 dark:bg-white/5">
            <Skeleton className="mb-2 h-3 w-1/2" />
            <Skeleton className="mb-3 h-7 w-1/3" />
            <Skeleton className="mb-2 h-3 w-3/4" />
            <Skeleton className="h-2 w-full" />
          </div>
        ))}
      </div>
      <div className="rounded-xl border border-slate-200 bg-white p-4 dark:border-white/10 dark:bg-white/5">
        <Skeleton className="mb-4 h-4 w-40" />
        <div className="grid grid-cols-6 gap-2">
          {[1, 2, 3, 4, 5, 6].map((d) => (
            <div key={d} className="flex flex-col items-center gap-1.5">
              <Skeleton className="h-3 w-6" />
              <Skeleton className="h-24 w-full rounded-lg" />
              <Skeleton className="h-3 w-6" />
            </div>
          ))}
        </div>
      </div>
      <div>
        <Skeleton className="mb-4 h-4 w-44" />
        <Table>
          <TableHead>
            <TableHeader>Code</TableHeader>
            <TableHeader>Title</TableHeader>
            <TableHeader className="text-center">Program</TableHeader>
            <TableHeader className="text-center">Year</TableHeader>
            <TableHeader className="text-center">Sem</TableHeader>
            <TableHeader className="text-center">LEC</TableHeader>
            <TableHeader className="text-center">LAB</TableHeader>
            <TableHeader className="text-center">Mtgs</TableHeader>
            <TableHeader className="text-center">Status</TableHeader>
          </TableHead>
          <TableBody>
            {[1, 2, 3, 4].map((r) => (
              <tr key={r}>
                {[0, 1, 2, 3, 4, 5, 6, 7, 8].map((c) => (
                  <td key={c} className="px-4 py-3.5">
                    <Skeleton className={`h-4 ${c === 1 ? "w-44" : c <= 3 ? "w-12" : "w-6"}`} />
                  </td>
                ))}
              </tr>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

export default function DeanTeachingTermRoute() {
  return (
    <RoleGuard allow={["dean"]}>
      <DeanTeachingTermPage />
    </RoleGuard>
  );
}

export function meta() {
  return [{ title: "Teaching Term Detail — GWC Class Scheduling" }];
}

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"] as const;
const DAY_ORDER: Record<string, number> = Object.fromEntries(DAYS.map((d, i) => [d, i]));

/** Stable-sorts sessions Mon → Sat; the API doesn't guarantee day order. */
function sortSessionsByDay(sessions: TeachingTermDetailScheduledSession[]) {
  return [...sessions].sort((a, b) => (DAY_ORDER[a.day] ?? 99) - (DAY_ORDER[b.day] ?? 99));
}

const barColors = {
  green: "bg-emerald-500 dark:bg-emerald-400",
  amber: "bg-amber-500 dark:bg-amber-400",
  red: "bg-red-500 dark:bg-red-400",
  slate: "bg-slate-300 dark:bg-white/10",
};

function utilizationMeta(rate: number) {
  if (rate > 100) return { color: "text-red-600 dark:text-red-400", bar: barColors.red };
  if (rate >= 80) return { color: "text-amber-600 dark:text-amber-400", bar: barColors.amber };
  return { color: "text-emerald-600 dark:text-emerald-400", bar: barColors.green };
}

function StatCard({ icon, label, value, children }: { icon: React.ReactNode; label: string; value: string | number; children?: React.ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-xl border border-slate-200 bg-white p-5 dark:border-white/10 dark:bg-white/5"
    >
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <span className="shrink-0 text-navy-700 dark:text-white">{icon}</span>
          <div>
            <p className="font-body text-xs font-medium text-slate-500 dark:text-slate-400">{label}</p>
            <p className="font-body text-xl font-bold tracking-tight text-navy-800 dark:text-white">{value}</p>
          </div>
        </div>
      </div>
      {children}
    </motion.div>
  );
}

function DailyLoadStrip({ dailyLoads }: { dailyLoads: TeachingTermDetail["daily_loads"] }) {
  const maxHours = Math.max(...dailyLoads.map((d) => d.current_daily_hours), 1);
  return (
    <div className="grid grid-cols-6 gap-3">
      {dailyLoads.map((day, idx) => {
        const pct = maxHours > 0 ? (day.current_daily_hours / maxHours) * 100 : 0;
        const meta = utilizationMeta(day.current_daily_hours > 4 ? 85 : day.current_daily_hours > 2 ? 60 : 10);
        return (
          <motion.div
            key={day.day_of_week}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.05 }}
            className="flex flex-col items-center gap-2"
          >
            <span className="font-body text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              {day.day_name.slice(0, 3)}
            </span>
            <div className="group relative flex w-full items-end justify-center" style={{ height: 96 }}>
              <div className="absolute bottom-0 left-0 right-0 rounded-lg border border-slate-100 bg-slate-50 dark:border-white/5 dark:bg-white/5" style={{ height: "100%" }} />
              <motion.div
                initial={{ height: 0 }}
                animate={{ height: `${pct}%` }}
                transition={{ type: "spring", stiffness: 80, damping: 14, delay: idx * 0.05 }}
                className={`absolute bottom-0 left-0 right-0 rounded-lg ${meta.bar} min-h-1`}
              />
              {day.current_daily_hours > 0 && (
                <span className="relative z-10 mt-auto pb-1 font-body text-[11px] font-bold text-slate-700 dark:text-white">
                  {day.current_daily_hours}h
                </span>
              )}
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}

function SessionsDropdown({ sessions }: { sessions: TeachingTermDetailScheduledSession[] }) {
  const sorted = sortSessionsByDay(sessions);
  const reduceMotion = useReducedMotion();
  return (
    <tr>
      <td colSpan={9} className="bg-slate-50/70 p-0 dark:bg-white/[0.03]">
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: "auto", opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          transition={{ duration: reduceMotion ? 0 : 0.2, ease: "easeInOut" }}
          className="overflow-hidden"
        >
          <div className="grid gap-2 px-4 py-3 sm:grid-cols-2 lg:grid-cols-3">
            {sorted.map((sess) => (
              <div
                key={sess.regular_sched_id}
                className="rounded-lg border border-slate-200 bg-white px-3.5 py-2.5 dark:border-white/10 dark:bg-white/5"
              >
                <p className="font-body text-sm font-semibold text-navy-800 dark:text-white">
                  {sess.day} · {sess.start_time}–{sess.end_time}
                </p>
                <div className="mt-0.5 flex flex-wrap items-center gap-2 font-body text-xs text-slate-500 dark:text-slate-400">
                  {sess.room && <span>Room {sess.room}</span>}
                  {sess.set_code && <span className="rounded bg-slate-100 px-1.5 py-0.5 dark:bg-white/10">{sess.set_code}</span>}
                  {sess.mode && <span>{sess.mode}</span>}
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      </td>
    </tr>
  );
}

function ordinalSuffix(n: number): string {
  const mod100 = n % 100;
  if (mod100 >= 11 && mod100 <= 13) return "th";
  switch (n % 10) {
    case 1: return "st";
    case 2: return "nd";
    case 3: return "rd";
    default: return "th";
  }
}

function SubjectAssignmentRow({
  assignment,
}: {
  assignment: TeachingTermDetailSubjectAssignment;
}) {
  const [expanded, setExpanded] = useState(false);
  const sessions = assignment.is_scheduled ? assignment.scheduled_sessions : [];
  const hasSessions = sessions.length > 0;
  const yr = assignment.year_level ? `${assignment.year_level}${ordinalSuffix(assignment.year_level)} Yr` : null;
  const sem = assignment.semester_category ? `${assignment.semester_category}${ordinalSuffix(assignment.semester_category)} Sem` : null;

  return (
    <>
      <motion.tr
        layout
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        onClick={() => hasSessions && setExpanded((v) => !v)}
        className={`group/row transition-colors hover:bg-slate-50 dark:hover:bg-white/5 ${hasSessions ? "cursor-pointer" : ""}`}
      >
        <TableCell className="py-3.5">
          <span className="flex items-center gap-1.5 font-body text-sm font-semibold text-navy-800 dark:text-white">
            {hasSessions && (
              <span className="shrink-0 text-slate-400">
                {expanded ? <ChevronDownIcon /> : <ChevronRightIcon />}
              </span>
            )}
            {assignment.subject_code}
          </span>
        </TableCell>
        <TableCell className="py-3.5">
          {assignment.descriptive_title}
        </TableCell>
        <TableCell className="py-3.5 text-center">
          <Badge tone="navy">{assignment.program_abbrev}</Badge>
          {assignment.is_shared && assignment.also_carried_by.length > 0 && (
            <span className="mt-0.5 block font-body text-[10px] text-slate-400 dark:text-slate-500">
              +{assignment.also_carried_by.map((p) => p.program_abbrev).join(", ")}
            </span>
          )}
        </TableCell>
        <TableCell className="py-3.5 text-center">
          {yr ?? "—"}
        </TableCell>
        <TableCell className="py-3.5 text-center">
          {sem ?? "—"}
        </TableCell>
        <TableCell className="py-3.5 text-center tabular-nums text-slate-600 dark:text-slate-300">
          {assignment.lec_hours}
        </TableCell>
        <TableCell className="py-3.5 text-center tabular-nums text-slate-600 dark:text-slate-300">
          {assignment.lab_hours}
        </TableCell>
        <TableCell className="py-3.5 text-center tabular-nums text-slate-600 dark:text-slate-300">
          {assignment.meetings ?? "—"}
        </TableCell>
        <TableCell className="py-3.5 text-center">
          {hasSessions ? (
            <span className="font-body text-xs font-medium text-emerald-600 dark:text-emerald-400">
              {sessions.length} session{sessions.length > 1 ? "s" : ""}
            </span>
          ) : (
            <span className="font-body text-xs text-slate-400 dark:text-slate-500">Not scheduled</span>
          )}
        </TableCell>
      </motion.tr>
      <AnimatePresence initial={false}>
        {expanded && hasSessions && <SessionsDropdown key="dropdown" sessions={sessions} />}
      </AnimatePresence>
    </>
  );
}

function UnassignedSubjectsWarning({ subjects }: { subjects: TeachingTermDetailUnassignedSubject[] }) {
  if (subjects.length === 0) return null;
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="overflow-hidden rounded-xl border border-amber-200 bg-amber-50 dark:border-amber-700/40 dark:bg-amber-900/15"
    >
      <div className="flex items-start gap-4 p-5">
        <span className="shrink-0 text-amber-600 dark:text-amber-400"><AlertTriangleIcon /></span>
        <div>
          <p className="font-body text-sm font-semibold text-amber-900 dark:text-amber-200">
            Unassigned Scheduled Subjects
          </p>
          <p className="mt-1 font-body text-xs leading-relaxed text-amber-700 dark:text-amber-400">
            These subjects have scheduled sessions but are not assigned to this instructor. This may indicate a data integrity issue.
          </p>
          <ul className="mt-3 space-y-1">
            {subjects.map((s) => (
              <li key={s.subject_id} className="flex items-center gap-2 font-body text-xs text-amber-800 dark:text-amber-300">
                <span className="size-1 rounded-full bg-amber-400 shrink-0" />
                <span className="font-semibold">{s.subject_code}</span>
                <span className="text-amber-600 dark:text-amber-400">—</span>
                <span>{s.descriptive_title}</span>
                <Badge tone="gold">{s.scheduled_sessions.length} session{s.scheduled_sessions.length !== 1 ? "s" : ""}</Badge>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </motion.div>
  );
}

function DeanTeachingTermPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [detail, setDetail] = useState<TeachingTermDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const teachingTermId = Number(id);

  useEffect(() => {
    if (!teachingTermId) return;
    let cancelled = false;
    setLoading(true);
    setError(null);
    deanService
      .getTeachingTermDetail(teachingTermId)
      .then((data) => {
        if (!cancelled) setDetail(data);
      })
      .catch((err) => {
        if (!cancelled) setError(err instanceof Error ? err.message : "Unable to load teaching term.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, [teachingTermId]);

  if (loading) {
    return <TermSkeleton />;
  }

  if (error || !detail) {
    return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
        <PageHeader
          title="Teaching Term Not Found"
          description={error ?? "The requested teaching term could not be loaded."}
          actions={
            <Button type="button" variant="outline" block={false} onClick={() => navigate("/dean/subject-assignments")}>
              <ArrowLeftIcon /> Back to Assignments
            </Button>
          }
        />
      </div>
    );
  }

  const { instructor, term, hours, totals, daily_loads, subject_assignments, unassigned_scheduled_subjects } = detail;
  const meta = utilizationMeta(hours.utilization_rate);

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      {/* ── Header: Instructor info + actions ── */}
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between"
      >
        <div className="flex items-center gap-4">
          {instructor.profile_photo_url ? (
            <img
              src={instructor.profile_photo_url}
              alt=""
              className="size-12 shrink-0 rounded-full bg-slate-100 object-cover dark:bg-white/10"
            />
          ) : (
            <div className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-navy-800 text-sm font-bold text-white dark:bg-white/10 dark:text-white">
              {instructor.full_name?.split(" ").map((n) => n[0]).join("").slice(0, 2) ?? "IN"}
            </div>
          )}
          <div>
            <h1 className="font-body text-xl font-bold text-navy-900 dark:text-white">
              {instructor.full_name ?? "Instructor"}
            </h1>
            <div className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-0.5 font-body text-xs text-slate-500 dark:text-slate-400">
              {instructor.department && <span>{instructor.department}</span>}
              {term.school_year && <><span className="text-slate-300 dark:text-slate-600">·</span><span>{term.school_year} — {term.semester}</span></>}
            </div>
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <Button type="button" variant="outline" block={false} onClick={() => navigate("/dean/subject-assignments")}>
            <ArrowLeftIcon /> Back
          </Button>
        </div>
      </motion.div>

      {/* ── Stats grid ── */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard icon={<ClockIcon size={19} />} label="Weekly Hours" value={`${hours.max_weekly_hours}h`}>
          <div className="mt-3 flex items-center gap-2">
            {hours.is_overloaded && <Badge tone="red">Overloaded</Badge>}
            <span className="font-body text-[11px] text-slate-400 dark:text-slate-500">max</span>
          </div>
          <div className="mt-4 space-y-1.5">
            <div className="flex items-center justify-between font-body text-xs text-slate-500 dark:text-slate-400">
              <span>{hours.current_weekly_hours}h used</span>
              <span>{hours.remaining_weekly_hours}h remaining</span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-slate-100 dark:bg-white/10">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${Math.min(hours.utilization_rate, 100)}%` }}
                transition={{ duration: 0.8, ease: "easeOut", delay: 0.2 }}
                className={`h-full rounded-full ${meta.bar}`}
              />
            </div>
            <p className={`text-right font-body text-xs font-semibold ${meta.color}`}>
              {hours.utilization_rate}% utilization
            </p>
          </div>
        </StatCard>

        <StatCard icon={<BookOpenIcon />} label="Assigned Subjects" value={totals.assigned_subjects}>
          <div className="mt-4 space-y-1 font-body text-xs text-slate-500 dark:text-slate-400">
            <div className="flex items-center justify-between">
              <span>Total units</span>
              <span className="font-semibold text-navy-700 dark:text-white">{totals.total_units}</span>
            </div>
            <div className="flex items-center justify-between">
              <span>Expected / week</span>
              <span className="font-semibold text-navy-700 dark:text-white">{hours.expected_weekly_hours}h</span>
            </div>
          </div>
        </StatCard>

        <StatCard icon={<LayersIcon />} label="Scheduled Subjects" value={`${totals.scheduled_subjects}/${totals.assigned_subjects}`}>
          <div className="mt-4 space-y-1 font-body text-xs text-slate-500 dark:text-slate-400">
            <div className="flex items-center justify-between">
              <span>Booked sessions</span>
              <span className="font-semibold text-navy-700 dark:text-white">{totals.scheduled_sessions}</span>
            </div>
            <div className="h-1.5 overflow-hidden rounded-full bg-slate-100 dark:bg-white/10">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${totals.assigned_subjects > 0 ? (totals.scheduled_subjects / totals.assigned_subjects) * 100 : 0}%` }}
                transition={{ duration: 0.6, ease: "easeOut", delay: 0.3 }}
                className="h-full rounded-full bg-blue-500 dark:bg-blue-400"
              />
            </div>
          </div>
        </StatCard>

        <StatCard icon={<ClockIcon size={19} />} label="Daily Hours" value={`${hours.total_daily_hours}h total`}>
          <div className="mt-4 space-y-1 font-body text-xs text-slate-500 dark:text-slate-400">
            <div className="flex items-center justify-between">
              <span>Current weekly</span>
              <span className="font-semibold text-navy-700 dark:text-white">{hours.current_weekly_hours}h</span>
            </div>
          </div>
        </StatCard>
      </div>

      {/* ── Daily loads ── */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        className="mt-6 rounded-xl border border-slate-200 bg-white p-5 dark:border-white/10 dark:bg-white/5"
      >
        <div className="flex items-center justify-between">
          <h3 className="font-body text-sm font-bold text-navy-800 dark:text-white">Daily Load (Mon–Sat)</h3>
          <span className="font-body text-[11px] text-slate-400 dark:text-slate-500">hours per day</span>
        </div>
        <div className="mt-5">
          <DailyLoadStrip dailyLoads={daily_loads} />
        </div>
      </motion.div>

      {/* ── Unassigned warning ── */}
      {unassigned_scheduled_subjects.length > 0 && (
        <div className="mt-6">
          <UnassignedSubjectsWarning subjects={unassigned_scheduled_subjects} />
        </div>
      )}

      {/* ── Subject assignments table ── */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="mt-6"
      >
        <div className="mb-4 flex items-center justify-between">
          <h3 className="font-body text-sm font-bold text-navy-800 dark:text-white">
            Subject Assignments
            <span className="ml-1.5 font-normal text-slate-400 dark:text-slate-500">({subject_assignments.length})</span>
          </h3>
        </div>
        {subject_assignments.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-12 text-center">
            <BookOpenIcon />
            <p className="font-body text-sm text-slate-500 dark:text-slate-400">
              No subjects assigned to this instructor for this term.
            </p>
          </div>
        ) : (
          <Table>
            <TableHead>
              <TableHeader>Code</TableHeader>
              <TableHeader>Title</TableHeader>
              <TableHeader className="text-center">Program</TableHeader>
              <TableHeader className="text-center">Year</TableHeader>
              <TableHeader className="text-center">Sem</TableHeader>
              <TableHeader className="text-center">LEC</TableHeader>
              <TableHeader className="text-center">LAB</TableHeader>
              <TableHeader className="text-center">Mtgs</TableHeader>
              <TableHeader className="text-center">Status</TableHeader>
            </TableHead>
            <TableBody>
              <AnimatePresence>
                {subject_assignments.map((a) => (
                  <SubjectAssignmentRow
                    key={a.subject_assignment_id}
                    assignment={a}
                  />
                ))}
              </AnimatePresence>
            </TableBody>
          </Table>
        )}
      </motion.div>
    </div>
  );
}
