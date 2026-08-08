import { useEffect, useState } from "react";
import { FormError } from "~/components/forms/form-error";
import { Button } from "~/components/ui/button";
import { Checkbox } from "~/components/ui/checkbox";
import { Modal } from "~/components/ui/modal";
import {
    scheduleReleaseStatusLabel,
    scheduleReleaseStatusTone,
    StatusBadge,
} from "~/features/academic-terms/status-badges";
import type { ScheduleRelease } from "~/types/schedule-release";

type ScheduleClearDialogProps = {
  open: boolean;
  onClose: () => void;
  /** Candidate sets to clear — the ones matching the active filters. */
  sets: ScheduleRelease[];
  /** Set pre-checked when the dialog opens (e.g. the currently-viewed set). */
  defaultSetId?: number | null;
  schoolYear: string;
  semesterLabel: string;
  /** Disable clearing (e.g. the term is closed). */
  disabled?: boolean;
  /** Clears the given set ids; resolves with labels of the sets that could not be cleared. */
  onConfirm: (setIds: number[]) => Promise<string[]>;
};

/** Clear one or more set schedules at once, with a "select all" toggle. */
export function ScheduleClearDialog({
  open,
  onClose,
  sets,
  defaultSetId,
  schoolYear,
  semesterLabel,
  disabled = false,
  onConfirm,
}: ScheduleClearDialogProps) {
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [clearing, setClearing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Reset to the default set each time the dialog opens.
  useEffect(() => {
    if (!open) return;
    setError(null);
    setSelectedIds(defaultSetId != null ? new Set([defaultSetId]) : new Set());
  }, [open, defaultSetId]);

  // Drop selections no longer present in the list (e.g. after a partial clear).
  useEffect(() => {
    setSelectedIds((prev) => {
      const valid = new Set(sets.map((row) => row.setId));
      const next = new Set([...prev].filter((id) => valid.has(id)));
      return next.size === prev.size ? prev : next;
    });
  }, [sets]);

  const allSelected = sets.length > 0 && sets.every((row) => selectedIds.has(row.setId));

  function toggleAll() {
    setSelectedIds(allSelected ? new Set() : new Set(sets.map((row) => row.setId)));
  }

  function toggleSet(setId: number) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(setId)) next.delete(setId);
      else next.add(setId);
      return next;
    });
  }

  async function handleConfirm() {
    if (disabled || selectedIds.size === 0) return;
    setClearing(true);
    setError(null);
    const failed = await onConfirm([...selectedIds]);
    setClearing(false);
    if (failed.length > 0) {
      // Keep the dialog open; the prune effect drops the cleared sets, leaving the failures to retry.
      setError(
        `Could not clear ${failed.length} set${failed.length === 1 ? "" : "s"}: ${failed.join(", ")}.`,
      );
    } else {
      onClose();
    }
  }

  return (
    <Modal
      open={open}
      onClose={() => {
        if (!clearing) onClose();
      }}
      title="Clear set schedule"
    >
      <div className="flex flex-col gap-4">
        <FormError message={error} />
        <p className="font-body text-sm text-slate-600 dark:text-slate-300">
          Select the sets to clear for S.Y. {schoolYear}, {semesterLabel}. Instructor and subject hour
          ledgers will be released, and any irregular students seated in these sets will be unseated.
        </p>
        <div className="overflow-hidden rounded-xl border border-slate-300 dark:border-white/10">
          <div className="flex items-center gap-3 border-b border-slate-200 px-3 py-2.5 dark:border-white/10">
            <Checkbox
              id="rc-clear-select-all"
              ariaLabel="Select all sets"
              hideLabel
              checked={allSelected}
              onChange={toggleAll}
            />
            <span className="font-body text-sm font-medium text-navy-700 dark:text-mist-100">
              {selectedIds.size > 0 ? `${selectedIds.size} of ${sets.length} selected` : "Select all"}
            </span>
          </div>
          <ul className="scrollbar-thin max-h-64 divide-y divide-slate-200 overflow-y-auto dark:divide-white/10">
            {sets.map((row) => (
              <li key={row.setId} className="flex items-center gap-3 px-3 py-2">
                <Checkbox
                  id={`rc-clear-${row.setId}`}
                  ariaLabel={`Select ${row.setCode ?? "set"}`}
                  hideLabel
                  checked={selectedIds.has(row.setId)}
                  onChange={() => toggleSet(row.setId)}
                />
                <span className="font-body text-sm font-semibold text-navy-700 dark:text-mist-100">
                  {row.setCode}
                </span>
                <StatusBadge tone={scheduleReleaseStatusTone(row.releaseStatus)}>
                  {scheduleReleaseStatusLabel(row.releaseStatus)}
                </StatusBadge>
                <span className="ml-auto font-body text-xs text-slate-500 dark:text-slate-400">
                  {row.sessionCount} session{row.sessionCount === 1 ? "" : "s"}
                </span>
              </li>
            ))}
          </ul>
        </div>
        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" block={false} disabled={clearing} onClick={onClose}>
            Cancel
          </Button>
          <Button
            type="button"
            variant="danger"
            block={false}
            disabled={disabled || selectedIds.size === 0}
            isLoading={clearing}
            loadingLabel="Clearing…"
            onClick={handleConfirm}
          >
            Clear{" "}
            {selectedIds.size > 0
              ? `${selectedIds.size} set${selectedIds.size === 1 ? "" : "s"}`
              : "schedule"}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
