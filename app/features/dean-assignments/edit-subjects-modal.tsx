import { useMemo, useState } from "react";
import { FormError } from "~/components/forms/form-error";
import { Button } from "~/components/ui/button";
import { CheckIcon, PlusIcon } from "~/components/ui/icons";
import { Modal } from "~/components/ui/modal";
import { useYearLevels } from "~/hooks/use-year-levels";
import type { FacultyLoadingSubject } from "~/types/faculty-load";

type ProgramSubject = {
  curriculumDetailId: number;
  id: number;
  code: string;
  title: string;
  units: number;
  yearLevel: number;
  semesterCategory: number;
};

type ProgramData = {
  id: number;
  abbrev: string;
  name: string;
  subjects: ProgramSubject[];
};

type EditSubjectsModalProps = {
  open: boolean;
  onClose: () => void;
  instructorName: string;
  teachingTermId: number;
  maxWeeklyHours: number | null;
  currentSubjects: FacultyLoadingSubject[];
  programs: ProgramData[];
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
  maxWeeklyHours,
  currentSubjects,
  programs,
  onSave,
}: EditSubjectsModalProps) {
  const { yearLevelLabel } = useYearLevels();

  const initialIds = useMemo(() => {
    const ids = new Set<number>();
    for (const s of currentSubjects) {
      if (s.curriculumDetailId != null) ids.add(s.curriculumDetailId);
    }
    return ids;
  }, [currentSubjects]);

  const [selectedIds, setSelectedIds] = useState<Set<number>>(() => new Set(initialIds));
  const [hours, setHours] = useState<string>(maxWeeklyHours != null ? String(maxWeeklyHours) : "");

  const resetKey = `${teachingTermId}-${currentSubjects.map((s) => s.subjectCode).join(",")}`;
  const [prevKey, setPrevKey] = useState(resetKey);
  if (resetKey !== prevKey) {
    setPrevKey(resetKey);
    setSelectedIds(new Set(initialIds));
    setHours(maxWeeklyHours != null ? String(maxWeeklyHours) : "");
  }

  const toggle = (id: number) =>
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const initialHours = maxWeeklyHours != null ? String(maxWeeklyHours) : "";
  const hoursChanged = hours !== initialHours;
  const subjectsChanged = !setsEqual(selectedIds, initialIds);
  const hasChanges = hoursChanged || subjectsChanged;

  async function handleSave() {
    if (!hasChanges) {
      onClose();
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const payload: { maxWeeklyHours?: number; curriculumDetailIds: number[] } = {
        curriculumDetailIds: [...selectedIds],
      };
      if (hoursChanged && hours !== "") {
        payload.maxWeeklyHours = Math.max(0, parseFloat(hours) || 0);
      }
      await onSave(teachingTermId, payload);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "");
    } finally {
      setSaving(false);
    }
  }

  const assignedHours = useMemo(() => {
    let total = 0;
    for (const program of programs) {
      for (const subject of program.subjects) {
        if (selectedIds.has(subject.curriculumDetailId)) {
          total += subject.units;
        }
      }
    }
    return total;
  }, [programs, selectedIds]);

  const maxHoursNum = hours !== "" ? parseFloat(hours) || 0 : null;
  const remainingHours = maxHoursNum != null ? maxHoursNum - assignedHours : null;

  return (
    <Modal open={open} onClose={onClose} title={`Update Assignment — ${instructorName}`} wide>
      <div className="flex flex-col gap-4">
        <FormError message={error} />

        <div className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4 sm:flex-row sm:items-center sm:justify-between dark:border-white/10 dark:bg-white/5">
          <div className="flex items-center gap-3">
            <span className="font-body text-sm font-bold text-navy-800 dark:text-white">Max Weekly Hours</span>
            <div className="flex items-center rounded-lg border border-slate-300 bg-white shadow-xs dark:border-white/15 dark:bg-white/5">
              <input
                type="number"
                min="0"
                max="99.99"
                step="0.5"
                placeholder="—"
                value={hours}
                onChange={(e) => setHours(e.target.value)}
                className="w-16 py-1.5 text-center font-body text-sm font-bold text-navy-800 placeholder:text-slate-300 focus:outline-none dark:text-white dark:placeholder:text-slate-600"
              />
              <span className="border-l border-slate-200 px-2.5 py-1.5 font-body text-xs text-slate-400 dark:border-white/10">
                hrs
              </span>
            </div>
          </div>

          <div className="flex items-center gap-4 font-body text-xs">
            <span className="text-slate-500 dark:text-slate-400">
              Assigned: <span className="font-bold text-navy-800 dark:text-white">{assignedHours} hrs</span>
            </span>
            {remainingHours != null && (
              <span className={
                remainingHours < 0
                  ? "text-red-600 dark:text-red-400"
                  : remainingHours <= 3
                    ? "text-amber-600 dark:text-amber-400"
                    : "text-emerald-600 dark:text-emerald-400"
              }>
                Remaining: <span className="font-bold">{remainingHours} hrs</span>
              </span>
            )}
          </div>
        </div>

        <p className="font-body text-sm text-slate-500 dark:text-slate-400">
          Click a subject row to toggle assignment.
        </p>

        {programs.length === 0 ? (
          <div className="py-8 text-center">
            <p className="font-body text-sm text-slate-500 dark:text-slate-400">
              No subjects available. Please ensure department programs are loaded.
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-4 max-h-[55vh] overflow-y-auto pr-1">
            {programs.map((program) => {
              if (program.subjects.length === 0) return null;
              const programCount = program.subjects.filter((s) => selectedIds.has(s.curriculumDetailId)).length;

              const groupedByYear = new Map<number, Map<number, ProgramSubject[]>>();
              for (const subject of program.subjects) {
                if (!groupedByYear.has(subject.yearLevel)) {
                  groupedByYear.set(subject.yearLevel, new Map());
                }
                const yearMap = groupedByYear.get(subject.yearLevel)!;
                if (!yearMap.has(subject.semesterCategory)) {
                  yearMap.set(subject.semesterCategory, []);
                }
                yearMap.get(subject.semesterCategory)!.push(subject);
              }

              return (
                <section key={program.id} className="rounded-xl border border-slate-200 dark:border-white/10">
                  <header className="flex items-center justify-between rounded-t-xl border-b border-slate-200 bg-slate-50 px-4 py-2.5 dark:border-white/10 dark:bg-white/5">
                    <div>
                      <h3 className="font-body text-sm font-bold text-navy-800 dark:text-white">
                        {program.abbrev || program.name}
                      </h3>
                      <p className="font-body text-xs text-slate-500 dark:text-slate-400">{program.name}</p>
                    </div>
                    <span className="font-body text-xs font-semibold text-slate-500 dark:text-slate-400">
                      {programCount} / {program.subjects.length} assigned
                    </span>
                  </header>

                  <div className="flex flex-col gap-3 p-4">
                    {[...groupedByYear.entries()]
                      .sort(([a], [b]) => a - b)
                      .map(([yearLevel, semesterMap]) => (
                        <div key={yearLevel}>
                          {[...semesterMap.entries()]
                            .sort(([a], [b]) => a - b)
                            .map(([semester, subjects]) => (
                              <div key={`${yearLevel}-${semester}`} className="mb-3">
                                <div className="mb-2 flex items-center justify-between">
                                  <p className="font-body text-xs font-semibold text-slate-600 dark:text-slate-300">
                                    {yearLevelLabel(yearLevel)} — {semester === 1 ? "1st" : "2nd"} Semester
                                  </p>
                                  <span className="font-body text-xs text-slate-400">
                                    {subjects.filter((s) => selectedIds.has(s.curriculumDetailId)).length}/{subjects.length}
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
                                    {subjects.map((subj) => {
                                      const isSelected = selectedIds.has(subj.curriculumDetailId);
                                      return (
                                        <tr
                                          key={subj.curriculumDetailId}
                                          onClick={() => toggle(subj.curriculumDetailId)}
                                          className={`cursor-pointer border-t border-slate-100 transition-colors dark:border-white/10 ${
                                            isSelected
                                              ? "bg-navy-50 dark:bg-white/10"
                                              : "hover:bg-slate-50 dark:hover:bg-white/5"
                                          }`}
                                        >
                                          <td className="px-3 py-2.5 font-semibold text-navy-800 dark:text-white">
                                            {subj.code}
                                          </td>
                                          <td className="px-3 py-2.5 text-slate-600 dark:text-slate-300">
                                            {subj.title}
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
                            ))}
                        </div>
                      ))}
                  </div>
                </section>
              );
            })}
          </div>
        )}

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
