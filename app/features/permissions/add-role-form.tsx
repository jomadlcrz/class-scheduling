import { useState, type FormEvent } from "react";
import { FormError } from "~/components/forms/form-error";
import { Button } from "~/components/ui/button";
import { PlusIcon, TrashIcon } from "~/components/ui/icons";
import { Input } from "~/components/ui/input";
import { permissionService } from "~/services/permission.service";

type PendingRole = { roleName: string };

type AddRoleFormProps = {
  onCreated: (message: string) => void;
  onCancel: () => void;
};

/** Creates one or more system roles in bulk (POST /roles). */
export function AddRoleForm({ onCreated, onCancel }: AddRoleFormProps) {
  const [rows, setRows] = useState<PendingRole[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  function handleAddRow(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const data = new FormData(form);
    const roleName = String(data.get("role-name") ?? "").trim().toUpperCase();

    if (!roleName) {
      setError("Enter a role name.");
      return;
    }
    if (rows.some((r) => r.roleName === roleName)) {
      setError("That role name was already added.");
      return;
    }

    setError(null);
    setRows((current) => [...current, { roleName }]);
    form.reset();
  }

  function handleRemoveRow(roleName: string) {
    setRows((current) => current.filter((r) => r.roleName !== roleName));
  }

  async function handleSubmit() {
    if (rows.length === 0) {
      setError("Add at least one role.");
      return;
    }
    setError(null);
    setIsSaving(true);
    try {
      const message = await permissionService.createRoleBulk(
        rows.map((r) => ({ roleName: r.roleName })),
      );
      onCreated(message);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
      setIsSaving(false);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <FormError message={error} />

      <form
        onSubmit={handleAddRow}
        className="flex flex-col gap-3 rounded-lg border border-slate-200 p-3 dark:border-white/10"
        noValidate
      >
        <Input
          id="add-role-name"
          label="Role Name"
          placeholder="e.g. INSTRUCTOR"
          name="role-name"
          autoComplete="off"
        />
        <Button type="submit" variant="outline" block={false}>
          <PlusIcon />
          Add Role
        </Button>
      </form>

      {rows.length > 0 && (
        <ul className="flex flex-col gap-2">
          {rows.map((row) => (
            <li
              key={row.roleName}
              className="flex items-center justify-between gap-3 rounded-lg border border-slate-200 px-3 py-2 dark:border-white/10"
            >
              <span className="font-body text-sm font-medium text-navy-700 dark:text-mist-100">
                {row.roleName}
              </span>
              <button
                type="button"
                onClick={() => handleRemoveRow(row.roleName)}
                aria-label={`Remove ${row.roleName}`}
                className="shrink-0 cursor-pointer text-slate-400 transition-colors duration-150 hover:text-red-600 dark:hover:text-red-400"
              >
                <TrashIcon />
              </button>
            </li>
          ))}
        </ul>
      )}

      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" block={false} onClick={onCancel} disabled={isSaving}>
          Cancel
        </Button>
        <Button
          type="button"
          block={false}
          isLoading={isSaving}
          loadingLabel="Creating…"
          disabled={rows.length === 0}
          onClick={handleSubmit}
        >
          Create Roles
        </Button>
      </div>
    </div>
  );
}
