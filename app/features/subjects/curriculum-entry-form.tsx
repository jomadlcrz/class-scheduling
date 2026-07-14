import { useState } from "react";
import { FormError } from "~/components/forms/form-error";
import { Button } from "~/components/ui/button";
import { PlusIcon } from "~/components/ui/icons";
import { FieldChrome, Input } from "~/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "~/components/ui/select";
import { useSemesters } from "~/hooks/use-semesters";
import { useYearLevels } from "~/hooks/use-year-levels";
import {
  type CreateSubjectInput,
  type Semester,
  type YearLevel,
} from "~/types/subject";
import type { PendingEntry } from "~/features/subjects/curriculum-structure";
import { PrerequisitePicker, type PrerequisiteOption } from "~/features/subjects/prerequisite-picker";

type CurriculumEntryFormProps = {
  /** Set when re-editing a pending entry; prefills the form. */
  initialEntry?: PendingEntry;
  /** Saved + pending subjects of the selected program. */
  prerequisiteOptions: PrerequisiteOption[];
  /** Backend SubjectTypeName values (enumService). */
  subjectTypes: string[];
  /** Appends the entry to the pending list; throws to reject (e.g. duplicate code). */
  onAdd: (input: Omit<CreateSubjectInput, "program">) => void;
  /** Restores the entry being edited without changes. */
  onCancelEdit?: () => void;
};

/** "Add new curriculum entry" panel — adds one subject at a time to the structure. */
export function CurriculumEntryForm({
  initialEntry,
  prerequisiteOptions,
  subjectTypes,
  onAdd,
  onCancelEdit,
}: CurriculumEntryFormProps) {
  const [error, setError] = useState<string | null>(null);
  const { semesters, semesterLabel } = useSemesters();
  const { yearLevelIds, yearLevelLabel } = useYearLevels();
  // Controlled so they survive form.reset() between consecutive adds.
  const [yearLevel, setYearLevel] = useState<YearLevel>(initialEntry?.yearLevel ?? 1);
  const [semester, setSemester] = useState<Semester>(initialEntry?.semester ?? 1);
  const [prerequisites, setPrerequisites] = useState<string[]>(
    initialEntry?.prerequisites ?? [],
  );
  const isEditing = Boolean(initialEntry);

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const data = new FormData(form);
    const code = String(data.get("entry-code") ?? "").trim();
    const title = String(data.get("entry-title") ?? "").trim();
    const units = Number(data.get("entry-units"));
    const subjectType = String(data.get("entry-subject-type") ?? "");

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

    try {
      onAdd({
        yearLevel,
        semester,
        code,
        title,
        units,
        subjectType,
        prerequisites,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't add the subject.");
      return;
    }

    setError(null);
    setPrerequisites([]);
    form.reset();
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
      <FormError message={error} />

      <div className="grid grid-cols-2 gap-3">
        <FieldChrome id="entry-year-level" label="Year Level">
          <Select
            items={yearLevelIds.map((year) => ({ value: String(year), label: yearLevelLabel(year) }))}
            value={String(yearLevel)}
            onValueChange={(v) => setYearLevel(Number(v) as YearLevel)}
          >
            <SelectTrigger id="entry-year-level">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {yearLevelIds.map((year) => (
                <SelectItem key={year} value={String(year)}>
                  {yearLevelLabel(year)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </FieldChrome>
        <FieldChrome id="entry-semester" label="Semester">
          <Select
            items={semesters.map((s) => ({
              value: String(s.semesterNumber),
              label: semesterLabel(s.semesterNumber),
            }))}
            value={String(semester)}
            onValueChange={(v) => setSemester(Number(v) as Semester)}
          >
            <SelectTrigger id="entry-semester">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {semesters.map((s) => (
                <SelectItem key={s.id} value={String(s.semesterNumber)}>
                  {semesterLabel(s.semesterNumber)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </FieldChrome>
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

      <div className="grid grid-cols-2 gap-3">
        <Input
          id="entry-units"
          label="Units"
          type="number"
          min={1}
          max={6}
          required
          defaultValue={initialEntry?.units ?? 3}
        />
        <FieldChrome id="entry-subject-type" label="Subject Type">
          <Select
            items={subjectTypes.map((type) => ({ value: type, label: type }))}
            name="entry-subject-type"
            defaultValue={initialEntry?.subjectType ?? subjectTypes[0] ?? ""}
          >
            <SelectTrigger id="entry-subject-type">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {subjectTypes.map((type) => (
                <SelectItem key={type} value={type}>
                  {type}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </FieldChrome>
      </div>

      <PrerequisitePicker
        options={prerequisiteOptions}
        value={prerequisites}
        onChange={setPrerequisites}
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
