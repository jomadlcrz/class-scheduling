import { AnimatePresence } from "motion/react";
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router";
import { toast } from "sonner";
import { RoleGuard } from "~/auth/role-guard";
import { EmptyState } from "~/components/feedback/empty-state";
import { FormError } from "~/components/forms/form-error";
import { Alert, AlertDescription } from "~/components/ui/alert";
import { Button } from "~/components/ui/button";
import { Card } from "~/components/ui/card";
import { Checkbox } from "~/components/ui/checkbox";
import { AlertIcon, EyeIcon, PlusIcon, PrinterIcon, RotateIcon, SendIcon, TrashIcon } from "~/components/ui/icons";
import { FieldChrome } from "~/components/ui/input";
import { ConfirmDialog, Modal } from "~/components/ui/modal";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "~/components/ui/select";
import { Spinner } from "~/components/ui/spinner";
import { scheduleReleaseStatusLabel, scheduleReleaseStatusTone, StatusBadge } from "~/features/academic-terms/status-badges";
import { useTermContext } from "~/features/academic-terms/term-context-provider";
import { openSchedulePrint } from "~/features/schedules/print-schedule";
import { ScheduleGrid } from "~/features/schedules/schedule-grid";
import { SchedulePreviewModal } from "~/features/schedules/schedule-preview-modal";
import { ScheduleSubmitDialog } from "~/features/schedules/schedule-submit-dialog";
import { ScheduleTable } from "~/features/schedules/schedule-table";
import {
  ScheduleViewToggle,
  type ScheduleViewMode,
} from "~/features/schedules/schedule-view-toggle";
import { useScheduleReleases } from "~/hooks/use-schedule-releases";
import { useSemesters } from "~/hooks/use-semesters";
import { PageHeader } from "~/layouts/page-header";
import { timeToMinutes } from "~/lib/time";
import { enumService } from "~/services/enum.service";
import { scheduleReleaseService } from "~/services/schedule-release.service";
import {
  scheduleService,
  type ScheduledSetOption,
  type ScheduleRoomOption,
  type ScheduleYearLevelOption,
  type UnseatedIrregularStudent,
} from "~/services/schedule.service";
import {
  DAYS,
  formatTime,
  generateTimeSlots,
  parseTime12h,
  SCHEDULE_MODES,
  type Schedule,
  type ScheduleSemester,
} from "~/types/schedule";
import type { ScheduleRelease } from "~/types/schedule-release";
import type { YearLevel } from "~/types/subject";

const TIME_OPTIONS = generateTimeSlots().map(formatTime);

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
  const [unseatedStudents, setUnseatedStudents] = useState<UnseatedIrregularStudent[]>([]);
  const [rooms, setRooms] = useState<ScheduleRoomOption[]>([]);
  const [dayOptions, setDayOptions] = useState<{ id: number; name: string }[]>([]);
  const [editTarget, setEditTarget] = useState<Schedule | null>(null);
  const [editError, setEditError] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({
    dayName: "",
    startTime: "07:00",
    endTime: "08:00",
    roomId: "",
    mode: "F2F" as Schedule["mode"],
  });
  const [editSaving, setEditSaving] = useState(false);

  const [previewOpen, setPreviewOpen] = useState(false);
  const [submitTarget, setSubmitTarget] = useState<ScheduleRelease | null>(null);
  const [withdrawTarget, setWithdrawTarget] = useState<ScheduleRelease | null>(null);

  // Filters — pin the view to a single section's weekly schedule.
  // Same cascade as /schedules/new: school year → semester → program → year level → set.
  const [schoolYear, setSchoolYear] = useState("");
  const [semester, setSemester] = useState<ScheduleSemester>(1);
  const [selectedProgram, setSelectedProgram] = useState("");
  const [selectedYearLevel, setSelectedYearLevel] = useState<YearLevel | "">("");
  const [setName, setSetName] = useState("");

  // Year-level labels come from the schedule-scoped creation context (same source
  // /schedules/new uses), so the vocabulary matches the backend's own.
  const [yearLevels, setYearLevels] = useState<ScheduleYearLevelOption[]>([]);

  // Clear Schedule dialog: pick one or more sets (with "select all") to clear.
  const [selectedSetIds, setSelectedSetIds] = useState<Set<number>>(new Set());
  const [clearDialogOpen, setClearDialogOpen] = useState(false);
  const [clearing, setClearing] = useState(false);
  const [clearError, setClearError] = useState<string | null>(null);

  const [viewMode, setViewMode] = useState<ScheduleViewMode>("table");

  useEffect(() => {
    scheduleService
      .view()
      .then((result) => {
        setSchedules(result);
        // Default to the newest school year, then cascade program → year level → set.
        const years = [...new Set(result.map((s) => s.schoolYear))].sort((a, b) => b.localeCompare(a));
        const firstYear = years[0] ?? "";
        setSchoolYear(firstYear);
        const inTerm = result.filter((s) => s.schoolYear === firstYear && s.semester === 1);
        const firstProgram = [...new Set(inTerm.map((s) => s.program))].sort()[0] ?? "";
        setSelectedProgram(firstProgram);
        const inProgram = inTerm.filter((s) => s.program === firstProgram);
        const firstYearLevel = [...new Set(inProgram.map((s) => s.yearLevel))].sort((a, b) => a - b)[0];
        setSelectedYearLevel(firstYearLevel ?? "");
        const firstSet = inProgram.find((s) => s.yearLevel === firstYearLevel);
        setSetName(firstSet?.setCode ?? "");
      })
      .catch((err) => {
        setLoadError(err instanceof Error ? err.message : "Unable to load schedules.");
        setSchedules([]);
      });
  }, []);

  useEffect(() => {
    scheduleService.getSetWithSchedules().then(setScheduledSets).catch(() => setScheduledSets([]));
    scheduleService.listScheduleRooms().then(setRooms).catch(() => setRooms([]));
    scheduleService
      .getCreationContext()
      .then(({ yearLevels: options }) => setYearLevels(options))
      .catch(() => setYearLevels([]));
    enumService.getOptions().then((options) => setDayOptions(options.dayOfWeek)).catch(() => setDayOptions([]));
  }, []);

  const yearLevelLabel = useMemo(() => {
    const labels = new Map<number, string>();
    for (const option of yearLevels) labels.set(option.id, option.name);
    return (n: number) => labels.get(n) ?? `${n}th Year`;
  }, [yearLevels]);

  const schoolYears = useMemo(
    () => [...new Set((schedules ?? []).map((s) => s.schoolYear))].sort((a, b) => b.localeCompare(a)),
    [schedules],
  );

  const availablePrograms = useMemo(
    () =>
      [
        ...new Set(
          (schedules ?? [])
            .filter((s) => s.schoolYear === schoolYear && s.semester === semester)
            .map((s) => s.program),
        ),
      ].sort(),
    [schedules, schoolYear, semester],
  );

  const availableYearLevels = useMemo(
    () =>
      [
        ...new Set(
          (schedules ?? [])
            .filter(
              (s) =>
                s.schoolYear === schoolYear &&
                s.semester === semester &&
                s.program === selectedProgram,
            )
            .map((s) => s.yearLevel),
        ),
      ].sort((a, b) => a - b),
    [schedules, schoolYear, semester, selectedProgram],
  );

  const availableSets = useMemo(
    () =>
      [
        ...new Set(
          (schedules ?? [])
            .filter(
              (s) =>
                s.schoolYear === schoolYear &&
                s.semester === semester &&
                s.program === selectedProgram &&
                s.yearLevel === selectedYearLevel,
            )
            .map((s) => s.setCode),
        ),
      ].sort(),
    [schedules, schoolYear, semester, selectedProgram, selectedYearLevel],
  );

  const visibleSchedules = useMemo(() => {
    if (!schedules) return [];
    return schedules
      .filter(
        (s) =>
          s.setCode === setName &&
          s.schoolYear === schoolYear &&
          s.semester === semester &&
          s.program === selectedProgram &&
          s.yearLevel === selectedYearLevel,
      )
      .sort(
        (a, b) =>
          DAYS.indexOf(a.day) - DAYS.indexOf(b.day) || a.startTime.localeCompare(b.startTime),
      );
  }, [schedules, setName, schoolYear, semester, selectedProgram, selectedYearLevel]);

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

  const { releases, refresh: refreshReleases } = useScheduleReleases(selectedSchoolYearId, semester);

  const selectedRelease = useMemo(
    () => releases.find((row) => row.setId === selectedScheduledSet?.setId) ?? null,
    [releases, selectedScheduledSet],
  );

  // Sets matching the current program + year level, for the bulk-clear panel.
  const bulkSets = useMemo(
    () =>
      releases
        .filter(
          (row) =>
            row.programAbbrev === selectedProgram && row.yearLevel === selectedYearLevel,
        )
        .sort((a, b) => (a.setCode ?? "").localeCompare(b.setCode ?? "")),
    [releases, selectedProgram, selectedYearLevel],
  );

  // Drop any selections that no longer match the visible set list.
  useEffect(() => {
    setSelectedSetIds((prev) => {
      const valid = new Set(bulkSets.map((row) => row.setId));
      const next = new Set([...prev].filter((id) => valid.has(id)));
      return next.size === prev.size ? prev : next;
    });
  }, [bulkSets]);

  const allBulkSelected = bulkSets.length > 0 && bulkSets.every((row) => selectedSetIds.has(row.setId));

  // Closed terms reject writes on the backend — disable the actions and explain why.
  const termClosed = termContext?.term?.status === "Closed";
  const termClosureReason = termContext?.term?.closedReasonLabel ?? null;
  const termClosedNote = termClosureReason
    ? `This term is closed — ${termClosureReason}.`
    : "This term is closed.";

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

  // Keep the cascading selection valid as upstream filters change (program → year → set).
  useEffect(() => {
    if (selectedProgram && !availablePrograms.includes(selectedProgram)) {
      setSelectedProgram(availablePrograms[0] ?? "");
    }
  }, [availablePrograms, selectedProgram]);

  useEffect(() => {
    if (selectedYearLevel !== "" && !availableYearLevels.includes(selectedYearLevel)) {
      setSelectedYearLevel(availableYearLevels[0] ?? "");
    }
  }, [availableYearLevels, selectedYearLevel]);

  useEffect(() => {
    if (setName && !availableSets.includes(setName)) {
      setSetName(availableSets[0] ?? "");
    }
  }, [availableSets, setName]);

  // Changing program re-seats year level and set to the first available option.
  function handleProgramChange(program: string) {
    setSelectedProgram(program);
    const inProgram = (schedules ?? []).filter(
      (s) => s.schoolYear === schoolYear && s.semester === semester && s.program === program,
    );
    const firstYearLevel = [...new Set(inProgram.map((s) => s.yearLevel))].sort((a, b) => a - b)[0];
    setSelectedYearLevel(firstYearLevel ?? "");
    setSetName(firstYearLevel == null ? "" : inProgram.find((s) => s.yearLevel === firstYearLevel)?.setCode ?? "");
  }

  function handleYearLevelChange(yearLevel: YearLevel | "") {
    setSelectedYearLevel(yearLevel);
    setSetName(
      yearLevel === ""
        ? ""
        : (schedules ?? []).find(
            (s) =>
              s.schoolYear === schoolYear &&
              s.semester === semester &&
              s.program === selectedProgram &&
              s.yearLevel === yearLevel,
          )?.setCode ?? "",
    );
  }

  // Open the Clear Schedule dialog, defaulting the selection to the viewed set.
  function openClearDialog() {
    setSelectedSetIds(
      selectedScheduledSet ? new Set([selectedScheduledSet.setId]) : new Set(),
    );
    setClearError(null);
    setClearDialogOpen(true);
  }

  // Clear every selected set, one call each; keep going if one fails.
  async function handleClearSelected() {
    if (!selectedSchoolYearId || selectedSetIds.size === 0 || termClosed) return;
    setClearing(true);
    setClearError(null);
    const targets = bulkSets.filter((row) => selectedSetIds.has(row.setId));
    const unseated: UnseatedIrregularStudent[] = [];
    const clearedSetCodes = new Set<string>();
    const clearedSetIds = new Set<number>();
    const failed: string[] = [];
    for (const target of targets) {
      try {
        const result = await scheduleService.removeSetSchedules(
          target.setId,
          selectedSchoolYearId,
          semester,
        );
        unseated.push(...result.irregularStudentsUnseated);
        if (target.setCode) clearedSetCodes.add(target.setCode);
        clearedSetIds.add(target.setId);
      } catch {
        failed.push(target.setCode ?? `Set ${target.setId}`);
      }
    }
    if (clearedSetCodes.size > 0) {
      setSchedules((current) =>
        current?.filter(
          (row) =>
            !(
              row.schoolYear === schoolYear &&
              row.semester === semester &&
              row.program === selectedProgram &&
              row.yearLevel === selectedYearLevel &&
              clearedSetCodes.has(row.setCode)
            ),
        ) ?? [],
      );
      setScheduledSets((current) => current.filter((row) => !clearedSetIds.has(row.setId)));
    }
    await refreshReleases();
    if (unseated.length > 0) setUnseatedStudents(unseated);
    setClearing(false);
    if (failed.length > 0) {
      // Keep the dialog open; the prune effect drops the cleared sets, leaving the failures selected to retry.
      setClearError(
        `Could not clear ${failed.length} set${failed.length === 1 ? "" : "s"}: ${failed.join(", ")}.`,
      );
    } else {
      setSelectedSetIds(new Set());
      setClearDialogOpen(false);
    }
  }

  function toggleSelectAll() {
    setSelectedSetIds(allBulkSelected ? new Set() : new Set(bulkSets.map((row) => row.setId)));
  }

  function toggleSet(setId: number) {
    setSelectedSetIds((prev) => {
      const next = new Set(prev);
      if (next.has(setId)) next.delete(setId);
      else next.add(setId);
      return next;
    });
  }

  async function handleSubmitRelease() {
    if (!submitTarget || termClosed) return;
    try {
      const { message } = await scheduleReleaseService.submitRelease(submitTarget.id);
      if (message) toast.success(message);
      await refreshReleases();
      setSubmitTarget(null);
    } catch (err) {
      throw err instanceof Error ? err : new Error("Unable to submit the schedule.");
    }
  }

  async function handleWithdrawRelease() {
    if (!withdrawTarget || termClosed) return;
    try {
      const { message } = await scheduleReleaseService.withdrawRelease(withdrawTarget.id);
      if (message) toast.success(message);
      await refreshReleases();
      setWithdrawTarget(null);
    } catch (err) {
      throw err instanceof Error ? err : new Error("Unable to withdraw the submission.");
    }
  }

  function openEdit(schedule: Schedule) {
    setEditTarget(schedule);
    setEditForm({
      dayName: dayOptions.find((option) => DAYS[option.id] === schedule.day)?.name ?? "",
      startTime: formatTime(schedule.startTime),
      endTime: formatTime(schedule.endTime),
      roomId: schedule.roomId,
      mode: schedule.mode,
    });
    setActionError(null);
    setEditError(null);
  }

  async function handleEditSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!editTarget || termClosed) return;
    setEditSaving(true);
    setActionError(null);
    setEditError(null);
    try {
      const message = await scheduleService.updateRegular(Number(editTarget.id), {
        dayOfWeek: editForm.dayName,
        startTime: formatTime(editForm.startTime),
        endTime: formatTime(editForm.endTime),
        roomId: editForm.roomId ? Number(editForm.roomId) : null,
        mode: editForm.mode,
      });
      if (message) toast.success(message);
      setSchedules((current) =>
        current?.map((row) =>
          row.id === editTarget.id
            ? {
                ...row,
                day: DAYS[dayOptions.find((option) => option.name === editForm.dayName)?.id ?? 0],
                startTime: parseTime12h(editForm.startTime),
                endTime: parseTime12h(editForm.endTime),
                roomId: editForm.roomId,
                roomName: rooms.find((room) => String(room.id) === editForm.roomId)?.roomName ?? row.roomName,
                mode: editForm.mode,
              }
            : row,
        ) ?? [],
      );
      setEditTarget(null);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unable to update schedule.";
      setEditError(message);
    } finally {
      setEditSaving(false);
    }
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
            {selectedRelease && (
              <Button type="button" variant="outline" block={false} onClick={() => setPreviewOpen(true)}>
                <EyeIcon />
                Preview
              </Button>
            )}
            {selectedRelease &&
              (selectedRelease.releaseStatus === "draft" || selectedRelease.releaseStatus === "rejected") && (
                <Button
                  type="button"
                  variant="outline"
                  block={false}
                  disabled={termClosed}
                  onClick={() => setSubmitTarget(selectedRelease)}
                >
                  <SendIcon />
                  Submit for Approval
                </Button>
              )}
            {selectedRelease && selectedRelease.releaseStatus === "pending_approval" && (
              <Button
                type="button"
                variant="outline"
                block={false}
                disabled={termClosed}
                onClick={() => setWithdrawTarget(selectedRelease)}
              >
                <RotateIcon />
                Withdraw
              </Button>
            )}
            {bulkSets.length > 0 && (
              <Button
                type="button"
                variant="outline"
                block={false}
                disabled={termClosed}
                onClick={openClearDialog}
              >
                <TrashIcon />
                Clear Schedule
              </Button>
            )}
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
          <Card className="grid grid-cols-2 gap-3 p-4 sm:grid-cols-3 lg:grid-cols-5">
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
          <FieldChrome id="rc-program" label="Program">
            <Select
              items={[
                {
                  value: "",
                  label: isLoading
                    ? "Loading…"
                    : availablePrograms.length === 0
                      ? "No program"
                      : "Select a program",
                },
                ...availablePrograms.map((p) => ({ value: p, label: p })),
              ]}
              value={selectedProgram}
              onValueChange={(v) => handleProgramChange(v as string)}
            >
              <SelectTrigger id="rc-program">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">
                  {isLoading
                    ? "Loading…"
                    : availablePrograms.length === 0
                      ? "No program"
                      : "Select a program"}
                </SelectItem>
                {availablePrograms.map((p) => (
                  <SelectItem key={p} value={p}>
                    {p}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FieldChrome>
          <FieldChrome id="rc-year-level" label="Year Level">
            <Select
              items={[
                {
                  value: "",
                  label: !selectedProgram
                    ? "Select a program first"
                    : availableYearLevels.length === 0
                      ? "No year level"
                      : "Select a year level",
                },
                ...availableYearLevels.map((yl) => ({ value: String(yl), label: yearLevelLabel(yl) })),
              ]}
              value={selectedYearLevel === "" ? "" : String(selectedYearLevel)}
              onValueChange={(v) => handleYearLevelChange(v === "" ? "" : (Number(v) as YearLevel))}
            >
              <SelectTrigger id="rc-year-level">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">
                  {!selectedProgram
                    ? "Select a program first"
                    : availableYearLevels.length === 0
                      ? "No year level"
                      : "Select a year level"}
                </SelectItem>
                {availableYearLevels.map((yl) => (
                  <SelectItem key={yl} value={String(yl)}>
                    {yearLevelLabel(yl)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FieldChrome>
          <FieldChrome id="rc-set" label="Set">
            <Select
              items={[
                {
                  value: "",
                  label: isLoading
                    ? "Loading…"
                    : !selectedYearLevel
                      ? "Select a year level first"
                      : availableSets.length === 0
                        ? "No set"
                        : "Select a set",
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
                  {isLoading
                    ? "Loading…"
                    : !selectedYearLevel
                      ? "Select a year level first"
                      : availableSets.length === 0
                        ? "No set"
                        : "Select a set"}
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

          {termClosed && (
            <p className="font-body text-xs text-amber-700 dark:text-amber-400">
              {termClosedNote} Submissions, edits, and deletions are disabled for this term.
            </p>
          )}

          {selectedRelease && (
            <div className="flex flex-wrap items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 dark:border-white/10 dark:bg-white/5">
              <StatusBadge tone={scheduleReleaseStatusTone(selectedRelease.releaseStatus)}>
                {scheduleReleaseStatusLabel(selectedRelease.releaseStatus)}
              </StatusBadge>
              <span className="font-body text-sm text-slate-600 dark:text-slate-300">
                {selectedRelease.sessionCount} session{selectedRelease.sessionCount === 1 ? "" : "s"} saved
              </span>
              {selectedRelease.releaseStatus === "pending_approval" && selectedRelease.submittedBy && (
                <span className="font-body text-xs text-slate-500 dark:text-slate-400">
                  Submitted by {selectedRelease.submittedBy.name ?? "—"}
                </span>
              )}
            </div>
          )}
          {selectedRelease?.releaseStatus === "rejected" && selectedRelease.rejectionReason && (
            <Alert variant="destructive">
              <AlertIcon />
              <AlertDescription>
                Rejected: {selectedRelease.rejectionReason}
                {selectedRelease.reviewedAt ? ` · ${selectedRelease.reviewedAt}` : ""}
              </AlertDescription>
            </Alert>
          )}
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
          <ScheduleGrid schedules={visibleSchedules} onEdit={openEdit} />
        ) : (
          <ScheduleTable schedules={visibleSchedules} onEdit={openEdit} />
        )}
      </div>

      <Modal
        open={editTarget !== null}
        onClose={() => {
          if (!editSaving) setEditTarget(null);
        }}
        title={`Edit ${editTarget?.subjectCode ?? "schedule"}`}
      >
        <form className="flex flex-col gap-4" onSubmit={handleEditSubmit}>
          <FormError message={editError} />
          {selectedRelease?.releaseStatus === "approved" && (
            <Alert variant="warning">
              <AlertIcon />
              <AlertDescription>
                Saving will unpublish this schedule. Students and instructors will lose access until the
                dean approves it again.
              </AlertDescription>
            </Alert>
          )}
          {termClosed && (
            <Alert variant="warning">
              <AlertIcon />
              <AlertDescription>{termClosedNote} You cannot save changes.</AlertDescription>
            </Alert>
          )}
          <p className="font-body text-sm text-slate-600 dark:text-slate-300">
            Update the saved class placement. The backend will validate conflicts and room rules.
          </p>
          <div className="grid gap-4 sm:grid-cols-2">
            <FieldChrome id="edit-day" label="Day">
              <Select
                items={dayOptions.map((option) => ({ value: option.name, label: option.name }))}
                value={editForm.dayName}
                onValueChange={(value) => setEditForm((current) => ({ ...current, dayName: value as string }))}
              >
                <SelectTrigger id="edit-day"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {dayOptions.map((option) => (
                    <SelectItem key={option.id} value={option.name}>{option.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FieldChrome>
            <FieldChrome id="edit-mode" label="Mode">
              <Select
                items={SCHEDULE_MODES.map((mode) => ({ value: mode, label: mode }))}
                value={editForm.mode}
                onValueChange={(value) => setEditForm((current) => ({ ...current, mode: value as Schedule["mode"] }))}
              >
                <SelectTrigger id="edit-mode"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {SCHEDULE_MODES.map((mode) => <SelectItem key={mode} value={mode}>{mode}</SelectItem>)}
                </SelectContent>
              </Select>
            </FieldChrome>
            <FieldChrome id="edit-start-time" label="Start time">
              <Select
                items={TIME_OPTIONS.map((time) => ({ value: time, label: time }))}
                value={editForm.startTime}
                onValueChange={(value) => setEditForm((current) => ({ ...current, startTime: value as string }))}
              >
                <SelectTrigger id="edit-start-time"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {TIME_OPTIONS.map((time) => <SelectItem key={time} value={time}>{time}</SelectItem>)}
                </SelectContent>
              </Select>
            </FieldChrome>
            <FieldChrome id="edit-end-time" label="End time">
              <Select
                items={TIME_OPTIONS.filter((time) => timeToMinutes(time) > timeToMinutes(editForm.startTime)).map((time) => ({ value: time, label: time }))}
                value={editForm.endTime}
                onValueChange={(value) => setEditForm((current) => ({ ...current, endTime: value as string }))}
              >
                <SelectTrigger id="edit-end-time"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {TIME_OPTIONS.filter((time) => timeToMinutes(time) > timeToMinutes(editForm.startTime)).map((time) => (
                    <SelectItem key={time} value={time}>{time}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FieldChrome>
          </div>
          <FieldChrome id="edit-room" label="Room">
            <Select
              items={rooms.map((room) => ({ value: String(room.id), label: `${room.roomName} (${room.buildingName})` }))}
              value={editForm.roomId}
              onValueChange={(value) => setEditForm((current) => ({ ...current, roomId: value as string }))}
            >
              <SelectTrigger id="edit-room"><SelectValue placeholder="Select a room" /></SelectTrigger>
              <SelectContent>
                {rooms.map((room) => (
                  <SelectItem key={room.id} value={String(room.id)}>{room.roomName} ({room.buildingName})</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FieldChrome>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" block={false} disabled={editSaving} onClick={() => setEditTarget(null)}>
              Cancel
            </Button>
            <Button
              type="submit"
              block={false}
              disabled={termClosed}
              isLoading={editSaving}
              loadingLabel="Saving…"
            >
              Save changes
            </Button>
          </div>
        </form>
      </Modal>

      <Modal
        open={clearDialogOpen}
        onClose={() => {
          if (!clearing) setClearDialogOpen(false);
        }}
        title="Clear set schedule"
      >
        <div className="flex flex-col gap-4">
          <FormError message={clearError} />
          <p className="font-body text-sm text-slate-600 dark:text-slate-300">
            Select the sets to clear for S.Y. {schoolYear}, {semesterLabel(semester)}. Instructor and
            subject hour ledgers will be released, and any irregular students seated in these sets will be
            unseated.
          </p>
          <div className="overflow-hidden rounded-xl border border-slate-300 dark:border-white/10">
            <div className="flex items-center gap-3 border-b border-slate-200 px-3 py-2.5 dark:border-white/10">
              <Checkbox
                id="rc-clear-select-all"
                ariaLabel="Select all sets"
                hideLabel
                checked={allBulkSelected}
                onChange={toggleSelectAll}
              />
              <span className="font-body text-sm font-medium text-navy-700 dark:text-mist-100">
                {selectedSetIds.size > 0
                  ? `${selectedSetIds.size} of ${bulkSets.length} selected`
                  : "Select all"}
              </span>
            </div>
            <ul className="scrollbar-thin max-h-64 divide-y divide-slate-200 overflow-y-auto dark:divide-white/10">
              {bulkSets.map((row) => (
                <li key={row.setId} className="flex items-center gap-3 px-3 py-2">
                  <Checkbox
                    id={`rc-clear-${row.setId}`}
                    ariaLabel={`Select ${row.setCode ?? "set"}`}
                    hideLabel
                    checked={selectedSetIds.has(row.setId)}
                    onChange={() => toggleSet(row.setId)}
                  />
                  <span className="font-body text-sm font-semibold text-navy-700 dark:text-mist-100">
                    {row.setCode}
                  </span>
                  <StatusBadge tone={scheduleReleaseStatusTone(row.releaseStatus)}>
                    {scheduleReleaseStatusLabel(row.releaseStatus)}
                  </StatusBadge>
                  <span className="ml-auto font-body text-xs text-slate-500 dark:text-slate-400">
                    {row.sessionCount} session{row.sessionCount === 1 ? "" : "s"}
                  </span>
                </li>
              ))}
            </ul>
          </div>
          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              block={false}
              disabled={clearing}
              onClick={() => setClearDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="danger"
              block={false}
              disabled={termClosed || selectedSetIds.size === 0}
              isLoading={clearing}
              loadingLabel="Clearing…"
              onClick={handleClearSelected}
            >
              Clear{" "}
              {selectedSetIds.size > 0
                ? `${selectedSetIds.size} set${selectedSetIds.size === 1 ? "" : "s"}`
                : "schedule"}
            </Button>
          </div>
        </div>
      </Modal>

      <Modal
        open={unseatedStudents.length > 0}
        onClose={() => setUnseatedStudents([])}
        title="Irregular students unseated"
      >
        <div className="flex flex-col gap-4">
          <p className="font-body text-sm leading-relaxed text-slate-600 dark:text-slate-300">
            Clearing the set removed these students from borrowed class offerings. They now need to be seated again.
          </p>
          <ul className="divide-y divide-slate-200 rounded-lg border border-slate-200 dark:divide-white/10 dark:border-white/10">
            {unseatedStudents.map((student) => (
              <li key={student.studentProfileId} className="px-3 py-2 font-body text-sm">
                <span className="font-medium text-navy-700 dark:text-mist-100">{student.name}</span>
                {student.studentId && (
                  <span className="ml-2 text-slate-500 dark:text-slate-400">{student.studentId}</span>
                )}
              </li>
            ))}
          </ul>
          <div className="flex justify-end">
            <Button type="button" block={false} onClick={() => setUnseatedStudents([])}>
              Close
            </Button>
          </div>
        </div>
      </Modal>

      <SchedulePreviewModal
        open={previewOpen}
        releaseId={selectedRelease?.id ?? null}
        fetchPreview={scheduleReleaseService.getReleasePreview}
        onClose={() => setPreviewOpen(false)}
      />

      <ScheduleSubmitDialog
        open={submitTarget !== null}
        release={submitTarget}
        onClose={() => setSubmitTarget(null)}
        onConfirm={handleSubmitRelease}
      />

      <ConfirmDialog
        open={withdrawTarget !== null}
        onClose={() => setWithdrawTarget(null)}
        title="Withdraw submission"
        confirmLabel="Withdraw"
        loadingLabel="Withdrawing…"
        onConfirm={handleWithdrawRelease}
      >
        Withdraw {withdrawTarget?.programAbbrev} {withdrawTarget?.setCode} from dean review and return it to
        draft? You can edit and resubmit it afterward.
      </ConfirmDialog>
    </div>
  );
}
