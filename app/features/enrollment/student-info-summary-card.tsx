import { Badge } from "~/components/ui/badge";
import { BookIcon, EditIcon, UserIcon } from "~/components/ui/icons";
import {
  EnrollmentSectionCard,
  InfoField,
} from "~/features/enrollment/enrollment-section-card";
import { StudentAvatar } from "~/features/enrollment/student-avatar";
import type { AcademicDraft } from "~/features/enrollment/add-student-step2-academic";
import type { IdentityDraft } from "~/features/enrollment/add-student-step1-identity";

type StudentInfoSummaryCardProps = {
  identity: IdentityDraft;
  academic: AcademicDraft;
  programLabel: string;
  yearLevelLabel: string;
  setLabel?: string;
  schoolYearLabel: string;
  semesterLabel: string;
  photoUrl?: string | null;
  onEditIdentity?: () => void;
  onEditAcademic?: () => void;
};

function displayName(identity: IdentityDraft): string {
  return (
    [identity.firstName, identity.midName, identity.lastName, identity.suffix].filter(Boolean).join(" ") || "—"
  );
}

/** Read-only Student Information card matching the enrollment mockup (review step). */
export function StudentInfoSummaryCard({
  identity,
  academic,
  programLabel,
  yearLevelLabel,
  setLabel,
  schoolYearLabel,
  semesterLabel,
  photoUrl,
  onEditIdentity,
  onEditAcademic,
}: StudentInfoSummaryCardProps) {
  const statusTone = academic.enrolledStatus === "Irregular" ? "gold" : "emerald";

  return (
    <EnrollmentSectionCard title="Student Information" icon={<UserIcon />}>
      <div className="grid gap-6 lg:grid-cols-[11rem_1fr_1fr]">
        <div className="flex flex-col items-center gap-3 border-b border-slate-200 pb-5 lg:border-b-0 lg:border-r lg:pb-0 lg:pr-5 dark:border-white/10">
          <StudentAvatar
            firstName={identity.firstName}
            lastName={identity.lastName}
            photoUrl={photoUrl}
          />
          <Badge tone="sky">For Enrollment</Badge>
          <p className="font-body text-xs font-medium tabular-nums text-slate-500 dark:text-slate-400">
            {identity.studentId.trim() || "ID pending"}
          </p>
        </div>

        <div className="min-w-0">
          <div className="mb-3 flex items-center justify-between gap-2">
            <h3 className="font-body text-sm font-semibold text-navy-800 dark:text-mist-100">
              Basic Information
            </h3>
            {onEditIdentity ? (
              <button
                type="button"
                onClick={onEditIdentity}
                className="inline-flex cursor-pointer items-center gap-1.5 font-body text-xs font-medium text-navy-700 transition-colors hover:text-navy-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-400 dark:text-mist-100 dark:hover:text-white"
              >
                <EditIcon />
                Edit
              </button>
            ) : null}
          </div>
          <dl className="grid gap-3">
            <InfoField label="Full Name">{displayName(identity)}</InfoField>
            <InfoField label="Contact Number">{identity.mobile.trim() || "—"}</InfoField>
            <InfoField label="Email">{identity.email.trim() || "—"}</InfoField>
          </dl>
        </div>

        <div className="min-w-0 border-t border-slate-200 pt-5 lg:border-t-0 lg:border-l lg:pl-5 lg:pt-0 dark:border-white/10">
          <div className="mb-3 flex items-center justify-between gap-2">
            <h3 className="inline-flex items-center gap-1.5 font-body text-sm font-semibold text-navy-800 dark:text-mist-100">
              <span className="text-navy-600 dark:text-gold-300">
                <BookIcon />
              </span>
              Academic Information
            </h3>
            {onEditAcademic ? (
              <button
                type="button"
                onClick={onEditAcademic}
                className="inline-flex cursor-pointer items-center gap-1.5 font-body text-xs font-medium text-navy-700 transition-colors hover:text-navy-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-400 dark:text-mist-100 dark:hover:text-white"
              >
                <EditIcon />
                Edit
              </button>
            ) : null}
          </div>
          <dl className="grid gap-3">
            <InfoField label="Program">{programLabel || "—"}</InfoField>
            <InfoField label="Year Level">{yearLevelLabel || "—"}</InfoField>
            <InfoField label="Student Type">{academic.studentType.trim() || "—"}</InfoField>
            <InfoField label="Enrolled Status">
              {academic.enrolledStatus ? (
                <Badge tone={statusTone}>{academic.enrolledStatus}</Badge>
              ) : (
                "—"
              )}
            </InfoField>
            {academic.enrolledStatus === "Regular" ? (
              <InfoField label="Class Set">{setLabel || "—"}</InfoField>
            ) : null}
            <InfoField label="Term">
              {[schoolYearLabel, semesterLabel].filter(Boolean).join(" · ") || "—"}
            </InfoField>
            <InfoField label="Enrollment Status">
              <Badge tone="sky">For Enrollment</Badge>
            </InfoField>
          </dl>
        </div>
      </div>
    </EnrollmentSectionCard>
  );
}
