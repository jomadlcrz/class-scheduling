import { useState } from "react";
import { FormError } from "../../components/forms/form-error";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Select } from "../../components/ui/select";
import {
  SEMESTER_LABELS,
  SEMESTERS,
  YEAR_LEVEL_LABELS,
  type Semester,
  type Subject,
} from "../../types/subject";
import {
  SET_STATUSES,
  SET_STATUS_LABELS,
  type ClassSet,
  type CreateSetInput,
  type SetStatus,
} from "../../types/set";

const SCHOOL_YEARS = ["2023-2024", "2024-2025", "2025-2026", "2026-2027"];

type SetFormProps = {
  /** Populated when editing; absent when creating. */
  set?: ClassSet;
  allSubjects: Subject[];
  onSubmit: (input: CreateSetInput) => Promise<void>;
  onCancel: () => void;
};

export function SetForm({ set, allSubjects, onSubmit, onCancel }: SetFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const defaultSubjectId = set?.subjectId ?? allSubjects[0]?.id ?? "";
  const [subjectId, setSubjectId] = useState(defaultSubjectId);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const data = new FormData(e.currentTarget);

    const setCode = String(data.get("set-code") ?? "").trim();
    const schoolYear = String(data.get("set-school-year") ?? "").trim();
    const semester = Number(data.get("set-semester")) as Semester;
    const capacity = Number(data.get("set-capacity"));
    const status = String(data.get("set-status")) as SetStatus;

    if (!subjectId) {
      setError("Select a subject.");
      return;
    }
    if (!setCode) {
      setError("Enter the set code.");
      return;
    }
    if (!schoolYear) {
      setError("Enter the school year.");
      return;
    }
    if (!Number.isFinite(capacity) || capacity < 1) {
      setError("Capacity must be at least 1.");
      return;
    }

    setError(null);
    setIsLoading(true);
    try {
      await onSubmit({ subjectId, setCode, schoolYear, semester, capacity, status });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
      setIsLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
      <FormError message={error} />

      <Select
        id="set-subject"
        label="Subject"
        value={subjectId}
        onChange={(e) => setSubjectId(e.target.value)}
      >
        {allSubjects.map((s) => (
          <option key={s.id} value={s.id}>
            {s.code} — {s.title} ({s.program}, {YEAR_LEVEL_LABELS[s.yearLevel]})
          </option>
        ))}
      </Select>

      <div className="grid grid-cols-2 gap-3">
        <Input
          id="set-code"
          label="Set Code"
          type="text"
          required
          placeholder="A"
          defaultValue={set?.setCode ?? ""}
        />
        <Select id="set-semester" label="Semester" defaultValue={set?.semester ?? 1}>
          {SEMESTERS.map((sem) => (
            <option key={sem} value={sem}>
              {SEMESTER_LABELS[sem]}
            </option>
          ))}
        </Select>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Select
          id="set-school-year"
          label="School Year"
          defaultValue={set?.schoolYear ?? "2024-2025"}
        >
          {SCHOOL_YEARS.map((sy) => (
            <option key={sy} value={sy}>
              {sy}
            </option>
          ))}
        </Select>
        <Input
          id="set-capacity"
          label="Capacity"
          type="number"
          min={1}
          max={200}
          required
          defaultValue={set?.capacity ?? 40}
        />
      </div>

      <Select id="set-status" label="Status" defaultValue={set?.status ?? "open"}>
        {SET_STATUSES.map((s) => (
          <option key={s} value={s}>
            {SET_STATUS_LABELS[s]}
          </option>
        ))}
      </Select>

      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" block={false} onClick={onCancel}>
          Cancel
        </Button>
        <Button block={false} isLoading={isLoading} loadingLabel="Saving…">
          {set ? "Save Changes" : "Add Set"}
        </Button>
      </div>
    </form>
  );
}
