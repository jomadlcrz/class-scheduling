import { useState } from "react";
import { FormError } from "~/components/forms/form-error";
import { Button } from "~/components/ui/button";
import { Select } from "~/components/ui/select";
import { semesterSchema } from "~/schemas/semester.schema";
import {
  ACADEMIC_SEMESTER_STATUSES,
  ACADEMIC_SEMESTER_STATUS_LABELS,
  type AcademicSemester,
  type CreateAcademicSemesterInput,
} from "~/types/semester";
import { SEMESTER_LABELS, SEMESTERS } from "~/types/subject";

type SemesterFormProps = {
  academicYearId: string;
  academicYearLabel: string;
  semester?: AcademicSemester;
  onSubmit: (input: CreateAcademicSemesterInput) => Promise<void>;
  onCancel: () => void;
};

export function SemesterForm({
  academicYearId,
  academicYearLabel,
  semester,
  onSubmit,
  onCancel,
}: SemesterFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const isEdit = Boolean(semester);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    const semNum = Number(data.get("sem-number"));
    const status = String(data.get("sem-status") ?? "");

    const result = semesterSchema.safeParse({
      academicYearId,
      semester: semNum,
      status,
    });
    if (!result.success) {
      setError(result.error.issues[0].message);
      return;
    }

    setError(null);
    setIsLoading(true);
    try {
      await onSubmit({
        academicYearId,
        academicYearLabel,
        semester: result.data.semester as 1 | 2 | 3,
        status: result.data.status,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
      setIsLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
      <FormError message={error} />
      <Select
        id="sem-number"
        label="Semester"
        defaultValue={semester?.semester ?? 1}
      >
        {SEMESTERS.map((s) => (
          <option key={s} value={s}>
            {SEMESTER_LABELS[s]}
          </option>
        ))}
      </Select>
      <Select
        id="sem-status"
        label="Status"
        defaultValue={semester?.status ?? "upcoming"}
      >
        {ACADEMIC_SEMESTER_STATUSES.map((s) => (
          <option key={s} value={s}>
            {ACADEMIC_SEMESTER_STATUS_LABELS[s]}
          </option>
        ))}
      </Select>
      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" block={false} onClick={onCancel}>
          Cancel
        </Button>
        <Button block={false} isLoading={isLoading} loadingLabel="Saving…">
          {isEdit ? "Save Changes" : "Add Semester"}
        </Button>
      </div>
    </form>
  );
}
