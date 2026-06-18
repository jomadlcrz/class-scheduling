import { useState } from "react";
import { FormError } from "../../components/forms/form-error";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Select } from "../../components/ui/select";
import { academicYearSchema } from "../../schemas/academic-year.schema";
import {
  ACADEMIC_YEAR_STATUSES,
  ACADEMIC_YEAR_STATUS_LABELS,
  type AcademicYear,
  type CreateAcademicYearInput,
} from "../../types/academic-year";

type AcademicYearFormProps = {
  academicYear?: AcademicYear;
  onSubmit: (input: CreateAcademicYearInput) => Promise<void>;
  onCancel: () => void;
};

export function AcademicYearForm({ academicYear, onSubmit, onCancel }: AcademicYearFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const isEdit = Boolean(academicYear);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    const label = String(data.get("ay-label") ?? "").trim();
    const status = String(data.get("ay-status") ?? "");

    const result = academicYearSchema.safeParse({ label, status });
    if (!result.success) {
      setError(result.error.issues[0].message);
      return;
    }

    setError(null);
    setIsLoading(true);
    try {
      await onSubmit(result.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
      setIsLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
      <FormError message={error} />
      <Input
        id="ay-label"
        label="Academic Year"
        required
        placeholder="2025-2026"
        defaultValue={academicYear?.label ?? ""}
        hint="Format: YYYY-YYYY (e.g., 2025-2026)."
      />
      <Select
        id="ay-status"
        label="Status"
        defaultValue={academicYear?.status ?? "upcoming"}
      >
        {ACADEMIC_YEAR_STATUSES.map((s) => (
          <option key={s} value={s}>
            {ACADEMIC_YEAR_STATUS_LABELS[s]}
          </option>
        ))}
      </Select>
      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" block={false} onClick={onCancel}>
          Cancel
        </Button>
        <Button block={false} isLoading={isLoading} loadingLabel="Saving…">
          {isEdit ? "Save Changes" : "Add Academic Year"}
        </Button>
      </div>
    </form>
  );
}
