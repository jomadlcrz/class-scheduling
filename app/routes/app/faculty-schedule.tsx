import { useMemo, useState } from "react";
import { Link } from "react-router";
import { RoleGuard } from "~/auth/role-guard";
import { EmptyState } from "~/components/feedback/empty-state";
import { MobileScheduleSkeleton } from "~/components/ui/skeleton";
import { PrinterIcon } from "~/components/ui/icons";
import { StatCard } from "~/components/ui/stat-card";
import { Tooltip } from "~/components/ui/tooltip";
import { useTermContext } from "~/features/academic-terms/term-context-provider";
import { MobileWeeklySchedule } from "~/features/schedules/mobile-weekly-schedule";
import { openInstructorSchedulePrint } from "~/features/schedules/print-instructor-schedule";
import { ScheduleViewer } from "~/features/schedules/schedule-viewer";
import type { ScheduleViewMode } from "~/features/schedules/schedule-view-toggle";
import { TodayClasses } from "~/features/schedules/today-classes";
import { useMySchedule } from "~/features/schedules/use-my-schedule";
import { useAuth } from "~/hooks/use-auth";
import { useCachedData } from "~/hooks/use-cached-data";
import { useDays } from "~/hooks/use-days";
import { useSemesters } from "~/hooks/use-semesters";
import { PageHeader } from "~/layouts/page-header";
import { deanService } from "~/services/dean.service";
import { authorityWorkflowService } from "~/services/authority-workflow.service";

export function meta() {
  return [
    { title: "My Schedule — GWC Class Scheduling" },
    { name: "description", content: "Your teaching schedule for the current academic term." },
  ];
}

export default function FacultyScheduleRoute() {
  return (
    <RoleGuard allow={["faculty"]}>
      <FacultySchedulePage />
    </RoleGuard>
  );
}

function FacultySchedulePage() {
  const { user } = useAuth();
  const { semesterLabel } = useSemesters();
  const { dayLabels } = useDays();
  const { context: termContext, loading: termContextLoading } = useTermContext();
  const [viewMode, setViewMode] = useState<ScheduleViewMode>("table");

  const {
    isLoading,
    loadError,
    schoolYear,
    semester,
    visibleSchedules,
    attestations,
    attestationsLoading,
  } = useMySchedule();

  const selectedTerm = termContext?.selection;
  const selectedTermReady = selectedTerm?.syId != null && selectedTerm.semesterNumber != null;
  const facultyLoadKey = `faculty-schedule-empty-state:${selectedTerm?.syId ?? "none"}:${selectedTerm?.semesterNumber ?? "none"}`;
  const { data: facultyLoading, error: facultyLoadingError } = useCachedData(
    facultyLoadKey,
    () => deanService.getFacultyLoading(selectedTerm!.syId!, selectedTerm!.semesterNumber!),
    { enabled: !isLoading && visibleSchedules.length === 0 && selectedTermReady },
  );
  const { data: reviewReleases } = useCachedData(
    "instructor-schedule-reviews",
    () => authorityWorkflowService.listInstructorScheduleReviews(),
    { cache: false },
  );

  const pendingReviewCount = reviewReleases?.length ?? 0;

  const emptyContextLoading =
    !isLoading &&
    visibleSchedules.length === 0 &&
    (termContextLoading || (selectedTermReady && facultyLoading === null && !facultyLoadingError));

  const emptyScheduleState = useMemo(() => {
    if (termContext && termContext.schoolYears.length === 0) {
      return {
        title: "No academic term available",
        message: "Your teaching schedule will appear after the registrar creates an academic term.",
      };
    }

    const facultyEntry = facultyLoading?.[0];
    if (selectedTermReady && facultyLoading && (!facultyEntry || facultyEntry.subjects.length === 0)) {
      return {
        title: "No teaching assignments",
        message: `You have no assigned subjects for ${selectedTerm?.schoolYear ?? "the selected term"}, ${semesterLabel(selectedTerm!.semesterNumber!)}.`,
      };
    }

    if (facultyEntry?.subjects.length) {
      return {
        title: "Schedule not available yet",
        message: "Your subjects are assigned, but the timetable is not public yet. It will appear after final approval and term-wide publication.",
      };
    }

    return {
      title: "No classes scheduled",
      message: "You have no classes for the selected term.",
    };
  }, [facultyLoading, semesterLabel, selectedTerm, selectedTermReady, termContext]);

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

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-8">
      <PageHeader
        title="My Teaching Schedule"

        actions={
          <Tooltip label="Print schedule">
            <button
              type="button"
              aria-label="Print schedule"
              disabled={visibleSchedules.length === 0 || attestationsLoading}
              onClick={() =>
                openInstructorSchedulePrint(visibleSchedules, {
                  schoolYear,
                  semesterLabel: semesterLabel(semester),
                  instructorName: user?.name ?? "",
                  semesterNumber: semester,
                  attestations,
                  dayLabels,
                })
              }
              className="grid size-9 cursor-pointer place-items-center rounded-lg border border-slate-300 text-slate-500 transition-colors duration-150 hover:bg-slate-100 hover:text-navy-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-400 disabled:cursor-not-allowed disabled:opacity-60 dark:border-white/10 dark:text-slate-400 dark:hover:bg-white/10 dark:hover:text-mist-100"
            >
              <PrinterIcon />
            </button>
          </Tooltip>
        }
      />

      {pendingReviewCount > 0 && (
        <div className="mt-4 flex items-center gap-2 rounded-lg border border-violet-200 bg-violet-50/50 px-4 py-3 text-sm dark:border-violet-400/25 dark:bg-violet-400/8">
          <span className="font-medium text-violet-700 dark:text-violet-300">
            You have {pendingReviewCount} schedule{pendingReviewCount === 1 ? "" : ""} awaiting review.
          </span>
          <Link
            to="/shift-requests"
            className="font-semibold text-violet-700 underline decoration-violet-300 underline-offset-2 hover:text-violet-900 dark:text-violet-300 dark:hover:text-violet-100"
          >
            Go to Shift Requests →
          </Link>
        </div>
      )}

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
                <StatCard label="Total units" value={totalUnits} />
                <StatCard
                  label="Weekly classes"
                  value={visibleSchedules.length}
                />
                <StatCard
                  label="Subjects"
                  value={totalSubjects}
                />
                <StatCard
                  label="Sets"
                  value={totalSets}
                />
              </div>

              <div className="mt-4">
                <TodayClasses schedules={visibleSchedules} hideInstructor />
              </div>

              <div className="mt-4 sm:hidden">
                <MobileWeeklySchedule schedules={visibleSchedules} hideInstructor />
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
              showSet
              hideInstructor
            />
          </div>
        </>
      )}
    </div>
  );
}
