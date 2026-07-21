import { useState } from "react";
import { Button } from "~/components/ui/button";
import { ClockIcon } from "~/components/ui/icons";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "~/components/ui/select";
import type { StudentPendingSchedule } from "~/services/irregular-class.service";

type AssignSchedulePanelProps = {
  /** null once a term is picked but this student has no pending record; undefined before a term is picked. */
  pending: StudentPendingSchedule | null | undefined;
  onAssign: (studentAcademicId: number, regularSchedId: number) => Promise<void>;
};

/** Lets an admin pick an existing regular schedule slot per pending subject and assign it to the selected irregular student. */
export function AssignSchedulePanel({ pending, onAssign }: AssignSchedulePanelProps) {
  const [selected, setSelected] = useState<Record<number, string>>({});
  const [assigningSubjectId, setAssigningSubjectId] = useState<number | null>(null);

  if (pending === undefined) {
    return (
      <div className="mt-4 flex flex-col items-center gap-2 py-8 text-center">
        <ClockIcon />
        <p className="font-body text-sm text-slate-400 dark:text-slate-500">
          Select a school year and semester above to view assignable schedules.
        </p>
      </div>
    );
  }

  if (!pending || pending.pendingSubjects.length === 0) {
    return (
      <div className="mt-4 flex flex-col items-center gap-2 py-8 text-center">
        <ClockIcon />
        <p className="font-body text-sm text-slate-400 dark:text-slate-500">
          No pending subjects for this student this term.
        </p>
      </div>
    );
  }

  async function handleAssign(subjectId: number) {
    const regularSchedId = Number(selected[subjectId]);
    if (!regularSchedId || !pending) return;
    setAssigningSubjectId(subjectId);
    try {
      await onAssign(pending.studentAcademicId, regularSchedId);
    } finally {
      setAssigningSubjectId(null);
    }
  }

  return (
    <ul className="mt-4 flex flex-col gap-3">
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
              <div className="mt-2 flex items-center gap-2">
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
                  <SelectTrigger id={`available-schedule-${subject.subjectId}`}>
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
                <Button
                  type="button"
                  variant="outline"
                  block={false}
                  disabled={!chosen}
                  isLoading={assigningSubjectId === subject.subjectId}
                  loadingLabel="Assigning…"
                  onClick={() => handleAssign(subject.subjectId)}
                >
                  Assign
                </Button>
              </div>
            )}
          </li>
        );
      })}
    </ul>
  );
}
