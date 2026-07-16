import { useEffect, useState, type FormEvent } from "react";
import { FormError } from "~/components/forms/form-error";
import { Button } from "~/components/ui/button";
import { PlusIcon, TrashIcon } from "~/components/ui/icons";
import { FieldChrome, Input } from "~/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "~/components/ui/select";
import { enumService } from "~/services/enum.service";
import { permissionService } from "~/services/permission.service";

type PendingPermission = { permissionSlug: string; description: string };

type PermissionFormProps = {
  onCreated: (message: string) => void;
  onCancel: () => void;
};

/** Creates a role with one or more permission slugs in a single request. */
export function PermissionForm({ onCreated, onCancel }: PermissionFormProps) {
  const [roleNames, setRoleNames] = useState<string[]>([]);
  const [roleName, setRoleName] = useState("");
  const [rows, setRows] = useState<PendingPermission[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    enumService
      .getOptions()
      .then((opts) => setRoleNames(opts.roleName))
      .catch(() => setRoleNames([]));
  }, []);

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
    if (!description) {
      setError("Enter a description.");
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
    if (!roleName) {
      setError("Select a role.");
      return;
    }
    if (rows.length === 0) {
      setError("Add at least one permission.");
      return;
    }

    setError(null);
    setIsSaving(true);
    try {
      const message = await permissionService.create({ roleName, permissions: rows });
      onCreated(message);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
      setIsSaving(false);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <FormError message={error} />

      <FieldChrome id="permission-role" label="Role">
        <Select
          items={[
            { value: "", label: roleNames.length === 0 ? "Loading roles…" : "Select a role" },
            ...roleNames.map((name) => ({ value: name, label: name })),
          ]}
          value={roleName}
          onValueChange={(v) => setRoleName(v as string)}
        >
          <SelectTrigger id="permission-role">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">{roleNames.length === 0 ? "Loading roles…" : "Select a role"}</SelectItem>
            {roleNames.map((name) => (
              <SelectItem key={name} value={name}>
                {name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </FieldChrome>

      <form
        onSubmit={handleAddRow}
        className="flex flex-col gap-3 rounded-lg border border-slate-200 p-3 dark:border-white/10"
        noValidate
      >
        <Input id="permission-slug" label="Permission Slug" type="text" placeholder="e.g. schedules:create" />
        <Input
          id="permission-description"
          label="Description"
          type="text"
          placeholder="What this permission allows"
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
                <p className="font-body text-sm font-medium text-navy-700 dark:text-white">
                  {row.permissionSlug}
                </p>
                <p className="font-body text-xs text-slate-500 dark:text-slate-400">{row.description}</p>
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
          disabled={rows.length === 0 || !roleName}
          onClick={handleSubmit}
        >
          Create Role
        </Button>
      </div>
    </div>
  );
}
