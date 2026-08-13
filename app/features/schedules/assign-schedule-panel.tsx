import { forwardRef, useEffect, useImperativeHandle, useState } from "react";
import { Alert, AlertDescription } from "~/components/ui/alert";
import { Badge } from "~/components/ui/badge";
import { AlertTriangleIcon } from "~/components/ui/icons";
import type { StudentPendingSchedule } from "~/services/irregular-class.service";

type AssignSchedulePanelProps = {
  pending: StudentPendingSchedule | null | undefined;
  onAssign: (studentAcademicId: number, regularSchedIds: number[]) => Promise<void>;
  bulkStudentCount?: number;
  bulkAssigning?: boolean;
  onBulkAssign?: (regularSchedIds: number[]) => Promise<void>;
  recCounts?: Map<string, number> | null;
  recTotal?: number;
  onSelectionStateChange?: (canAssign: boolean) => void;
};

export type AssignSchedulePanelHandle = {
  assign: () => void;
  getSummary: () => { subjectCode: string; set: string | null; meetingCount: number }[];
};

export const AssignSchedulePanel = forwardRef<AssignSchedulePanelHandle, AssignSchedulePanelProps>(function AssignSchedulePanel(
  { pending, onAssign, bulkStudentCount, bulkAssigning, onBulkAssign, recCounts, recTotal, onSelectionStateChange },
  ref,
) {
  const [selected, setSelected] = useState<Record<number, number | null>>({});
  const [assigning, setAssigning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const isBulk = Boolean(bulkStudentCount && onBulkAssign);
  const allSelected = Boolean(
    pending?.pendingSubjects.length &&
      pending.pendingSubjects.every(
        (subject) => selected[subject.subjectId] !== undefined && selected[subject.subjectId] !== null,
      ),
  );

  useEffect(() => {
    onSelectionStateChange?.(allSelected);
  }, [allSelected, onSelectionStateChange]);

  if (!pending || pending.pendingSubjects.length === 0) return null;

  function toggleOffering(subjectId: number, offeringIdx: number) {
    setSelected((prev) => {
      const current = prev[subjectId];
      return { ...prev, [subjectId]: current === offeringIdx ? null : offeringIdx };
    });
  }

  function selectAllRecommended() {
    const next: Record<number, number | null> = {};
    for (const subj of pending!.pendingSubjects) {
      const recIdx = subj.availableOfferings.findIndex((o) => o.recommended);
      next[subj.subjectId] = recIdx >= 0 ? recIdx : null;
    }
    setSelected(next);
  }

  function getSchedIds(): number[] {
    return pending!.pendingSubjects
      .map((s) => {
        const idx = selected[s.subjectId];
        if (idx == null) return [];
        return s.availableOfferings[idx]?.regularSchedIds ?? [];
      })
      .flat()
      .filter((id) => id > 0);
  }

  async function handleAssignAll() {
    if (!pending) return;
    const schedIds = getSchedIds();
    if (schedIds.length === 0) return;
    setError(null);
    setAssigning(true);
    try {
      await onAssign(pending.studentAcademicId, schedIds);
      setSelected({});
    } catch (err) {
      setError(err instanceof Error ? err.message : "");
    } finally {
      setAssigning(false);
    }
  }

  async function handleBulkAssignAll() {
    if (!pending || !onBulkAssign) return;
    const schedIds = getSchedIds();
    if (schedIds.length === 0) return;
    setError(null);
    await onBulkAssign(schedIds);
  }

  function getSummary() {
    return pending!.pendingSubjects.map((s) => {
      const idx = selected[s.subjectId];
      const offering = idx != null ? s.availableOfferings[idx] : null;
      return {
        subjectCode: s.subjectCode,
        set: offering?.set ?? null,
        meetingCount: offering?.meetingCount ?? 0,
      };
    });
  }

  useImperativeHandle(ref, () => ({
    assign() {
      if (isBulk) handleBulkAssignAll();
      else handleAssignAll();
    },
    getSummary,
  }));

  const anyRecommended = pending.pendingSubjects.some(
    (s) => s.availableOfferings.some((o) => o.recommended),
  );

  return (
    <div className="flex flex-col gap-4">
      {error && (
        <Alert variant="destructive">
          <AlertTriangleIcon />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {anyRecommended && (
        <button
          type="button"
          onClick={selectAllRecommended}
          className="w-fit rounded-full px-3 py-1 font-body text-xs text-navy-600 transition-colors hover:text-navy-800 dark:text-navy-400 dark:hover:text-mist-100"
        >
          Select all recommended
        </button>
      )}

      {pending.pendingSubjects.map((subject) => {
        const chosenIdx = selected[subject.subjectId];
        return (
          <div key={subject.subjectId}>
            <div className="mb-2 flex items-center gap-2">
              <h4 className="font-body text-sm font-semibold text-navy-800 dark:text-mist-100">
                {subject.subjectCode}
              </h4>
              <span className="font-body text-xs text-slate-500 dark:text-slate-400">
                {subject.descTitle} · {subject.units} unit{subject.units !== 1 ? "s" : ""}
              </span>
            </div>

            {subject.availableOfferings.length === 0 ? (
              <p className="font-body text-xs text-slate-400 dark:text-slate-500">
                No regular schedule exists yet for this subject.
              </p>
            ) : (
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                {subject.availableOfferings.map((offering, idx) => {
                  const isChosen = chosenIdx === idx;
                  const recKey = `${subject.subjectId}:${offering.setId}`;
                  const recNum = recCounts?.get(recKey);
                  return (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => toggleOffering(subject.subjectId, idx)}
                      className={`flex flex-col gap-1 rounded-lg border px-3 py-2.5 text-left transition-colors ${
                        isChosen
                          ? "border-navy-700 bg-navy-50 ring-1 ring-navy-700 dark:border-gold-400 dark:bg-gold-400/10 dark:ring-gold-400"
                          : "border-slate-200 bg-white hover:border-slate-300 dark:border-white/10 dark:bg-white/5 dark:hover:border-white/20"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-body text-sm font-medium text-navy-800 dark:text-mist-100">
                          {offering.set ?? "—"}
                        </span>
                        <span className="flex items-center gap-1.5">
                          {offering.recommended && (
                            <Badge tone="emerald">Recommended</Badge>
                          )}
                          {recNum !== undefined && recNum > 0 && (
                            <span className="font-body text-[0.65rem] text-slate-400 dark:text-slate-500">
                              {recNum}/{recTotal}
                            </span>
                          )}
                        </span>
                      </div>
                      <span className="font-body text-xs text-slate-500 dark:text-slate-400">
                        {offering.days}
                        {offering.meetingCount > 1 ? ` · ${offering.meetingCount} meetings` : ""}
                      </span>
                      <span className="font-body text-xs text-slate-400 dark:text-slate-500">
                        {offering.instructors.join(", ") || "TBA"}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}

      {pending.scheduledSubjects.length > 0 && (
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-3 dark:border-emerald-500/20 dark:bg-emerald-500/5">
          <p className="font-body text-xs font-medium text-emerald-700 dark:text-emerald-400">
            Already scheduled: {pending.scheduledSubjects.map((ss) => ss.subjectCode).join(", ")}
          </p>
        </div>
      )}
    </div>
  );
});
