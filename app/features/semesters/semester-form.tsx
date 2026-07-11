import { useState } from "react";
import { FormError } from "~/components/forms/form-error";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Select } from "~/components/ui/select";
import { semesterSchema } from "~/schemas/semester.schema";
import type { CreateSemesterInput } from "~/types/semester";

const SEMESTER_NUMBERS = [1, 2, 3] as const;

type SemesterFormProps = {
  onSubmit: (input: CreateSemesterInput) => Promise<void>;
  onCancel: () => void;
};

export function SemesterForm({ onSubmit, onCancel }: SemesterFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const data = new FormData(e.currentTarget);

    const result = semesterSchema.safeParse({
      semester: String(data.get("sem-name") ?? "").trim(),
      semesterNumber: Number(data.get("sem-number")),
    });
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
        id="sem-name"
        label="Semester Name"
        placeholder="e.g. 1st Semester"
        maxLength={20}
        required
      />
      <Select id="sem-number" label="Semester Number" defaultValue={1}>
        {SEMESTER_NUMBERS.map((n) => (
          <option key={n} value={n}>
            {n}
          </option>
        ))}
      </Select>
      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" block={false} onClick={onCancel}>
          Cancel
        </Button>
        <Button block={false} isLoading={isLoading} loadingLabel="Saving…">
          Add Semester
        </Button>
      </div>
    </form>
  );
}
