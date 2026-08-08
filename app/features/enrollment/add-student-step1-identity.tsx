import { FieldChrome, Input } from "~/components/ui/input";
import { UserIcon } from "~/components/ui/icons";
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
  mobile: string;
  email: string;
};

type AddStudentStep1IdentityProps = {
  identity: IdentityDraft;
  onIdentityChange: (patch: Partial<IdentityDraft>) => void;
  /** Backend NameSuffix enum values (enumService). */
  nameSuffixes: string[];
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
  photoFile,
  onPhotoChange,
  canAdvance,
  onNext,
  onCancel,
}: AddStudentStep1IdentityProps) {
  return (
    <div className="flex flex-col gap-5">
      <EnrollmentSectionCard title="Student Information" icon={<UserIcon />}>
        <div className="grid gap-6 lg:grid-cols-[11rem_1fr]">
          <div className="border-b border-slate-200 pb-5 lg:border-b-0 lg:border-r lg:pb-0 lg:pr-5 dark:border-white/10">
            <PhotoUploadField
              firstName={identity.firstName}
              lastName={identity.lastName}
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
                placeholder="e.g. 2024-00123"
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
                  placeholder="e.g. Juan"
                  value={identity.firstName}
                  onChange={(e) => onIdentityChange({ firstName: e.target.value })}
                />
                <Input
                  id="new-student-mid-name"
                  label="Middle Name (Optional)"
                  type="text"
                  placeholder="e.g. Santos"
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
                  placeholder="e.g. Dela Cruz"
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
                      <SelectValue />
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
                <Input
                  id="new-student-mobile"
                  label="Mobile Number"
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={11}
                  required
                  placeholder="e.g. 09171234567"
                  value={identity.mobile}
                  onChange={(e) =>
                    onIdentityChange({ mobile: e.target.value.replace(/\D/g, "").slice(0, 11) })
                  }
                />
                <Input
                  id="new-student-email"
                  label="Email Address"
                  type="email"
                  required
                  placeholder="e.g. juan.delacruz@example.com"
                  value={identity.email}
                  onChange={(e) => onIdentityChange({ email: e.target.value })}
                />
              </div>

              <p className="font-body text-xs text-slate-400 dark:text-slate-500">
                Email and mobile must be unique — used for account creation and communication. An
                account is created automatically the first time the student logs in.
              </p>
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
