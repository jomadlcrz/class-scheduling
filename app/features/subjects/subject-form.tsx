import { useState } from "react";
import { FormError } from "~/components/forms/form-error";
import { Button } from "~/components/ui/button";
import { FieldChrome, Input } from "~/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "~/components/ui/select";
import { useSemesters } from "~/hooks/use-semesters";
import { useYearLevels } from "~/hooks/use-year-levels";
import type { Subject, UpdateSubjectInput } from "~/types/subject";
import { subjectSchema } from "~/schemas/subject.schema";
import { PrerequisitePicker } from "~/features/subjects/prerequisite-picker";

type SubjectFormProps = {
  /** The subject being edited. */
  subject: Subject;
  /** Full catalog — prerequisite candidates come from the subject's program. */
  allSubjects: Subject[];
  /** Backend SubjectTypeName values (enumService). */
  subjectTypes: string[];
  onSubmit: (input: UpdateSubjectInput) => Promise<void>;
  onCancel: () => void;
};

/**
 * Edit form for an existing subject (creation happens on /subjects/new).
 * The curriculum slot (program/year/semester) is fixed by the backend.
 */
export function SubjectForm({ subject, allSubjects, subjectTypes, onSubmit, onCancel }: SubjectFormProps) {
  const { semesterLabel } = useSemesters();
  const { yearLevelLabel } = useYearLevels();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [prerequisites, setPrerequisites] = useState<string[]>(subject.prerequisites);

  // Prerequisites are referenced by subject code on the backend.
  const prerequisiteOptions = allSubjects
    .filter((s) => s.program === subject.program && s.id !== subject.id)
    .map((s) => ({ id: s.code, code: s.code, title: s.title }));

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    const code = String(data.get("subject-code") ?? "").trim();
    const title = String(data.get("subject-title") ?? "").trim();
    const units = Number(data.get("subject-units"));
    const subjectType = String(data.get("subject-type") ?? "");

    const result = subjectSchema.safeParse({ code, title, units, subjectType, prerequisites });
    if (!result.success) {
      setError(result.error.issues[0].message);
      return;
    }

    setError(null);
    setIsLoading(true);
    try {
      await onSubmit(result.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
      setIsLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
      <FormError message={error} />

      <p className="rounded-lg bg-slate-100 px-3 py-2 font-body text-sm text-slate-600 dark:bg-white/5 dark:text-slate-300">
        {subject.program} · {yearLevelLabel(subject.yearLevel)} ·{" "}
        {semesterLabel(subject.semester)}
      </p>

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

      <div className="grid grid-cols-2 gap-3">
        <Input
          id="subject-units"
          label="Units"
          type="number"
          min={1}
          max={6}
          required
          defaultValue={subject.units}
        />
        <FieldChrome id="subject-type" label="Subject Type">
          <Select
            items={subjectTypes.map((type) => ({ value: type, label: type }))}
            name="subject-type"
            defaultValue={subject.subjectType}
          >
            <SelectTrigger id="subject-type">
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
