import { useState } from "react";
import { FormError } from "~/components/forms/form-error";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Select } from "~/components/ui/select";
import type { Program } from "~/types/program";
import {
  SEMESTER_LABELS,
  SEMESTERS,
  SUBJECT_TYPE_LABELS,
  SUBJECT_TYPES,
  YEAR_LEVEL_LABELS,
  YEAR_LEVELS,
  type CreateSubjectInput,
  type Semester,
  type Subject,
  type SubjectType,
  type YearLevel,
} from "~/types/subject";
import { subjectSchema } from "~/schemas/subject.schema";
import { PrerequisitePicker } from "~/features/subjects/prerequisite-picker";

type SubjectFormProps = {
  /** The subject being edited. */
  subject: Subject;
  /** Full catalog — prerequisite candidates come from the selected program. */
  allSubjects: Subject[];
  programs: Program[];
  onSubmit: (input: CreateSubjectInput) => Promise<void>;
  onCancel: () => void;
};

/** Edit form for an existing subject (creation happens on /subjects/new). */
export function SubjectForm({ subject, allSubjects, programs, onSubmit, onCancel }: SubjectFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Controlled so the prerequisite options follow the selected program.
  const [program, setProgram] = useState(subject.program);
  const [prerequisiteIds, setPrerequisiteIds] = useState<string[]>(subject.prerequisiteIds);

  const prerequisiteOptions = allSubjects
    .filter((s) => s.program === program && s.id !== subject.id)
    .map((s) => ({ id: s.id, code: s.code, title: s.title }));

  function handleProgramChange(next: string) {
    setProgram(next);
    // Prerequisites belong to a program; switching invalidates them.
    setPrerequisiteIds([]);
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    const yearLevel = Number(data.get("subject-year-level")) as YearLevel;
    const semester = Number(data.get("subject-semester")) as Semester;
    const code = String(data.get("subject-code") ?? "").trim();
    const title = String(data.get("subject-title") ?? "").trim();
    const units = Number(data.get("subject-units"));
    const subjectType = String(data.get("subject-type")) as SubjectType;
    const lectureHours = Number(data.get("subject-lecture-hours"));
    const labHours = Number(data.get("subject-lab-hours"));

    const result = subjectSchema.safeParse({
      code,
      title,
      units,
      lectureHours,
      labHours,
      program,
      yearLevel,
      semester,
      subjectType,
      prerequisiteIds,
    });
    if (!result.success) {
      setError(result.error.issues[0].message);
      return;
    }

    setError(null);
    setIsLoading(true);
    try {
      await onSubmit({
        ...result.data,
        yearLevel: result.data.yearLevel as YearLevel,
        semester: result.data.semester as Semester,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
      setIsLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
      <FormError message={error} />

      <Select
        id="subject-program"
        label="Program"
        value={program}
        onChange={(e) => handleProgramChange(e.target.value)}
      >
        {programs.map((p) => (
          <option key={p.code} value={p.code}>
            {p.code} — {p.name}
          </option>
        ))}
      </Select>

      <div className="grid grid-cols-2 gap-3">
        <Select id="subject-year-level" label="Year Level" defaultValue={subject.yearLevel}>
          {YEAR_LEVELS.map((year) => (
            <option key={year} value={year}>
              {YEAR_LEVEL_LABELS[year]}
            </option>
          ))}
        </Select>
        <Select id="subject-semester" label="Semester" defaultValue={subject.semester}>
          {SEMESTERS.map((semester) => (
            <option key={semester} value={semester}>
              {SEMESTER_LABELS[semester]}
            </option>
          ))}
        </Select>
      </div>

      <Input
        id="subject-code"
        label="Subject Code"
        type="text"
        required
        placeholder="CS 101"
        defaultValue={subject.code}
      />

      <Input
        id="subject-title"
        label="Descriptive Title"
        type="text"
        required
        placeholder="Introduction to Computing"
        defaultValue={subject.title}
      />

      <div className="grid grid-cols-3 gap-3">
        <Input
          id="subject-units"
          label="Units"
          type="number"
          min={1}
          max={6}
          required
          defaultValue={subject.units}
        />
        <Input
          id="subject-lecture-hours"
          label="Lec Hours"
          type="number"
          min={0}
          max={12}
          required
          defaultValue={subject.lectureHours}
        />
        <Input
          id="subject-lab-hours"
          label="Lab Hours"
          type="number"
          min={0}
          max={12}
          required
          defaultValue={subject.labHours}
        />
      </div>

      <Select id="subject-type" label="Subject Type" defaultValue={subject.subjectType}>
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

      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" block={false} onClick={onCancel}>
          Cancel
        </Button>
        <Button block={false} isLoading={isLoading} loadingLabel="Saving…">
          Save Changes
        </Button>
      </div>
    </form>
  );
}
