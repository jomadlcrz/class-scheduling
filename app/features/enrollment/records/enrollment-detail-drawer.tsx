import { useState } from "react";
import { toast } from "sonner";
import { Badge, type BadgeTone } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { Drawer } from "~/components/ui/drawer";
import { ConfirmDialog } from "~/components/ui/modal";
import { enrollmentService } from "~/services/enrollment.service";
import type { EnrollmentRow, EnrollmentStudent } from "~/types/enrollment";

const STATE_TONES: Record<string, BadgeTone> = {
  Enrolled: "emerald",
  Dropped: "red",
  Withdrawn: "gold",
  Voided: "slate",
};

/** State transitions the registrar can apply. Backend-owned vocabulary — shown verbatim. */
const STATES = ["Enrolled", "Dropped", "Withdrawn", "Voided"] as const;

type Props = {
  student: EnrollmentStudent | null;
  enrollment: EnrollmentRow | null;
  onClose: () => void;
  /** Refetch the directory after a successful write. */
  onChanged: () => void;
};

function DetailRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-baseline justify-between gap-4 py-1.5">
      <span className="font-body text-xs uppercase tracking-wide text-slate-400 dark:text-slate-500">
        {label}
      </span>
      <span className="text-right font-body text-sm text-navy-700 dark:text-mist-100">{value}</span>
    </div>
  );
}

export function EnrollmentDetailDrawer({ student, enrollment, onClose, onChanged }: Props) {
  const [pendingState, setPendingState] = useState<string | null>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);

  const open = student !== null && enrollment !== null;

  async function applyState() {
    if (!enrollment || !pendingState) return;
    const message = await enrollmentService.setEnrollmentState(enrollment.enrollmentId, pendingState);
    if (message) toast.success(message);
    onChanged();
    onClose();
  }

  async function applyDelete() {
    if (!enrollment) return;
    const message = await enrollmentService.deleteEnrollment(enrollment.enrollmentId);
    if (message) toast.success(message);
    onChanged();
    onClose();
  }

  return (
    <>
      <Drawer
        open={open}
        onClose={onClose}
        title={student?.name ?? "Enrollment"}
        description={student?.studentId ?? undefined}
      >
        {enrollment && student && (
          <div className="flex flex-col gap-6">
            <section className="rounded-xl border border-slate-200 px-4 py-2 dark:border-white/10">
              <DetailRow label="Term" value={`${enrollment.schoolYear ?? "—"} · Sem ${enrollment.semesterNumber}`} />
              <DetailRow label="Program" value={enrollment.program ?? "—"} />
              <DetailRow label="Year level" value={enrollment.yearLevel || "—"} />
              <DetailRow label="Type" value={enrollment.enrolledStatus} />
              <DetailRow label="Section" value={enrollment.set ?? <span className="text-slate-400">No section (irregular)</span>} />
              <DetailRow label="Student type" value={enrollment.studentType ?? "—"} />
              <DetailRow
                label="State"
                value={
                  <Badge tone={STATE_TONES[enrollment.enrollmentState] ?? "slate"}>
                    {enrollment.enrollmentState}
                  </Badge>
                }
              />
            </section>

            <section>
              <h3 className="mb-2 font-body text-sm font-semibold text-navy-700 dark:text-mist-100">
                Subjects
                <span className="ml-1.5 font-normal text-slate-400 dark:text-slate-500">
                  ({enrollment.subjects.length})
                </span>
              </h3>
              {enrollment.subjects.length === 0 ? (
                <p className="font-body text-sm text-slate-500 dark:text-slate-400">
                  No subjects recorded for this enrollment.
                </p>
              ) : (
                <ul className="divide-y divide-slate-100 rounded-xl border border-slate-200 dark:divide-white/8 dark:border-white/10">
                  {enrollment.subjects.map((s) => (
                    <li key={s.subjectId} className="flex items-baseline justify-between gap-3 px-3 py-2">
                      <span className="min-w-0">
                        <span className="font-body text-sm font-medium text-navy-700 dark:text-mist-100">
                          {s.subjectCode ?? "—"}
                        </span>
                        {s.descriptiveTitle && (
                          <span className="block truncate font-body text-xs text-slate-500 dark:text-slate-400">
                            {s.descriptiveTitle}
                          </span>
                        )}
                      </span>
                      {s.units != null && (
                        <span className="shrink-0 font-body text-xs tabular-nums text-slate-500 dark:text-slate-400">
                          {s.units} unit{s.units === 1 ? "" : "s"}
                        </span>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </section>

            <section>
              <h3 className="mb-2 font-body text-sm font-semibold text-navy-700 dark:text-mist-100">
                Change state
              </h3>
              <div className="flex flex-wrap gap-2">
                {STATES.filter((s) => s !== enrollment.enrollmentState).map((s) => (
                  <Button key={s} type="button" variant="outline" block={false} onClick={() => setPendingState(s)}>
                    Mark as {s}
                  </Button>
                ))}
              </div>
            </section>

            <section className="border-t border-slate-100 pt-4 dark:border-white/8">
              <Button
                type="button"
                variant="danger"
                block={false}
                disabled={enrollment.termClosed}
                onClick={() => setDeleteOpen(true)}
              >
                Delete enrollment
              </Button>
              {enrollment.termClosed && (
                <p className="mt-1.5 font-body text-xs text-slate-400 dark:text-slate-500">
                  Deleting is disabled once the term is closed — use a state change (drop/withdraw/void) instead.
                </p>
              )}
            </section>
          </div>
        )}
      </Drawer>

      <ConfirmDialog
        open={pendingState !== null}
        onClose={() => setPendingState(null)}
        title={`Mark ${student?.name ?? "student"} as ${pendingState}?`}
        confirmLabel={`Mark as ${pendingState}`}
        loadingLabel="Updating…"
        onConfirm={applyState}
      >
        This sets the enrollment state for {enrollment?.schoolYear ?? "this term"} · Sem{" "}
        {enrollment?.semesterNumber}. State changes are allowed even after the term is closed.
      </ConfirmDialog>

      <ConfirmDialog
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        title="Delete enrollment"
        confirmLabel="Delete"
        confirmVariant="danger"
        loadingLabel="Deleting…"
        onConfirm={applyDelete}
      >
        Permanently remove {student?.name}'s enrollment for this term? This can't be undone. To keep a record
        instead, drop or withdraw the student.
      </ConfirmDialog>
    </>
  );
}
