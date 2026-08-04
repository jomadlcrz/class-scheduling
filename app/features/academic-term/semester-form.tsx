import { useState } from "react";
import { FormError } from "~/components/forms/form-error";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "~/components/ui/select";
import {
  SEMESTER_NUMBER_TO_NAME,
  semesterWriteSchema,
} from "~/schemas/semester.schema";

export type SemesterFormValue = {
  semester: string;
  semesterNumber: 1 | 2;
  semesterName: string;
};

type SemesterFormProps = {
  initialValue?: SemesterFormValue;
  defaultNumber?: 1 | 2;
  mode?: "create" | "edit";
  onSubmit: (value: SemesterFormValue) => Promise<void>;
  onCancel: () => void;
};

/** Collects semester, semesterNumber, and semesterName for POST /semesters. */
export function SemesterForm({ initialValue, defaultNumber, mode, onSubmit, onCancel }: SemesterFormProps) {
  const isEdit = mode === "edit" || (mode == null && Boolean(initialValue));
  const [semesterNumber, setSemesterNumber] = useState<1 | 2>(
    initialValue?.semesterNumber ?? defaultNumber ?? 1,
  );
  const [semesterName, setSemesterName] = useState(
    initialValue?.semesterName ?? initialValue?.semester ?? SEMESTER_NUMBER_TO_NAME[defaultNumber ?? 1],
  );
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  function handleNumberChange(value: string | null) {
    if (value == null) return;
    const next = Number(value) as 1 | 2;
    if (next !== 1 && next !== 2) return;
    setSemesterNumber(next);
    if (!isEdit) {
      setSemesterName(SEMESTER_NUMBER_TO_NAME[next]);
    }
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const trimmedName = semesterName.trim();
    const payload = {
      semester: trimmedName,
      semesterNumber,
      semesterName: trimmedName,
    };

    const result = semesterWriteSchema.safeParse(payload);
    if (!result.success) {
      setError(result.error.issues[0].message);
      return;
    }

    setError(null);
    setIsSaving(true);
    try {
      await onSubmit(result.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
      <FormError message={error} />

      <div className="w-full">
        <label htmlFor="semester-number" className="font-body text-sm font-medium text-navy-700 dark:text-mist-100">
          Semester number
        </label>
        <div className="mt-1.5">
          <Select
            items={[
              { value: "1", label: "1 — 1st Semester" },
              { value: "2", label: "2 — 2nd Semester" },
            ]}
            value={String(semesterNumber)}
            onValueChange={handleNumberChange}
          >
            <SelectTrigger id="semester-number" aria-label="Semester number" disabled={isEdit}>
              <SelectValue placeholder="Select semester" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1">1 — 1st Semester</SelectItem>
              <SelectItem value="2">2 — 2nd Semester</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <Input
        id="semester-name"
        label="Semester name"
        required
        value={semesterName}
        onChange={(event) => setSemesterName(event.target.value)}
        placeholder="1st Semester"
        hint='Sent as both "semester" and "semesterName" — use "1st Semester" or "2nd Semester".'
        autoFocus
      />

      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" block={false} onClick={onCancel} disabled={isSaving}>
          Cancel
        </Button>
        <Button type="submit" block={false} isLoading={isSaving} loadingLabel={isEdit ? "Saving…" : "Adding…"}>
          {isEdit ? "Save Changes" : "Add Semester"}
        </Button>
      </div>
    </form>
  );
}

export function suggestedSemesterNumber(existingNumbers: Iterable<number>): 1 | 2 {
  const taken = new Set(existingNumbers);
  if (!taken.has(1)) return 1;
  if (!taken.has(2)) return 2;
  return 1;
}
