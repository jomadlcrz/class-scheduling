import { useNavigate } from "react-router";
import { RoleGuard } from "~/auth/role-guard";
import { Badge } from "~/components/ui/badge";
import { Card } from "~/components/ui/card";
import { ScreenHeader } from "~/components/ui/screen-header";
import { Skeleton } from "~/components/ui/skeleton";
import { useTermContext } from "~/features/academic-terms/term-context-provider";
import { useAuth } from "~/hooks/use-auth";
import { useCachedData } from "~/hooks/use-cached-data";
import { useYearLevels } from "~/hooks/use-year-levels";
import { studentService } from "~/services/student.service";
import type { RegistrationData } from "~/types/registration";

export function meta() {
  return [
    { title: "Academic Information — GWC Class Scheduling" },
    { name: "description", content: "Official academic and curriculum information for the student." },
  ];
}

function InfoIcon({ size = 16, className = "" }: { size?: number; className?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="10" />
      <path d="M12 16v-4M12 8h.01" />
    </svg>
  );
}

export default function AcademicInformationRoute() {
  return (
    <RoleGuard allow={["student"]}>
      <AcademicInformationPage />
    </RoleGuard>
  );
}

function AcademicInformationPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { yearLevelLabel } = useYearLevels();
  const { context: termContext } = useTermContext();
  const selectedTerm = termContext?.selection;

  const { data: registration } = useCachedData<RegistrationData>(
    `student-profile-registration:${selectedTerm?.syId}:${selectedTerm?.semesterNumber}`,
    () =>
      studentService.getMyRegistration({
        syId: selectedTerm?.syId ?? undefined,
        semesterNumber: selectedTerm?.semesterNumber ?? undefined,
      }),
    { enabled: !!user },
  );

  const loading = registration === null;

  const meta = registration?.meta;
  const programName =
    meta?.program_name ||
    registration?.program_name ||
    meta?.program_abbrev ||
    "—";
  const rawYear = meta?.year_level ?? registration?.year_level;
  const rawYearNum = typeof rawYear === "number" ? rawYear : Number(rawYear);
  const rawYearName = meta?.year_level_name;
  const resolvedYearLevel = (() => {
    if (rawYearName && rawYearName.trim() && rawYearName !== "-" && rawYearName !== "—") {
      return rawYearName.trim();
    }
    if (!Number.isNaN(rawYearNum) && rawYearNum > 0) {
      return yearLevelLabel(rawYearNum);
    }
    return "—";
  })();

  const section = meta?.set_name || registration?.section || "";
  const schoolYear = meta?.school_year || registration?.school_year || selectedTerm?.schoolYear || "—";
  const semester = meta?.semester_name || registration?.semester || "—";
  const enrolledStatus = meta?.enrolled_status || registration?.academic_status || "Enrolled";

  return (
    <div className="flex min-h-[calc(100dvh-3.5rem)] flex-col bg-slate-50 dark:bg-surface">
      {/* Screen Header with Back Navigation */}
      <ScreenHeader
        title="Academic Information"
        showBack
        onBack={() => navigate(-1)}
        className="border-b border-slate-200/90 bg-white dark:border-white/10 dark:bg-surface"
      />

      <div className="flex-1 px-4 py-6 sm:px-6">
        <div className="mx-auto w-full max-w-lg">
          <p className="mb-5 text-sm text-slate-500 dark:text-slate-400">
            Official enrollment and curriculum record for the current academic term.
          </p>

          {loading && !registration ? (
            <Card className="p-5">
              <div className="space-y-4">
                <Skeleton className="h-6 w-3/4 rounded-lg" />
                <Skeleton className="h-6 w-1/2 rounded-lg" />
                <Skeleton className="h-6 w-2/3 rounded-lg" />
                <Skeleton className="h-6 w-1/3 rounded-lg" />
              </div>
            </Card>
          ) : (
            <div className="space-y-4">
              {/* Grouped Content Card */}
              <Card className="overflow-hidden">
                <div className="divide-y divide-slate-100 p-5 dark:divide-white/5">
                  <div className="flex items-center justify-between pb-3.5">
                    <span className="text-xs font-semibold text-slate-400 dark:text-slate-500">
                      Program
                    </span>
                    <span className="max-w-[65%] text-right text-xs font-bold text-slate-800 dark:text-slate-200">
                      {programName}
                    </span>
                  </div>

                  <div className="flex items-center justify-between py-3.5">
                    <span className="text-xs font-semibold text-slate-400 dark:text-slate-500">
                      Year level
                    </span>
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                      {resolvedYearLevel}
                    </span>
                  </div>

                  <div className="flex items-center justify-between py-3.5">
                    <span className="text-xs font-semibold text-slate-400 dark:text-slate-500">
                      Section
                    </span>
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                      {section && section !== "—" && section !== "-" ? section : "Irregular (No set)"}
                    </span>
                  </div>

                  <div className="flex items-center justify-between py-3.5">
                    <span className="text-xs font-semibold text-slate-400 dark:text-slate-500">
                      Academic year
                    </span>
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                      A.Y. {schoolYear}
                    </span>
                  </div>

                  <div className="flex items-center justify-between py-3.5">
                    <span className="text-xs font-semibold text-slate-400 dark:text-slate-500">
                      Semester
                    </span>
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                      {semester}
                    </span>
                  </div>

                  <div className="flex items-center justify-between pt-3.5">
                    <span className="text-xs font-semibold text-slate-400 dark:text-slate-500">
                      Status
                    </span>
                    <Badge tone={enrolledStatus?.toLowerCase() === "irregular" ? "gold" : "navy"}>
                      {enrolledStatus}
                    </Badge>
                  </div>
                </div>
              </Card>

              {/* Informative Guidance Box */}
              <Card className="flex items-start gap-3 bg-slate-100/70 p-4 text-xs text-slate-500 dark:bg-white/5 dark:text-slate-400">
                <InfoIcon size={16} className="mt-0.5 shrink-0 text-slate-400 dark:text-slate-500" />
                <p className="leading-relaxed">
                  To request a change in your program, year level, or section assignment, please consult your department chair or visit the Registrar&apos;s Office.
                </p>
              </Card>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
