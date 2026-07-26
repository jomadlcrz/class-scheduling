import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router";
import { toast } from "sonner";
import { ConfirmDialog } from "~/components/ui/modal";
import { RoleGuard } from "~/auth/role-guard";
import { deanService } from "~/services/dean.service";
import type {
  TeachingTermDetail,
  TeachingTermDetailSubjectAssignment,
  TeachingTermDetailUnassignedSubject,
} from "~/types/faculty-load";
import { PageHeader } from "~/layouts/page-header";
import {
  ArrowLeftIcon,
  AlertTriangleIcon,
  TrashIcon,
  ClockIcon,
  BookOpenIcon,
  LayersIcon,
} from "~/components/ui/icons";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";

export default function DeanTeachingTermRoute() {
  return (
    <RoleGuard allow={["dean"]}>
      <DeanTeachingTermPage />
    </RoleGuard>
  );
}

function meta() {
  return [{ title: "Teaching Term Detail — GWC Class Scheduling" }];
}

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"] as const;

function utilizationColor(rate: number): string {
  if (rate > 100) return "text-red-600 dark:text-red-400";
  if (rate >= 80) return "text-amber-600 dark:text-amber-400";
  return "text-green-600 dark:text-green-400";
}

function utilizationBarColor(rate: number): string {
  if (rate > 100) return "bg-red-500";
  if (rate >= 80) return "bg-amber-500";
  return "bg-green-500";
}

function SummaryStat({ icon, label, value }: { icon: React.ReactNode; label: string; value: string | number }) {
  return (
    <div className="flex items-center gap-3">
      <span className="text-navy-700 dark:text-white">{icon}</span>
      <div>
        <p className="font-body text-xs text-slate-500 dark:text-slate-400">{label}</p>
        <p className="font-body text-base font-bold text-navy-800 dark:text-white">{value}</p>
      </div>
    </div>
  );
}

function DailyLoadStrip({ dailyLoads }: { dailyLoads: TeachingTermDetail["daily_loads"] }) {
  const maxHours = Math.max(...dailyLoads.map((d) => d.current_daily_hours), 1);
  return (
    <div className="grid grid-cols-6 gap-2">
      {dailyLoads.map((day) => {
        const pct = maxHours > 0 ? (day.current_daily_hours / maxHours) * 100 : 0;
        return (
          <div key={day.day_of_week} className="flex flex-col items-center gap-1.5">
            <span className="font-body text-xs font-medium text-slate-600 dark:text-slate-300">
              {day.day_name.slice(0, 3)}
            </span>
            <div className="relative h-24 w-full overflow-hidden rounded-lg border border-slate-200 bg-slate-50 dark:border-white/10 dark:bg-white/5">
              <div
                className={`absolute bottom-0 left-0 right-0 rounded-b-lg transition-all ${utilizationBarColor(
                  day.current_daily_hours > 0 ? 50 : 0,
                )}`}
                style={{ height: `${pct}%` }}
              />
            </div>
            <span className="font-body text-xs font-semibold text-navy-800 dark:text-white">
              {day.current_daily_hours}h
            </span>
          </div>
        );
      })}
    </div>
  );
}

function SubjectAssignmentRow({
  assignment,
  onRemove,
}: {
  assignment: TeachingTermDetailSubjectAssignment;
  onRemove: (assignmentId: number, subjectCode: string) => void;
}) {
  return (
    <tr className="border-t border-slate-200 dark:border-white/10">
      <td className="px-4 py-3">
        <span className="font-body text-sm font-semibold text-navy-800 dark:text-white">
          {assignment.subject_code}
        </span>
      </td>
      <td className="px-4 py-3 font-body text-sm text-slate-600 dark:text-slate-300">
        {assignment.descriptive_title}
      </td>
      <td className="px-4 py-3 text-center">
        <Badge tone="navy">{assignment.program_abbrev}</Badge>
      </td>
      <td className="px-4 py-3 text-center font-body text-sm text-slate-600 dark:text-slate-300">
        {assignment.year_level ? `${assignment.year_level}${ordinalSuffix(assignment.year_level)} Yr` : "—"}
      </td>
      <td className="px-4 py-3 text-center font-body text-sm text-slate-600 dark:text-slate-300">
        {assignment.semester_category ? `${assignment.semester_category}${ordinalSuffix(assignment.semester_category)} Sem` : "—"}
      </td>
      <td className="px-4 py-3 text-center font-body text-sm">{assignment.lec_hours}</td>
      <td className="px-4 py-3 text-center font-body text-sm">{assignment.lab_hours}</td>
      <td className="px-4 py-3 text-center font-body text-sm">{assignment.meetings ?? "—"}</td>
      <td className="px-4 py-3 text-center">
        <Badge tone={assignment.is_scheduled ? "green" : "slate"}>
          {assignment.is_scheduled ? `${assignment.scheduled_sessions.length} session${assignment.scheduled_sessions.length !== 1 ? "s" : ""}` : "Not scheduled"}
        </Badge>
      </td>
      <td className="px-4 py-3 text-center">
        <button
          type="button"
          onClick={() => onRemove(assignment.subject_assignment_id, assignment.subject_code ?? "this subject")}
          className="grid size-7 place-items-center rounded text-slate-400 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/30 dark:hover:text-red-400"
          aria-label={`Remove ${assignment.subject_code}`}
        >
          <TrashIcon />
        </button>
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

function UnassignedSubjectsWarning({ subjects }: { subjects: TeachingTermDetailUnassignedSubject[] }) {
  if (subjects.length === 0) return null;
  return (
    <div className="rounded-lg border border-amber-300 bg-amber-50 p-4 dark:border-amber-700/50 dark:bg-amber-900/20">
      <div className="flex items-start gap-3">
        <AlertTriangleIcon />
        <div>
          <p className="font-body text-sm font-semibold text-amber-800 dark:text-amber-300">
            Unassigned Scheduled Subjects
          </p>
          <p className="mt-1 font-body text-xs text-amber-700 dark:text-amber-400">
            The following subjects have scheduled sessions but are not assigned to this instructor. This may indicate a data integrity issue.
          </p>
          <ul className="mt-2 list-inside list-disc font-body text-xs text-amber-700 dark:text-amber-400">
            {subjects.map((s) => (
              <li key={s.subject_id}>
                {s.subject_code} — {s.descriptive_title} ({s.scheduled_sessions.length} session{s.scheduled_sessions.length !== 1 ? "s" : ""})
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}

function SubjectSessions({ assignment }: { assignment: TeachingTermDetailSubjectAssignment }) {
  if (!assignment.is_scheduled || assignment.scheduled_sessions.length === 0) return null;
  return (
    <tr className="bg-slate-50 dark:bg-white/2">
      <td colSpan={10} className="px-4 py-2">
        <div className="flex flex-wrap gap-1.5">
          {assignment.scheduled_sessions.map((sess) => (
            <span
              key={sess.regular_sched_id}
              className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-white px-2.5 py-0.5 font-body text-xs text-slate-600 dark:border-white/10 dark:bg-white/5 dark:text-slate-300"
            >
              <span className="font-medium">{sess.day}</span>
              <span>{sess.start_time}–{sess.end_time}</span>
              {sess.room && <span className="text-slate-400 dark:text-slate-500">@ {sess.room}</span>}
              {sess.set_code && <span className="text-slate-400 dark:text-slate-500">({sess.set_code})</span>}
            </span>
          ))}
        </div>
      </td>
    </tr>
  );
}

function DeanTeachingTermPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [detail, setDetail] = useState<TeachingTermDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [removeTarget, setRemoveTarget] = useState<{ assignmentId: number; subjectCode: string } | null>(null);
  const [deleteTarget, setDeleteTarget] = useState(false);
  const [deleteCascade, setDeleteCascade] = useState(false);

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

  async function handleRemoveAssignment() {
    if (!removeTarget) return;
    await deanService.removeSubjectAssignment(teachingTermId, removeTarget.assignmentId);
    toast.success("Subject assignment removed.");
    setRemoveTarget(null);
    // Reload
    const data = await deanService.getTeachingTermDetail(teachingTermId);
    setDetail(data);
  }

  async function handleDeleteTerm() {
    try {
      await deanService.deleteTeachingTerm(teachingTermId, deleteCascade);
      toast.success("Teaching term deleted.");
      navigate("/dean/subject-assignments");
    } catch (err) {
      if (err instanceof Error) {
        const msg = err.message;
        if (msg.includes("409") || msg.includes("subject assignment")) {
          // Has assignments — switch to cascade confirm
          setDeleteCascade(true);
        }
        throw err;
      }
      throw err;
    }
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
        <p className="py-12 text-center font-body text-sm text-slate-500">Loading teaching term…</p>
      </div>
    );
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

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      <PageHeader
        title={instructor.full_name ?? "Instructor"}
        description={`${instructor.department ?? ""} · ${term.school_year ?? ""} — ${term.semester ?? ""}`}
        actions={
          <div className="flex items-center gap-2">
            <Button type="button" variant="outline" block={false} onClick={() => navigate("/dean/subject-assignments")}>
              <ArrowLeftIcon /> Back
            </Button>
            <Button type="button" variant="danger" block={false} onClick={() => { setDeleteCascade(false); setDeleteTarget(true); }}>
              <TrashIcon /> Delete Term
            </Button>
          </div>
        }
      />

      {/* ── Hours summary ── */}
      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border border-slate-200 bg-white p-4 dark:border-white/10 dark:bg-white/5">
          <div className="flex items-center justify-between">
            <SummaryStat icon={<ClockIcon size={19} />} label="Max Weekly Hours" value={`${hours.max_weekly_hours}h`} />
            {hours.is_overloaded && <Badge tone="red">Overloaded</Badge>}
          </div>
          <div className="mt-3">
            <div className="flex items-center justify-between text-xs font-body text-slate-500 dark:text-slate-400">
              <span>{hours.current_weekly_hours}h used</span>
              <span>{hours.remaining_weekly_hours}h remaining</span>
            </div>
            <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-slate-100 dark:bg-white/10">
              <div
                className={`h-full rounded-full transition-all ${utilizationBarColor(hours.utilization_rate)}`}
                style={{ width: `${Math.min(hours.utilization_rate, 100)}%` }}
              />
            </div>
            <p className={`mt-1 text-right font-body text-xs font-semibold ${utilizationColor(hours.utilization_rate)}`}>
              {hours.utilization_rate}% utilization
            </p>
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4 dark:border-white/10 dark:bg-white/5">
          <SummaryStat icon={<BookOpenIcon />} label="Assigned Subjects" value={totals.assigned_subjects} />
          <p className="mt-2 font-body text-xs text-slate-500 dark:text-slate-400">
            {totals.total_units} total units · Expected {hours.expected_weekly_hours}h/week
          </p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4 dark:border-white/10 dark:bg-white/5">
          <SummaryStat icon={<LayersIcon />} label="Scheduled" value={`${totals.scheduled_subjects}/${totals.assigned_subjects}`} />
          <p className="mt-2 font-body text-xs text-slate-500 dark:text-slate-400">
            {totals.scheduled_sessions} session{totals.scheduled_sessions !== 1 ? "s" : ""} booked
          </p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4 dark:border-white/10 dark:bg-white/5">
          <SummaryStat icon={<ClockIcon size={19} />} label="Daily Hours" value={`${hours.total_daily_hours}h total`} />
          <p className="mt-2 font-body text-xs text-slate-500 dark:text-slate-400">
            Current weekly: {hours.current_weekly_hours}h
          </p>
        </div>
      </div>

      {/* ── Daily loads ── */}
      <div className="mt-6 rounded-xl border border-slate-200 bg-white p-5 dark:border-white/10 dark:bg-white/5">
        <h3 className="font-body text-sm font-bold text-navy-800 dark:text-white">Daily Load (Mon–Sat)</h3>
        <div className="mt-4">
          <DailyLoadStrip dailyLoads={daily_loads} />
        </div>
      </div>

      {/* ── Unassigned warning ── */}
      {unassigned_scheduled_subjects.length > 0 && (
        <div className="mt-6">
          <UnassignedSubjectsWarning subjects={unassigned_scheduled_subjects} />
        </div>
      )}

      {/* ── Subject assignments ── */}
      <div className="mt-6 rounded-xl border border-slate-200 bg-white dark:border-white/10 dark:bg-white/5">
        <div className="border-b border-slate-200 px-5 py-4 dark:border-white/10">
          <h3 className="font-body text-sm font-bold text-navy-800 dark:text-white">
            Assigned Subjects ({subject_assignments.length})
          </h3>
        </div>
        {subject_assignments.length === 0 ? (
          <div className="px-5 py-8 text-center font-body text-sm text-slate-500">
            No subjects assigned to this instructor for this term.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full font-body text-sm">
              <thead className="text-left text-xs text-slate-500 dark:text-slate-400">
                <tr>
                  <th className="px-4 py-3">Code</th>
                  <th className="px-4 py-3">Title</th>
                  <th className="px-4 py-3 text-center">Program</th>
                  <th className="px-4 py-3 text-center">Year</th>
                  <th className="px-4 py-3 text-center">Sem</th>
                  <th className="px-4 py-3 text-center">LEC</th>
                  <th className="px-4 py-3 text-center">LAB</th>
                  <th className="px-4 py-3 text-center">Mtgs</th>
                  <th className="px-4 py-3 text-center">Status</th>
                  <th className="px-4 py-3 text-center" />
                </tr>
              </thead>
              <tbody>
                {subject_assignments.map((a) => (
                  <SubjectAssignmentRow
                    key={a.subject_assignment_id}
                    assignment={a}
                    onRemove={(id, code) => setRemoveTarget({ assignmentId: id, subjectCode: code })}
                  />
                ))}
                {subject_assignments
                  .filter((a) => a.is_scheduled)
                  .map((a) => (
                    <SubjectSessions key={`sess-${a.subject_assignment_id}`} assignment={a} />
                  ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── Remove assignment confirm ── */}
      <ConfirmDialog
        open={removeTarget !== null}
        onClose={() => setRemoveTarget(null)}
        title="Remove Subject Assignment"
        confirmLabel="Remove"
        loadingLabel="Removing…"
        confirmVariant="danger"
        onConfirm={handleRemoveAssignment}
      >
        Are you sure you want to remove <strong>{removeTarget?.subjectCode}</strong> from this instructor&apos;s term?
        If this subject has scheduled sessions, the removal will be blocked.
      </ConfirmDialog>

      {/* ── Delete term confirm ── */}
      <ConfirmDialog
        open={deleteTarget}
        onClose={() => { setDeleteTarget(false); setDeleteCascade(false); }}
        title={deleteCascade ? "Delete Term with Assignments" : "Delete Teaching Term"}
        confirmLabel={deleteCascade ? "Delete All" : "Delete Term"}
        loadingLabel="Deleting…"
        confirmVariant="danger"
        onConfirm={handleDeleteTerm}
      >
        {deleteCascade ? (
          <p>
            This will permanently delete this teaching term, its daily loads, <strong>and all {totals.assigned_subjects} subject assignment(s)</strong>.
            If any subject is already scheduled, the deletion will be blocked.
          </p>
        ) : (
          <p>
            This will delete this teaching term and its daily loads.
            If it still has subject assignments, you&apos;ll be asked to confirm again with cascade enabled.
          </p>
        )}
      </ConfirmDialog>
    </div>
  );
}
