import { AnimatePresence } from "motion/react";
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router";
import { toast } from "sonner";
import { RoleGuard } from "~/auth/role-guard";
import { EmptyState } from "~/components/feedback/empty-state";
import { Alert, AlertDescription } from "~/components/ui/alert";
import { Button } from "~/components/ui/button";
import { Card } from "~/components/ui/card";
import { AlertIcon, PlusIcon, PrinterIcon, RefreshCwIcon, TrashIcon } from "~/components/ui/icons";
import { FieldChrome } from "~/components/ui/input";
import { ConfirmDialog } from "~/components/ui/modal";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "~/components/ui/select";
import { Spinner } from "~/components/ui/spinner";
import { openSchedulePrint } from "~/features/schedules/print-schedule";
import { useTermContext } from "~/features/academic-terms/term-context-provider";
import { ScheduleGrid } from "~/features/schedules/schedule-grid";
import { ScheduleTable } from "~/features/schedules/schedule-table";
import {
  ScheduleViewToggle,
  type ScheduleViewMode,
} from "~/features/schedules/schedule-view-toggle";
import { useSemesters } from "~/hooks/use-semesters";
import { PageHeader } from "~/layouts/page-header";
import { scheduleService, type ScheduledSetOption } from "~/services/schedule.service";
import {
  DAYS,
  type Schedule,
  type ScheduleSemester,
} from "~/types/schedule";

export function meta() {
  return [
    { title: "Regular Class — GWC Class Scheduling" },
    { name: "description", content: "Assign subjects to time slots and manage class schedules." },
  ];
}

export default function RegularClassRoute() {
  return (
    <RoleGuard allow={["registrar"]}>
      <RegularClassPage />
    </RoleGuard>
  );
}

function RegularClassPage() {
  const navigate = useNavigate();
  const { semesters, semesterLabel, loading: semestersLoading } = useSemesters();
  const { context: termContext, selectTerm } = useTermContext();
  const [schedules, setSchedules] = useState<Schedule[] | null>(null);
  const [scheduledSets, setScheduledSets] = useState<ScheduledSetOption[]>([]);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [clearTarget, setClearTarget] = useState<ScheduledSetOption | null>(null);
  const [ledgerDriftCount, setLedgerDriftCount] = useState<number | null>(null);
  const [checkingLedgers, setCheckingLedgers] = useState(false);

  // Filters — pin the view to a single section's weekly schedule.
  const [schoolYear, setSchoolYear] = useState("");
  const [semester, setSemester] = useState<ScheduleSemester>(1);
  const [setName, setSetName] = useState("");

  const [viewMode, setViewMode] = useState<ScheduleViewMode>("table");

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

  useEffect(() => {
    scheduleService.getSetWithSchedules().then(setScheduledSets).catch(() => setScheduledSets([]));
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

  const selectedSchoolYearId = useMemo(
    () => termContext?.schoolYears.find((row) => row.schoolYear === schoolYear)?.id ?? null,
    [schoolYear, termContext],
  );

  const selectedScheduledSet = useMemo(
    () =>
      scheduledSets.find(
        (row) =>
          row.setCode === setName &&
          row.schoolYear === schoolYear &&
          row.semesterNumber === semester,
      ) ?? null,
    [scheduledSets, schoolYear, semester, setName],
  );

  useEffect(() => {
    if (!selectedSchoolYearId) return;
    if (
      termContext?.selection.syId === selectedSchoolYearId &&
      termContext.selection.semesterNumber === semester
    ) {
      return;
    }
    void selectTerm(selectedSchoolYearId, semester);
  }, [selectedSchoolYearId, semester, selectTerm, termContext]);

  // Keep the set selection valid when the year/semester filters change.
  useEffect(() => {
    if (setName && !availableSets.includes(setName)) {
      setSetName(availableSets[0] ?? "");
    }
  }, [availableSets, setName]);

  function selectedTermParams() {
    if (!selectedSchoolYearId) return null;
    const matchingSelection =
      termContext?.selection.syId === selectedSchoolYearId &&
      termContext.selection.semesterNumber === semester;
    return {
      syId: selectedSchoolYearId,
      semId: matchingSelection ? termContext.selection.semId ?? undefined : undefined,
      semesterNumber: semester,
    };
  }

  async function handleClearSchedule() {
    if (!clearTarget || !selectedSchoolYearId) return;
    const message = await scheduleService.removeSetSchedules(
      clearTarget.setId,
      selectedSchoolYearId,
      semester,
    );
    if (message) toast.success(message);
    setSchedules((current) =>
      current?.filter(
        (row) =>
          row.setCode !== clearTarget.setCode ||
          row.schoolYear !== schoolYear ||
          row.semester !== semester,
      ) ?? [],
    );
    setScheduledSets((current) =>
      current.filter(
        (row) =>
          row.setId !== clearTarget.setId ||
          row.schoolYear !== schoolYear ||
          row.semesterNumber !== semester,
      ),
    );
    setClearTarget(null);
  }

  async function handleCheckLedgers() {
    const params = selectedTermParams();
    if (!params) return;
    setActionError(null);
    setCheckingLedgers(true);
    try {
      const result = await scheduleService.reconcileInstructorLedgers(params);
      if (result.drift.length > 0) {
        setLedgerDriftCount(result.drift.length);
      } else if (result.message) {
        toast.success(result.message);
      }
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "");
    } finally {
      setCheckingLedgers(false);
    }
  }

  async function handleRepairLedgers() {
    const params = selectedTermParams();
    if (!params) return;
    const result = await scheduleService.reconcileInstructorLedgers(params, true);
    if (result.message) toast.success(result.message);
    setLedgerDriftCount(null);
  }

  const isLoading = schedules === null;
  // Filters only make sense once there's at least one schedule to show.
  const showContent = !loadError && !isLoading && (schedules?.length ?? 0) > 0;

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <PageHeader
        title="Regular Schedule Builder"
        description="Class schedules for the current academic term."
        actions={
          <div className="flex flex-wrap justify-end gap-2">
            {selectedScheduledSet && (
              <Button
                type="button"
                variant="outline"
                block={false}
                onClick={() => setClearTarget(selectedScheduledSet)}
              >
                <TrashIcon />
                Clear Schedule
              </Button>
            )}
            <Button
              type="button"
              variant="outline"
              block={false}
              disabled={!selectedSchoolYearId}
              isLoading={checkingLedgers}
              loadingLabel="Checking…"
              onClick={handleCheckLedgers}
            >
              <RefreshCwIcon />
              Check Ledgers
            </Button>
            <Button type="button" block={false} onClick={() => navigate("/schedules/new")}>
              <PlusIcon />
              Create Schedule
            </Button>
          </div>
        }
      />

      {/* Filters */}
      {showContent && (
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
              value={semestersLoading ? "" : String(semester)}
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
              items={[
                {
                  value: "",
                  label: isLoading ? "Loading…" : availableSets.length === 0 ? "No set" : "Select a set",
                },
                ...availableSets.map((s) => ({ value: s, label: s })),
              ]}
              value={setName}
              onValueChange={(v) => setSetName(v as string)}
            >
              <SelectTrigger id="rc-set">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">
                  {isLoading ? "Loading…" : availableSets.length === 0 ? "No set" : "Select a set"}
                </SelectItem>
                {availableSets.map((s) => (
                  <SelectItem key={s} value={s}>
                    {s}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FieldChrome>
        </Card>
        </div>
      )}

      {/* View toggle + print */}
      {showContent && (
        <div className="mt-4 grid items-center gap-3 sm:grid-cols-[1fr_auto_1fr]">
          <div className="hidden sm:block" />
          <div className="flex justify-center">
            <ScheduleViewToggle value={viewMode} onChange={setViewMode} />
          </div>
          <div className="flex justify-end">
            <Button
              type="button"
              variant="outline"
              block={false}
              disabled={visibleSchedules.length === 0}
              onClick={() =>
                openSchedulePrint(visibleSchedules, { schoolYear, semesterLabel: semesterLabel(semester) })
              }
            >
              <PrinterIcon />
              Print
            </Button>
          </div>
        </div>
      )}

      <div className="mt-4">
        <AnimatePresence>
          {actionError && (
            <Alert key="action-error" variant="destructive" className="mb-4">
              <AlertIcon />
              <AlertDescription>{actionError}</AlertDescription>
            </Alert>
          )}
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

      <ConfirmDialog
        open={clearTarget !== null}
        onClose={() => setClearTarget(null)}
        title="Clear set schedule"
        confirmLabel="Clear schedule"
        loadingLabel="Clearing…"
        confirmVariant="danger"
        onConfirm={handleClearSchedule}
      >
        Clear the complete {clearTarget?.setCode} schedule for S.Y. {schoolYear}, {semesterLabel(semester)}?
        Instructor and subject hour ledgers will be released with the saved sessions.
      </ConfirmDialog>

      <ConfirmDialog
        open={ledgerDriftCount !== null && ledgerDriftCount > 0}
        onClose={() => setLedgerDriftCount(null)}
        title="Repair instructor ledgers"
        confirmLabel="Repair ledgers"
        loadingLabel="Repairing…"
        onConfirm={handleRepairLedgers}
      >
        The read-only check found {ledgerDriftCount} ledger {ledgerDriftCount === 1 ? "discrepancy" : "discrepancies"}.
        Recalculate the counters from the saved schedule sessions?
      </ConfirmDialog>
    </div>
  );
}
