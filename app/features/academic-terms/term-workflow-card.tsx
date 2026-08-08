import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "~/components/ui/button";
import { Card } from "~/components/ui/card";
import { LockIcon } from "~/components/ui/icons";
import { ConfirmDialog } from "~/components/ui/modal";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "~/components/ui/select";
import { TimelineSkeleton } from "~/components/ui/skeleton";
import { Textarea } from "~/components/ui/textarea";
import { SchoolYearCloseDialog } from "~/features/academic-terms/school-year-close-dialog";
import { StatusBadge } from "~/features/academic-terms/status-badges";
import { TermCloseDialog } from "~/features/academic-terms/term-close-dialog";
import { TermWorkflowTimeline } from "~/features/academic-terms/term-workflow-timeline";
import { useTermContext } from "~/features/academic-terms/term-context-provider";
import { termClosureService } from "~/services/term-closure.service";
import type { TermWorkflow } from "~/types/term-closure";

type TermWorkflowCardProps = {
  onChanged?: () => Promise<void>;
  refreshKey?: number;
};

/** Academic year workflow — timeline stepper, semester cards, post/reopen actions. */
export function TermWorkflowCard({ onChanged, refreshKey = 0 }: TermWorkflowCardProps) {
  const { context, refresh, selectTerm } = useTermContext();
  const schoolYears = context?.schoolYears ?? [];
  const [syId, setSyId] = useState<number | null>(context?.selection.syId ?? null);
  const [workflow, setWorkflow] = useState<TermWorkflow | null>(null);
  const [loading, setLoading] = useState(false);
  const [closeSemester, setCloseSemester] = useState<number | null>(null);
  const [closeSchoolYearOpen, setCloseSchoolYearOpen] = useState(false);
  const [reopenSchoolYearOpen, setReopenSchoolYearOpen] = useState(false);
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
  }, [syId, refreshKey]);

  async function reload() {
    if (syId == null) return;
    const data = await termClosureService.getTermWorkflow(syId);
    setWorkflow(data);
    await Promise.all([refresh(), onChanged?.()]);
  }

  async function handlePostTerm(reason: string) {
    if (syId == null || closeSemester == null) return;
    const message = await termClosureService.patchTermState(
      syId,
      closeSemester,
      "closed",
      reason || undefined,
    );
    if (message) toast.success(message);
    setCloseSemester(null);
    await reload();
  }

  async function handleCloseSchoolYear(reason: string) {
    if (syId == null) return;
    const message = await termClosureService.patchSchoolYearState(syId, "closed", reason || undefined);
    if (message) toast.success(message);
    setCloseSchoolYearOpen(false);
    await reload();
  }

  async function handleReopenSchoolYear() {
    if (syId == null) return;
    const message = await termClosureService.patchSchoolYearState(
      syId,
      "open",
      reopenReason.trim() || undefined,
    );
    if (message) toast.success(message);
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
  const canReopenSchoolYear =
    workflow?.workflow.schoolYearCompleted === true && workflow.schoolYear.reopenable === true;

  return (
    <>
      <Card className="overflow-hidden">
        <div className="border-b border-slate-100 bg-slate-50/60 px-5 py-4 dark:border-white/10 dark:bg-white/3">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="font-display text-base tracking-wide text-navy-700 dark:text-mist-100">
                Academic year workflow
              </h2>
              <p className="mt-1 font-body text-sm text-slate-500 dark:text-slate-400">
                Post each semester when scheduling is complete, then close the school year.
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
            <TimelineSkeleton steps={5} />
          ) : workflow ? (
            <div className="space-y-6">
              <TermWorkflowTimeline
                steps={workflow.workflow.steps}
                nextAction={workflow.workflow.nextAction}
                schoolYearLabel={workflow.schoolYear.schoolYear}
              />

              <div className="flex justify-end border-t border-slate-100 pt-6 dark:border-white/10">
                {canReopenSchoolYear ? (
                  <div className="shrink-0">
                    <Button
                      type="button"
                      variant="outline"
                      block={false}
                      disabled={loading}
                      onClick={() => setReopenSchoolYearOpen(true)}
                    >
                      Reopen School Year
                    </Button>
                  </div>
                ) : canRunNextAction && (
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
        open={reopenSchoolYearOpen}
        onClose={() => {
          setReopenSchoolYearOpen(false);
          setReopenReason("");
        }}
        title="Reopen school year"
        confirmLabel="Reopen school year"
        loadingLabel="Reopening…"
        onConfirm={handleReopenSchoolYear}
      >
        <p>
          Reopening this school year will unlock records from both the 1st and 2nd semesters.
        </p>
        <div className="mt-4">
          <Textarea
            id="school-year-reopen-reason"
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
