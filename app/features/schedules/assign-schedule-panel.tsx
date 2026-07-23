import { useState } from "react";
import { Button } from "~/components/ui/button";
import { ClockIcon } from "~/components/ui/icons";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "~/components/ui/select";
import type { StudentPendingSchedule } from "~/services/irregular-class.service";

type AssignSchedulePanelProps = {
  /** null once a term is picked but this student has no pending record; undefined before a term is picked. */
  pending: StudentPendingSchedule | null | undefined;
  onAssign: (studentAcademicId: number, regularSchedIds: number[]) => Promise<void>;
};

/** Lets an admin pick existing regular schedule slots per pending subject and assign them all at once. */
export function AssignSchedulePanel({ pending, onAssign }: AssignSchedulePanelProps) {
  const [selected, setSelected] = useState<Record<number, string>>({});
  const [assigning, setAssigning] = useState(false);

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

  if (!pending || pending.pendingSubjects.length === 0) {
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
  const hasAnySchedule = pending.pendingSubjects.some((s) => s.availableSchedules.length > 0);

  async function handleAssignAll() {
    if (!pending) return;
    const schedIds = pending.pendingSubjects
      .map((s) => Number(selected[s.subjectId]))
      .filter((id) => id > 0);
    if (schedIds.length === 0) return;
    setAssigning(true);
    try {
      await onAssign(pending.studentAcademicId, schedIds);
      setSelected({});
    } finally {
      setAssigning(false);
    }
  }

  return (
    <div className="mt-4 flex min-h-0 flex-1 flex-col">
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
                  {subject.descTitle}
                </span>
              </div>

              {subject.availableSchedules.length === 0 ? (
                <p className="mt-2 font-body text-xs text-slate-400 dark:text-slate-500">
                  No regular schedule exists yet for this subject.
                </p>
              ) : (
                <div className="mt-2">
                  <Select
                    items={[
                      { value: "", label: "Select a schedule" },
                      ...subject.availableSchedules.map((av) => ({
                        value: String(av.regularSchedId),
                        label: `${av.set ?? "—"} · ${av.dayOfWeek} ${av.startTime}–${av.endTime} · ${av.room ?? "TBA"} · ${av.instructor ?? "TBA"}`,
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
                      <SelectItem value="">Select a schedule</SelectItem>
                      {subject.availableSchedules.map((av) => (
                        <SelectItem key={av.regularSchedId} value={String(av.regularSchedId)}>
                          {av.set ?? "—"} · {av.dayOfWeek} {av.startTime}–{av.endTime} · {av.room ?? "TBA"} ·{" "}
                          {av.instructor ?? "TBA"}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </li>
          );
        })}
      </ul>

      {hasAnySchedule && (
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
