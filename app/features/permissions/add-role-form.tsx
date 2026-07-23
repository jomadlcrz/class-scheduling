import { useEffect, useState } from "react";
import { FormError } from "~/components/forms/form-error";
import { Button } from "~/components/ui/button";
import { FieldChrome } from "~/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "~/components/ui/select";
import { enumService } from "~/services/enum.service";
import { permissionService } from "~/services/permission.service";

type AddRoleFormProps = {
  onCreated: (message: string) => void;
  onCancel: () => void;
};

/** Creates a new system role (POST /roles). */
export function AddRoleForm({ onCreated, onCancel }: AddRoleFormProps) {
  const [roleNames, setRoleNames] = useState<string[]>([]);
  const [roleName, setRoleName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    enumService
      .getOptions()
      .then((opts) => setRoleNames(opts.roleName))
      .catch(() => setRoleNames([]));
  }, []);

  async function handleSubmit() {
    if (!roleName) {
      setError("Select a role.");
      return;
    }
    setError(null);
    setIsSaving(true);
    try {
      const message = await permissionService.create({ roleName, permissions: [] });
      onCreated(message);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
      setIsSaving(false);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <FormError message={error} />

      <FieldChrome id="add-role-name" label="Role">
        <Select
          items={[
            { value: "", label: roleNames.length === 0 ? "Loading roles…" : "Select a role" },
            ...roleNames.map((name) => ({ value: name, label: name })),
          ]}
          value={roleName}
          onValueChange={(v) => setRoleName(v as string)}
        >
          <SelectTrigger id="add-role-name">
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

      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" block={false} onClick={onCancel} disabled={isSaving}>
          Cancel
        </Button>
        <Button
          type="button"
          block={false}
          isLoading={isSaving}
          loadingLabel="Creating…"
          disabled={!roleName}
          onClick={handleSubmit}
        >
          Create Role
        </Button>
      </div>
    </div>
  );
}
