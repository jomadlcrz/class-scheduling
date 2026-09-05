import { useState, type FormEvent } from "react";
import { FormError } from "~/components/forms/form-error";
import { Button } from "~/components/ui/button";
import { FieldChrome, Input } from "~/components/ui/input";
import { PhoneInput } from "~/components/ui/phone-input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "~/components/ui/select";
import { normalizePhoneNumber } from "~/lib/phone-number";
import type { StudentProfileDetail, UpdateStudentProfileInput } from "~/types/student";

type StudentProfileFormProps = {
  profile: StudentProfileDetail;
  /** Backend NameSuffix enum values (enumService). */
  nameSuffixes: string[];
  onSubmit: (input: UpdateStudentProfileInput) => Promise<void>;
  onCancel: () => void;
};

/** Edits only the personal fields accepted by PUT /students/:id. */
export function StudentProfileForm({ profile, nameSuffixes, onSubmit, onCancel }: StudentProfileFormProps) {
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [suffix, setSuffix] = useState(profile.suffix ?? "");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const mobile = normalizePhoneNumber(String(form.get("student-profile-mobile") ?? ""));
    if (!mobile) {
      setError("Enter a valid mobile number.");
      return;
    }
    setError(null);
    setIsSaving(true);
    try {
      const middleName = String(form.get("student-profile-mid-name") ?? "").trim();
      await onSubmit({
        firstName: String(form.get("student-profile-first-name") ?? "").trim(),
        midName: middleName || null,
        lastName: String(form.get("student-profile-last-name") ?? "").trim(),
        suffix: suffix || null,
        mobile,
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
          label="First name"
          defaultValue={profile.firstName}
          required
          disabled={isSaving}
        />
        <Input
          id="student-profile-mid-name"
          label="Middle name"
          defaultValue={profile.midName ?? ""}
          disabled={isSaving}
        />
        <Input
          id="student-profile-last-name"
          label="Last name"
          defaultValue={profile.lastName}
          required
          disabled={isSaving}
        />
        <FieldChrome id="student-profile-suffix" label="Suffix">
          <Select
            items={[
              { value: "", label: "No suffix" },
              ...nameSuffixes.map((s) => ({ value: s, label: s })),
            ]}
            value={suffix}
            onValueChange={(v) => setSuffix(v as string)}
            disabled={isSaving}
          >
            <SelectTrigger id="student-profile-suffix">
              <SelectValue placeholder="No suffix" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">No suffix</SelectItem>
              {nameSuffixes.map((s) => (
                <SelectItem key={s} value={s}>
                  {s}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </FieldChrome>
        <PhoneInput
          id="student-profile-mobile"
          label="Mobile"
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
          Save changes
        </Button>
      </div>
    </form>
  );
}
