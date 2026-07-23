import { useState } from "react";
import { FormError } from "~/components/forms/form-error";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { permissionService } from "~/services/permission.service";

type AddPermissionFormProps = {
  onCreated: (message: string) => void;
  onCancel: () => void;
};

/** Creates a single permission in the catalog (POST /permissions). */
export function AddPermissionForm({ onCreated, onCancel }: AddPermissionFormProps) {
  const [slug, setSlug] = useState("");
  const [description, setDescription] = useState("");
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
      const message = await permissionService.createPermission({
        permissionSlug: slug.trim(),
        description: description.trim() || undefined,
      });
      onCreated(message);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
      setIsSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
      <FormError message={error} />
      <Input
        id="add-permission-slug"
        label="Permission Slug"
        required
        placeholder="e.g. schedules:create"
        value={slug}
        onChange={(e) => setSlug(e.target.value)}
        autoFocus
      />
      <Input
        id="add-permission-description"
        label="Description"
        placeholder="What this permission allows"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
      />
      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" block={false} onClick={onCancel} disabled={isSaving}>
          Cancel
        </Button>
        <Button type="submit" block={false} isLoading={isSaving} loadingLabel="Creating…">
          Add Permission
        </Button>
      </div>
    </form>
  );
}
