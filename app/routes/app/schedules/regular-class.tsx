import { AnimatePresence } from "motion/react";
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router";
import { RoleGuard } from "~/auth/role-guard";
import { Alert, AlertDescription } from "~/components/ui/alert";
import { Button } from "~/components/ui/button";
import { Card } from "~/components/ui/card";
import { EmptyState } from "~/components/feedback/empty-state";
import { AlertIcon, PlusIcon, PrinterIcon } from "~/components/ui/icons";
import { FieldChrome } from "~/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "~/components/ui/select";
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
        <Card className="grid grid-cols-2 gap-3 p-4 sm:grid-cols-3">
          <FieldChrome id="rc-school-year" label="School Year">
            <Select
              items={
                isLoading
                  ? [{ value: "", label: "Loading…" }]
                  : schoolYears.length === 0
                    ? [{ value: "", label: "No school year" }]
                    : schoolYears.map((y) => ({ value: y, label: y }))
              }
              value={schoolYear}
              onValueChange={(v) => setSchoolYear(v as string)}
            >
              <SelectTrigger id="rc-school-year">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {isLoading ? (
                  <SelectItem value="">Loading…</SelectItem>
                ) : schoolYears.length === 0 ? (
                  <SelectItem value="">No school year</SelectItem>
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
          <FieldChrome id="rc-semester" label="Semester">
            <Select
              items={
                semestersLoading
                  ? [{ value: "", label: "Loading…" }]
                  : semesters.length === 0
                    ? [{ value: "", label: "No semester" }]
                    : semesters
                        .filter((s) => s.semesterNumber !== 3)
                        .map((s) => ({ value: String(s.semesterNumber), label: semesterLabel(s.semesterNumber) }))
              }
              value={String(semester)}
              onValueChange={(v) => setSemester(Number(v) as ScheduleSemester)}
            >
              <SelectTrigger id="rc-semester">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {semestersLoading ? (
                  <SelectItem value="">Loading…</SelectItem>
                ) : semesters.length === 0 ? (
                  <SelectItem value="">No semester</SelectItem>
                ) : (
                  semesters.filter((s) => s.semesterNumber !== 3).map((s) => (
                    <SelectItem key={s.id} value={String(s.semesterNumber)}>
                      {semesterLabel(s.semesterNumber)}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </FieldChrome>
          <FieldChrome id="rc-set" label="Set">
            <Select
              items={
                isLoading
                  ? [{ value: "", label: "Loading…" }]
                  : availableSets.length === 0
                    ? [{ value: "", label: "No set" }]
                    : availableSets.map((s) => ({ value: s, label: s }))
              }
              value={setName}
              onValueChange={(v) => setSetName(v as string)}
            >
              <SelectTrigger id="rc-set">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {isLoading ? (
                  <SelectItem value="">Loading…</SelectItem>
                ) : availableSets.length === 0 ? (
                  <SelectItem value="">No set</SelectItem>
                ) : (
                  availableSets.map((s) => (
                    <SelectItem key={s} value={s}>
                      {s}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </FieldChrome>
        </Card>
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
        <AnimatePresence>
          {loadError && (
            <Alert key="load-error" variant="destructive" className="mb-4">
              <AlertIcon />
              <AlertDescription>{loadError}</AlertDescription>
            </Alert>
          )}
        </AnimatePresence>

        {loadError ? null : isLoading ? (
          <div
            role="status"
            aria-label="Loading schedules"
            className="grid place-items-center py-12 text-navy-700 dark:text-slate-200"
          >
            <Spinner />
          </div>
        ) : visibleSchedules.length === 0 ? (
          <EmptyState
            title="No schedules found"
            action={
              <Button type="button" block={false} onClick={() => navigate("/schedules/new")}>
                <PlusIcon />
                Create Schedule
              </Button>
            }
          >
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
