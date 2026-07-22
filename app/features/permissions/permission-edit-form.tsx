import { useState } from "react";
import { FormError } from "~/components/forms/form-error";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { permissionService } from "~/services/permission.service";
import type { RolePermission } from "~/types/permission";

type PermissionEditFormProps = {
  permission: RolePermission;
  onSaved: (message: string) => void;
  onCancel: () => void;
};

/** Edits an existing permission's slug/description in place (PUT /permissions/<id>). */
export function PermissionEditForm({ permission, onSaved, onCancel }: PermissionEditFormProps) {
  const [slug, setSlug] = useState(permission.slug);
  const [description, setDescription] = useState(permission.description);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!slug.trim()) {
      setError("Enter a permission slug.");
      return;
    }
    setError(null);
    setIsSaving(true);
    try {
      const message = await permissionService.update(permission.id, {
        permissionSlug: slug.trim(),
        description: description.trim(),
      });
      onSaved(message);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
      setIsSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
      <FormError message={error} />
      <Input
        id="edit-permission-slug"
        label="Permission Slug"
        required
        value={slug}
        onChange={(e) => setSlug(e.target.value)}
        autoFocus
      />
      <Input
        id="edit-permission-description"
        label="Description"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
      />
      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" block={false} onClick={onCancel} disabled={isSaving}>
          Cancel
        </Button>
        <Button type="submit" block={false} isLoading={isSaving} loadingLabel="Saving…">
          Save Changes
        </Button>
      </div>
    </form>
  );
}
