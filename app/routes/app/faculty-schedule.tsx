import { useEffect, useMemo, useState } from "react";
import { RoleGuard } from "~/auth/role-guard";
import { EmptyState } from "~/components/feedback/empty-state";
import { FieldChrome } from "~/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "~/components/ui/select";
import { ScheduleViewer } from "~/features/schedules/schedule-viewer";
import type { ScheduleViewMode } from "~/features/schedules/schedule-view-toggle";
import { useSemesters } from "~/hooks/use-semesters";
import { PageHeader } from "~/layouts/page-header";
import { scheduleService } from "~/services/schedule.service";
import { DAYS, type Schedule, type ScheduleSemester } from "~/types/schedule";

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
  const { semesters, semesterLabel, loading: semestersLoading } = useSemesters();
  const [schedules, setSchedules] = useState<Schedule[] | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [schoolYear, setSchoolYear] = useState("");
  const [semester, setSemester] = useState<ScheduleSemester>(1);
  const [viewMode, setViewMode] = useState<ScheduleViewMode>("table");

  // The backend already scopes rows to this instructor via the JWT (RegularSchedule.faculty_id).
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

  const isLoading = schedules === null;

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <PageHeader
        title="My Teaching Schedule"
        description="The classes you teach this academic term."
      />

      {loadError ? (
        <EmptyState title="Couldn't load your schedule">{loadError}</EmptyState>
      ) : (
        <>
          <div className="mt-4 grid grid-cols-2 gap-3 sm:max-w-sm">
            <FieldChrome id="fs-school-year" label="School Year">
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
                <SelectTrigger id="fs-school-year">
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
            <FieldChrome id="fs-semester" label="Semester">
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
                <SelectTrigger id="fs-semester">
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

          <ScheduleViewer
            schedules={visibleSchedules}
            isLoading={isLoading}
            viewMode={viewMode}
            onViewModeChange={setViewMode}
            emptyTitle="No classes scheduled"
            emptyMessage="You have no classes for the selected term."
          />
        </>
      )}
    </div>
  );
}
