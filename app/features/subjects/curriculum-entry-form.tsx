import { useState } from "react";
import { FormError } from "../../components/forms/form-error";
import { Button } from "../../components/ui/button";
import { PlusIcon } from "../../components/ui/icons";
import { Input } from "../../components/ui/input";
import { Select } from "../../components/ui/select";
import {
  SEMESTER_LABELS,
  SEMESTERS,
  SUBJECT_TYPE_LABELS,
  SUBJECT_TYPES,
  YEAR_LEVEL_LABELS,
  YEAR_LEVELS,
  type CreateSubjectInput,
  type Semester,
  type SubjectType,
  type YearLevel,
} from "../../types/subject";
import type { PendingEntry } from "./curriculum-structure";
import { PrerequisitePicker, type PrerequisiteOption } from "./prerequisite-picker";

type CurriculumEntryFormProps = {
  /** Set when re-editing a pending entry; prefills the form. */
  initialEntry?: PendingEntry;
  /** Saved + pending subjects of the selected program. */
  prerequisiteOptions: PrerequisiteOption[];
  /** Appends the entry to the pending list; throws to reject (e.g. duplicate code). */
  onAdd: (input: Omit<CreateSubjectInput, "program">) => void;
  /** Restores the entry being edited without changes. */
  onCancelEdit?: () => void;
};

/** "Add new curriculum entry" panel — adds one subject at a time to the structure. */
export function CurriculumEntryForm({
  initialEntry,
  prerequisiteOptions,
  onAdd,
  onCancelEdit,
}: CurriculumEntryFormProps) {
  const [error, setError] = useState<string | null>(null);
  // Controlled so they survive form.reset() between consecutive adds.
  const [yearLevel, setYearLevel] = useState<YearLevel>(initialEntry?.yearLevel ?? 1);
  const [semester, setSemester] = useState<Semester>(initialEntry?.semester ?? 1);
  const [prerequisiteIds, setPrerequisiteIds] = useState<string[]>(
    initialEntry?.prerequisiteIds ?? [],
  );
  const isEditing = Boolean(initialEntry);

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const data = new FormData(form);
    const code = String(data.get("entry-code") ?? "").trim();
    const title = String(data.get("entry-title") ?? "").trim();
    const units = Number(data.get("entry-units"));
    const subjectType = String(data.get("entry-subject-type")) as SubjectType;
    const lectureHours = Number(data.get("entry-lecture-hours"));
    const labHours = Number(data.get("entry-lab-hours"));

    if (!code) {
      setError("Enter the subject code.");
      return;
    }
    if (!title) {
      setError("Enter the descriptive title.");
      return;
    }
    if (!Number.isFinite(units) || units < 1) {
      setError("Units must be at least 1.");
      return;
    }
    if (!Number.isFinite(lectureHours) || lectureHours < 0 || !Number.isFinite(labHours) || labHours < 0) {
      setError("Hours can't be negative.");
      return;
    }

    try {
      onAdd({
        yearLevel,
        semester,
        code,
        title,
        units,
        subjectType,
        lectureHours,
        labHours,
        prerequisiteIds,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't add the subject.");
      return;
    }

    setError(null);
    setPrerequisiteIds([]);
    form.reset();
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
      <FormError message={error} />

      <div className="grid grid-cols-2 gap-3">
        <Select
          id="entry-year-level"
          label="Year Level"
          value={yearLevel}
          onChange={(e) => setYearLevel(Number(e.target.value) as YearLevel)}
        >
          {YEAR_LEVELS.map((year) => (
            <option key={year} value={year}>
              {YEAR_LEVEL_LABELS[year]}
            </option>
          ))}
        </Select>
        <Select
          id="entry-semester"
          label="Semester"
          value={semester}
          onChange={(e) => setSemester(Number(e.target.value) as Semester)}
        >
          {SEMESTERS.map((s) => (
            <option key={s} value={s}>
              {SEMESTER_LABELS[s]}
            </option>
          ))}
        </Select>
      </div>

      <Input
        id="entry-code"
        label="Subject Code"
        type="text"
        required
        placeholder="CS 101"
        defaultValue={initialEntry?.code}
      />

      <Input
        id="entry-title"
        label="Descriptive Title"
        type="text"
        required
        placeholder="Introduction to Computing"
        defaultValue={initialEntry?.title}
      />

      <div className="grid grid-cols-3 gap-3">
        <Input
          id="entry-units"
          label="Units"
          type="number"
          min={1}
          max={6}
          required
          defaultValue={initialEntry?.units ?? 3}
        />
        <Input
          id="entry-lecture-hours"
          label="Lec Hours"
          type="number"
          min={0}
          max={12}
          required
          defaultValue={initialEntry?.lectureHours ?? 3}
        />
        <Input
          id="entry-lab-hours"
          label="Lab Hours"
          type="number"
          min={0}
          max={12}
          required
          defaultValue={initialEntry?.labHours ?? 0}
        />
      </div>

      <Select
        id="entry-subject-type"
        label="Subject Type"
        defaultValue={initialEntry?.subjectType ?? "gened"}
      >
        {SUBJECT_TYPES.map((type) => (
          <option key={type} value={type}>
            {SUBJECT_TYPE_LABELS[type]}
          </option>
        ))}
      </Select>

      <PrerequisitePicker
        options={prerequisiteOptions}
        value={prerequisiteIds}
        onChange={setPrerequisiteIds}
      />

      <div className="flex flex-col gap-2">
        <Button>
          <PlusIcon />
          {isEditing ? "Update Subject" : "Add Subject"}
        </Button>
        {isEditing && onCancelEdit && (
          <Button type="button" variant="outline" onClick={onCancelEdit}>
            Cancel Edit
          </Button>
        )}
      </div>
    </form>
  );
}
