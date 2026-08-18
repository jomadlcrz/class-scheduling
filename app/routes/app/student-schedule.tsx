import { useMemo, useState } from "react";
import { RoleGuard } from "~/auth/role-guard";
import { EmptyState } from "~/components/feedback/empty-state";
import { PrinterIcon } from "~/components/ui/icons";
import { MobileScheduleSkeleton } from "~/components/ui/skeleton";
import { StatCard } from "~/components/ui/stat-card";
import { Tooltip } from "~/components/ui/tooltip";
import { useTermContext } from "~/features/academic-terms/term-context-provider";
import { MobileWeeklySchedule } from "~/features/schedules/mobile-weekly-schedule";
import { openStudentSchedulePrint } from "~/features/schedules/print-student-schedule";
import { ScheduleViewer } from "~/features/schedules/schedule-viewer";
import type { ScheduleViewMode } from "~/features/schedules/schedule-view-toggle";
import { TodayClasses } from "~/features/schedules/today-classes";
import { useMySchedule } from "~/features/schedules/use-my-schedule";
import { useAuth } from "~/hooks/use-auth";
import { useCachedData } from "~/hooks/use-cached-data";
import { useSemesters } from "~/hooks/use-semesters";
import { PageHeader } from "~/layouts/page-header";
import { selfAnalyticsService } from "~/services/self-analytics.service";

export function meta() {
  return [
    { title: "My Schedule — GWC Class Scheduling" },
    { name: "description", content: "Your class schedule for the current academic term." },
  ];
}

export default function StudentScheduleRoute() {
  return (
    <RoleGuard allow={["student"]}>
      <StudentSchedulePage />
    </RoleGuard>
  );
}

function StudentSchedulePage() {
  const { user } = useAuth();
  const { semesterLabel } = useSemesters();
  const { context: termContext, loading: termContextLoading } = useTermContext();
  const [viewMode, setViewMode] = useState<ScheduleViewMode>("table");

  // The backend already scopes rows to this student via the JWT (StudentProfile.user_id).
  const {
    isLoading,
    loadError,
    schoolYear,
    semester,
    visibleSchedules,
    attestations,
  } = useMySchedule();

  const selectedTerm = termContext?.selection;
  const selectedTermReady = selectedTerm?.syId != null && selectedTerm.semesterNumber != null;
  const studentContextKey = `student-schedule-empty-state:${selectedTerm?.syId ?? "none"}:${selectedTerm?.semesterNumber ?? "none"}`;
  const { data: studentAnalytics, error: studentAnalyticsError } = useCachedData(
    studentContextKey,
    () => selfAnalyticsService.getStudent(selectedTerm!.syId!, selectedTerm!.semesterNumber!),
    { enabled: selectedTermReady },
  );

  const emptyContextLoading =
    !isLoading &&
    visibleSchedules.length === 0 &&
    (termContextLoading ||
      (selectedTermReady && studentAnalytics === null && !studentAnalyticsError));

  const emptyScheduleState = useMemo(() => {
    if (termContext && termContext.schoolYears.length === 0) {
      return {
        title: "No academic term available",
        message: "Your class schedule will appear after the registrar creates an academic term.",
      };
    }

    if (selectedTermReady && studentAnalytics && studentAnalytics.subjects.length === 0) {
      return {
        title: "No enrolled subjects",
        message: `You have no enrolled subjects for ${selectedTerm?.schoolYear ?? "the selected term"}, ${semesterLabel(selectedTerm!.semesterNumber!)}.`,
      };
    }

    const releaseStatus = studentAnalytics?.meta.scheduleReleaseStatus;
    if (releaseStatus === "pending_approval") {
      return {
        title: "Schedule pending approval",
        message: "Your class schedule is waiting for dean approval. It will appear here once approved.",
      };
    }

    if (releaseStatus === "rejected") {
      return {
        title: "Schedule under revision",
        message: "Your class schedule was returned for revision and will appear after it is updated and approved.",
      };
    }

    if (studentAnalytics?.subjects.length) {
      return {
        title: "Schedule not available yet",
        message: "You are enrolled, but your approved class schedule is not available yet.",
      };
    }

    return {
      title: "No classes scheduled",
      message: "You have no classes for the selected term.",
    };
  }, [semesterLabel, selectedTerm, selectedTermReady, studentAnalytics, termContext]);

  const totalUnits = useMemo(() => {
    const seen = new Set<string>();
    let sum = 0;
    for (const s of visibleSchedules) {
      if (seen.has(s.subjectCode)) continue;
      seen.add(s.subjectCode);
      sum += s.units ?? 0;
    }
    return sum;
  }, [visibleSchedules]);

  const totalSubjects = useMemo(
    () => new Set(visibleSchedules.map((s) => s.subjectCode)).size,
    [visibleSchedules],
  );

  const totalSets = useMemo(
    () => new Set(visibleSchedules.map((s) => s.setCode)).size,
    [visibleSchedules],
  );

  const academicStatus = visibleSchedules[0]?.academicStatus;
  const isRegular = academicStatus === "Regular";
  const studentSetCode = visibleSchedules[0]?.setCode ?? "";
  const programName =
    studentAnalytics?.meta.program_name ??
    visibleSchedules[0]?.programName ??
    visibleSchedules[0]?.program;

  const currentAttestation = attestations.find((a) => a.setCode === studentSetCode);

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-8">
      <PageHeader
        title="My Class Schedule"
        actions={
          <Tooltip label="Print schedule">
            <button
              type="button"
              aria-label="Print schedule"
              disabled={visibleSchedules.length === 0}
              onClick={() =>
                openStudentSchedulePrint(visibleSchedules, {
                  schoolYear,
                  semesterLabel: semesterLabel(semester),
                  studentName: user?.name ?? "",
                  academicStatus,
                  programName,
                  attestations,
                })
              }
              className="grid size-9 cursor-pointer place-items-center rounded-lg border border-slate-300 text-slate-500 transition-colors duration-150 hover:bg-slate-100 hover:text-navy-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-400 disabled:cursor-not-allowed disabled:opacity-60 dark:border-white/10 dark:text-slate-400 dark:hover:bg-white/10 dark:hover:text-mist-100"
            >
              <PrinterIcon />
            </button>
          </Tooltip>
        }
      />

      {loadError && isLoading ? (
        <EmptyState title="Couldn't load your schedule">{loadError}</EmptyState>
      ) : (
        <>
          {isLoading || emptyContextLoading ? (
            <div className="mt-8 sm:hidden">
              <MobileScheduleSkeleton rows={4} />
            </div>
          ) : visibleSchedules.length === 0 ? (
            <div className="mt-6 sm:hidden">
              <EmptyState title={emptyScheduleState.title}>
                {emptyScheduleState.message}
              </EmptyState>
            </div>
          ) : (
            <>
              <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <StatCard label="Total Units" value={totalUnits} />
                <StatCard
                  label="Weekly Classes"
                  value={visibleSchedules.length}
                />
                <StatCard
                  label="Status"
                  value={academicStatus || "Irregular"}
                />
                {isRegular ? (
                  <StatCard label="Set" value={studentSetCode} />
                ) : (
                  <StatCard label="Sets" value={totalSets} />
                )}
              </div>

              <div className="mt-4">
                <TodayClasses schedules={visibleSchedules} />
              </div>

              <div className="mt-4 sm:hidden">
                <MobileWeeklySchedule schedules={visibleSchedules} showSet={!isRegular} />
              </div>
            </>
          )}

          <div className="hidden sm:block">
            <ScheduleViewer
              schedules={visibleSchedules}
              isLoading={isLoading || emptyContextLoading}
              viewMode={viewMode}
              onViewModeChange={setViewMode}
              emptyTitle={emptyScheduleState.title}
              emptyMessage={emptyScheduleState.message}
              showSet={!isRegular}
            />
          </div>

          {visibleSchedules.length > 0 && currentAttestation && (
            <div className="mt-8 grid gap-6 sm:grid-cols-2">
              <div>
                <p className="font-body text-sm font-semibold text-navy-700 dark:text-mist-100">
                  Prepared by:
                </p>
                <p className="mt-1 font-body text-sm text-navy-700 dark:text-mist-100">
                  {currentAttestation.preparedBy.name}
                </p>
                <p className="mt-0.5 font-body text-xs text-slate-500 dark:text-slate-400">
                  {currentAttestation.preparedBy.position}
                </p>
              </div>
              <div>
                <p className="font-body text-sm font-semibold text-navy-700 dark:text-mist-100">
                  Approved by:
                </p>
                <p className="mt-1 font-body text-sm text-navy-700 dark:text-mist-100">
                  {currentAttestation.approvedBy.name}
                </p>
                <p className="mt-0.5 font-body text-xs text-slate-500 dark:text-slate-400">
                  {currentAttestation.approvedBy.departmentAbbrev
                    ? `${currentAttestation.approvedBy.position}, ${currentAttestation.approvedBy.departmentAbbrev} Department`
                    : currentAttestation.approvedBy.position}
                </p>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
