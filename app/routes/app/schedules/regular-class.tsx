import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router";
import { RoleGuard } from "~/auth/role-guard";
import { ResultState } from "~/components/feedback/result-state";
import { Button } from "~/components/ui/button";
import { EmptyState } from "~/components/feedback/empty-state";
import { PlusIcon, PrinterIcon } from "~/components/ui/icons";
import { Select } from "~/components/ui/select";
import { Spinner } from "~/components/ui/spinner";
import { ScheduleGrid } from "~/features/schedules/schedule-grid";
import { ScheduleTable } from "~/features/schedules/schedule-table";
import {
  ScheduleViewToggle,
  type ScheduleViewMode,
} from "~/features/schedules/schedule-view-toggle";
import { PageHeader } from "~/layouts/page-header";
import { scheduleService } from "~/services/schedule.service";
import {
  DAYS,
  type Schedule,
  type ScheduleSemester,
} from "~/types/schedule";
import { useSemesters } from "~/hooks/use-semesters";

export function meta() {
  return [
    { title: "Regular Class — GWC Class Scheduling" },
    { name: "description", content: "Assign subjects to time slots and manage class schedules." },
  ];
}

export default function RegularClassRoute() {
  return (
    <RoleGuard allow={["admin", "registrar", "dean"]}>
      <RegularClassPage />
    </RoleGuard>
  );
}

function RegularClassPage() {
  const navigate = useNavigate();
  const { semesters, semesterLabel, loading: semestersLoading } = useSemesters();
  const [schedules, setSchedules] = useState<Schedule[] | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  // Filters — pin the view to a single section's weekly schedule.
  const [schoolYear, setSchoolYear] = useState("");
  const [semester, setSemester] = useState<ScheduleSemester>(1);
  const [setName, setSetName] = useState("");

  const [viewMode, setViewMode] = useState<ScheduleViewMode>("grid");

  useEffect(() => {
    scheduleService
      .view()
      .then((result) => {
        setSchedules(result);
        // Default to the newest school year and its first set.
        const years = [...new Set(result.map((s) => s.schoolYear))].sort((a, b) => b.localeCompare(a));
        const firstYear = years[0] ?? "";
        setSchoolYear(firstYear);
        const firstSet = result.find((s) => s.schoolYear === firstYear && s.semester === 1);
        setSetName(firstSet?.setCode ?? "");
      })
      .catch((err) => {
        setLoadError(err instanceof Error ? err.message : "Unable to load schedules.");
        setSchedules([]);
      });
  }, []);

  const schoolYears = useMemo(
    () => [...new Set((schedules ?? []).map((s) => s.schoolYear))].sort((a, b) => b.localeCompare(a)),
    [schedules],
  );

  const availableSets = useMemo(
    () =>
      [
        ...new Set(
          (schedules ?? [])
            .filter((s) => s.schoolYear === schoolYear && s.semester === semester)
            .map((s) => s.setCode),
        ),
      ].sort(),
    [schedules, schoolYear, semester],
  );

  const visibleSchedules = useMemo(() => {
    if (!schedules) return [];
    return schedules
      .filter(
        (s) => s.setCode === setName && s.schoolYear === schoolYear && s.semester === semester,
      )
      .sort(
        (a, b) =>
          DAYS.indexOf(a.day) - DAYS.indexOf(b.day) || a.startTime.localeCompare(b.startTime),
      );
  }, [schedules, setName, schoolYear, semester]);

  // Keep the set selection valid when the year/semester filters change.
  useEffect(() => {
    if (setName && !availableSets.includes(setName)) {
      setSetName(availableSets[0] ?? "");
    }
  }, [availableSets, setName]);

  const isLoading = schedules === null;

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <PageHeader
        title="Regular Schedule Builder"
        description="Class schedules for the current academic term."
        actions={
          <Button type="button" block={false} onClick={() => navigate("/schedules/new")}>
            <PlusIcon />
            Create Schedule
          </Button>
        }
      />

      {/* Filters */}
      <div className="mt-4 flex flex-col gap-4">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          <Select
            id="rc-school-year"
            label="School Year"
            value={schoolYear}
            onChange={(e) => setSchoolYear(e.target.value)}
          >
            {isLoading ? (
              <option value="">Loading…</option>
            ) : schoolYears.length === 0 ? (
              <option value="">No school year</option>
            ) : (
              schoolYears.map((y) => (
                <option key={y} value={y}>{y}</option>
              ))
            )}
          </Select>
          <Select
            id="rc-semester"
            label="Semester"
            value={semester}
            onChange={(e) => setSemester(Number(e.target.value) as ScheduleSemester)}
          >
            {semestersLoading ? (
              <option value="">Loading…</option>
            ) : semesters.length === 0 ? (
              <option value="">No semester</option>
            ) : (
              semesters.filter((s) => s.semesterNumber !== 3).map((s) => (
                <option key={s.id} value={s.semesterNumber}>{semesterLabel(s.semesterNumber)}</option>
              ))
            )}
          </Select>
          <Select
            id="rc-set"
            label="Set"
            value={setName}
            onChange={(e) => setSetName(e.target.value)}
          >
            {isLoading ? (
              <option value="">Loading…</option>
            ) : availableSets.length === 0 ? (
              <option value="">No set</option>
            ) : (
              availableSets.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))
            )}
          </Select>
        </div>
      </div>

      {/* View toggle + print */}
      <div className="mt-4 grid items-center gap-3 sm:grid-cols-[1fr_auto_1fr]">
        <div className="hidden sm:block" />
        <div className="flex justify-center">
          <ScheduleViewToggle value={viewMode} onChange={setViewMode} />
        </div>
        <div className="flex justify-end">
          <Button type="button" variant="outline" block={false} onClick={() => window.print()}>
            <PrinterIcon />
            Print
          </Button>
        </div>
      </div>

      <div className="mt-4">
        {loadError ? (
          <ResultState tone="error" title="Unable to load">
            {loadError}
          </ResultState>
        ) : isLoading ? (
          <div
            role="status"
            aria-label="Loading schedules"
            className="grid place-items-center py-12 text-navy-700 dark:text-slate-200"
          >
            <Spinner />
          </div>
        ) : visibleSchedules.length === 0 ? (
          <EmptyState title="No schedules found">
            No schedules match the current filters. Create a schedule to get started.
          </EmptyState>
        ) : viewMode === "grid" ? (
          <ScheduleGrid schedules={visibleSchedules} />
        ) : (
          <ScheduleTable schedules={visibleSchedules} />
        )}
      </div>
    </div>
  );
}
