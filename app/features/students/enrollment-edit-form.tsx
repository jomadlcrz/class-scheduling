import { useState } from "react";
import { FormError } from "~/components/forms/form-error";
import { Button } from "~/components/ui/button";
import { FieldChrome } from "~/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "~/components/ui/select";
import { useYearLevels } from "~/hooks/use-year-levels";
import type { ClassSet } from "~/types/set";
import type { StudentAcademicRecord, UpdateEnrollmentInput } from "~/types/student";

type EnrollmentEditFormProps = {
  record: StudentAcademicRecord;
  sets: ClassSet[];
  academicStatuses: string[];
  onSubmit: (input: UpdateEnrollmentInput) => Promise<void>;
  onCancel: () => void;
};

/** Edits a single term's set/year level/status (PUT /students/enrollments/<id>) — doesn't touch enrolled subjects. */
export function EnrollmentEditForm({ record, sets, academicStatuses, onSubmit, onCancel }: EnrollmentEditFormProps) {
  const { yearLevels } = useYearLevels();
  const [yearLevel, setYearLevel] = useState(String(record.yearLevel));
  const [setId, setSetId] = useState("");
  const [enrolledStatus, setEnrolledStatus] = useState(record.enrolledStatus);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const setsForProgram = sets.filter((s) => s.program === record.program);

  async function handleSubmit() {
    setError(null);
    setIsSaving(true);
    try {
      await onSubmit({
        yearLevel: Number(yearLevel),
        ...(setId && { setId: Number(setId) }),
        enrolledStatus,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
      setIsSaving(false);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <FormError message={error} />

      <FieldChrome id="enrollment-year-level" label="Year Level">
        <Select
          items={yearLevels.map((yl) => ({ value: String(yl.id), label: yl.name }))}
          value={yearLevel}
          onValueChange={(v) => setYearLevel(v as string)}
        >
          <SelectTrigger id="enrollment-year-level">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {yearLevels.map((yl) => (
              <SelectItem key={yl.id} value={String(yl.id)}>
                {yl.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </FieldChrome>

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

      <FieldChrome id="enrollment-status" label="Enrolled Status">
        <Select
          items={academicStatuses.map((s) => ({ value: s, label: s }))}
          value={enrolledStatus}
          onValueChange={(v) => setEnrolledStatus(v as string)}
        >
          <SelectTrigger id="enrollment-status">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {academicStatuses.map((s) => (
              <SelectItem key={s} value={s}>
                {s}
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
