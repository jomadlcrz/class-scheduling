import { useState } from "react";
import { FormError } from "~/components/forms/form-error";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Select } from "~/components/ui/select";
import { facultyAccountSchema } from "~/schemas/faculty.schema";
import type { DepartmentOption } from "~/types/department";
import type { CreateFacultyAccountInput } from "~/types/faculty";

type FacultyAccountFormProps = {
  departments: DepartmentOption[];
  /** Backend enum values (enumService); empty selection = not specified. */
  genders: string[];
  civilStatuses: string[];
  onSubmit: (input: CreateFacultyAccountInput) => Promise<void>;
  onCancel: () => void;
};

/** Creates the faculty login account + profile on the backend (temp password emailed). */
export function FacultyAccountForm({
  departments,
  genders,
  civilStatuses,
  onSubmit,
  onCancel,
}: FacultyAccountFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const data = new FormData(e.currentTarget);

    const result = facultyAccountSchema.safeParse({
      firstName: String(data.get("faculty-first-name") ?? "").trim(),
      midName: String(data.get("faculty-mid-name") ?? "").trim(),
      lastName: String(data.get("faculty-last-name") ?? "").trim(),
      email: String(data.get("faculty-email") ?? "").trim(),
      mobile: String(data.get("faculty-mobile") ?? "").trim(),
      departmentId: String(data.get("faculty-department") ?? ""),
      gender: String(data.get("faculty-gender") ?? ""),
      civilStatus: String(data.get("faculty-civil-status") ?? ""),
    });
    if (!result.success) {
      setError(result.error.issues[0].message);
      return;
    }

    setError(null);
    setIsLoading(true);
    try {
      // Empty enum selections are omitted — the backend defaults them to "N/A".
      await onSubmit({
        ...result.data,
        gender: result.data.gender || undefined,
        civilStatus: result.data.civilStatus || undefined,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
      setIsLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
      <FormError message={error} />

      <div className="grid grid-cols-2 gap-3">
        <Input id="faculty-first-name" label="First Name" type="text" required placeholder="Ana" />
        <Input id="faculty-mid-name" label="Middle Name" type="text" placeholder="Optional" />
      </div>

      <Input id="faculty-last-name" label="Last Name" type="text" required placeholder="Reyes" />

      <Input
        id="faculty-email"
        label="Email"
        type="email"
        required
        placeholder="a.reyes@gwc.edu.ph"
      />

      <Input
        id="faculty-mobile"
        label="Mobile Number"
        type="tel"
        required
        placeholder="09171234567"
      />

      <Select id="faculty-department" label="Department" defaultValue={departments[0]?.id}>
        {departments.map((d) => (
          <option key={d.id} value={d.id}>
            {d.code} — {d.name}
          </option>
        ))}
      </Select>

      <div className="grid grid-cols-2 gap-3">
        <Select id="faculty-gender" label="Gender" defaultValue="">
          {genders.map((g) => (
            <option key={g} value={g}>
              {g}
            </option>
          ))}
        </Select>
        <Select id="faculty-civil-status" label="Civil Status" defaultValue="">
          {civilStatuses.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </Select>
      </div>

      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" block={false} onClick={onCancel}>
          Cancel
        </Button>
        <Button block={false} isLoading={isLoading} loadingLabel="Creating…">
          Add Faculty
        </Button>
      </div>
    </form>
  );
}
