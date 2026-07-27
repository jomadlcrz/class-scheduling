import { useMemo, useState } from "react";
import { Button } from "~/components/ui/button";
import { Checkbox } from "~/components/ui/checkbox";
import { Modal } from "~/components/ui/modal";
import { useYearLevels } from "~/hooks/use-year-levels";
import type { DepartmentSubjectProgram, FacultyLoadingSubject } from "~/types/faculty-load";

type EditSubjectsModalProps = {
  open: boolean;
  onClose: () => void;
  instructorName: string;
  teachingTermId: number;
  currentSubjects: FacultyLoadingSubject[];
  currentMaxWeeklyHours: number | null;
  programs: DepartmentSubjectProgram[];
  /** Maps subjectCode → curriculumDetailId from the teaching term's subject assignments. */
  curriculumDetailIdMap: Map<string, number>;
  onSave: (teachingTermId: number, payload: { maxWeeklyHours?: number; curriculumDetailIds: number[] }) => Promise<void>;
};

function setsEqual(a: Set<number>, b: Set<number>) {
  if (a.size !== b.size) return false;
  for (const v of a) if (!b.has(v)) return false;
  return true;
}

export function EditSubjectsModal({
  open,
  onClose,
  instructorName,
  teachingTermId,
  currentSubjects,
  currentMaxWeeklyHours,
  programs,
  curriculumDetailIdMap,
  onSave,
}: EditSubjectsModalProps) {
  const { yearLevelLabel } = useYearLevels();

  const initialIds = useMemo(() => {
    const ids = new Set<number>();
    for (const s of currentSubjects) {
      const id = curriculumDetailIdMap.get(s.subjectCode);
      if (id != null) ids.add(id);
    }
    return ids;
  }, [currentSubjects, curriculumDetailIdMap]);

  // Initialise selected IDs from the instructor's current subjects
  const [selectedIds, setSelectedIds] = useState<Set<number>>(() => new Set(initialIds));
  const [maxWeeklyHours, setMaxWeeklyHours] = useState<string>(
    currentMaxWeeklyHours != null ? String(currentMaxWeeklyHours) : "",
  );

  // Reset when modal opens with different data
  const resetKey = `${teachingTermId}-${currentSubjects.map((s) => s.subjectCode).join(",")}`;
  const [prevKey, setPrevKey] = useState(resetKey);
  if (resetKey !== prevKey) {
    setPrevKey(resetKey);
    setSelectedIds(new Set(initialIds));
    setMaxWeeklyHours(currentMaxWeeklyHours != null ? String(currentMaxWeeklyHours) : "");
  }

  const toggle = (id: number) =>
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const toggleAll = (ids: number[]) =>
    setSelectedIds((prev) => {
      const next = new Set(prev);
      const allSelected = ids.every((id) => next.has(id));
      for (const id of ids) {
        if (allSelected) next.delete(id);
        else next.add(id);
      }
      return next;
    });

  const [saving, setSaving] = useState(false);

  const hoursChanged = maxWeeklyHours !== (currentMaxWeeklyHours != null ? String(currentMaxWeeklyHours) : "");
  const subjectsChanged = !setsEqual(selectedIds, initialIds);
  const hasChanges = hoursChanged || subjectsChanged;

  async function handleSave() {
    if (!hasChanges) {
      onClose();
      return;
    }
    setSaving(true);
    try {
      const payload: { maxWeeklyHours?: number; curriculumDetailIds: number[] } = {
        curriculumDetailIds: [...selectedIds],
      };
      if (hoursChanged) {
        const val = parseFloat(maxWeeklyHours);
        if (!isNaN(val) && val >= 0) payload.maxWeeklyHours = val;
      }
      await onSave(teachingTermId, payload);
      onClose();
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal open={open} onClose={onClose} title={`Edit Teaching Term — ${instructorName}`} wide>
      <div className="flex flex-col gap-4">
        <div>
          <label htmlFor="edit-max-weekly-hours" className="mb-1.5 block font-body text-sm font-medium text-slate-700 dark:text-slate-300">
            Maximum Weekly Hours
          </label>
          <input
            id="edit-max-weekly-hours"
            type="number"
            min={0}
            step={0.5}
            value={maxWeeklyHours}
            onChange={(e) => setMaxWeeklyHours(e.target.value)}
            placeholder="e.g. 20"
            className="h-9 w-32 rounded-lg border border-slate-300 bg-white px-3 font-body text-sm text-navy-800 focus:border-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-700/20 dark:border-white/15 dark:bg-white/5 dark:text-mist-100"
          />
        </div>

        <p className="font-body text-sm text-slate-500 dark:text-slate-400">
          Select the subjects this instructor will handle for the current term.
        </p>

        <div className="flex flex-col gap-4 max-h-[50vh] overflow-y-auto pr-1">
          {programs.map((program) => {
            const programIds = program.curriculumDetails.flatMap((y) =>
              y.semesterDetails.flatMap((s) => s.subjects.map((sub) => curriculumDetailIdMap.get(sub.subjectCode)).filter((id): id is number => id != null)),
            );
            if (programIds.length === 0) return null;
            const programCount = programIds.filter((id) => selectedIds.has(id)).length;

            return (
              <section key={program.programAbbrev || program.programName} className="rounded-xl border border-slate-200 dark:border-white/10">
                <header className="flex items-center justify-between rounded-t-xl border-b border-slate-200 bg-slate-50 px-4 py-2.5 dark:border-white/10 dark:bg-white/5">
                  <div>
                    <h3 className="font-body text-sm font-bold text-navy-800 dark:text-white">
                      {program.programAbbrev || program.programName}
                    </h3>
                    <p className="font-body text-xs text-slate-500 dark:text-slate-400">{program.programName}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-body text-xs text-slate-500 dark:text-slate-400">
                      {programCount}/{programIds.length}
                    </span>
                    <Checkbox
                      id={`prog-${program.programAbbrev}`}
                      label="Select all"
                      checked={programIds.length > 0 && programIds.every((id) => selectedIds.has(id))}
                      onChange={() => toggleAll(programIds)}
                    />
                  </div>
                </header>

                <div className="flex flex-col gap-3 p-4">
                  {program.curriculumDetails.map((year) =>
                    year.semesterDetails.map((sem) => {
                      const semIds = sem.subjects.map((s) => curriculumDetailIdMap.get(s.subjectCode)).filter((id): id is number => id != null);
                      if (semIds.length === 0) return null;
                      const semCount = semIds.filter((id) => selectedIds.has(id)).length;

                      return (
                        <div key={`${year.yearLevel}-${sem.semester}`}>
                          <div className="mb-1.5 flex items-center justify-between">
                            <p className="font-body text-xs font-semibold text-slate-600 dark:text-slate-300">
                              {yearLevelLabel(year.yearLevel)} — {sem.semester === 1 ? "1st" : "2nd"} Semester
                            </p>
                            <span className="font-body text-xs text-slate-400">
                              {semCount}/{semIds.length}
                            </span>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            {sem.subjects.map((subj) => {
                              const id = curriculumDetailIdMap.get(subj.subjectCode);
                              if (id == null) return null;
                              return (
                                <Checkbox
                                  key={subj.subjectCode}
                                  id={`subj-${id}`}
                                  label={`${subj.subjectCode} — ${subj.descriptiveTitle}`}
                                  checked={selectedIds.has(id)}
                                  onChange={() => toggle(id)}
                                />
                              );
                            })}
                          </div>
                        </div>
                      );
                    }),
                  )}
                </div>
              </section>
            );
          })}
        </div>

        <div className="flex justify-end gap-2 border-t border-slate-200 pt-4 dark:border-white/10">
          <Button type="button" variant="outline" block={false} onClick={onClose}>
            Cancel
          </Button>
          <Button type="button" block={false} isLoading={saving} loadingLabel="Saving…" onClick={handleSave}>
            Save Changes
          </Button>
        </div>
      </div>
    </Modal>
  );
}
