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
import { useTermContext } from "~/features/academic-terms/term-context-provider";
import { termClosureService } from "~/services/term-closure.service";
import type { TermWorkflow, TermWorkflowStep } from "~/types/term-closure";

type TermWorkflowCardProps = {
  onChanged?: () => Promise<void>;
};

const actionButtonClassName =
  "inline-flex cursor-pointer items-center gap-1.5 rounded-lg border px-2.5 py-1.5 font-body text-xs font-medium transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-400";

function stepTone(status: TermWorkflowStep["status"]) {
  if (status === "completed") return "emerald" as const;
  if (status === "current") return "gold" as const;
  return "slate" as const;
}

/** Academic year workflow — post semesters, reopen when allowed, close the school year. */
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
      <Card className="p-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap items-center gap-3">
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
              <SelectTrigger id="term-workflow-sy" aria-label="School year" className="w-44">
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
              <div className="flex items-center gap-2">
                {workflow.workflow.schoolYearCompleted ? (
                  <StatusBadge tone="slate">School year closed</StatusBadge>
                ) : (
                  <StatusBadge tone="emerald">In progress</StatusBadge>
                )}
              </div>
            )}
          </div>

          {canRunNextAction && (
            <Button type="button" block={false} disabled={loading} onClick={handleNextAction}>
              <LockIcon size={16} />
              {nextAction?.label}
            </Button>
          )}
        </div>

        {loading ? (
          <div role="status" aria-label="Loading workflow" className="mt-6 grid place-items-center py-10">
            <Spinner />
          </div>
        ) : workflow ? (
          <>
            <ol className="mt-6 flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:gap-0">
              {workflow.workflow.steps.map((step, index) => (
                <li key={step.key} className="flex min-w-0 flex-1 items-center gap-2 sm:flex-col sm:px-2 sm:text-center">
                  <div className="flex w-full items-center gap-2 sm:flex-col">
                    <span
                      className={`grid size-7 shrink-0 place-items-center rounded-full font-body text-xs font-semibold ${
                        step.status === "completed"
                          ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-400/15 dark:text-emerald-400"
                          : step.status === "current"
                            ? "bg-amber-100 text-amber-800 dark:bg-gold-400/15 dark:text-gold-300"
                            : "bg-slate-100 text-slate-500 dark:bg-white/10 dark:text-slate-400"
                      }`}
                    >
                      {index + 1}
                    </span>
                    <div className="min-w-0 flex-1 sm:mt-2">
                      <p className="truncate font-body text-xs font-medium text-navy-700 dark:text-mist-100">
                        {step.label}
                      </p>
                      <StatusBadge tone={stepTone(step.status)}>{step.status}</StatusBadge>
                    </div>
                  </div>
                  {index < workflow.workflow.steps.length - 1 && (
                    <span
                      className="hidden h-px flex-1 bg-slate-200 sm:block dark:bg-white/10"
                      aria-hidden="true"
                    />
                  )}
                </li>
              ))}
            </ol>

            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              {workflow.semesters.map((semester) => (
                <div
                  key={semester.semesterNumber}
                  className="flex flex-col gap-3 rounded-lg border border-slate-200 px-4 py-3 dark:border-white/10"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
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
                          className={`${actionButtonClassName} border-amber-200 text-amber-700 hover:bg-amber-50 dark:border-gold-400/30 dark:text-gold-300 dark:hover:bg-gold-400/10`}
                        >
                          Post
                        </button>
                      )}
                      {semester.actions.canReopen && (
                        <button
                          type="button"
                          onClick={() => setReopenSemester(semester.semesterNumber)}
                          className={`${actionButtonClassName} border-slate-200 text-slate-700 hover:bg-slate-50 dark:border-white/15 dark:text-slate-200 dark:hover:bg-white/10`}
                        >
                          Reopen
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        ) : null}
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
