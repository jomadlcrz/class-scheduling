import { FieldChrome, Input } from "~/components/ui/input";
import { PhoneInput } from "~/components/ui/phone-input";
import { DatePicker } from "~/components/ui/date-picker";
import { formatISODate } from "~/components/ui/calendar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "~/components/ui/select";
import { EnrollmentSectionCard } from "~/features/enrollment/enrollment-section-card";
import { PhotoUploadField } from "~/features/enrollment/photo-upload-field";
import { ProgramWizardFooter } from "~/features/subjects/program-wizard-footer";

export type IdentityDraft = {
  studentId: string;
  firstName: string;
  midName: string;
  lastName: string;
  suffix: string;
  gender: string;
  birthdate: string;
  mobile: string;
  email: string;
  addressStreet: string;
  addressBarangay: string;
  addressCity: string;
  addressProvince: string;
  addressRegion: string;
  addressZipCode: string;
};

type AddStudentStep1IdentityProps = {
  identity: IdentityDraft;
  onIdentityChange: (patch: Partial<IdentityDraft>) => void;
  /** Backend NameSuffix enum values (enumService). */
  nameSuffixes: string[];
  /** Backend Gender enum values (enumService). */
  genders: string[];
  photoFile: File | null;
  onPhotoChange: (file: File | null) => void;
  canAdvance: boolean;
  onNext: () => void;
  onCancel: () => void;
};

export function AddStudentStep1Identity({
  identity,
  onIdentityChange,
  nameSuffixes,
  genders,
  photoFile,
  onPhotoChange,
  canAdvance,
  onNext,
  onCancel,
}: AddStudentStep1IdentityProps) {
  // Students must be at least 18 — cap selectable birthdates at 18 years ago.
  const eighteenYearsAgo = new Date();
  eighteenYearsAgo.setFullYear(eighteenYearsAgo.getFullYear() - 18);

  return (
    <div className="flex flex-col gap-5">
      <EnrollmentSectionCard title="Student Information">
        <div className="grid gap-6 lg:grid-cols-[11rem_1fr]">
          <div className="border-b border-slate-200 pb-5 lg:border-b-0 lg:border-r lg:pb-0 lg:pr-5 dark:border-white/10">
            <PhotoUploadField
              firstName={identity.firstName}
              lastName={identity.lastName}
              gender={identity.gender}
              studentIdLabel={identity.studentId.trim() || "ID optional"}
              photoFile={photoFile}
              onPhotoChange={onPhotoChange}
            />
          </div>

          <div className="min-w-0">
            <h3 className="mb-4 font-body text-sm font-semibold text-navy-800 dark:text-mist-100">
              Basic Information
            </h3>

            <div className="flex flex-col gap-4">
              <Input
                id="new-student-id"
                label="Student ID (Optional)"
                type="text"
                maxLength={50}
                hint="School-assigned ID"
                value={identity.studentId}
                onChange={(e) => onIdentityChange({ studentId: e.target.value })}
              />

              <div className="grid gap-3 sm:grid-cols-2">
                <Input
                  id="new-student-first-name"
                  label="First Name"
                  type="text"
                  required
                  value={identity.firstName}
                  onChange={(e) => onIdentityChange({ firstName: e.target.value })}
                />
                <Input
                  id="new-student-mid-name"
                  label="Middle Name (Optional)"
                  type="text"
                  value={identity.midName}
                  onChange={(e) => onIdentityChange({ midName: e.target.value })}
                />
              </div>

              <div className="grid gap-3 sm:grid-cols-[1fr_10rem]">
                <Input
                  id="new-student-last-name"
                  label="Last Name"
                  type="text"
                  required
                  value={identity.lastName}
                  onChange={(e) => onIdentityChange({ lastName: e.target.value })}
                />
                <FieldChrome id="new-student-suffix" label="Suffix (Optional)">
                  <Select
                    items={[{ value: "", label: "None" }, ...nameSuffixes.map((s) => ({ value: s, label: s }))]}
                    value={identity.suffix}
                    onValueChange={(v) => onIdentityChange({ suffix: v as string })}
                  >
                    <SelectTrigger id="new-student-suffix">
                      <SelectValue placeholder="None" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">None</SelectItem>
                      {nameSuffixes.map((s) => (
                        <SelectItem key={s} value={s}>
                          {s}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </FieldChrome>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <FieldChrome id="new-student-gender" label="Gender" required>
                  <Select
                    items={[{ value: "", label: "Select gender" }, ...genders.map((g) => ({ value: g, label: g }))]}
                    value={identity.gender}
                    onValueChange={(v) => onIdentityChange({ gender: v as string })}
                  >
                    <SelectTrigger id="new-student-gender">
                      <SelectValue placeholder="Select gender" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Select gender</SelectItem>
                      {genders.map((g) => (
                        <SelectItem key={g} value={g}>
                          {g}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </FieldChrome>
                <DatePicker
                  id="new-student-birthdate"
                  label="Birthdate"
                  required
                  hint="Must be at least 18 years old"
                  value={identity.birthdate}
                  onChange={(v) => onIdentityChange({ birthdate: v })}
                  captionLayout="dropdown"
                  fromYear={1940}
                  toYear={eighteenYearsAgo.getFullYear()}
                  max={formatISODate(eighteenYearsAgo)}
                />
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <PhoneInput
                  id="new-student-mobile"
                  label="Mobile number"
                  required
                  value={identity.mobile}
                  onChange={(e) => onIdentityChange({ mobile: e.target.value })}
                />
                <Input
                  id="new-student-email"
                  label="Email address"
                  type="email"
                  required
                  value={identity.email}
                  onChange={(e) => onIdentityChange({ email: e.target.value })}
                />
              </div>

              <p className="font-body text-xs text-slate-400 dark:text-slate-500">
                Email and mobile must be unique — used for account creation and communication. An
                account is created automatically the first time the student logs in.
              </p>

              <details className="group">
                <summary className="w-fit cursor-pointer font-body text-sm font-semibold text-navy-800 dark:text-mist-100">
                  Address (optional)
                </summary>
                <div className="mt-3 flex flex-col gap-3">
                  <div className="grid gap-3 sm:grid-cols-2">
                    <Input
                      id="new-student-address-street"
                      label="Street"
                      type="text"
                      value={identity.addressStreet}
                      onChange={(e) => onIdentityChange({ addressStreet: e.target.value })}
                    />
                    <Input
                      id="new-student-address-barangay"
                      label="Barangay"
                      type="text"
                      value={identity.addressBarangay}
                      onChange={(e) => onIdentityChange({ addressBarangay: e.target.value })}
                    />
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <Input
                      id="new-student-address-city"
                      label="City / Municipality"
                      type="text"
                      value={identity.addressCity}
                      onChange={(e) => onIdentityChange({ addressCity: e.target.value })}
                    />
                    <Input
                      id="new-student-address-province"
                      label="Province"
                      type="text"
                      value={identity.addressProvince}
                      onChange={(e) => onIdentityChange({ addressProvince: e.target.value })}
                    />
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <Input
                      id="new-student-address-region"
                      label="Region"
                      type="text"
                      value={identity.addressRegion}
                      onChange={(e) => onIdentityChange({ addressRegion: e.target.value })}
                    />
                    <Input
                      id="new-student-address-zip"
                      label="Zip Code"
                      type="text"
                      inputMode="numeric"
                      maxLength={4}
                      value={identity.addressZipCode}
                      onChange={(e) =>
                        onIdentityChange({ addressZipCode: e.target.value.replace(/\D/g, "").slice(0, 4) })
                      }
                    />
                  </div>
                </div>
              </details>
            </div>
          </div>
        </div>
      </EnrollmentSectionCard>

      <ProgramWizardFooter
        backLabel="Cancel"
        onBack={onCancel}
        primaryLabel="Next: Academic Information"
        onPrimary={onNext}
        primaryDisabled={!canAdvance}
      />
    </div>
  );
}
