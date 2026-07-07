import { useState } from "react";
import { FormError } from "~/components/forms/form-error";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Select } from "~/components/ui/select";
import { facultySchema } from "~/schemas/faculty.schema";
import type { Department } from "~/types/department";
import {
  FACULTY_STATUS_LABELS,
  FACULTY_STATUSES,
  type CreateFacultyInput,
  type Faculty,
  type FacultyStatus,
} from "~/types/faculty";

type FacultyFormProps = {
  member?: Faculty;
  departments: Department[];
  onSubmit: (input: CreateFacultyInput) => Promise<void>;
  onCancel: () => void;
};

export function FacultyForm({ member, departments, onSubmit, onCancel }: FacultyFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isEdit = Boolean(member);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const data = new FormData(e.currentTarget);

    const firstName = String(data.get("faculty-first-name") ?? "").trim();
    const lastName = String(data.get("faculty-last-name") ?? "").trim();
    const email = String(data.get("faculty-email") ?? "").trim();
    const departmentId = String(data.get("faculty-department") ?? "");
    const specialization = String(data.get("faculty-specialization") ?? "").trim();
    const status = String(data.get("faculty-status") ?? "") as FacultyStatus;
    const maxWeeklyHours = String(data.get("faculty-max-weekly-hours") ?? "25");

    const result = facultySchema.safeParse({ firstName, lastName, email, departmentId, specialization, status, maxWeeklyHours });
    if (!result.success) {
      setError(result.error.issues[0].message);
      return;
    }

    const dept = departments.find((d) => d.id === departmentId);
    if (!dept) { setError("Select a department."); return; }

    setError(null);
    setIsLoading(true);
    try {
      await onSubmit({ ...result.data, departmentCode: dept.code });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
      setIsLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
      <FormError message={error} />

      <div className="grid grid-cols-2 gap-3">
        <Input
          id="faculty-first-name"
          label="First Name"
          type="text"
          required
          placeholder="Ana"
          defaultValue={member?.firstName}
        />
        <Input
          id="faculty-last-name"
          label="Last Name"
          type="text"
          required
          placeholder="Reyes"
          defaultValue={member?.lastName}
        />
      </div>

      <Input
        id="faculty-email"
        label="Email"
        type="email"
        required
        placeholder="a.reyes@gwc.edu.ph"
        defaultValue={member?.email}
      />

      <Select
        id="faculty-department"
        label="Department"
        defaultValue={member?.departmentId ?? departments[0]?.id}
      >
        {departments.map((d) => (
          <option key={d.id} value={d.id}>
            {d.code} — {d.name}
          </option>
        ))}
      </Select>

      <Input
        id="faculty-specialization"
        label="Specialization"
        type="text"
        placeholder="e.g. Web Development"
        defaultValue={member?.specialization}
      />

      <Select
        id="faculty-status"
        label="Status"
        defaultValue={member?.status ?? "active"}
      >
        {FACULTY_STATUSES.map((s) => (
          <option key={s} value={s}>
            {FACULTY_STATUS_LABELS[s]}
          </option>
        ))}
      </Select>

      <Input
        id="faculty-max-weekly-hours"
        label="Max Weekly Hours"
        type="number"
        min={1}
        max={60}
        defaultValue={member?.maxWeeklyHours ?? 25}
      />

      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" block={false} onClick={onCancel}>
          Cancel
        </Button>
        <Button block={false} isLoading={isLoading} loadingLabel="Saving…">
          {isEdit ? "Save Changes" : "Add Faculty"}
        </Button>
      </div>
    </form>
  );
}
