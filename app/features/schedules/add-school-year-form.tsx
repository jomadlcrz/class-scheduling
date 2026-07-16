import { useState } from "react";
import { FormError } from "~/components/forms/form-error";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";

const SCHOOL_YEAR_RE = /^\d{4}-\d{4}$/;

type AddSchoolYearFormProps = {
  onAdd: (schoolYear: string) => Promise<void>;
  onCancel: () => void;
};

/** Small form for creating a new school year inline, e.g. from a modal. */
export function AddSchoolYearForm({ onAdd, onCancel }: AddSchoolYearFormProps) {
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    const schoolYear = String(data.get("school-year") ?? "").trim();

    if (!SCHOOL_YEAR_RE.test(schoolYear)) {
      setError("Enter a school year like 2026-2027.");
      return;
    }
    const [start, end] = schoolYear.split("-").map(Number);
    if (end !== start + 1) {
      setError("The end year must be one year after the start year.");
      return;
    }

    setError(null);
    setIsSaving(true);
    try {
      await onAdd(schoolYear);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
      <FormError message={error} />
      <Input id="school-year" label="School Year" type="text" placeholder="e.g. 2026-2027" autoFocus />
      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" block={false} onClick={onCancel} disabled={isSaving}>
          Cancel
        </Button>
        <Button type="submit" block={false} isLoading={isSaving} loadingLabel="Adding…">
          Add School Year
        </Button>
      </div>
    </form>
  );
}
