import { useEffect, useMemo, useState } from "react";
import { RoleGuard } from "~/auth/role-guard";
import { EmptyState } from "~/components/feedback/empty-state";
import { Badge } from "~/components/ui/badge";
import { BookIcon, CalendarIcon, PrinterIcon, UserCheckIcon } from "~/components/ui/icons";
import { FieldChrome } from "~/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "~/components/ui/select";
import { Spinner } from "~/components/ui/spinner";
import { Tooltip } from "~/components/ui/tooltip";
import { MobileWeeklySchedule } from "~/features/schedules/mobile-weekly-schedule";
import { openSchedulePrint } from "~/features/schedules/print-schedule";
import { ScheduleKpiCard } from "~/features/schedules/schedule-kpi-card";
import { ScheduleViewer } from "~/features/schedules/schedule-viewer";
import type { ScheduleViewMode } from "~/features/schedules/schedule-view-toggle";
import { TodayClasses } from "~/features/schedules/today-classes";
import { useSemesters } from "~/hooks/use-semesters";
import { PageHeader } from "~/layouts/page-header";
import { scheduleService } from "~/services/schedule.service";
import { DAYS, type Schedule, type ScheduleSemester } from "~/types/schedule";

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
  const { semesters, semesterLabel, loading: semestersLoading } = useSemesters();
  const [schedules, setSchedules] = useState<Schedule[] | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [schoolYear, setSchoolYear] = useState("");
  const [semester, setSemester] = useState<ScheduleSemester>(1);
  const [viewMode, setViewMode] = useState<ScheduleViewMode>("table");

  // The backend already scopes rows to this student via the JWT (StudentProfile.user_id).
  useEffect(() => {
    scheduleService
      .view()
      .then((result) => {
        setSchedules(result);
        const years = [...new Set(result.map((s) => s.schoolYear))].sort((a, b) => b.localeCompare(a));
        const firstYear = years[0] ?? "";
        setSchoolYear(firstYear);
        const firstSemester = result.find((s) => s.schoolYear === firstYear)?.semester;
        if (firstSemester) setSemester(firstSemester);
      })
      .catch((err) => {
        setLoadError(err instanceof Error ? err.message : "Unable to load your schedule.");
        setSchedules([]);
      });
  }, []);

  const schoolYears = useMemo(
    () => [...new Set((schedules ?? []).map((s) => s.schoolYear))].sort((a, b) => b.localeCompare(a)),
    [schedules],
  );

  const visibleSchedules = useMemo(() => {
    if (!schedules) return [];
    return schedules
      .filter((s) => s.schoolYear === schoolYear && s.semester === semester)
      .sort(
        (a, b) =>
          DAYS.indexOf(a.day) - DAYS.indexOf(b.day) || a.startTime.localeCompare(b.startTime),
      );
  }, [schedules, schoolYear, semester]);

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

  // Every visible row carries the same value — the backend attaches it per-row, not once.
  const academicStatus = visibleSchedules[0]?.academicStatus;

  const isLoading = schedules === null;

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <PageHeader
        title="My Class Schedule"
        description="Your enrolled subjects and weekly class times."
        actions={
          <Tooltip label="Print schedule">
            <button
              type="button"
              aria-label="Print schedule"
              disabled={visibleSchedules.length === 0}
              onClick={() =>
                openSchedulePrint(visibleSchedules, { schoolYear, semesterLabel: semesterLabel(semester) })
              }
              className="grid size-9 cursor-pointer place-items-center rounded-lg border border-slate-300 text-slate-500 transition-colors duration-150 hover:bg-slate-100 hover:text-navy-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-400 disabled:cursor-not-allowed disabled:opacity-60 dark:border-white/10 dark:text-slate-400 dark:hover:bg-white/10 dark:hover:text-white"
            >
              <PrinterIcon />
            </button>
          </Tooltip>
        }
      />

      {loadError ? (
        <EmptyState title="Couldn't load your schedule">{loadError}</EmptyState>
      ) : (
        <>
          <div className="mt-4 grid grid-cols-2 gap-3 sm:max-w-sm">
            <FieldChrome id="ss-school-year" label="School Year">
              <Select
                items={
                  isLoading
                    ? [{ value: "", label: "Loading…" }]
                    : schoolYears.length === 0
                      ? [{ value: "", label: "No classes yet" }]
                      : schoolYears.map((y) => ({ value: y, label: y }))
                }
                value={schoolYear}
                onValueChange={(v) => setSchoolYear(v as string)}
              >
                <SelectTrigger id="ss-school-year">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {isLoading ? (
                    <SelectItem value="">Loading…</SelectItem>
                  ) : schoolYears.length === 0 ? (
                    <SelectItem value="">No classes yet</SelectItem>
                  ) : (
                    schoolYears.map((y) => (
                      <SelectItem key={y} value={y}>
                        {y}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </FieldChrome>
            <FieldChrome id="ss-semester" label="Semester">
              <Select
                items={
                  semestersLoading
                    ? [{ value: "", label: "Loading…" }]
                    : semesters
                        .filter((s) => s.semesterNumber !== 3)
                        .map((s) => ({ value: String(s.semesterNumber), label: semesterLabel(s.semesterNumber) }))
                }
                value={semestersLoading ? "" : String(semester)}
                onValueChange={(v) => setSemester(Number(v) as ScheduleSemester)}
              >
                <SelectTrigger id="ss-semester">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {semestersLoading ? (
                    <SelectItem value="">Loading…</SelectItem>
                  ) : (
                    semesters
                      .filter((s) => s.semesterNumber !== 3)
                      .map((s) => (
                        <SelectItem key={s.id} value={String(s.semesterNumber)}>
                          {semesterLabel(s.semesterNumber)}
                        </SelectItem>
                      ))
                  )}
                </SelectContent>
              </Select>
            </FieldChrome>
          </div>

          {isLoading ? (
            <div
              role="status"
              aria-label="Loading schedule"
              className="mt-8 grid place-items-center text-navy-700 sm:hidden dark:text-slate-200"
            >
              <Spinner />
            </div>
          ) : visibleSchedules.length === 0 ? (
            <div className="mt-6 sm:hidden">
              <EmptyState title="No classes scheduled">
                You have no classes for the selected term.
              </EmptyState>
            </div>
          ) : (
            <>
              <div className="mt-4 grid gap-3 sm:grid-cols-3">
                <ScheduleKpiCard icon={<BookIcon />} tone="navy" label="Total Units" value={totalUnits} />
                <ScheduleKpiCard
                  icon={<CalendarIcon />}
                  tone="blue"
                  label="Weekly Classes"
                  value={visibleSchedules.length}
                />
                <ScheduleKpiCard
                  icon={<UserCheckIcon />}
                  tone="emerald"
                  label="Status"
                  value={
                    academicStatus ? <Badge tone="emerald">{academicStatus}</Badge> : `${totalSubjects} subjects`
                  }
                />
              </div>

              <div className="mt-4">
                <TodayClasses schedules={visibleSchedules} />
              </div>

              <div className="mt-4 sm:hidden">
                <MobileWeeklySchedule schedules={visibleSchedules} />
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
              emptyMessage="You have no classes for the selected term."
            />
          </div>
        </>
      )}
    </div>
  );
}
