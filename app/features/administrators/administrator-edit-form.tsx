import { useState } from "react";
import { FormError } from "~/components/forms/form-error";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import type { Administrator } from "~/types/administrator";

type AdministratorEditFormProps = {
  administrator: Administrator;
  onSubmit: (input: { firstName: string; midName?: string; lastName: string; mobile: string; email: string }) => Promise<void>;
  onCancel: () => void;
};

/** Edits an existing administrator's name/contact fields (PUT /super-admin/admin-accounts/<id>) — role/department aren't editable here. */
export function AdministratorEditForm({ administrator, onSubmit, onCancel }: AdministratorEditFormProps) {
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    const firstName = String(data.get("edit-admin-first-name") ?? "").trim();
    const lastName = String(data.get("edit-admin-last-name") ?? "").trim();
    const mobile = String(data.get("edit-admin-mobile") ?? "").trim();
    const email = String(data.get("edit-admin-email") ?? "").trim();
    const midName = String(data.get("edit-admin-mid-name") ?? "").trim();

    if (!firstName || !lastName || !mobile || !email) {
      setError("Fill in all required fields.");
      return;
    }

    setError(null);
    setIsSaving(true);
    try {
      await onSubmit({ firstName, midName: midName || undefined, lastName, mobile, email });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
      setIsSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
      <FormError message={error} />
      <div className="grid grid-cols-2 gap-3">
        <Input
          id="edit-admin-first-name"
          label="First Name"
          type="text"
          required
          defaultValue={administrator.firstName}
        />
        <Input
          id="edit-admin-mid-name"
          label="Middle Name"
          type="text"
          defaultValue={administrator.midName ?? ""}
        />
      </div>
      <Input id="edit-admin-last-name" label="Last Name" type="text" required defaultValue={administrator.lastName} />
      <Input id="edit-admin-email" label="Email" type="email" required defaultValue={administrator.email ?? ""} />
      <Input
        id="edit-admin-mobile"
        label="Mobile Number"
        type="text"
        inputMode="numeric"
        pattern="[0-9]*"
        maxLength={11}
        required
        defaultValue={administrator.mobile ?? ""}
        onInput={(e) => {
          e.currentTarget.value = e.currentTarget.value.replace(/\D/g, "").slice(0, 11);
        }}
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
