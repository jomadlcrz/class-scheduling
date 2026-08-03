import { useState } from "react";
import { FormError } from "~/components/forms/form-error";
import { Button } from "~/components/ui/button";
import { Card } from "~/components/ui/card";
import { FieldChrome, Input } from "~/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "~/components/ui/select";
import { RolePermissionsPanel } from "~/features/permissions/role-permissions-panel";
import { facultySchema, FACULTY_ROLES } from "~/schemas/faculty.schema";
import type { DepartmentOption } from "~/types/department";
import type { CreateFacultyAccountInput } from "~/types/faculty";
import type { PermissionSummary } from "~/types/permission";

type FacultyAccountFormProps = {
  departments: DepartmentOption[];
  /** Backend enum values (enumService); empty selection = not specified. */
  genders: string[];
  civilStatuses: string[];
  /** Roles with their permissions; empty when the viewer can't load them. */
  rolePermissions: PermissionSummary[];
  onSubmit: (input: CreateFacultyAccountInput) => Promise<void>;
  onCancel: () => void;
  onDirtyChange?: (isDirty: boolean) => void;
};

/** Creates the faculty login account + profile on the backend (temp password emailed). */
export function FacultyAccountForm({
  departments,
  genders,
  civilStatuses,
  rolePermissions,
  onSubmit,
  onCancel,
  onDirtyChange,
}: FacultyAccountFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [role, setRole] = useState("");

  const selectedRole = rolePermissions.find(
    (r) => r.name.toLowerCase() === role.toLowerCase(),
  );

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const data = new FormData(e.currentTarget);

    const result = facultySchema.safeParse({
      firstName: String(data.get("faculty-first-name") ?? "").trim(),
      midName: String(data.get("faculty-mid-name") ?? "").trim(),
      lastName: String(data.get("faculty-last-name") ?? "").trim(),
      email: String(data.get("faculty-email") ?? "").trim(),
      mobile: String(data.get("faculty-mobile") ?? "").trim(),
      departmentId: String(data.get("faculty-department") ?? ""),
      roleName: String(data.get("faculty-role") ?? ""),
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
      await onSubmit(result.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "");
      setIsLoading(false);
    }
  }

  const showPermissions = rolePermissions.length > 0;

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
            <Input id="faculty-first-name" label="First Name" type="text" required placeholder="Enter first name" />
            <Input id="faculty-mid-name" label="Middle Name" type="text" placeholder="Enter middle name" />
          </div>

          <Input id="faculty-last-name" label="Last Name" type="text" required placeholder="Enter last name" />

          <Input
            id="faculty-email"
            label="Email"
            type="email"
            required
            placeholder="Enter email address"
          />

          <Input
            id="faculty-mobile"
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

        </div>

        <div className="flex flex-col gap-4">

          <FieldChrome id="faculty-department" label="Department" required>
            <Select
              items={[
                { value: "", label: "Select a department" },
                ...departments.map((d) => ({ value: d.id, label: `${d.abbrev} — ${d.name}` })),
              ]}
              name="faculty-department"
              defaultValue=""
              onValueChange={() => onDirtyChange?.(true)}
            >
              <SelectTrigger id="faculty-department">
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
            <FieldChrome id="faculty-gender" label="Gender" required>
              <Select
                items={[{ value: "", label: "Select a gender" }, ...genders.map((g) => ({ value: g, label: g }))]}
                name="faculty-gender"
                defaultValue=""
                onValueChange={() => onDirtyChange?.(true)}
              >
                <SelectTrigger id="faculty-gender">
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
            <FieldChrome id="faculty-civil-status" label="Civil Status" required>
              <Select
                items={[
                  { value: "", label: "Select a status" },
                  ...civilStatuses.map((s) => ({ value: s, label: s })),
                ]}
                name="faculty-civil-status"
                defaultValue=""
                onValueChange={() => onDirtyChange?.(true)}
              >
                <SelectTrigger id="faculty-civil-status">
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

          <FieldChrome id="faculty-role" label="Role" required>
            <Select
              items={[
                { value: "", label: "Select a role" },
                ...FACULTY_ROLES.map((r) => ({ value: r, label: r })),
              ]}
              name="faculty-role"
              value={role}
              onValueChange={(v) => {
                setRole(v as string);
                onDirtyChange?.(true);
              }}
            >
              <SelectTrigger id="faculty-role">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Select a role</SelectItem>
                {FACULTY_ROLES.map((r) => (
                  <SelectItem key={r} value={r}>
                    {r}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FieldChrome>

          {showPermissions && <RolePermissionsPanel role={selectedRole} />}
        </div>
        </div>
      </Card>

      <div className="sticky bottom-0 z-10 flex justify-between border-t border-slate-200 bg-slate-50/95 py-4 backdrop-blur dark:border-white/10 dark:bg-surface/95">
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
