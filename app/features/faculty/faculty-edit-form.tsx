import { useState } from "react";
import { FormError } from "~/components/forms/form-error";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Modal } from "~/components/ui/modal";
import { PhoneInput } from "~/components/ui/phone-input";
import { normalizePhoneNumber } from "~/lib/phone-number";
import type { Faculty } from "~/types/faculty";

type FacultyEditFormProps = {
  member: Faculty;
  onSubmit: (input: {
    firstName: string;
    midName?: string | null;
    lastName: string;
    mobile: string;
    email: string;
    prefixHonorific?: string;
    academicRank?: string | null;
  }) => Promise<void>;
  onCancel: () => void;
};

/** Edits an existing faculty member's name/contact fields (PUT /super-admin/faculty-accounts/<id>) — role/department aren't editable here. */
export function FacultyEditForm({ member, onSubmit, onCancel }: FacultyEditFormProps) {
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [email, setEmail] = useState(member.email ?? "");
  const [emailModalOpen, setEmailModalOpen] = useState(false);
  const [prefixHonorific, setPrefixHonorific] = useState(member.prefixHonorific ?? "");
  const [academicRank, setAcademicRank] = useState(member.academicRank ?? "");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    const firstName = String(data.get("edit-faculty-first-name") ?? "").trim();
    const lastName = String(data.get("edit-faculty-last-name") ?? "").trim();
    const mobile = normalizePhoneNumber(String(data.get("edit-faculty-mobile") ?? ""));
    const midName = String(data.get("edit-faculty-mid-name") ?? "").trim();

    if (!firstName || !lastName) {
      setError("Fill in all required fields.");
      return;
    }
    if (!mobile) {
      setError("Enter a valid mobile number.");
      return;
    }

    setError(null);
    setIsSaving(true);
    try {
      await onSubmit({
        firstName,
        midName: midName || null,
        lastName,
        mobile,
        email,
        prefixHonorific: prefixHonorific.trim() || undefined,
        academicRank: academicRank.trim() === "" ? null : academicRank.trim(),
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "");
      setIsSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
      <FormError message={error} />
      <div className="grid grid-cols-2 gap-3">
        <Input id="edit-faculty-first-name" label="First name" type="text" required defaultValue={member.firstName} />
        <Input id="edit-faculty-mid-name" label="Middle name" type="text" defaultValue={member.midName ?? ""} />
      </div>
      <Input id="edit-faculty-last-name" label="Last name" type="text" required defaultValue={member.lastName} />
      <div className="grid grid-cols-2 gap-3">
        <Input
          id="edit-faculty-prefix"
          label="Prefix"
          type="text"
          placeholder="e.g. Dr., Prof."
          value={prefixHonorific}
          onChange={(e) => setPrefixHonorific(e.target.value)}
        />
        <Input
          id="edit-faculty-academic-rank"
          label="Academic rank"
          type="text"
          placeholder="e.g. Instructor I"
          value={academicRank}
          onChange={(e) => setAcademicRank(e.target.value)}
        />
      </div>
      <div className="flex flex-col gap-1.5">
        <label className="font-body text-sm font-semibold text-slate-600 dark:text-slate-400">Email address</label>
        <div className="flex items-center gap-3">
          <p className="min-w-0 truncate font-body text-sm text-navy-700 dark:text-mist-100">
            {email}
          </p>
          <Button type="button" variant="outline" block={false} onClick={() => setEmailModalOpen(true)}>
            Change
          </Button>
        </div>
      </div>
      <PhoneInput
        id="edit-faculty-mobile"
        label="Mobile number"
        required
        defaultValue={member.mobile ?? ""}
      />
      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" block={false} onClick={onCancel} disabled={isSaving}>
          Cancel
        </Button>
        <Button type="submit" block={false} isLoading={isSaving} loadingLabel="Saving…">
          Save changes
        </Button>
      </div>

      <Modal open={emailModalOpen} onClose={() => setEmailModalOpen(false)} title="Change Email">
        <div className="flex flex-col gap-4">
          <Input
            id="edit-faculty-change-email"
            label="New email address"
            type="email"
            autoComplete="email"
            hint="The user may need to reconfirm their account with the new email."
          />
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" block={false} onClick={() => setEmailModalOpen(false)}>
              Cancel
            </Button>
            <Button type="button" block={false} onClick={() => {
              const input = document.getElementById("edit-faculty-change-email") as HTMLInputElement | null;
              const value = input?.value?.trim() ?? "";
              if (value) setEmail(value);
              setEmailModalOpen(false);
            }}>
              Change email
            </Button>
          </div>
        </div>
      </Modal>
    </form>
  );
}
