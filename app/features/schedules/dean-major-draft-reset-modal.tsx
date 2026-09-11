import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "~/components/ui/button";
import { Checkbox } from "~/components/ui/checkbox";
import { Modal } from "~/components/ui/modal";
import { Spinner } from "~/components/ui/spinner";
import {
  authorityWorkflowService,
} from "~/services/authority-workflow.service";
import type { DeanDraftResetOptions } from "~/types/schedule-authority";

/**
 * Remove a program's draft Major meetings and start that program again.
 *
 * PER PROGRAM, because a department holds several and rebuilding one is not a
 * reason to lose the others — a Dean redoing BSIT's majors must not have BSCS
 * swept up with it.
 *
 * Draft only. A submitted or finalized build is not the Dean's to discard:
 * the Registrar holds it, and finalized meetings are already the timetable.
 * The backend refuses those rather than skipping them, so this cannot quietly
 * remove less than it said it would.
 */
export function DeanMajorDraftResetModal({
  open,
  onClose,
  syId,
  semesterNumber,
  onReset,
}: {
  open: boolean;
  onClose: () => void;
  syId: number | null;
  semesterNumber: number | null;
  onReset: () => void;
}) {
  const [options, setOptions] = useState<DeanDraftResetOptions | null>(null);
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [loading, setLoading] = useState(false);
  const [resetting, setResetting] = useState(false);

  useEffect(() => {
    if (!open || syId == null || semesterNumber == null) return;
    let active = true;
    setLoading(true);
    setSelected(new Set());
    authorityWorkflowService
      .getDraftResetOptions(syId, semesterNumber)
      .then((next) => {
        if (active) setOptions(next);
      })
      .catch((err) => {
        if (!active) return;
        setOptions(null);
        toast.error(
          err instanceof Error ? err.message : "Could not load the reset options.",
        );
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [open, syId, semesterNumber]);

  const programs = options?.programs ?? [];
  const resettable = programs.filter((program) => program.draftMeetingCount > 0);
  const chosenCount = resettable
    .filter((program) => selected.has(program.programId))
    .reduce((total, program) => total + program.draftMeetingCount, 0);

  function toggle(programId: number) {
    setSelected((current) => {
      const next = new Set(current);
      if (next.has(programId)) next.delete(programId);
      else next.add(programId);
      return next;
    });
  }

  async function confirm() {
    if (selected.size === 0 || syId == null || semesterNumber == null) return;
    setResetting(true);
    try {
      const result = await authorityWorkflowService.resetDraftMajors(
        [...selected], syId, semesterNumber,
      );
      toast.success(result.message);
      onReset();
      onClose();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not reset those drafts.");
    } finally {
      setResetting(false);
    }
  }

  return (
    <Modal
      open={open}
      onClose={resetting ? () => {} : onClose}
      title="Reset draft major schedules"
    >
      <p className="mb-3 font-body text-xs text-slate-500 dark:text-slate-400">
        Choose which programs to clear. Only draft meetings are removed.
      </p>

      {loading ? (
        <div className="grid place-items-center py-8">
          <Spinner />
        </div>
      ) : programs.length === 0 || resettable.length === 0 ? (
        <div className="flex flex-col gap-3">
          <p className="font-body text-xs text-slate-500 dark:text-slate-400">
            {options && options.lockedMeetingCount > 0
              ? `No draft major meetings to remove. ${options.lockedMeetingCount} meeting${
                  options.lockedMeetingCount === 1 ? " is" : "s are"
                } already submitted, which only the Registrar can reopen.`
              : "No draft major meetings exist for this term."}
          </p>
          <div className="flex justify-end">
            <Button variant="outline" block={false} onClick={onClose}>
              Close
            </Button>
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          <ul className="flex flex-col gap-1.5">
            {programs.map((program) => {
              const empty = program.draftMeetingCount === 0;
              return (
                <li key={program.programId}>
                  <label
                    htmlFor={`draft-reset-${program.programId}`}
                    className={`flex items-center gap-3 rounded-lg border px-3 py-2.5 transition-colors ${
                      empty
                        ? "cursor-not-allowed border-slate-200/70 opacity-60 dark:border-white/5"
                        : "cursor-pointer border-slate-200 hover:bg-slate-50 dark:border-white/10 dark:hover:bg-white/5"
                    }`}
                  >
                    <Checkbox
                      id={`draft-reset-${program.programId}`}
                      ariaLabel={`Reset ${program.programAbbrev} draft major schedules`}
                      hideLabel
                      disabled={empty}
                      checked={selected.has(program.programId)}
                      onChange={() => toggle(program.programId)}
                    />
                    <span className="min-w-0 flex-1">
                      <span className="block font-body text-sm font-semibold text-navy-800 dark:text-mist-100">
                        {program.programAbbrev}
                      </span>
                      <span className="block font-body text-xs text-slate-500 dark:text-slate-400">{program.programName}</span>
                    </span>
                    <span className="shrink-0 font-body text-xs font-semibold tabular-nums text-slate-500 dark:text-slate-400">
                      {empty
                        ? "No drafts"
                        : `${program.draftMeetingCount} meeting${
                            program.draftMeetingCount === 1 ? "" : "s"
                          }`}
                    </span>
                  </label>
                </li>
              );
            })}
          </ul>

          {options && options.lockedMeetingCount > 0 ? (
            <p className="font-body text-xs text-slate-500 dark:text-slate-400">
              {options.lockedMeetingCount} other meeting
              {options.lockedMeetingCount === 1 ? " is" : "s are"} already submitted and
              cannot be reset here — the Registrar reopens those.
            </p>
          ) : null}

          <p className="rounded-lg border border-rose-200/80 bg-rose-50/70 px-3 py-2 font-body text-xs text-rose-800 dark:border-rose-400/20 dark:bg-rose-400/10 dark:text-rose-200">
            {chosenCount === 0
              ? "Select a program to remove its draft meetings."
              : `This removes ${chosenCount} draft meeting${
                  chosenCount === 1 ? "" : "s"
                }. The sections stay, so their curriculum requirements reappear as unscheduled.`}
          </p>

          <div className="flex flex-wrap justify-end gap-2">
            <Button variant="outline" block={false} onClick={onClose} disabled={resetting}>
              Cancel
            </Button>
            <Button
              variant="danger"
              block={false}
              onClick={confirm}
              disabled={selected.size === 0 || resetting}
              isLoading={resetting}
              loadingLabel="Removing…"
            >
              Remove drafts
            </Button>
          </div>
        </div>
      )}
    </Modal>
  );
}
