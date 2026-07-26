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
  programs: DepartmentSubjectProgram[];
  onSave: (teachingTermId: number, curriculumDetailIds: number[]) => Promise<void>;
};

/** Build a subjectCode → curriculumDetailId lookup from the curriculum tree. */
function buildSubjectIdMap(programs: DepartmentSubjectProgram[]): Map<string, number> {
  const map = new Map<string, number>();
  for (const program of programs) {
    for (const year of program.curriculumDetails) {
      for (const sem of year.semesterDetails) {
        for (const subj of sem.subjects) {
          if (!map.has(subj.subjectCode)) map.set(subj.subjectCode, subj.subjectId);
        }
      }
    }
  }
  return map;
}

export function EditSubjectsModal({
  open,
  onClose,
  instructorName,
  teachingTermId,
  currentSubjects,
  programs,
  onSave,
}: EditSubjectsModalProps) {
  const { yearLevelLabel } = useYearLevels();
  const subjectIdMap = useMemo(() => buildSubjectIdMap(programs), [programs]);

  // Initialise selected IDs from the instructor's current subjects
  const [selectedIds, setSelectedIds] = useState<Set<number>>(() => {
    const ids = new Set<number>();
    for (const s of currentSubjects) {
      const id = subjectIdMap.get(s.subjectCode);
      if (id != null) ids.add(id);
    }
    return ids;
  });

  // Reset when modal opens with different data
  const resetKey = `${teachingTermId}-${currentSubjects.map((s) => s.subjectCode).join(",")}`;
  const [prevKey, setPrevKey] = useState(resetKey);
  if (resetKey !== prevKey) {
    setPrevKey(resetKey);
    const ids = new Set<number>();
    for (const s of currentSubjects) {
      const id = subjectIdMap.get(s.subjectCode);
      if (id != null) ids.add(id);
    }
    setSelectedIds(ids);
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

  async function handleSave() {
    setSaving(true);
    try {
      await onSave(teachingTermId, [...selectedIds]);
      onClose();
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal open={open} onClose={onClose} title={`Edit Subjects — ${instructorName}`} wide>
      <div className="flex flex-col gap-4">
        <p className="font-body text-sm text-slate-500 dark:text-slate-400">
          Select the subjects this instructor will handle for the current term.
        </p>

        <div className="flex flex-col gap-4 max-h-[50vh] overflow-y-auto pr-1">
          {programs.map((program) => {
            const programIds = program.curriculumDetails.flatMap((y) =>
              y.semesterDetails.flatMap((s) => s.subjects.map((sub) => subjectIdMap.get(sub.subjectCode)).filter((id): id is number => id != null)),
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
                      const semIds = sem.subjects.map((s) => subjectIdMap.get(s.subjectCode)).filter((id): id is number => id != null);
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
                              const id = subjectIdMap.get(subj.subjectCode);
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
            Save Subjects
          </Button>
        </div>
      </div>
    </Modal>
  );
}
