import { useState } from "react";
import { FormError } from "~/components/forms/form-error";
import { Button } from "~/components/ui/button";
import { Checkbox } from "~/components/ui/checkbox";
import { SearchInput } from "~/components/ui/search-input";
import { TabList } from "~/components/ui/tabs";
import { permissionService } from "~/services/permission.service";
import type { PermissionSummary, RolePermission } from "~/types/permission";

type RolePermissionsFormProps = {
  role: PermissionSummary;
  catalog: RolePermission[];
  onSaved: (message: string) => void;
  onCancel: () => void;
};

type TabKey = "all" | "assigned";

/** Bulk-replaces a role's permission grants via PUT /roles/{roleId}/permissions. */
export function RolePermissionsForm({ role, catalog, onSaved, onCancel }: RolePermissionsFormProps) {
  const [selectedIds, setSelectedIds] = useState<Set<number>>(
    () => new Set(role.permissions.map((p) => p.id)),
  );
  const [activeTab, setActiveTab] = useState<TabKey>("all");
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [search, setSearch] = useState("");

  const normalizedSearch = search.trim().toLowerCase();

  const tabCatalog =
    activeTab === "assigned"
      ? catalog.filter((permission) => selectedIds.has(permission.id))
      : catalog;

  const filteredCatalog = normalizedSearch
    ? tabCatalog.filter((permission) =>
        `${permission.slug} ${permission.description ?? ""}`.toLowerCase().includes(normalizedSearch),
      )
    : tabCatalog;

  function toggle(id: number, checked: boolean) {
    setSelectedIds((current) => {
      const next = new Set(current);
      if (checked) next.add(id);
      else next.delete(id);
      return next;
    });
  }

  function selectAllMatching() {
    setSelectedIds((current) => {
      const next = new Set(current);
      filteredCatalog.forEach((p) => next.add(p.id));
      return next;
    });
  }

  function clearAll() {
    setSelectedIds(new Set());
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

  const tabs: { value: TabKey; label: string }[] = [
    { value: "all", label: `All Permissions (${catalog.length})` },
    { value: "assigned", label: `Assigned (${selectedIds.size})` },
  ];

  return (
    <div className="flex flex-col gap-4">
      <FormError message={error} />

      {catalog.length === 0 ? (
        <p className="text-sm text-slate-500 dark:text-slate-400">No permissions exist yet.</p>
      ) : (
        <div className="flex flex-col gap-3">
          <TabList
            ariaLabel="Permission tabs"
            tabs={tabs}
            value={activeTab}
            onChange={setActiveTab}
            fullWidth
          />

          <SearchInput
            id="permission-search"
            value={search}
            onChange={setSearch}
            placeholder={
              activeTab === "assigned"
                ? "Search assigned permissions…"
                : "Search permissions by name or description…"
            }
          />

          <div className="flex items-center justify-between px-1 text-xs">
            <span className="font-body text-slate-500 dark:text-slate-400">
              <strong className="font-semibold text-navy-700 dark:text-mist-100">
                {selectedIds.size}
              </strong>{" "}
              of {catalog.length} assigned
            </span>
            <div className="flex items-center gap-3">
              {activeTab === "all" && filteredCatalog.length > 0 && (
                <button
                  type="button"
                  onClick={selectAllMatching}
                  className="cursor-pointer text-navy-600 hover:text-navy-800 hover:underline dark:text-navy-300 dark:hover:text-mist-100"
                >
                  Select all{search ? " matching" : ""}
                </button>
              )}
              {selectedIds.size > 0 && (
                <button
                  type="button"
                  onClick={clearAll}
                  className="cursor-pointer text-red-600 hover:text-red-700 hover:underline dark:text-red-400 dark:hover:text-red-300"
                >
                  Clear all
                </button>
              )}
            </div>
          </div>

          <div className="flex max-h-80 flex-col gap-2 overflow-y-auto rounded-lg border border-slate-200 p-3 dark:border-white/10">
            {activeTab === "assigned" && selectedIds.size === 0 ? (
              <p className="py-6 text-center text-sm text-slate-500 dark:text-slate-400">
                No permissions assigned to this role yet. Switch to “All Permissions” to assign.
              </p>
            ) : filteredCatalog.length === 0 ? (
              <p className="py-6 text-center text-sm text-slate-500 dark:text-slate-400">
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
                      <span className="font-mono text-xs font-semibold text-navy-800 dark:text-mist-100">
                        {permission.slug}
                      </span>
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
          Save permissions
        </Button>
      </div>
    </div>
  );
}
