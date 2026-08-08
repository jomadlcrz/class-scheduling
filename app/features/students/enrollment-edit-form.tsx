import { useState } from "react";
import { FormError } from "~/components/forms/form-error";
import { Button } from "~/components/ui/button";
import { FieldChrome } from "~/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "~/components/ui/select";
import type { ClassSet } from "~/types/set";
import type { StudentAcademicRecord, UpdateEnrollmentInput } from "~/types/student";

type EnrollmentEditFormProps = {
  record: StudentAcademicRecord;
  sets: ClassSet[];
  enrollmentStates: string[];
  onSubmit: (input: EnrollmentEditValue) => Promise<void>;
  onCancel: () => void;
};

export type EnrollmentEditValue = UpdateEnrollmentInput & { enrollmentState?: string };

/**
 * Edits a single term's section (set) and enrollment state.
 * Year level and academic status are derived server-side and are no longer editable
 * here (PUT /enrollments/<id> accepts only setId; state goes through PATCH .../state).
 */
export function EnrollmentEditForm({
  record,
  sets,
  enrollmentStates,
  onSubmit,
  onCancel,
}: EnrollmentEditFormProps) {
  const [setId, setSetId] = useState("");
  const [enrollmentState, setEnrollmentState] = useState(record.enrollmentState ?? "");
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const setsForProgram = sets.filter((s) => s.program === record.program);

  async function handleSubmit() {
    setError(null);
    setIsSaving(true);
    try {
      await onSubmit({
        ...(setId && { setId: Number(setId) }),
        ...(enrollmentState && { enrollmentState }),
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "");
      setIsSaving(false);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <FormError message={error} />

      <FieldChrome id="enrollment-set" label="Set" hint="Leave unset to keep the current set.">
        <Select
          items={[
            { value: "", label: "Keep current set" },
            ...setsForProgram.map((s) => ({ value: String(s.id), label: `${s.program} ${s.yearLevel}${s.setCode}` })),
          ]}
          value={setId}
          onValueChange={(v) => setSetId(v as string)}
        >
          <SelectTrigger id="enrollment-set">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">Keep current set</SelectItem>
            {setsForProgram.map((s) => (
              <SelectItem key={s.id} value={String(s.id)}>
                {s.program} {s.yearLevel}
                {s.setCode}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </FieldChrome>

      <FieldChrome
        id="enrollment-state"
        label="Enrollment State"
        hint="Use this to mark the enrollment as enrolled, dropped, withdrawn, or voided without deleting its history."
      >
        <Select
          items={[
            { value: "", label: "Keep current state" },
            ...enrollmentStates.map((state) => ({ value: state, label: state })),
          ]}
          value={enrollmentState}
          onValueChange={(value) => setEnrollmentState(value as string)}
        >
          <SelectTrigger id="enrollment-state">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">Keep current state</SelectItem>
            {enrollmentStates.map((state) => (
              <SelectItem key={state} value={state}>
                {state}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </FieldChrome>

      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" block={false} onClick={onCancel} disabled={isSaving}>
          Cancel
        </Button>
        <Button type="button" block={false} isLoading={isSaving} loadingLabel="Saving…" onClick={handleSubmit}>
          Save Changes
        </Button>
      </div>
    </div>
  );
}
