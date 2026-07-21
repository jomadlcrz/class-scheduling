import { useState } from "react";
import { FormError } from "~/components/forms/form-error";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { semesterSchema } from "~/schemas/semester.schema";
import type { CreateSemesterInput } from "~/types/semester";

type SemesterFormProps = {
  onSubmit: (input: CreateSemesterInput) => Promise<void>;
  onCancel: () => void;
};

/** Semester number is derived from the leading digit of the name (e.g. "1st Semester" → 1) — no separate field. */
export function SemesterForm({ onSubmit, onCancel }: SemesterFormProps) {
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    const semester = String(data.get("semester-name") ?? "").trim();
    const leadingDigit = semester.match(/^(\d)/)?.[1];

    if (!leadingDigit) {
      setError("Start the name with the semester number, e.g. \"1st Semester\".");
      return;
    }

    const result = semesterSchema.safeParse({ semester, semesterNumber: Number(leadingDigit) });
    if (!result.success) {
      setError(result.error.issues[0].message);
      return;
    }

    setError(null);
    setIsSaving(true);
    try {
      await onSubmit(result.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
      <FormError message={error} />
      <Input
        id="semester-name"
        label="Semester Name"
        required
        placeholder="1st Semester"
        hint="Start with the number, e.g. 1st Semester, 2nd Semester, 3rd Semester."
        autoFocus
      />
      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" block={false} onClick={onCancel} disabled={isSaving}>
          Cancel
        </Button>
        <Button type="submit" block={false} isLoading={isSaving} loadingLabel="Adding…">
          Add Semester
        </Button>
      </div>
    </form>
  );
}
