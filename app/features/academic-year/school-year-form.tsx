import { useState } from "react";
import { FormError } from "~/components/forms/form-error";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { schoolYearSchema } from "~/schemas/school-year.schema";

const CURRENT_YEAR = new Date().getFullYear();
const EXAMPLE_SCHOOL_YEAR = `${CURRENT_YEAR}-${CURRENT_YEAR + 1}`;

type SchoolYearFormProps = {
  initialValue?: string;
  onSubmit: (schoolYear: string) => Promise<void>;
  onCancel: () => void;
};

export function SchoolYearForm({ initialValue, onSubmit, onCancel }: SchoolYearFormProps) {
  const [schoolYear, setSchoolYear] = useState(initialValue ?? "");
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const isEdit = Boolean(initialValue);

  // The end year is always start + 1 (backend rule) — auto-fill it the moment
  // a 4-digit start year is typed, but leave the field free to edit after that.
  function handleSchoolYearChange(e: React.ChangeEvent<HTMLInputElement>) {
    const raw = e.target.value;
    if (/^\d{4}$/.test(raw)) {
      setSchoolYear(`${raw}-${Number(raw) + 1}`);
      return;
    }
    setSchoolYear(raw);
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    const result = schoolYearSchema.safeParse({ schoolYear });
    if (!result.success) {
      setError(result.error.issues[0].message);
      return;
    }

    setError(null);
    setIsSaving(true);
    try {
      await onSubmit(result.data.schoolYear);
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
        id="school-year"
        label="School Year"
        type="text"
        placeholder={`e.g. ${EXAMPLE_SCHOOL_YEAR}`}
        value={schoolYear}
        onChange={handleSchoolYearChange}
        autoFocus
      />
      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" block={false} onClick={onCancel} disabled={isSaving}>
          Cancel
        </Button>
        <Button
          type="submit"
          block={false}
          isLoading={isSaving}
          loadingLabel={isEdit ? "Saving…" : "Adding…"}
        >
          {isEdit ? "Save Changes" : "Add School Year"}
        </Button>
      </div>
    </form>
  );
}
