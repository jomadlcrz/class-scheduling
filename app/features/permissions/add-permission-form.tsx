import { useState, type FormEvent } from "react";
import { FormError } from "~/components/forms/form-error";
import { Button } from "~/components/ui/button";
import { PlusIcon, TrashIcon } from "~/components/ui/icons";
import { Input } from "~/components/ui/input";
import { permissionService } from "~/services/permission.service";

type PendingPermission = { permissionSlug: string; description: string };

type AddPermissionFormProps = {
  onCreated: (message: string) => void;
  onCancel: () => void;
};

/** Creates one or more permissions in the catalog (POST /permissions). */
export function AddPermissionForm({ onCreated, onCancel }: AddPermissionFormProps) {
  const [rows, setRows] = useState<PendingPermission[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  function handleAddRow(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const data = new FormData(form);
    const slug = String(data.get("permission-slug") ?? "").trim();
    const description = String(data.get("permission-description") ?? "").trim();

    if (!slug) {
      setError("Enter a permission slug.");
      return;
    }
    if (rows.some((r) => r.permissionSlug.toLowerCase() === slug.toLowerCase())) {
      setError("That permission slug was already added.");
      return;
    }

    setError(null);
    setRows((current) => [...current, { permissionSlug: slug, description }]);
    form.reset();
  }

  function handleRemoveRow(slug: string) {
    setRows((current) => current.filter((r) => r.permissionSlug !== slug));
  }

  async function handleSubmit() {
    if (rows.length === 0) {
      setError("Add at least one permission.");
      return;
    }
    setError(null);
    setIsSaving(true);
    try {
      const message = await permissionService.createPermissionBulk(rows);
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
          id="add-permission-slug"
          label="Permission Slug"
          placeholder="e.g. schedules:create"
          name="permission-slug"
        />
        <Input
          id="add-permission-description"
          label="Description"
          placeholder="What this permission allows"
          name="permission-description"
        />
        <Button type="submit" variant="outline" block={false}>
          <PlusIcon />
          Add Permission
        </Button>
      </form>

      {rows.length > 0 && (
        <ul className="flex flex-col gap-2">
          {rows.map((row) => (
            <li
              key={row.permissionSlug}
              className="flex items-start justify-between gap-3 rounded-lg border border-slate-200 px-3 py-2 dark:border-white/10"
            >
              <div>
                <p className="font-body text-sm font-medium text-navy-700 dark:text-mist-100">
                  {row.permissionSlug}
                </p>
                {row.description && (
                  <p className="font-body text-xs text-slate-500 dark:text-slate-400">{row.description}</p>
                )}
              </div>
              <button
                type="button"
                onClick={() => handleRemoveRow(row.permissionSlug)}
                aria-label={`Remove ${row.permissionSlug}`}
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
          Create Permissions
        </Button>
      </div>
    </div>
  );
}
