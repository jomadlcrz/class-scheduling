import { useState } from "react";
import { FormError } from "~/components/forms/form-error";
import { Button } from "~/components/ui/button";
import { FieldChrome, Input } from "~/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "~/components/ui/select";
import { administratorSchema } from "~/schemas/administrator.schema";
import type { CreateAdministratorAccountInput } from "~/types/administrator";
import { ADMINISTRATOR_ROLES } from "~/types/administrator";
import type { DepartmentOption } from "~/types/department";

type AdministratorAccountFormProps = {
  departments: DepartmentOption[];
  /** Backend enum values (enumService); empty selection = not specified. */
  genders: string[];
  civilStatuses: string[];
  onSubmit: (input: CreateAdministratorAccountInput) => Promise<void>;
  onCancel: () => void;
};

/** Creates a Super Admin or Registrar Admin account (temp password emailed). */
export function AdministratorAccountForm({
  departments,
  genders,
  civilStatuses,
  onSubmit,
  onCancel,
}: AdministratorAccountFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [role, setRole] = useState("");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const data = new FormData(e.currentTarget);

    const result = administratorSchema.safeParse({
      firstName: String(data.get("admin-first-name") ?? "").trim(),
      midName: String(data.get("admin-mid-name") ?? "").trim(),
      lastName: String(data.get("admin-last-name") ?? "").trim(),
      email: String(data.get("admin-email") ?? "").trim(),
      mobile: String(data.get("admin-mobile") ?? "").trim(),
      roleName: String(data.get("admin-role") ?? ""),
      departmentId: String(data.get("admin-department") ?? ""),
      gender: String(data.get("admin-gender") ?? ""),
      civilStatus: String(data.get("admin-civil-status") ?? ""),
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
        <Input id="admin-first-name" label="First Name" type="text" required placeholder="Enter first name" />
        <Input id="admin-mid-name" label="Middle Name" type="text" placeholder="Enter middle name" />
      </div>

      <Input id="admin-last-name" label="Last Name" type="text" required placeholder="Enter last name" />

      <Input id="admin-email" label="Email" type="email" required placeholder="Enter email address" />

      <Input
        id="admin-mobile"
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

      <FieldChrome id="admin-role" label="Role" required>
        <Select
          items={[
            { value: "", label: "Select a role" },
            ...ADMINISTRATOR_ROLES.map((r) => ({ value: r, label: r })),
          ]}
          name="admin-role"
          value={role}
          onValueChange={(v) => setRole(v as string)}
        >
          <SelectTrigger id="admin-role">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">Select a role</SelectItem>
            {ADMINISTRATOR_ROLES.map((r) => (
              <SelectItem key={r} value={r}>
                {r}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </FieldChrome>

      <FieldChrome id="admin-department" label="Department" required>
        <Select
          items={[
            { value: "", label: "Select a department" },
            ...departments.map((d) => ({ value: d.id, label: `${d.abbrev} — ${d.name}` })),
          ]}
          name="admin-department"
          defaultValue=""
        >
          <SelectTrigger id="admin-department">
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
        <FieldChrome id="admin-gender" label="Gender" required>
          <Select
            items={[{ value: "", label: "Select a gender" }, ...genders.map((g) => ({ value: g, label: g }))]}
            name="admin-gender"
            defaultValue=""
          >
            <SelectTrigger id="admin-gender">
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
        <FieldChrome id="admin-civil-status" label="Civil Status" required>
          <Select
            items={[
              { value: "", label: "Select a status" },
              ...civilStatuses.map((s) => ({ value: s, label: s })),
            ]}
            name="admin-civil-status"
            defaultValue=""
          >
            <SelectTrigger id="admin-civil-status">
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

      <p className="font-body text-xs leading-relaxed text-slate-400 dark:text-slate-500">
        New administrators start with a temporary password and must set their own at first login.
      </p>

      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" block={false} onClick={onCancel}>
          Cancel
        </Button>
        <Button block={false} isLoading={isLoading} loadingLabel="Creating…">
          Add Administrator
        </Button>
      </div>
    </form>
  );
}
