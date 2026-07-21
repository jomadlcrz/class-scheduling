import { useState } from "react";
import { FormError } from "~/components/forms/form-error";
import { Button } from "~/components/ui/button";
import { FieldChrome, Input } from "~/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "~/components/ui/select";
import { facultySchema } from "~/schemas/faculty.schema";
import type { DepartmentOption } from "~/types/department";
import type { CreateFacultyAccountInput } from "~/types/faculty";

const deanAccountSchema = facultySchema.omit({ roleName: true });

type DeanFormProps = {
  departments: DepartmentOption[];
  /** Backend enum values (enumService); empty selection = not specified. */
  genders: string[];
  civilStatuses: string[];
  onSubmit: (input: Omit<CreateFacultyAccountInput, "roleName">) => Promise<void>;
  onCancel: () => void;
};

/** Creates the dean login account + faculty profile on the backend (temp password emailed). */
export function DeanForm({ departments, genders, civilStatuses, onSubmit, onCancel }: DeanFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const data = new FormData(e.currentTarget);

    const result = deanAccountSchema.safeParse({
      firstName: String(data.get("dean-first-name") ?? "").trim(),
      midName: String(data.get("dean-mid-name") ?? "").trim(),
      lastName: String(data.get("dean-last-name") ?? "").trim(),
      email: String(data.get("dean-email") ?? "").trim(),
      mobile: String(data.get("dean-mobile") ?? "").trim(),
      departmentId: String(data.get("dean-department") ?? ""),
      gender: String(data.get("dean-gender") ?? ""),
      civilStatus: String(data.get("dean-civil-status") ?? ""),
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
      setError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
      setIsLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
      <FormError message={error} />

      <div className="grid grid-cols-2 gap-3">
        <Input id="dean-first-name" label="First Name" type="text" required placeholder="Enter first name" />
        <Input id="dean-mid-name" label="Middle Name" type="text" placeholder="Enter middle name" />
      </div>

      <Input id="dean-last-name" label="Last Name" type="text" required placeholder="Enter last name" />

      <Input id="dean-email" label="Email" type="email" required placeholder="dean@gwc.edu.ph" />

      <Input
        id="dean-mobile"
        label="Mobile Number"
        type="text"
        inputMode="numeric"
        pattern="[0-9]*"
        maxLength={11}
        required
        placeholder="Enter mobile number"
        onInput={(e) => {
          e.currentTarget.value = e.currentTarget.value.replace(/\D/g, "").slice(0, 11);
        }}
      />

      <FieldChrome id="dean-department" label="Department" required>
        <Select
          items={[
            { value: "", label: "Select a department" },
            ...departments.map((d) => ({ value: d.id, label: `${d.abbrev} — ${d.name}` })),
          ]}
          name="dean-department"
          defaultValue=""
        >
          <SelectTrigger id="dean-department">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">Select a department</SelectItem>
            {departments.map((d) => (
              <SelectItem key={d.id} value={d.id}>
                {d.abbrev} — {d.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </FieldChrome>

      <div className="grid grid-cols-2 gap-3">
        <FieldChrome id="dean-gender" label="Gender" required>
          <Select
            items={[{ value: "", label: "Select a gender" }, ...genders.map((g) => ({ value: g, label: g }))]}
            name="dean-gender"
            defaultValue=""
          >
            <SelectTrigger id="dean-gender">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">Select a gender</SelectItem>
              {genders.map((g) => (
                <SelectItem key={g} value={g}>
                  {g}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </FieldChrome>
        <FieldChrome id="dean-civil-status" label="Civil Status" required>
          <Select
            items={[
              { value: "", label: "Select a status" },
              ...civilStatuses.map((s) => ({ value: s, label: s })),
            ]}
            name="dean-civil-status"
            defaultValue=""
          >
            <SelectTrigger id="dean-civil-status">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">Select a status</SelectItem>
              {civilStatuses.map((s) => (
                <SelectItem key={s} value={s}>
                  {s}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </FieldChrome>
      </div>

      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" block={false} onClick={onCancel}>
          Cancel
        </Button>
        <Button block={false} isLoading={isLoading} loadingLabel="Creating…">
          Add Dean
        </Button>
      </div>
    </form>
  );
}
