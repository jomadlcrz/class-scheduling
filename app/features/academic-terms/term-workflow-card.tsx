import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "~/components/ui/button";
import { Card } from "~/components/ui/card";
import { LockIcon } from "~/components/ui/icons";
import { ConfirmDialog } from "~/components/ui/modal";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "~/components/ui/select";
import { Spinner } from "~/components/ui/spinner";
import { Textarea } from "~/components/ui/textarea";
import { SchoolYearCloseDialog } from "~/features/academic-terms/school-year-close-dialog";
import { StatusBadge, closedReasonTone, termStatusTone } from "~/features/academic-terms/status-badges";
import { TermCloseDialog } from "~/features/academic-terms/term-close-dialog";
import { TermWorkflowTimeline } from "~/features/academic-terms/term-workflow-timeline";
import { useTermContext } from "~/features/academic-terms/term-context-provider";
import { termClosureService } from "~/services/term-closure.service";
import type { TermWorkflow } from "~/types/term-closure";

type TermWorkflowCardProps = {
  onChanged?: () => Promise<void>;
};

/** Academic year workflow — timeline stepper, semester cards, post/reopen actions. */
export function TermWorkflowCard({ onChanged }: TermWorkflowCardProps) {
  const { context, refresh, selectTerm } = useTermContext();
  const schoolYears = context?.schoolYears ?? [];
  const [syId, setSyId] = useState<number | null>(context?.selection.syId ?? null);
  const [workflow, setWorkflow] = useState<TermWorkflow | null>(null);
  const [loading, setLoading] = useState(false);
  const [closeSemester, setCloseSemester] = useState<number | null>(null);
  const [closeSchoolYearOpen, setCloseSchoolYearOpen] = useState(false);
  const [reopenSemester, setReopenSemester] = useState<number | null>(null);
  const [reopenReason, setReopenReason] = useState("");

  useEffect(() => {
    if (syId == null && context?.selection.syId != null) {
      setSyId(context.selection.syId);
    }
  }, [context?.selection.syId, syId]);

  useEffect(() => {
    if (syId == null) {
      setWorkflow(null);
      return;
    }

    let cancelled = false;
    setLoading(true);
    termClosureService
      .getTermWorkflow(syId)
      .then((data) => {
        if (!cancelled) setWorkflow(data);
      })
      .catch((err) => {
        if (!cancelled) {
          setWorkflow(null);
          toast.error(err instanceof Error ? err.message : "Unable to load workflow.");
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [syId]);

  async function reload() {
    if (syId == null) return;
    const data = await termClosureService.getTermWorkflow(syId);
    setWorkflow(data);
    await Promise.all([refresh(), onChanged?.()]);
  }

  async function handlePostTerm(reason: string) {
    if (syId == null || closeSemester == null) return;
    const message = await termClosureService.close(syId, closeSemester, reason || undefined);
    if (message) toast.success(message);
    setCloseSemester(null);
    await reload();
  }

  async function handleCloseSchoolYear(reason: string) {
    if (syId == null) return;
    const message = await termClosureService.closeSchoolYear(syId, reason || undefined);
    if (message) toast.success(message);
    await reload();
  }

  async function handleReopen() {
    if (syId == null || reopenSemester == null) return;
    const message = await termClosureService.reopen(
      syId,
      reopenSemester,
      reopenReason.trim() || undefined,
    );
    if (message) toast.success(message);
    setReopenSemester(null);
    setReopenReason("");
    await reload();
  }

  function handleNextAction() {
    if (!workflow) return;
    const action = workflow.workflow.nextAction;
    if (action.key === "close_semester" && action.semesterNumber != null) {
      setCloseSemester(action.semesterNumber);
      return;
    }
    if (action.key === "close_school_year") {
      setCloseSchoolYearOpen(true);
    }
  }

  const nextAction = workflow?.workflow.nextAction;
  const canRunNextAction = nextAction?.key === "close_semester" || nextAction?.key === "close_school_year";
  const reopenTarget = workflow?.semesters.find((row) => row.semesterNumber === reopenSemester);

  return (
    <>
      <Card className="overflow-hidden">
        <div className="border-b border-slate-100 bg-slate-50/60 px-5 py-4 dark:border-white/10 dark:bg-white/[0.03]">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="font-display text-base tracking-wide text-navy-700 dark:text-mist-100">
                Academic year workflow
              </h2>
              <p className="mt-1 font-body text-sm text-slate-500 dark:text-slate-400">
                Post each semester when grades are finalized, then close the school year.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <Select
                items={schoolYears.map((row) => ({ value: String(row.id), label: row.schoolYear }))}
                value={syId ? String(syId) : ""}
                onValueChange={(value) => {
                  if (!value) return;
                  const id = Number(value);
                  setSyId(id);
                  const sem = workflow?.workflow.activeSemesterNumber ?? 1;
                  void selectTerm(id, sem);
                }}
              >
                <SelectTrigger id="term-workflow-sy" aria-label="School year" className="w-44 bg-white dark:bg-surface-raised">
                  <SelectValue placeholder="School year" />
                </SelectTrigger>
                <SelectContent>
                  {schoolYears.map((row) => (
                    <SelectItem key={row.id} value={String(row.id)}>
                      {row.schoolYear}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {workflow && (
                workflow.workflow.schoolYearCompleted ? (
                  <StatusBadge tone="slate">School year closed</StatusBadge>
                ) : (
                  <StatusBadge tone="emerald">In progress</StatusBadge>
                )
              )}
            </div>
          </div>
        </div>

        <div className="p-5">
          {loading ? (
            <div role="status" aria-label="Loading workflow" className="grid place-items-center py-12">
              <Spinner />
            </div>
          ) : workflow ? (
            <div className="space-y-6">
              <TermWorkflowTimeline
                steps={workflow.workflow.steps}
                semesters={workflow.semesters}
                nextAction={workflow.workflow.nextAction}
                schoolYearLabel={workflow.schoolYear.schoolYear}
                onPostSemester={setCloseSemester}
                onReopenSemester={setReopenSemester}
                onCloseSchoolYear={() => setCloseSchoolYearOpen(true)}
              />

              <div className="flex flex-col gap-4 border-t border-slate-100 pt-6 sm:flex-row sm:items-end sm:justify-between dark:border-white/10">
                <div className="grid flex-1 gap-3 sm:grid-cols-2">
                  {workflow.semesters.map((semester) => (
                    <div
                      key={semester.semesterNumber}
                      className={`rounded-lg border px-4 py-3 ${
                        semester.status === "Closed"
                          ? "border-amber-200/80 bg-amber-50/50 dark:border-gold-400/20 dark:bg-gold-400/5"
                          : "border-slate-200 bg-slate-50/40 dark:border-white/10 dark:bg-white/[0.02]"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="font-body text-sm font-medium text-navy-700 dark:text-mist-100">
                            {semester.semesterName}
                          </p>
                          <div className="mt-1.5">
                            {semester.status === "Open" ? (
                              <StatusBadge tone={termStatusTone("Open")}>Open</StatusBadge>
                            ) : (
                              <StatusBadge tone={closedReasonTone(semester.closedReason)}>
                                {semester.closedReasonLabel ?? "Closed"}
                              </StatusBadge>
                            )}
                          </div>
                        </div>

                        <div className="flex shrink-0 gap-1.5">
                          {semester.actions.canClose && (
                            <button
                              type="button"
                              onClick={() => setCloseSemester(semester.semesterNumber)}
                              className="rounded-md border border-amber-200 bg-white px-2.5 py-1 font-body text-xs font-medium text-amber-800 transition-colors hover:bg-amber-50 dark:border-gold-400/30 dark:bg-surface-raised dark:text-gold-200 dark:hover:bg-gold-400/10"
                            >
                              Post
                            </button>
                          )}
                          {semester.actions.canReopen && (
                            <button
                              type="button"
                              onClick={() => setReopenSemester(semester.semesterNumber)}
                              className="rounded-md border border-slate-200 bg-white px-2.5 py-1 font-body text-xs font-medium text-slate-700 transition-colors hover:bg-slate-50 dark:border-white/15 dark:bg-surface-raised dark:text-slate-200 dark:hover:bg-white/10"
                            >
                              Reopen
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {canRunNextAction && (
                  <div className="shrink-0">
                    <Button type="button" block={false} disabled={loading} onClick={handleNextAction}>
                      <LockIcon size={16} />
                      {nextAction?.label}
                    </Button>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <p className="py-8 text-center font-body text-sm text-slate-500 dark:text-slate-400">
              Select a school year to view the workflow.
            </p>
          )}
        </div>
      </Card>

      <TermCloseDialog
        open={closeSemester != null}
        syId={syId}
        semesterNumber={closeSemester}
        onClose={() => setCloseSemester(null)}
        onConfirm={handlePostTerm}
      />

      <SchoolYearCloseDialog
        open={closeSchoolYearOpen}
        syId={syId}
        onClose={() => setCloseSchoolYearOpen(false)}
        onConfirm={handleCloseSchoolYear}
      />

      <ConfirmDialog
        open={reopenSemester != null}
        onClose={() => {
          setReopenSemester(null);
          setReopenReason("");
        }}
        title="Reopen term"
        confirmLabel="Reopen term"
        loadingLabel="Reopening…"
        onConfirm={handleReopen}
      >
        <p>
          Reopen {reopenTarget?.semesterName}, S.Y. {workflow?.schoolYear.schoolYear}? Destructive deletes
          will work again until you post the term.
        </p>
        <div className="mt-4">
          <Textarea
            id="workflow-reopen-reason"
            label="Reason for reopening"
            value={reopenReason}
            onChange={(event) => setReopenReason(event.target.value)}
            placeholder="Optional notes for the audit trail"
          />
        </div>
      </ConfirmDialog>
    </>
  );
}
