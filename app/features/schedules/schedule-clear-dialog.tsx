import { useEffect, useMemo, useState } from "react";
import { FormError } from "~/components/forms/form-error";
import { Button } from "~/components/ui/button";
import { Checkbox } from "~/components/ui/checkbox";
import { Modal } from "~/components/ui/modal";
import {
    scheduleReleaseStatusLabel,
    scheduleReleaseStatusTone,
    StatusBadge,
} from "~/features/academic-terms/status-badges";
import { useYearLevels } from "~/hooks/use-year-levels";
import type { ScheduleRelease } from "~/types/schedule-release";

type ScheduleClearDialogProps = {
  open: boolean;
  onClose: () => void;
  /** Candidate sets to clear — the ones matching the active filters. */
  sets: ScheduleRelease[];
  /** Set pre-checked when the dialog opens (e.g. the currently-viewed set). */
  defaultSetId?: number | null;
  /** Multiple sets pre-checked when the dialog opens (e.g. clearing a program). */
  defaultSetIds?: number[];
  schoolYear: string;
  semesterLabel: string;
  /** Disable clearing (e.g. the term is closed). */
  disabled?: boolean;
  /** Clears the given set ids; resolves with labels of the sets that could not be cleared. */
  onConfirm: (setIds: number[]) => Promise<string[]>;
};

/** Clear one or more set schedules at once, grouped by year level. */
export function ScheduleClearDialog({
  open,
  onClose,
  sets,
  defaultSetId,
  defaultSetIds,
  schoolYear,
  semesterLabel,
  disabled = false,
  onConfirm,
}: ScheduleClearDialogProps) {
  const { yearLevelLabel } = useYearLevels();
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [clearing, setClearing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Reset to the default set each time the dialog opens.
  useEffect(() => {
    if (!open) return;
    setError(null);
    if (defaultSetIds && defaultSetIds.length > 0) {
      setSelectedIds(new Set(defaultSetIds));
    } else if (defaultSetId != null) {
      setSelectedIds(new Set([defaultSetId]));
    } else {
      setSelectedIds(new Set());
    }
  }, [open, defaultSetId, defaultSetIds]);

  // Drop selections no longer present in the list (e.g. after a partial clear).
  useEffect(() => {
    setSelectedIds((prev) => {
      const valid = new Set(sets.map((row) => row.setId));
      const next = new Set([...prev].filter((id) => valid.has(id)));
      return next.size === prev.size ? prev : next;
    });
  }, [sets]);

  // When specific sets are selected, only show those sets; otherwise show all.
  const displaySets = defaultSetIds && defaultSetIds.length > 0
    ? sets.filter((row) => defaultSetIds.includes(row.setId))
    : defaultSetId != null
    ? sets.filter((row) => row.setId === defaultSetId)
    : sets;

  // Group by year level
  const yearGroups = useMemo(() => {
    const groups = new Map<number, ScheduleRelease[]>();
    for (const row of displaySets) {
      const yl = row.yearLevel ?? 0;
      const list = groups.get(yl);
      if (list) list.push(row);
      else groups.set(yl, [row]);
    }
    return [...groups.entries()].sort((a, b) => a[0] - b[0]);
  }, [displaySets]);

  const allSelected = displaySets.length > 0 && displaySets.every((row) => selectedIds.has(row.setId));

  function toggleAll() {
    setSelectedIds(allSelected ? new Set() : new Set(displaySets.map((row) => row.setId)));
  }

  function toggleYearLevel(yearLevel: number, yearSets: ScheduleRelease[]) {
    const ids = yearSets.map((r) => r.setId);
    const allYearSelected = ids.every((id) => selectedIds.has(id));
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (allYearSelected) {
        for (const id of ids) next.delete(id);
      } else {
        for (const id of ids) next.add(id);
      }
      return next;
    });
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

  const showCheckboxes = displaySets.length > 1;
  const selectedCount = selectedIds.size;

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
        <p className="font-body text-sm text-slate-500 dark:text-slate-400">
          Select the sets to clear for S.Y. {schoolYear}, {semesterLabel}. Instructor and subject hour
          ledgers will be released, and any irregular students seated in these sets will be unseated.
        </p>
        <div className="overflow-hidden rounded-xl border border-slate-300 dark:border-white/10">
          {showCheckboxes && (
            <div className="flex items-center gap-3 border-b border-slate-200 px-3 py-2.5 dark:border-white/10">
              <Checkbox
                id="rc-clear-select-all"
                ariaLabel="Select all sets"
                hideLabel
                checked={allSelected}
                onChange={toggleAll}
              />
              <span className="font-body text-sm font-semibold text-navy-800 dark:text-mist-100">
                {selectedCount > 0 ? `${selectedCount} of ${displaySets.length} selected` : "Select all"}
              </span>
            </div>
          )}
          <div className="scrollbar-thin max-h-72 overflow-y-auto">
            {yearGroups.map(([yearLevel, yearSets]) => {
              const yearSelected = yearSets.every((r) => selectedIds.has(r.setId));
              return (
                <div key={yearLevel}>
                  {yearGroups.length > 1 && (
                    <div className="flex items-center gap-3 border-b border-slate-100 bg-slate-50 px-3 py-2 dark:border-white/5 dark:bg-navy-800">
                      {showCheckboxes && (
                        <Checkbox
                          id={`rc-clear-yl-${yearLevel}`}
                          ariaLabel={`Select all ${yearLevelLabel(yearLevel)} sets`}
                          hideLabel
                          checked={yearSelected}
                          onChange={() => toggleYearLevel(yearLevel, yearSets)}
                        />
                      )}
                      <span className="font-body text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                        {yearLevel === 0 ? "Unassigned" : yearLevelLabel(yearLevel)}
                      </span>
                      <span className="font-body text-xs text-slate-400 dark:text-slate-500">
                        ({yearSets.length} set{yearSets.length === 1 ? "" : "s"})
                      </span>
                    </div>
                  )}
                  <ul className="divide-y divide-slate-200 dark:divide-white/10">
                    {yearSets.map((row) => (
                      <li key={row.setId} className="flex items-center gap-3 px-3 py-2">
                        {showCheckboxes && (
                          <Checkbox
                            id={`rc-clear-${row.setId}`}
                            ariaLabel={`Select ${row.setCode ?? "set"}`}
                            hideLabel
                            checked={selectedIds.has(row.setId)}
                            onChange={() => toggleSet(row.setId)}
                          />
                        )}
                        <span className="font-body text-sm font-semibold text-navy-800 dark:text-mist-100">
                          {row.setCode}
                        </span>
                        <span className="font-body text-xs text-slate-500 dark:text-slate-400">
                          {row.programAbbrev}
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
              );
            })}
          </div>
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
            {selectedCount > 0
              ? `${selectedCount} set${selectedCount === 1 ? "" : "s"}`
              : "schedule"}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
