import { useState } from "react";
import { Alert, AlertDescription } from "~/components/ui/alert";
import { Button } from "~/components/ui/button";
import { AlertTriangleIcon, ClockIcon } from "~/components/ui/icons";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "~/components/ui/select";
import type { StudentPendingSchedule } from "~/services/irregular-class.service";

type AssignSchedulePanelProps = {
  /** null once a term is picked but this student has no pending record; undefined before a term is picked. */
  pending: StudentPendingSchedule | null | undefined;
  onAssign: (studentAcademicId: number, regularSchedIds: number[]) => Promise<void>;
};

/** Lets an admin pick existing regular schedule offerings per pending subject and assign them all at once. */
export function AssignSchedulePanel({ pending, onAssign }: AssignSchedulePanelProps) {
  const [selected, setSelected] = useState<Record<number, string>>({});
  const [assigning, setAssigning] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (pending === undefined) {
    return (
      <div className="mt-4 flex min-h-0 flex-1 flex-col items-center justify-center gap-2 py-8 text-center">
        <ClockIcon />
        <p className="font-body text-sm text-slate-400 dark:text-slate-500">
          Select a school year and semester above to view assignable schedules.
        </p>
      </div>
    );
  }

  if (!pending || (pending.pendingSubjects.length === 0 && pending.scheduledSubjects.length === 0)) {
    return (
      <div className="mt-4 flex min-h-0 flex-1 flex-col items-center justify-center gap-2 py-8 text-center">
        <ClockIcon />
        <p className="font-body text-sm text-slate-400 dark:text-slate-500">
          No pending subjects for this student this term.
        </p>
      </div>
    );
  }

  const allSelected = pending.pendingSubjects.every(
    (s) => selected[s.subjectId] && selected[s.subjectId] !== "",
  );
  const hasAnyOffering = pending.pendingSubjects.some((s) => s.availableOfferings.length > 0);

  async function handleAssignAll() {
    if (!pending) return;
    const schedIds = pending.pendingSubjects
      .map((s) => {
        const offeringIdx = Number(selected[s.subjectId]);
        if (!offeringIdx && offeringIdx !== 0) return [];
        return s.availableOfferings[offeringIdx]?.regularSchedIds ?? [];
      })
      .flat()
      .filter((id) => id > 0);
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

  return (
    <div className="mt-4 flex min-h-0 flex-1 flex-col">
      {error && (
        <Alert variant="destructive" className="mb-3">
          <AlertTriangleIcon />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <ul className="scrollbar-none flex flex-1 flex-col gap-3 overflow-y-auto">
        {pending.pendingSubjects.map((subject) => {
          const chosen = selected[subject.subjectId] ?? "";
          return (
            <li
              key={subject.subjectId}
              className="rounded-lg border border-slate-200 p-3 dark:border-white/10"
            >
              <div className="flex flex-col">
                <span className="font-body text-sm font-medium text-navy-800 dark:text-mist-100">
                  {subject.subjectCode}
                </span>
                <span className="font-body text-xs text-slate-500 dark:text-slate-400">
                  {subject.descTitle} · {subject.units} unit{subject.units !== 1 ? "s" : ""}
                </span>
              </div>

              {subject.availableOfferings.length === 0 ? (
                <p className="mt-2 font-body text-xs text-slate-400 dark:text-slate-500">
                  No regular schedule exists yet for this subject.
                </p>
              ) : (
                <div className="mt-2">
                  <Select
                    items={[
                      { value: "", label: "Select a class" },
                      ...subject.availableOfferings.map((offering, idx) => ({
                        value: String(idx),
                        label: `${offering.set ?? "—"} · ${offering.days} · ${offering.instructors.join(", ") || "TBA"}`,
                      })),
                    ]}
                    value={chosen}
                    onValueChange={(v) =>
                      setSelected((current) => ({ ...current, [subject.subjectId]: v as string }))
                    }
                  >
                    <SelectTrigger id={`available-schedule-${subject.subjectId}`} className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Select a class</SelectItem>
                      {subject.availableOfferings.map((offering, idx) => (
                        <SelectItem key={idx} value={String(idx)}>
                          {offering.set ?? "—"} · {offering.days} · {offering.instructors.join(", ") || "TBA"}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  {chosen !== "" && (() => {
                    const offering = subject.availableOfferings[Number(chosen)];
                    if (!offering) return null;
                    return (
                      <div className="mt-2 space-y-1 rounded-md bg-slate-50 p-2 dark:bg-white/5">
                        {offering.meetings.map((m) => (
                          <div key={m.regularSchedId} className="flex items-center gap-2 font-body text-xs text-slate-600 dark:text-slate-300">
                            <span className="font-medium">{m.dayOfWeek}</span>
                            <span>{m.startTime}–{m.endTime}</span>
                            <span className="text-slate-400 dark:text-slate-500">{m.room ?? "TBA"}</span>
                            <span className="text-slate-400 dark:text-slate-500">{m.mode}</span>
                          </div>
                        ))}
                      </div>
                    );
                  })()}
                </div>
              )}
            </li>
          );
        })}
      </ul>

      {pending.scheduledSubjects.length > 0 && (
        <div className="mt-3 rounded-lg border border-emerald-200 bg-emerald-50 p-3 dark:border-emerald-500/20 dark:bg-emerald-500/5">
          <p className="font-body text-xs font-medium text-emerald-700 dark:text-emerald-400">
            Already scheduled: {pending.scheduledSubjects.map((ss) => ss.subjectCode).join(", ")}
          </p>
        </div>
      )}

      {hasAnyOffering && (
        <div className="mt-4 shrink-0 border-t border-slate-200 pt-4 dark:border-white/10">
          <Button
            type="button"
            block
            disabled={!allSelected}
            isLoading={assigning}
            loadingLabel="Assigning…"
            onClick={handleAssignAll}
          >
            Assign All
          </Button>
        </div>
      )}
    </div>
  );
}
