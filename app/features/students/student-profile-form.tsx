import { useState, type FormEvent } from "react";
import { FormError } from "~/components/forms/form-error";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import type { StudentProfileDetail, UpdateStudentProfileInput } from "~/types/student";

type StudentProfileFormProps = {
  profile: StudentProfileDetail;
  onSubmit: (input: UpdateStudentProfileInput) => Promise<void>;
  onCancel: () => void;
};

/** Edits only the personal fields accepted by PUT /students/:id. */
export function StudentProfileForm({ profile, onSubmit, onCancel }: StudentProfileFormProps) {
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setError(null);
    setIsSaving(true);
    try {
      const middleName = String(form.get("student-profile-mid-name") ?? "").trim();
      await onSubmit({
        firstName: String(form.get("student-profile-first-name") ?? "").trim(),
        midName: middleName || null,
        lastName: String(form.get("student-profile-last-name") ?? "").trim(),
        mobile: String(form.get("student-profile-mobile") ?? "").trim(),
        email: String(form.get("student-profile-email") ?? "").trim(),
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <form noValidate onSubmit={handleSubmit} className="flex flex-col gap-4">
      <FormError message={error} />
      <div className="grid gap-4 sm:grid-cols-2">
        <Input
          id="student-profile-first-name"
          label="First Name"
          defaultValue={profile.firstName}
          required
          disabled={isSaving}
        />
        <Input
          id="student-profile-mid-name"
          label="Middle Name"
          defaultValue={profile.midName ?? ""}
          disabled={isSaving}
        />
        <Input
          id="student-profile-last-name"
          label="Last Name"
          defaultValue={profile.lastName}
          required
          disabled={isSaving}
        />
        <Input
          id="student-profile-mobile"
          label="Mobile"
          type="tel"
          defaultValue={profile.mobile ?? ""}
          disabled={isSaving}
        />
        <div className="sm:col-span-2">
          <Input
            id="student-profile-email"
            label="Email"
            type="email"
            defaultValue={profile.email ?? ""}
            disabled={isSaving}
          />
        </div>
      </div>
      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" block={false} onClick={onCancel} disabled={isSaving}>
          Cancel
        </Button>
        <Button block={false} isLoading={isSaving} loadingLabel="Saving…">
          Save Changes
        </Button>
      </div>
    </form>
  );
}
