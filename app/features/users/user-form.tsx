import { useState } from "react";
import { FormError } from "~/components/forms/form-error";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Select } from "~/components/ui/select";
import { userSchema } from "~/schemas/user.schema";
import type { CreateUserInput, Role, User } from "~/types/user";
import { ROLE_LABELS } from "~/features/users/role-badge";

type UserFormProps = {
  /** Existing user when editing; omitted when creating. */
  user?: User;
  onSubmit: (input: CreateUserInput) => Promise<void>;
  onCancel: () => void;
};

export function UserForm({ user, onSubmit, onCancel }: UserFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const isEditing = Boolean(user);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    const name = String(data.get("user-name") ?? "").trim();
    const email = String(data.get("user-email") ?? "").trim();
    const role = String(data.get("user-role") ?? "") as Role;

    const result = userSchema.safeParse({ name, email, role });
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

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
      <FormError message={error} />

      <Input
        id="user-name"
        label="Full Name"
        type="text"
        required
        placeholder="Juan Dela Cruz"
        defaultValue={user?.name}
      />

      <Input
        id="user-email"
        label="Email"
        type="email"
        autoComplete="off"
        required
        placeholder="user@gwc.edu.ph"
        defaultValue={user?.email}
      />

      <Select id="user-role" label="Role" defaultValue={user?.role ?? "faculty"}>
        {Object.entries(ROLE_LABELS).map(([role, label]) => (
          <option key={role} value={role}>
            {label}
          </option>
        ))}
      </Select>

      {!isEditing && (
        <p className="font-body text-xs leading-relaxed text-slate-400 dark:text-slate-500">
          New users start with a temporary password and must set their own at first login.
        </p>
      )}

      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" block={false} onClick={onCancel}>
          Cancel
        </Button>
        <Button block={false} isLoading={isLoading} loadingLabel={isEditing ? "Saving…" : "Creating…"}>
          {isEditing ? "Save Changes" : "Create User"}
        </Button>
      </div>
    </form>
  );
}
