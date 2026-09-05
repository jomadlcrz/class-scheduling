import { useState } from "react";
import { FormError } from "~/components/forms/form-error";
import { Button } from "~/components/ui/button";
import { StickyFooter } from "~/components/ui/sticky-footer";
import { Card } from "~/components/ui/card";
import { FieldChrome, Input } from "~/components/ui/input";
import { PhoneInput } from "~/components/ui/phone-input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "~/components/ui/select";
import { RolePermissionsPanel } from "~/features/permissions/role-permissions-panel";
import { administratorSchema } from "~/schemas/administrator.schema";
import type { CreateAdministratorAccountInput } from "~/types/administrator";
import { ADMINISTRATOR_ROLES } from "~/types/administrator";
import type { DepartmentOption } from "~/types/department";
import type { PermissionSummary } from "~/types/permission";

type AdministratorAccountFormProps = {
  departments: DepartmentOption[];
  /** Backend enum values (enumService); empty selection = not specified. */
  genders: string[];
  civilStatuses: string[];
  rolePermissions: PermissionSummary[];
  onSubmit: (input: CreateAdministratorAccountInput) => Promise<void>;
  onCancel: () => void;
  onDirtyChange?: (isDirty: boolean) => void;
};

/** Creates a Super Admin or Registrar Admin account (temp password emailed). */
export function AdministratorAccountForm({
  departments,
  genders,
  civilStatuses,
  rolePermissions,
  onSubmit,
  onCancel,
  onDirtyChange,
}: AdministratorAccountFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [role, setRole] = useState("");
  const selectedRole = rolePermissions.find(
    (item) => item.name.toLowerCase() === role.toLowerCase(),
  );

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
      setError(err instanceof Error ? err.message : "");
      setIsLoading(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      onChange={() => onDirtyChange?.(true)}
      className="flex flex-col gap-4"
      noValidate
    >
      <Card className="flex flex-col gap-4 p-6">
        <FormError message={error} />

        <div className="grid gap-6 sm:grid-cols-2">
          <div className="flex flex-col gap-4">
        <div className="grid grid-cols-2 gap-3">
          <Input id="admin-first-name" label="First name" type="text" required />
          <Input id="admin-mid-name" label="Middle name" type="text" />
        </div>

      <Input id="admin-last-name" label="Last name" type="text" required />

      <Input id="admin-email" label="Email" type="email" required />

      <PhoneInput
        id="admin-mobile"
        label="Mobile number"
        required
      />

          </div>

          <div className="flex flex-col gap-4">

      <FieldChrome id="admin-role" label="Role" required>
        <Select
          items={[
            { value: "", label: "Select a role" },
            ...ADMINISTRATOR_ROLES.map((r) => ({ value: r, label: r })),
          ]}
          name="admin-role"
          value={role}
          onValueChange={(v) => {
            setRole(v as string);
            onDirtyChange?.(true);
          }}
        >
          <SelectTrigger id="admin-role">
            <SelectValue placeholder="Select a role" />
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
        {departments.length > 0 ? (
          <Select
            items={[
              { value: "", label: "Select a department" },
              ...departments.map((d) => ({ value: d.id, label: `${d.abbrev} — ${d.name}` })),
            ]}
            name="admin-department"
            defaultValue=""
            onValueChange={() => onDirtyChange?.(true)}
          >
            <SelectTrigger id="admin-department">
              <SelectValue placeholder="Select a department" />
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
        ) : (
          <div className="flex flex-col gap-2 rounded-lg border border-slate-200 bg-slate-50 p-3 text-xs text-slate-600 dark:border-white/10 dark:bg-white/5 dark:text-slate-400">
            <p className="font-medium text-navy-800 dark:text-mist-100">No departments available</p>
            <p>
              Please create an administrative or academic department first before creating administrator accounts.
            </p>
          </div>
        )}
      </FieldChrome>

      <div className="grid grid-cols-2 gap-3">
        <FieldChrome id="admin-gender" label="Gender" required>
          <Select
            items={[{ value: "", label: "Select a gender" }, ...genders.map((g) => ({ value: g, label: g }))]}
            name="admin-gender"
            defaultValue=""
            onValueChange={() => onDirtyChange?.(true)}
          >
            <SelectTrigger id="admin-gender">
              <SelectValue placeholder="Select a gender" />
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
        <FieldChrome id="admin-civil-status" label="Civil status" required>
          <Select
            items={[
              { value: "", label: "Select a status" },
              ...civilStatuses.map((s) => ({ value: s, label: s })),
            ]}
            name="admin-civil-status"
            defaultValue=""
            onValueChange={() => onDirtyChange?.(true)}
          >
            <SelectTrigger id="admin-civil-status">
              <SelectValue placeholder="Select a status" />
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

            <RolePermissionsPanel role={selectedRole} />
          </div>
        </div>
      </Card>

      <StickyFooter>
        <Button type="button" variant="outline" block={false} onClick={onCancel}>
          Cancel
        </Button>
        <Button block={false} disabled={departments.length === 0 || isLoading} isLoading={isLoading} loadingLabel="Creating…">
          Add administrator
        </Button>
      </StickyFooter>
    </form>
  );
}
