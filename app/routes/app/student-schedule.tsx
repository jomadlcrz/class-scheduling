import { useMemo, useState } from "react";
import { RoleGuard } from "~/auth/role-guard";
import { EmptyState } from "~/components/feedback/empty-state";
import { MobileScheduleSkeleton } from "~/components/ui/skeleton";
import { BookIcon, CalendarIcon, PrinterIcon, UserCheckIcon, UsersIcon } from "~/components/ui/icons";
import { Tooltip } from "~/components/ui/tooltip";
import { MobileWeeklySchedule } from "~/features/schedules/mobile-weekly-schedule";
import { openStudentSchedulePrint } from "~/features/schedules/print-student-schedule";
import { ScheduleKpiCard } from "~/features/schedules/schedule-kpi-card";
import { ScheduleViewer } from "~/features/schedules/schedule-viewer";
import type { ScheduleViewMode } from "~/features/schedules/schedule-view-toggle";
import { TodayClasses } from "~/features/schedules/today-classes";
import { useMySchedule } from "~/features/schedules/use-my-schedule";
import { useAuth } from "~/hooks/use-auth";
import { useSemesters } from "~/hooks/use-semesters";
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
  const { user } = useAuth();
  const { semesterLabel } = useSemesters();
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
    <div className="mx-auto max-w-6xl px-4 py-8">
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
                  showSet: !isRegular,
                })
              }
              className="grid size-9 cursor-pointer place-items-center rounded-lg border border-slate-300 text-slate-500 transition-colors duration-150 hover:bg-slate-100 hover:text-navy-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-400 disabled:cursor-not-allowed disabled:opacity-60 dark:border-white/10 dark:text-slate-400 dark:hover:bg-white/10 dark:hover:text-white"
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
                <ScheduleKpiCard icon={<BookIcon />} label="Total Units" value={totalUnits} />
                <ScheduleKpiCard
                  icon={<CalendarIcon />}
                  label="Weekly Classes"
                  value={visibleSchedules.length}
                />
                <ScheduleKpiCard
                  icon={<UserCheckIcon />}
                  label="Status"
                  value={academicStatus ?? totalSubjects}
                />
                {isRegular ? (
                  <ScheduleKpiCard icon={<UsersIcon />} label="SET" value={studentSetCode} />
                ) : (
                  <ScheduleKpiCard icon={<UsersIcon />} label="Sets" value={totalSets} />
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
        </>
      )}
    </div>
  );
}
