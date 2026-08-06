import { Input } from "~/components/ui/input";
import { ProgramWizardFooter } from "~/features/subjects/program-wizard-footer";

export type IdentityDraft = {
  studentId: string;
  firstName: string;
  midName: string;
  lastName: string;
  mobile: string;
  email: string;
};

type AddStudentStep1IdentityProps = {
  identity: IdentityDraft;
  onIdentityChange: (patch: Partial<IdentityDraft>) => void;
  canAdvance: boolean;
  onNext: () => void;
  onCancel: () => void;
};

export function AddStudentStep1Identity({
  identity,
  onIdentityChange,
  canAdvance,
  onNext,
  onCancel,
}: AddStudentStep1IdentityProps) {
  return (
    <div className="flex flex-col gap-5">
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

      <Input
        id="new-student-last-name"
        label="Last Name"
        type="text"
        required
        placeholder="e.g. Dela Cruz"
        value={identity.lastName}
        onChange={(e) => onIdentityChange({ lastName: e.target.value })}
      />

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
          onChange={(e) => onIdentityChange({ mobile: e.target.value.replace(/\D/g, "").slice(0, 11) })}
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
        Email and mobile number must be unique — they're used for account creation and communication. An
        account is created automatically the first time the student logs in.
      </p>

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
