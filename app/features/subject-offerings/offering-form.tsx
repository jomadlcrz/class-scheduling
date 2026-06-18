import { useState } from "react";
import { FormError } from "../../components/forms/form-error";
import { Button } from "../../components/ui/button";
import { Select } from "../../components/ui/select";
import { subjectOfferingSchema } from "../../schemas/subject-offering.schema";
import type { AcademicSemester } from "../../types/semester";
import type { Subject } from "../../types/subject";
import { YEAR_LEVEL_LABELS } from "../../types/subject";
import type { CreateSubjectOfferingInput } from "../../types/subject-offering";

type OfferingFormProps = {
  semester: AcademicSemester;
  subjects: Subject[];
  onSubmit: (input: CreateSubjectOfferingInput) => Promise<void>;
  onCancel: () => void;
};

export function OfferingForm({ semester, subjects, onSubmit, onCancel }: OfferingFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    const subjectId = String(data.get("off-subject") ?? "");

    const result = subjectOfferingSchema.safeParse({
      semesterId: semester.id,
      subjectId,
    });
    if (!result.success) {
      setError(result.error.issues[0].message);
      return;
    }

    const subject = subjects.find((s) => s.id === subjectId);
    if (!subject) {
      setError("Selected subject not found.");
      return;
    }

    setError(null);
    setIsLoading(true);
    try {
      await onSubmit({
        semesterId: semester.id,
        academicYearId: semester.academicYearId,
        academicYearLabel: semester.academicYearLabel,
        semester: semester.semester,
        subjectId: subject.id,
        subjectCode: subject.code,
        subjectTitle: subject.title,
        program: subject.program,
        yearLevel: subject.yearLevel,
        units: subject.units,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
      setIsLoading(false);
    }
  }

  const sortedSubjects = [...subjects].sort(
    (a, b) =>
      a.program.localeCompare(b.program) ||
      a.yearLevel - b.yearLevel ||
      a.semester - b.semester ||
      a.code.localeCompare(b.code),
  );

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
      <FormError message={error} />
      <Select
        id="off-subject"
        label="Subject"
        defaultValue={sortedSubjects[0]?.id ?? ""}
      >
        {sortedSubjects.length === 0 ? (
          <option value="">No subjects available</option>
        ) : (
          sortedSubjects.map((s) => (
            <option key={s.id} value={s.id}>
              {s.code} — {s.title} ({s.program}, {YEAR_LEVEL_LABELS[s.yearLevel]})
            </option>
          ))
        )}
      </Select>
      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" block={false} onClick={onCancel}>
          Cancel
        </Button>
        <Button block={false} isLoading={isLoading} loadingLabel="Saving…">
          Add Offering
        </Button>
      </div>
    </form>
  );
}
