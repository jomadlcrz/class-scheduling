import { useMemo, useState } from "react";
import { RoleGuard } from "~/auth/role-guard";
import { EmptyState } from "~/components/feedback/empty-state";
import { MobileScheduleSkeleton } from "~/components/ui/skeleton";
import { StatCard } from "~/components/ui/stat-card";
import { MobileWeeklySchedule } from "~/features/schedules/mobile-weekly-schedule";
import { ScheduleViewer } from "~/features/schedules/schedule-viewer";
import type { ScheduleViewMode } from "~/features/schedules/schedule-view-toggle";
import { TodayClasses } from "~/features/schedules/today-classes";
import { useMySchedule } from "~/features/schedules/use-my-schedule";
import { PageHeader } from "~/layouts/page-header";

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
  const [viewMode, setViewMode] = useState<ScheduleViewMode>("table");

  // The backend already scopes rows to this student via the JWT (StudentProfile.user_id).
  const {
    isLoading,
    loadError,
    schoolYear,
    semester,
    visibleSchedules,
  } = useMySchedule();

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

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-8">
      <PageHeader title="My Class Schedule" />

      {loadError && isLoading ? (
        <EmptyState title="Couldn't load your schedule">{loadError}</EmptyState>
      ) : (
        <>
          {isLoading ? (
            <div className="mt-8 sm:hidden">
              <MobileScheduleSkeleton rows={4} />
            </div>
          ) : visibleSchedules.length === 0 ? (
            <div className="mt-6 sm:hidden">
              <EmptyState title="No classes scheduled">
                You have no classes scheduled.
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
                  value={academicStatus ?? totalSubjects}
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
              isLoading={isLoading}
              viewMode={viewMode}
              onViewModeChange={setViewMode}
              emptyTitle="No classes scheduled"
              emptyMessage="You have no classes scheduled."
                  showSet={!isRegular}
            />
          </div>

          {visibleSchedules.length > 0 && (
            <div className="mt-8 grid gap-6 sm:grid-cols-2">
              <div>
                <p className="font-body text-sm font-semibold text-navy-700 dark:text-mist-100">
                  Prepared by:
                </p>
                <p className="mt-1 font-body text-sm text-navy-700 dark:text-mist-100">
                  Harvin A. Arisga
                </p>
                <p className="mt-0.5 font-body text-xs text-slate-500 dark:text-slate-400">
                  Registrar
                </p>
              </div>
              <div>
                <p className="font-body text-sm font-semibold text-navy-700 dark:text-mist-100">
                  Approved by:
                </p>
                <p className="mt-1 font-body text-sm text-navy-700 dark:text-mist-100">
                  Denzel Valdez
                </p>
                <p className="mt-0.5 font-body text-xs text-slate-500 dark:text-slate-400">
                  Dean, CITE Department
                </p>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
