import { useState } from "react";
import { FormError } from "~/components/forms/form-error";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { SEMESTER_NUMBER_TO_NAME, semesterWriteSchema } from "~/schemas/semester.schema";

export type SemesterFormValue = {
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

/** Collects semesterNumber and semesterName for POST /semesters. */
export function SemesterForm({ initialValue, defaultNumber, mode, onSubmit, onCancel }: SemesterFormProps) {
  const isEdit = mode === "edit" || (mode == null && Boolean(initialValue));
  const [semesterNumber, setSemesterNumber] = useState(
    String(initialValue?.semesterNumber ?? defaultNumber ?? 1),
  );
  const [semesterName, setSemesterName] = useState(
    initialValue?.semesterName ?? SEMESTER_NUMBER_TO_NAME[defaultNumber ?? 1],
  );
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  function handleNumberChange(event: React.ChangeEvent<HTMLInputElement>) {
    const raw = event.target.value.replace(/\D/g, "").slice(0, 1);
    setSemesterNumber(raw);
    const next = Number(raw);
    if (!isEdit && (next === 1 || next === 2)) {
      setSemesterName(SEMESTER_NUMBER_TO_NAME[next as 1 | 2]);
    }
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const trimmedName = semesterName.trim();
    const numberValue = Number(semesterNumber);
    if (numberValue !== 1 && numberValue !== 2) {
      setError("Semester number must be 1 or 2.");
      return;
    }
    const payload = {
      semesterNumber: numberValue as 1 | 2,
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
        <Input
          id="semester-number"
          label="Semester number"
          type="number"
          min={1}
          max={2}
          step={1}
          inputMode="numeric"
          required
          value={semesterNumber}
          onChange={handleNumberChange}
          disabled={isEdit}
          placeholder="1"
          hint="Only 1 or 2 — the two global semesters."
        />
      </div>

      <Input
        id="semester-name"
        label="Semester name"
        required
        value={semesterName}
        onChange={(event) => setSemesterName(event.target.value)}
        placeholder="1st Semester"
        hint='Sent as "semesterName" — must match the number, e.g. "1st Semester" or "2nd Semester".'
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
