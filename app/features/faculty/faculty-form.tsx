import { useState } from "react";
import { FormError } from "~/components/forms/form-error";
import { Button } from "~/components/ui/button";
import { FieldChrome, Input } from "~/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "~/components/ui/select";
import type { Department } from "~/types/department";
import type { Faculty } from "~/types/faculty";

type FacultyFormProps = {
  member?: Faculty;
  departments: Department[];
  onSubmit: (input: { firstName: string; lastName: string; email: string; departmentId: string }) => Promise<void>;
  onCancel: () => void;
};

export function FacultyForm({ member, departments, onSubmit, onCancel }: FacultyFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const data = new FormData(e.currentTarget);

    const firstName = String(data.get("faculty-first-name") ?? "").trim();
    const lastName = String(data.get("faculty-last-name") ?? "").trim();
    const email = String(data.get("faculty-email") ?? "").trim();
    const departmentId = String(data.get("faculty-department") ?? "");

    if (!firstName) { setError("Enter the first name."); return; }
    if (!lastName) { setError("Enter the last name."); return; }
    if (!email) { setError("Enter the email."); return; }
    if (!departmentId) { setError("Select a department."); return; }

    setError(null);
    setIsLoading(true);
    try {
      await onSubmit({ firstName, lastName, email, departmentId });
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
        defaultValue={member?.email ?? ""}
      />

      <FieldChrome id="faculty-department" label="Department">
        <Select
          items={departments.map((d) => ({ value: String(d.id), label: `${d.abbrev} — ${d.name}` }))}
          name="faculty-department"
          defaultValue={member?.departmentCode ?? String(departments[0]?.id ?? "")}
        >
          <SelectTrigger id="faculty-department">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {departments.map((d) => (
              <SelectItem key={d.id} value={String(d.id)}>
                {d.abbrev} — {d.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </FieldChrome>

      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" block={false} onClick={onCancel}>
          Cancel
        </Button>
        <Button block={false} isLoading={isLoading} loadingLabel="Saving…">
          Save Changes
        </Button>
      </div>
    </form>
  );
}
