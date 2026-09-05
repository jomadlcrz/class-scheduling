import { useState } from "react";
import { toast } from "sonner";
import { FormError } from "~/components/forms/form-error";
import { Button } from "~/components/ui/button";
import { inputClassName } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { Modal, ModalActions } from "~/components/ui/modal";
import { devToolsService } from "~/services/dev-tools.service";

type ResetAction = {
  id: string;
  title: string;
  desc: string;
  fn: (confirm: string) => Promise<string>;
  color: string;
};

const RESET_ACTIONS: ResetAction[] = [
  {
    id: "schedules",
    title: "Reset All Schedules",
    desc: "Wipes generated regular & irregular class schedule draft assignments.",
    fn: (confirm) => devToolsService.resetSchedules(confirm),
    color: "bg-amber-600 hover:bg-amber-500",
  },
  {
    id: "students",
    title: "Reset Students & Enrollments",
    desc: "Wipes enrolled student mock records and enrollment subjects.",
    fn: (confirm) => devToolsService.resetStudents(confirm),
    color: "bg-rose-600 hover:bg-rose-500",
  },
  {
    id: "sections",
    title: "Reset Class Sections",
    desc: "Wipes mock generated class sections and student section assignments.",
    fn: (confirm) => devToolsService.resetSections(confirm),
    color: "bg-purple-600 hover:bg-purple-500",
  },
  {
    id: "programs",
    title: "Reset Programs & Curricula",
    desc: "Resets program curricula drafts and catalog structures.",
    fn: (confirm) => devToolsService.resetPrograms(confirm),
    color: "bg-indigo-600 hover:bg-indigo-500",
  },
  {
    id: "assignments",
    title: "Reset Instructor Assignments",
    desc: "Clears faculty subject loads and teaching term assignments.",
    fn: (confirm) => devToolsService.resetInstructorAssignments(confirm),
    color: "bg-orange-600 hover:bg-orange-500",
  },
  {
    id: "tallies",
    title: "Reset Schedule Tallies",
    desc: "Recalculates and resets section headcount and subject capacity tallies.",
    fn: (confirm) => devToolsService.resetScheduleTallies(confirm),
    color: "bg-teal-600 hover:bg-teal-500",
  },
  {
    id: "scheduling-workflow",
    title: "Reset Scheduling Workflow",
    desc: "Clears the current scheduling workflow run while preserving its configuration.",
    fn: (confirm) => devToolsService.resetSchedulingWorkflow(confirm),
    color: "bg-cyan-700 hover:bg-cyan-600",
  },
  {
    id: "audits",
    title: "Reset System Audit Logs",
    desc: "Purges historical timetable schedule changes and audit logs.",
    fn: (confirm) => devToolsService.resetAudits(confirm),
    color: "bg-slate-700 hover:bg-slate-600",
  },
  {
    id: "users",
    title: "Reset Test User Accounts",
    desc: "Resets generated student/faculty accounts back to baseline defaults.",
    fn: (confirm) => devToolsService.resetUsers(confirm),
    color: "bg-zinc-700 hover:bg-zinc-600",
  },
  {
    id: "all",
    title: "Full Factory Reset",
    desc: "Complete reset of all schedules, assignments, and test students.",
    fn: (confirm) => devToolsService.resetAll(confirm),
    color: "bg-red-700 hover:bg-red-600",
  },
];

export function DevResetToolsPanel() {
  const [selectedAction, setSelectedAction] = useState<ResetAction | null>(null);
  const [confirmValue, setConfirmValue] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function openResetModal(action: ResetAction) {
    setSelectedAction(action);
    setConfirmValue("");
    setError(null);
  }

  function closeResetModal() {
    if (isSubmitting) return;
    setSelectedAction(null);
    setConfirmValue("");
    setError(null);
  }

  const confirmed = confirmValue.trim() === "RESET";

  async function handleExecuteReset() {
    if (!selectedAction || !confirmed) return;

    setIsSubmitting(true);
    setError(null);

    try {
      const resultMessage = await selectedAction.fn(confirmValue.trim());
      toast.success(resultMessage || `${selectedAction.title} completed successfully.`);
      closeResetModal();
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : `Failed to execute ${selectedAction.title}`;
      setError(errMsg);
      toast.error(errMsg);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-surface-raised">
      <div className="border-b border-slate-200 pb-4 dark:border-white/10">
        <h2 className="font-display text-lg tracking-wide text-navy-700 dark:text-mist-100">
          Developer Fast-Reset & Maintenance Tools
        </h2>
        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
          Quickly purge mock datasets during local development and testing without dropping database tables.
        </p>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {RESET_ACTIONS.map((act) => (
          <div
            key={act.id}
            className="flex flex-col justify-between rounded-lg border border-slate-200/80 bg-slate-50/60 p-4 transition dark:border-white/5 dark:bg-white/5"
          >
            <div>
              <h3 className="font-display text-sm tracking-wide text-navy-700 dark:text-mist-100">
                {act.title}
              </h3>
              <p className="mt-1.5 text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                {act.desc}
              </p>
            </div>
            <button
              type="button"
              onClick={() => openResetModal(act)}
              className={`mt-5 w-full rounded-lg px-3 py-2 text-xs font-semibold text-white shadow-sm transition ${act.color}`}
            >
              Execute reset
            </button>
          </div>
        ))}
      </div>

      {/* Confirmation Modal conforming to modal.tsx patterns */}
      <Modal
        open={selectedAction !== null}
        onClose={closeResetModal}
        title={selectedAction ? `Confirm: ${selectedAction.title}` : "Confirm Reset"}
      >
        {selectedAction && (
          <div className="flex flex-col gap-4">
            {error && <FormError message={error} />}

            <p className="font-body text-sm leading-relaxed text-slate-500 dark:text-slate-400">
              {selectedAction.desc} This action will permanently remove these records and cannot be undone.
            </p>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="reset-confirm-input">
                Type{" "}
                <span className="font-semibold text-navy-800 dark:text-mist-100">
                  RESET
                </span>{" "}
                to confirm this reset.
              </Label>
              <input
                id="reset-confirm-input"
                type="text"
                autoFocus
                autoComplete="off"
                spellCheck={false}
                placeholder="RESET"
                value={confirmValue}
                onChange={(e) => setConfirmValue(e.target.value)}
                className={`${inputClassName} font-body`}
              />
            </div>

            <ModalActions>
              <Button
                type="button"
                variant="outline"
                block={false}
                disabled={isSubmitting}
                onClick={closeResetModal}
              >
                Cancel
              </Button>
              <Button
                type="button"
                variant="danger"
                block={false}
                disabled={!confirmed}
                isLoading={isSubmitting}
                loadingLabel="Resetting…"
                onClick={handleExecuteReset}
              >
                Execute reset
              </Button>
            </ModalActions>
          </div>
        )}
      </Modal>
    </div>
  );
}
