import { useState } from "react";
import { FormError } from "~/components/forms/form-error";
import { Button } from "~/components/ui/button";
import { FieldChrome, Input } from "~/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "~/components/ui/select";
import {
  ACADEMIC_PERIOD_STATUS_LABELS,
  ACADEMIC_PERIOD_STATUSES,
  type AcademicPeriodStatus,
} from "~/features/academic-year/academic-year-status";
import { schoolYearSchema } from "~/schemas/school-year.schema";
import { semesterSchema } from "~/schemas/semester.schema";

const CURRENT_YEAR = new Date().getFullYear();
const EXAMPLE_SCHOOL_YEAR = `${CURRENT_YEAR}-${CURRENT_YEAR + 1}`;

// A newly created period can't already be finished — "Completed"/"Archived" only
// make sense once an existing period has run its course, so restrict Add to these.
const NEW_PERIOD_STATUSES: AcademicPeriodStatus[] = ["upcoming", "active"];

export type AcademicPeriodFormValue = {
  schoolYear: string;
  semester: string;
  semesterNumber: number;
  status: AcademicPeriodStatus;
};

type AcademicPeriodFormProps = {
  initialValue?: AcademicPeriodFormValue;
  onSubmit: (value: AcademicPeriodFormValue) => Promise<void>;
  onCancel: () => void;
};

/** Semester number is derived from the leading digit of the name (e.g. "1st Semester" → 1) — no separate field. */
export function AcademicPeriodForm({ initialValue, onSubmit, onCancel }: AcademicPeriodFormProps) {
  const [schoolYear, setSchoolYear] = useState(initialValue?.schoolYear ?? "");
  const [status, setStatus] = useState<AcademicPeriodStatus>(initialValue?.status ?? "upcoming");
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const isEdit = Boolean(initialValue);
  const statusOptions = isEdit ? ACADEMIC_PERIOD_STATUSES : NEW_PERIOD_STATUSES;

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
    const data = new FormData(e.currentTarget);
    const semesterName = String(data.get("period-semester") ?? "").trim();
    const leadingDigit = semesterName.match(/^(\d)/)?.[1];

    const yearResult = schoolYearSchema.safeParse({ schoolYear });
    if (!yearResult.success) {
      setError(yearResult.error.issues[0].message);
      return;
    }

    if (!leadingDigit) {
      setError("Start the semester name with its number, e.g. \"1st Semester\".");
      return;
    }

    const semResult = semesterSchema.safeParse({
      semester: semesterName,
      semesterNumber: Number(leadingDigit),
    });
    if (!semResult.success) {
      setError(semResult.error.issues[0].message);
      return;
    }

    setError(null);
    setIsSaving(true);
    try {
      await onSubmit({
        schoolYear: yearResult.data.schoolYear,
        semester: semResult.data.semester,
        semesterNumber: semResult.data.semesterNumber,
        status,
      });
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
        id="period-school-year"
        label="School Year"
        required
        type="text"
        placeholder={`e.g. ${EXAMPLE_SCHOOL_YEAR}`}
        value={schoolYear}
        onChange={handleSchoolYearChange}
        autoFocus
      />
      <Input
        id="period-semester"
        label="Semester"
        required
        placeholder="1st Semester"
        defaultValue={initialValue?.semester ?? ""}
        hint="Start with the number, e.g. 1st Semester, 2nd Semester, 3rd Semester."
      />
      <FieldChrome id="period-status" label="Status">
        <Select
          items={statusOptions.map((s) => ({
            value: s,
            label: ACADEMIC_PERIOD_STATUS_LABELS[s],
          }))}
          name="period-status"
          value={status}
          onValueChange={(value) => setStatus(value as AcademicPeriodStatus)}
        >
          <SelectTrigger id="period-status">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {statusOptions.map((s) => (
              <SelectItem key={s} value={s}>
                {ACADEMIC_PERIOD_STATUS_LABELS[s]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </FieldChrome>
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
          {isEdit ? "Save Changes" : "Add Academic Period"}
        </Button>
      </div>
    </form>
  );
}
