import { useState } from "react";
import { FormError } from "~/components/forms/form-error";
import { Button } from "~/components/ui/button";
import { CheckIcon } from "~/components/ui/icons";
import { Input } from "~/components/ui/input";
import { Select } from "~/components/ui/select";
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
};

/** Creates the faculty login account + profile on the backend (temp password emailed). */
export function FacultyAccountForm({
  departments,
  genders,
  civilStatuses,
  rolePermissions,
  onSubmit,
  onCancel,
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
      setError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
      setIsLoading(false);
    }
  }

  const showPermissions = rolePermissions.length > 0;

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
      <FormError message={error} />

      <div className={showPermissions ? "grid gap-6 sm:grid-cols-[1fr_minmax(0,18rem)]" : undefined}>
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

          <Select id="faculty-department" label="Department" defaultValue="" required>
            <option value="">Select a department</option>
            {departments.map((d) => (
              <option key={d.id} value={d.id}>
                {d.code} — {d.name}
              </option>
            ))}
          </Select>

          <div className="grid grid-cols-2 gap-3">
            <Select id="faculty-gender" label="Gender" defaultValue="" required>
              <option value="">Select a gender</option>
              {genders.map((g) => (
                <option key={g} value={g}>
                  {g}
                </option>
              ))}
            </Select>
            <Select id="faculty-civil-status" label="Civil Status" defaultValue="" required>
              <option value="">Select a status</option>
              {civilStatuses.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </Select>
          </div>

          <Select
            id="faculty-role"
            label="Role"
            value={role}
            onChange={(e) => setRole(e.target.value)}
            required
          >
            <option value="">Select a role</option>
            {FACULTY_ROLES.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </Select>
        </div>

        {showPermissions && <RolePermissionsPanel role={selectedRole} />}
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

/** What the chosen role will be able to do; hint until a role is picked. */
function RolePermissionsPanel({ role }: { role: PermissionSummary | undefined }) {
  return (
    <aside className="h-fit rounded-lg border border-slate-200 bg-slate-50 p-4 dark:border-white/10 dark:bg-white/5">
      <h3 className="font-display text-sm tracking-wide text-navy-700 dark:text-white">
        Role Permissions
      </h3>
      {role ? (
        <ul className="mt-3 flex flex-col gap-2.5">
          {role.permissions.map((p) => (
            <li key={p.id} className="flex items-start gap-2">
              <span className="mt-0.5 shrink-0 text-emerald-500" aria-hidden="true">
                <CheckIcon />
              </span>
              <span>
                <span className="block text-sm font-medium text-navy-700 dark:text-white">
                  {p.description || p.slug}
                </span>
                <span className="block text-xs text-slate-400 dark:text-slate-500">{p.slug}</span>
              </span>
            </li>
          ))}
          {role.permissions.length === 0 && (
            <li className="text-sm text-slate-500 dark:text-slate-400">
              This role has no permissions assigned.
            </li>
          )}
        </ul>
      ) : (
        <p className="mt-3 text-sm text-slate-500 dark:text-slate-400">
          Select a role to see what it can do.
        </p>
      )}
    </aside>
  );
}
