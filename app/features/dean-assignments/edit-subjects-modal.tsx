import { useMemo, useState } from "react";
import { FormError } from "~/components/forms/form-error";
import { Button } from "~/components/ui/button";
import { Modal } from "~/components/ui/modal";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "~/components/ui/select";
import type { FacultyLoadingSubject } from "~/types/faculty-load";

type EditSubjectsModalProps = {
  open: boolean;
  onClose: () => void;
  instructorName: string;
  teachingTermId: number;
  maxWeeklyHours: number | null;
  currentSubjects: FacultyLoadingSubject[];
  programs: {
    id: number;
    abbrev: string;
    name: string;
    subjects: { curriculumDetailId: number; id: number; code: string; title: string; units: number; yearLevel: number; semesterCategory: number }[];
  }[];
  onSave: (teachingTermId: number, payload: { maxWeeklyHours?: number; curriculumDetailIds: number[] }) => Promise<void>;
};

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

  const allSubjects = useMemo(
    () =>
      programs.flatMap((p) =>
        p.subjects.map((s) => ({ ...s, programAbbrev: p.abbrev, programName: p.name })),
      ),
    [programs],
  );

  const selectedValues = useMemo(() => [...selectedIds].map(String), [selectedIds]);

  const handleValueChange = (value: string[] | null) => {
    setSelectedIds(new Set((value ?? []).map(Number)));
  };

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const initialHours = maxWeeklyHours != null ? String(maxWeeklyHours) : "";
  const hoursChanged = hours !== initialHours;
  const idsEqual = selectedIds.size === initialIds.size && [...selectedIds].every((id) => initialIds.has(id));
  const hasChanges = hoursChanged || !idsEqual;

  const assignedHours = useMemo(() => {
    let total = 0;
    for (const subject of allSubjects) {
      if (selectedIds.has(subject.curriculumDetailId)) {
        total += subject.units;
      }
    }
    return total;
  }, [allSubjects, selectedIds]);

  const maxHoursNum = hours !== "" ? parseFloat(hours) || 0 : null;
  const remainingHours = maxHoursNum != null ? maxHoursNum - assignedHours : null;

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

  return (
    <Modal open={open} onClose={onClose} title={`Update Assignment — ${instructorName}`} wide>
      <div className="space-y-4 font-body text-sm">
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
              <span
                className={
                  remainingHours < 0
                    ? "text-red-600 dark:text-red-400"
                    : remainingHours <= 3
                      ? "text-amber-600 dark:text-amber-400"
                      : "text-emerald-600 dark:text-emerald-400"
                }
              >
                Remaining: <span className="font-bold">{remainingHours} hrs</span>
              </span>
            )}
          </div>
        </div>

        <div>
          <label className="mb-1 block text-xs font-semibold text-slate-700 dark:text-slate-300">
            Select Subjects
          </label>
          {allSubjects.length === 0 ? (
            <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-500 dark:border-white/10 dark:bg-white/5 dark:text-slate-400">
              No subjects available. Please ensure department programs are loaded.
            </div>
          ) : (
            <Select
              multiple
              value={selectedValues}
              onValueChange={handleValueChange}
              items={allSubjects.map((s) => ({
                value: String(s.curriculumDetailId),
                label: `${s.code} — ${s.title}`,
              }))}
            >
              <SelectTrigger id="edit-subjects">
                <SelectValue placeholder="Choose subjects...">
                  {selectedValues.length === 0
                    ? "Choose subjects..."
                    : `${selectedValues.length} subject${selectedValues.length !== 1 ? "s" : ""} selected`}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {allSubjects.map((subj) => (
                  <SelectItem key={subj.curriculumDetailId} value={String(subj.curriculumDetailId)}>
                    <span className="font-semibold">{subj.code}</span>
                    <span className="ml-2 text-slate-500 dark:text-slate-400">{subj.title}</span>
                    <span className="ml-auto text-slate-400 dark:text-slate-500">({subj.units} hrs)</span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>

        <div className="flex flex-col-reverse gap-2 pt-2 sm:flex-row sm:justify-end">
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
