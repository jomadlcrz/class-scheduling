import { useState } from "react";
import { FormError } from "~/components/forms/form-error";
import { Button } from "~/components/ui/button";
import { Checkbox } from "~/components/ui/checkbox";
import { SearchInput } from "~/components/ui/search-input";
import { permissionService } from "~/services/permission.service";
import type { PermissionSummary, RolePermission } from "~/types/permission";

type RolePermissionsFormProps = {
  role: PermissionSummary;
  catalog: RolePermission[];
  onSaved: (message: string) => void;
  onCancel: () => void;
};

/** Bulk-replaces a role's permission grants via PUT /roles/{roleId}/permissions. */
export function RolePermissionsForm({ role, catalog, onSaved, onCancel }: RolePermissionsFormProps) {
  const [selectedIds, setSelectedIds] = useState<Set<number>>(
    () => new Set(role.permissions.map((p) => p.id)),
  );
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [search, setSearch] = useState("");

  const normalizedSearch = search.trim().toLowerCase();
  const filteredCatalog = normalizedSearch
    ? catalog.filter((permission) =>
        `${permission.slug} ${permission.description ?? ""}`.toLowerCase().includes(normalizedSearch),
      )
    : catalog;

  function toggle(id: number, checked: boolean) {
    setSelectedIds((current) => {
      const next = new Set(current);
      if (checked) next.add(id);
      else next.delete(id);
      return next;
    });
  }

  async function handleSubmit() {
    setError(null);
    setIsSaving(true);
    try {
      const message = await permissionService.replace(role.id, [...selectedIds]);
      onSaved(message);
    } catch (err) {
      setError(err instanceof Error ? err.message : "");
      setIsSaving(false);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <FormError message={error} />

      {catalog.length === 0 ? (
        <p className="text-sm text-slate-500 dark:text-slate-400">No permissions exist yet.</p>
      ) : (
        <div className="flex flex-col gap-3">
          <SearchInput
            id="permission-search"
            value={search}
            onChange={setSearch}
            placeholder="Search permissions..."
          />

          <div className="flex max-h-80 flex-col gap-2 overflow-y-auto rounded-lg border border-slate-200 p-3 dark:border-white/10">
            {filteredCatalog.length === 0 ? (
              <p className="py-4 text-center text-sm text-slate-500 dark:text-slate-400">
                No permissions match your search.
              </p>
            ) : (
              filteredCatalog.map((permission) => (
                <Checkbox
                  key={permission.id}
                  id={`role-permission-${permission.id}`}
                  ariaLabel={permission.description || permission.slug}
                  label={
                    <span className="flex flex-col">
                      <span>{permission.slug}</span>
                      {permission.description && (
                        <span className="text-xs text-slate-400 dark:text-slate-500">
                          {permission.description}
                        </span>
                      )}
                    </span>
                  }
                  checked={selectedIds.has(permission.id)}
                  onChange={(checked) => toggle(permission.id, checked)}
                />
              ))
            )}
          </div>
        </div>
      )}

      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" block={false} onClick={onCancel} disabled={isSaving}>
          Cancel
        </Button>
        <Button
          type="button"
          block={false}
          isLoading={isSaving}
          loadingLabel="Saving…"
          onClick={handleSubmit}
        >
          Save Permissions
        </Button>
      </div>
    </div>
  );
}
