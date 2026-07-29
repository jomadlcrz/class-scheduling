import { useMemo, useState } from "react";
import { Button } from "~/components/ui/button";
import { CheckIcon, PlusIcon, TrashIcon } from "~/components/ui/icons";
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
  curriculumDetailIdMap: Map<string, number>;
  onSave: (teachingTermId: number, payload: { curriculumDetailIds: number[] }) => Promise<void>;
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

  const [selectedIds, setSelectedIds] = useState<Set<number>>(() => new Set(initialIds));

  const resetKey = `${teachingTermId}-${currentSubjects.map((s) => s.subjectCode).join(",")}`;
  const [prevKey, setPrevKey] = useState(resetKey);
  if (resetKey !== prevKey) {
    setPrevKey(resetKey);
    setSelectedIds(new Set(initialIds));
  }

  const toggle = (id: number) =>
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const [saving, setSaving] = useState(false);
  const hasChanges = !setsEqual(selectedIds, initialIds);

  async function handleSave() {
    if (!hasChanges) {
      onClose();
      return;
    }
    setSaving(true);
    try {
      await onSave(teachingTermId, { curriculumDetailIds: [...selectedIds] });
      onClose();
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal open={open} onClose={onClose} title={`Assign Subjects — ${instructorName}`} wide>
      <div className="flex flex-col gap-4">
        <p className="font-body text-sm text-slate-500 dark:text-slate-400">
          Click a subject row to toggle assignment.
        </p>

        <div className="flex flex-col gap-4 max-h-[55vh] overflow-y-auto pr-1">
          {programs.map((program) => {
            const programIds = program.curriculumDetails.flatMap((y) =>
              y.semesterDetails.flatMap((s) =>
                s.subjects.map((sub) => curriculumDetailIdMap.get(sub.subjectCode)).filter((id): id is number => id != null),
              ),
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
                  <span className="font-body text-xs font-semibold text-slate-500 dark:text-slate-400">
                    {programCount} / {programIds.length} assigned
                  </span>
                </header>

                <div className="flex flex-col gap-3 p-4">
                  {program.curriculumDetails.map((year) =>
                    year.semesterDetails.map((sem) => {
                      const semIds = sem.subjects
                        .map((s) => curriculumDetailIdMap.get(s.subjectCode))
                        .filter((id): id is number => id != null);
                      if (semIds.length === 0) return null;
                      const semCount = semIds.filter((id) => selectedIds.has(id)).length;

                      return (
                        <div key={`${year.yearLevel}-${sem.semester}`}>
                          <div className="mb-2 flex items-center justify-between">
                            <p className="font-body text-xs font-semibold text-slate-600 dark:text-slate-300">
                              {yearLevelLabel(year.yearLevel)} — {sem.semester === 1 ? "1st" : "2nd"} Semester
                            </p>
                            <span className="font-body text-xs text-slate-400">
                              {semCount}/{semIds.length}
                            </span>
                          </div>
                          <table className="w-full font-body text-sm">
                            <thead className="text-left text-xs text-slate-500 dark:text-slate-400">
                              <tr>
                                <th className="px-3 py-2">Code</th>
                                <th className="px-3 py-2">Descriptive Title</th>
                                <th className="px-3 py-2 text-right">Units</th>
                                <th className="px-3 py-2 text-center" style={{ width: "3.5rem" }} />
                              </tr>
                            </thead>
                            <tbody>
                              {sem.subjects.map((subj) => {
                                const id = curriculumDetailIdMap.get(subj.subjectCode);
                                if (id == null) return null;
                                const isSelected = selectedIds.has(id);
                                return (
                                  <tr
                                    key={subj.subjectCode}
                                    onClick={() => toggle(id)}
                                    className={`cursor-pointer border-t border-slate-100 transition-colors dark:border-white/10 ${
                                      isSelected
                                        ? "bg-navy-50 dark:bg-white/10"
                                        : "hover:bg-slate-50 dark:hover:bg-white/5"
                                    }`}
                                  >
                                    <td className="px-3 py-2.5 font-semibold text-navy-800 dark:text-white">
                                      {subj.subjectCode}
                                    </td>
                                    <td className="px-3 py-2.5 text-slate-600 dark:text-slate-300">
                                      {subj.descriptiveTitle}
                                    </td>
                                    <td className="px-3 py-2.5 text-right font-semibold">
                                      {subj.units}
                                    </td>
                                    <td className="px-3 py-2.5 text-center">
                                      {isSelected ? (
                                        <span className="inline-flex size-6 items-center justify-center rounded-full bg-navy-800 text-white dark:bg-white dark:text-navy-900">
                                          <CheckIcon size={16} />
                                        </span>
                                      ) : (
                                        <span className="inline-flex size-6 items-center justify-center rounded-full border border-slate-300 text-slate-400 dark:border-white/15 dark:text-slate-500">
                                          <PlusIcon />
                                        </span>
                                      )}
                                    </td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
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
