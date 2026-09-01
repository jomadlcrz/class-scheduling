import { AnimatePresence } from "motion/react";
import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router";
import { toast } from "sonner";
import { RoleGuard } from "~/auth/role-guard";
import { DataLoadAlert } from "~/components/feedback/data-load-alert";
import { Alert, AlertDescription } from "~/components/ui/alert";
import { Breadcrumb } from "~/components/ui/breadcrumb";
import { Button } from "~/components/ui/button";
import { AlertIcon, PlusIcon } from "~/components/ui/icons";
import { ConfirmDialog, Modal } from "~/components/ui/modal";
import { ScheduleSkeleton } from "~/components/ui/skeleton";
import { TabButtons } from "~/components/ui/underline-tabs";
import { useTermContext } from "~/features/academic-terms/term-context-provider";
import { DepartmentBlockAlert } from "~/features/schedules/department-block-alert";
import {
  MasterSchedulesFlatList,
  type ProgramFlatData,
} from "~/features/schedules/master-schedules-flat-list";
import { MasterSchedulesTermBar } from "~/features/schedules/master-schedules-term-bar";
import { ScheduleClearDialog } from "~/features/schedules/schedule-clear-dialog";
import { ScheduleEditDialog } from "~/features/schedules/schedule-edit-dialog";
import { ScheduleSubmitDialog } from "~/features/schedules/schedule-submit-dialog";
import type { ScheduleViewMode } from "~/features/schedules/schedule-view-toggle";
import { useCachedData } from "~/hooks/use-cached-data";
import { useScheduleReleases } from "~/hooks/use-schedule-releases";
import { useSemesters } from "~/hooks/use-semesters";
import { PageHeader } from "~/layouts/page-header";
import { ApiError } from "~/lib/api";
import { departmentService } from "~/services/department.service";
import { enumService } from "~/services/enum.service";
import { facilityService } from "~/services/facility.service";
import { programService } from "~/services/program.service";
import {
  scheduleService,
  type UnseatedIrregularStudent,
} from "~/services/schedule.service";
import { termPhaseService } from "~/services/term-phase.service";
import {
  DAYS,
  formatTime,
  generateTimeSlots,
  parseTime12h,
  type Schedule,
  type ScheduleSemester,
} from "~/types/schedule";
import type { ScheduleRelease } from "~/types/schedule-release";
import type { TermDepartmentEntry } from "~/types/term-scheduling";

const TIME_OPTIONS = generateTimeSlots().map(formatTime);

type DepartmentBlock = {
  reason: string;
  department: TermDepartmentEntry;
};

function departmentBlockFromError(err: unknown): DepartmentBlock | null {
  if (!(err instanceof ApiError) || !err.details) return null;
  const reason = err.details.reason;
  const department = err.details.department;
  if (typeof reason !== "string" || !department || typeof department !== "object") return null;
  return { reason, department: department as TermDepartmentEntry };
}

export function meta() {
  return [
    { title: "Master Schedules — GWC Class Scheduling" },
    { name: "description", content: "Assign subjects to time slots and manage master class schedules." },
  ];
}

export default function RegularClassRoute() {
  return (
    <RoleGuard allow={["registrar"]}>
      <MasterSchedulesPage />
    </RoleGuard>
  );
}

function MasterSchedulesPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const prefillAppliedRef = useRef(false);

  const { semesters, semesterLabel, loading: semestersLoading } = useSemesters();
  const { context: termContext, selectTerm } = useTermContext();

  const { data: schedules, error: loadError, setData: setSchedules } = useCachedData(
    "regular-class-schedules",
    () => scheduleService.view(),
  );

  const { data: scheduledSetsData, setData: setScheduledSetsData } = useCachedData(
    "scheduled-sets",
    () => scheduleService.getSetWithSchedules(),
  );
  const scheduledSets = scheduledSetsData ?? [];

  const { data: roomsData } = useCachedData("schedule-rooms", () =>
    scheduleService.listScheduleRooms(),
  );
  const rooms = roomsData ?? [];

  const { data: enumOptions } = useCachedData("enums", () => enumService.getOptions());
  const dayOptions = enumOptions?.dayOfWeek ?? [];
  const sessionModes = enumOptions?.sessionMode ?? [];

  const { data: facilitiesData } = useCachedData("facilities", () => facilityService.list());
  const sessionModeByRoomId = useMemo(() => {
    const backendValue = (code: "LEC" | "LAB") =>
      sessionModes.find((value) => value.toUpperCase() === code) ?? code;
    const values = new Map<string, string>();
    for (const building of facilitiesData ?? []) {
      for (const room of building.rooms) {
        values.set(String(room.id), backendValue(room.type === "Laboratory" ? "LAB" : "LEC"));
      }
    }
    return values;
  }, [facilitiesData, sessionModes]);

  const schedulesForDisplay = useMemo(
    () => (schedules ?? []).map((schedule) => ({
      ...schedule,
      sessionMode: sessionModeByRoomId.get(schedule.roomId),
    })),
    [schedules, sessionModeByRoomId],
  );

  const { data: creationContext } = useCachedData("schedule-creation-context", () =>
    scheduleService.getCreationContext(),
  );
  const yearLevels = useMemo(() => creationContext?.yearLevels ?? [], [creationContext]);

  const { data: programsData } = useCachedData("programs", () => programService.list());
  const programs = programsData ?? [];

  const { data: departmentsData } = useCachedData("academic-departments", () =>
    departmentService.listAcademic(),
  );
  const departments = useMemo(
    () => (departmentsData ?? []).filter((d) => d.departmentType !== "Administrative"),
    [departmentsData],
  );

  // Active Term state (School Year & Semester)
  const [schoolYear, setSchoolYear] = useState<string>(() => {
    if (termContext?.selection.syId) {
      const activeSy = termContext.schoolYears.find((row) => row.id === termContext.selection.syId)?.schoolYear;
      if (activeSy) return activeSy;
    }
    return "";
  });
  const [semester, setSemester] = useState<ScheduleSemester>(() => {
    return (termContext?.selection.semesterNumber as ScheduleSemester) || 1;
  });

  // Selected Department Underline Tab ("ALL" or department abbrev e.g. "CCS")
  const [selectedDepartment, setSelectedDepartment] = useState("ALL");

  // Global Schedule View Mode (Table vs Grid)
  const [globalViewMode, setGlobalViewMode] = useState<ScheduleViewMode>("table");

  // Action / Mutation Dialogs
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionBlock, setActionBlock] = useState<{
    reason: string;
    department: TermDepartmentEntry;
  } | null>(null);
  const [unseatedStudents, setUnseatedStudents] = useState<UnseatedIrregularStudent[]>([]);
  const [clearDialogOpen, setClearDialogOpen] = useState(false);
  const [clearTargetSetId, setClearTargetSetId] = useState<number | null>(null);
  const [clearTargetSetIds, setClearTargetSetIds] = useState<number[]>([]);
  const [submitTarget, setSubmitTarget] = useState<ScheduleRelease | null>(null);
  const [withdrawTarget, setWithdrawTarget] = useState<ScheduleRelease | null>(null);

  // Edit schedule state
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

  // Helper map: program abbrev -> Program object
  const programMap = useMemo(() => {
    const map = new Map<string, (typeof programs)[number]>();
    for (const prog of programs) map.set(prog.abbrev, prog);
    return map;
  }, [programs]);

  // Year level label resolver
  const yearLevelLabel = useMemo(() => {
    const labels = new Map<number, string>();
    for (const option of yearLevels) labels.set(option.id, option.name);
    return (n: number) => labels.get(n) ?? `${n}th Year`;
  }, [yearLevels]);

  // Department tabs list for UnderlineTabs
  const departmentTabs = useMemo(() => {
    const tabs = [{ value: "ALL", label: "All Departments" }];
    for (const dept of departments) {
      tabs.push({ value: dept.abbrev, label: dept.abbrev });
    }
    return tabs;
  }, [departments]);

  // School years present in loaded schedules or term context
  const schoolYears = useMemo(() => {
    const fromSchedules = (schedules ?? []).map((s) => s.schoolYear);
    const fromContext = (termContext?.schoolYears ?? []).map((y) => y.schoolYear);
    return [...new Set([...fromSchedules, ...fromContext])].filter(Boolean).sort((a, b) => b.localeCompare(a));
  }, [schedules, termContext]);

  // Seed active term if not initialized yet
  useEffect(() => {
    if (schoolYear) return;
    if (termContext?.selection.syId) {
      const activeSy = termContext.schoolYears.find((row) => row.id === termContext.selection.syId)?.schoolYear;
      if (activeSy) {
        setSchoolYear(activeSy);
        setSemester(termContext.selection.semesterNumber as ScheduleSemester);
        return;
      }
    }
    if (schoolYears.length > 0) {
      setSchoolYear(schoolYears[0]);
    }
  }, [schoolYear, schoolYears, termContext]);

  // Resolved schoolYearId for releases
  const selectedSchoolYearId = useMemo(
    () => termContext?.schoolYears.find((row) => row.schoolYear === schoolYear)?.id ?? null,
    [schoolYear, termContext],
  );

  // Synchronize termContext when schoolYear/semester changes
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

  const { releases, refresh: refreshReleases } = useScheduleReleases(selectedSchoolYearId, semester);

  // Closed term checks
  const termClosed = termContext?.term?.status === "Closed";
  const termClosureReason = termContext?.term?.closedReasonLabel ?? null;
  const termClosedNote = termClosureReason
    ? `This term is closed — ${termClosureReason}.`
    : "This term is closed.";

  // Deep-link prefill handling (?sy&sem&program&yl&set)
  useEffect(() => {
    if (prefillAppliedRef.current || !schedules || schedules.length === 0) return;
    const setParam = searchParams.get("set");
    const programParam = searchParams.get("program");
    const syParam = searchParams.get("sy");
    const semParam = searchParams.get("sem");
    const ylParam = searchParams.get("yl");

    if (!setParam && !programParam && !syParam) return;
    prefillAppliedRef.current = true;

    if (syParam) setSchoolYear(syParam);
    if (semParam === "1" || semParam === "2") setSemester(Number(semParam) as ScheduleSemester);

    if (programParam) {
      const prog = programMap.get(programParam);
      if (prog?.departmentAbbrev) {
        setSelectedDepartment(prog.departmentAbbrev);
      }
    }
  }, [schedules, searchParams, programMap]);

  // Build the hierarchical tree of programs -> year levels -> sets for the active term
  const programTreeData = useMemo<ProgramFlatData[]>(() => {
    if (!schedules) return [];

    const termSchedules = schedulesForDisplay.filter(
      (s) => s.schoolYear === schoolYear && s.semester === semester,
    );

    // Map releases by set code and set ID
    const releaseBySetCode = new Map<string, ScheduleRelease>();
    const releaseBySetId = new Map<string, ScheduleRelease>();
    for (const rel of releases) {
      if (rel.setCode) releaseBySetCode.set(rel.setCode.toLowerCase(), rel);
      if (rel.setId) releaseBySetId.set(String(rel.setId), rel);
    }

    // Map scheduledSets by set code
    const scheduledSetByCode = new Map<string, number>();
    for (const ss of scheduledSets) {
      if (ss.schoolYear === schoolYear && ss.semesterNumber === semester) {
        scheduledSetByCode.set(ss.setCode, ss.setId);
      }
    }

    // Unique program abbreviations in the current term schedules
    const programAbbrevs = [...new Set(termSchedules.map((s) => s.program))].filter(Boolean).sort();

    const tree: ProgramFlatData[] = [];

    for (const abbrev of programAbbrevs) {
      const progMeta = programMap.get(abbrev);
      // Determine department
      const deptAbbrev =
        progMeta?.departmentAbbrev ||
        departments.find((d) => d.programs.some((p) => p.abbrev === abbrev))?.abbrev ||
        termSchedules.find((s) => s.program === abbrev)?.departmentCode ||
        "General";

      // Apply department tab filter
      if (selectedDepartment !== "ALL" && deptAbbrev !== selectedDepartment) {
        continue;
      }

      const inProgSchedules = termSchedules.filter((s) => s.program === abbrev);
      const uniqueYearLevels = [...new Set(inProgSchedules.map((s) => s.yearLevel))].sort((a, b) => a - b);

      const yearGroups = uniqueYearLevels.map((yl) => {
        const inYearSchedules = inProgSchedules.filter((s) => s.yearLevel === yl);
        const setCodes = [...new Set(inYearSchedules.map((s) => s.setCode))].sort();

        const sets = setCodes.map((setCode) => {
          const setScheds = inYearSchedules
            .filter((s) => s.setCode === setCode)
            .sort(
              (a, b) =>
                DAYS.indexOf(a.day) - DAYS.indexOf(b.day) || a.startTime.localeCompare(b.startTime),
            );

          const setId = setScheds[0]?.setId;
          const scheduledSetId = scheduledSetByCode.get(setCode) ?? null;
          const release =
            (setId ? releaseBySetId.get(String(setId)) : null) ??
            (scheduledSetId ? releaseBySetId.get(String(scheduledSetId)) : null) ??
            releaseBySetCode.get(setCode.toLowerCase()) ??
            null;

          return {
            setCode,
            schedules: setScheds,
            release,
            scheduledSetId,
          };
        });

        return {
          yearLevel: yl,
          yearLabel: yearLevelLabel(yl),
          sets,
        };
      });

      tree.push({
        abbrev,
        name: progMeta?.name ?? "",
        departmentAbbrev: deptAbbrev,
        programId: progMeta?.id,
        yearGroups,
      });
    }

    return tree;
  }, [
    schedules,
    schedulesForDisplay,
    schoolYear,
    semester,
    releases,
    scheduledSets,
    programMap,
    departments,
    selectedDepartment,
    yearLevelLabel,
  ]);

  // Aggregate metrics
  const totalSections = useMemo(
    () => programTreeData.reduce((acc, p) => acc + p.yearGroups.reduce((ya, y) => ya + y.sets.length, 0), 0),
    [programTreeData],
  );

  const totalClasses = useMemo(
    () =>
      programTreeData.reduce(
        (acc, p) =>
          acc +
          p.yearGroups.reduce((ya, y) => ya + y.sets.reduce((sa, s) => sa + s.schedules.length, 0), 0),
        0,
      ),
    [programTreeData],
  );

  // All clearable sets for the active term
  const clearableSets = useMemo(
    () =>
      releases
        .filter((row) => row.setCode)
        .sort((a, b) => (a.setCode ?? "").localeCompare(b.setCode ?? "")),
    [releases],
  );

  // Clear set schedules (single or bulk)
  async function clearSets(setIds: number[]): Promise<string[]> {
    if (!selectedSchoolYearId || termClosed) return setIds.map(String);
    const unseated: UnseatedIrregularStudent[] = [];
    const clearedSetCodes = new Set<string>();
    const clearedSetIds = new Set<number>();
    const failed: string[] = [];

    for (const setId of setIds) {
      const rel = releases.find((r) => r.setId === setId);
      const setCodeName = rel?.setCode ?? `Set ${setId}`;
      try {
        const result = await scheduleService.removeSetSchedules(
          setId,
          selectedSchoolYearId,
          semester,
        );
        unseated.push(...result.irregularStudentsUnseated);
        if (rel?.setCode) clearedSetCodes.add(rel.setCode);
        clearedSetIds.add(setId);
      } catch {
        failed.push(setCodeName);
      }
    }

    if (clearedSetCodes.size > 0) {
      setSchedules((current) =>
        current?.filter(
          (row) =>
            !(
              row.schoolYear === schoolYear &&
              row.semester === semester &&
              clearedSetCodes.has(row.setCode)
            ),
        ) ?? [],
      );
      setScheduledSetsData((current) => (current ?? []).filter((row) => !clearedSetIds.has(row.setId)));
    }

    await refreshReleases();
    if (unseated.length > 0) setUnseatedStudents(unseated);
    return failed;
  }

  function handleClearSingleSet(setId: number, _setCode: string) {
    setClearTargetSetId(setId);
    setClearDialogOpen(true);
  }

  function handleClearProgram(programAbbrev: string) {
    const program = programTreeData.find((p) => p.abbrev === programAbbrev);
    if (!program) return;
    const setIds = program.yearGroups
      .flatMap((yg) => yg.sets)
      .map((s) => s.scheduledSetId)
      .filter((id): id is number => id != null);
    if (setIds.length === 0) return;
    setClearTargetSetIds(setIds);
    setClearDialogOpen(true);
  }

  // Program & Release Workflow Handlers
  async function handleSendProgram(programId: number, programAbbrev: string) {
    if (termClosed || !selectedSchoolYearId) return;
    setActionError(null);
    setActionBlock(null);
    try {
      const res = await termPhaseService.sendProgram(selectedSchoolYearId, semester, programId);
      toast.success(res.message || `${programAbbrev} schedules submitted to Dean.`);
      await refreshReleases();
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Unable to submit program schedules.";
      toast.error(msg);
      setActionError(msg);
      setActionBlock(departmentBlockFromError(err));
    }
  }

  async function handleWithdrawProgram(programId: number, programAbbrev: string) {
    if (termClosed || !selectedSchoolYearId) return;
    setActionError(null);
    setActionBlock(null);
    try {
      const res = await termPhaseService.withdrawProgram(selectedSchoolYearId, semester, programId);
      toast.success(res.message || `${programAbbrev} schedules withdrawn from Dean review.`);
      await refreshReleases();
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Unable to withdraw program schedules.";
      toast.error(msg);
      setActionError(msg);
      setActionBlock(departmentBlockFromError(err));
    }
  }

  async function handlePublishProgram(programId: number, programAbbrev: string) {
    if (termClosed || !selectedSchoolYearId) return;
    setActionError(null);
    setActionBlock(null);
    try {
      const res = await termPhaseService.publishProgramSchedule(selectedSchoolYearId, semester, programId);
      toast.success(res.message || `${programAbbrev} official schedule published.`);
      await refreshReleases();
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Unable to publish program schedule.";
      toast.error(msg);
      setActionError(msg);
      setActionBlock(departmentBlockFromError(err));
    }
  }

  async function handleSubmitRelease(note: string) {
    if (!submitTarget || termClosed || !selectedSchoolYearId) return;
    const progId = submitTarget.programId || programMap.get(submitTarget.programAbbrev ?? "")?.id;
    if (!progId) {
      throw new Error("Program not found for this schedule.");
    }
    try {
      const res = await termPhaseService.sendProgram(selectedSchoolYearId, semester, progId, note);
      toast.success(res.message || `${res.programAbbrev || "Program"} schedules submitted to Dean.`);
      await refreshReleases();
      setSubmitTarget(null);
    } catch (err) {
      throw err instanceof Error ? err : new Error("Unable to submit the schedule.");
    }
  }

  async function handleWithdrawRelease() {
    if (!withdrawTarget || termClosed || !selectedSchoolYearId) return;
    const progId = withdrawTarget.programId || programMap.get(withdrawTarget.programAbbrev ?? "")?.id;
    if (!progId) {
      throw new Error("Program not found for this schedule.");
    }
    try {
      const res = await termPhaseService.withdrawProgram(selectedSchoolYearId, semester, progId);
      toast.success(res.message || `${res.programAbbrev || "Program"} withdrawn from Dean review.`);
      await refreshReleases();
      setWithdrawTarget(null);
    } catch (err) {
      throw err instanceof Error ? err : new Error("Unable to withdraw the submission.");
    }
  }

  // Schedule Slot Edit Handlers
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
                roomName:
                  rooms.find((room) => String(room.id) === editForm.roomId)?.roomName ??
                  row.roomName,
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

  const isLoading =
    schedules === null ||
    scheduledSetsData === null ||
    departmentsData === null ||
    programsData === null;

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-8">
      <Breadcrumb
        items={[
          { label: "Scheduling Hub", href: "/schedules" },
          { label: "Master Schedules" },
        ]}
        className="mb-4"
      />

      <PageHeader
        title="Master Schedules"
        actions={
          <div className="flex flex-wrap justify-end gap-2">
            <Button type="button" block={false} onClick={() => navigate("/schedules/new")}>
              <PlusIcon />
              Create Schedule
            </Button>
          </div>
        }
      />

      {isLoading ? (
        <div className="mt-6">
          <ScheduleSkeleton rows={8} />
        </div>
      ) : (
        <>
          {/* Term Context & Global View Mode Bar */}
          <div className="mt-4">
            <MasterSchedulesTermBar
              schoolYears={schoolYears}
              schoolYear={schoolYear}
              onSchoolYearChange={setSchoolYear}
              semesters={semesters}
              semestersLoading={semestersLoading}
              semester={semester}
              onSemesterChange={setSemester}
              semesterLabel={semesterLabel}
              globalViewMode={globalViewMode}
              onGlobalViewModeChange={setGlobalViewMode}
              totalSections={totalSections}
              totalClasses={totalClasses}
            />
          </div>

          {termClosed && (
            <p className="mt-3 font-body text-xs text-amber-700 dark:text-amber-400">
              {termClosedNote} Submissions, edits, and deletions are disabled for this term.
            </p>
          )}

          {/* Underline Tabs: Departments */}
          <div className="mt-5 border-b border-slate-200 dark:border-white/10">
            <TabButtons
              ariaLabel="Departments"
              tabs={departmentTabs}
              value={selectedDepartment}
              onChange={setSelectedDepartment}
            />
          </div>

          {/* Main Accordion Hierarchy */}
          <div className="mt-5">
            <AnimatePresence>
              {actionBlock ? (
                <DepartmentBlockAlert
                  key="action-block"
                  message={actionError ?? "This program cannot be sent yet."}
                  reason={actionBlock.reason}
                  department={actionBlock.department}
                />
              ) : (
                actionError && (
                  <Alert key="action-error" variant="destructive" className="mb-4">
                    <AlertIcon />
                    <AlertDescription>{actionError}</AlertDescription>
                  </Alert>
                )
              )}
              {loadError && (
                <DataLoadAlert
                  className="mb-4"
                  title="Schedules unavailable"
                  message={loadError}
                  permission={loadError.toLowerCase().includes("permission")}
                />
              )}
            </AnimatePresence>

            <MasterSchedulesFlatList
              programs={programTreeData}
              schoolYear={schoolYear}
              semesterLabel={semesterLabel(semester)}
              termClosed={termClosed}
              departments={departments}
              onEdit={openEdit}
              onSubmitRelease={setSubmitTarget}
              onWithdrawRelease={setWithdrawTarget}
              onClearSet={handleClearSingleSet}
              onClearProgram={handleClearProgram}
              onSendProgram={handleSendProgram}
              onWithdrawProgram={handleWithdrawProgram}
              onPublishProgram={handlePublishProgram}
            />
          </div>
        </>
      )}

      {/* Schedule Edit Dialog */}
      <ScheduleEditDialog
        open={editTarget !== null}
        title={`Edit ${editTarget?.subjectCode ?? "schedule"}`}
        onClose={() => setEditTarget(null)}
        onSubmit={handleEditSubmit}
        form={editForm}
        onFormChange={setEditForm}
        dayOptions={dayOptions}
        rooms={rooms}
        timeOptions={TIME_OPTIONS}
        saving={editSaving}
        error={editError}
        disabled={termClosed}
        disabledNote={termClosedNote}
      />

      {/* Clear Schedule Dialog */}
      <ScheduleClearDialog
        open={clearDialogOpen}
        onClose={() => {
          setClearDialogOpen(false);
          setClearTargetSetId(null);
          setClearTargetSetIds([]);
        }}
        sets={clearableSets}
        defaultSetId={clearTargetSetId}
        defaultSetIds={clearTargetSetIds}
        schoolYear={schoolYear}
        semesterLabel={semesterLabel(semester)}
        disabled={termClosed}
        onConfirm={clearSets}
      />

      {/* Unseated Irregular Students Notification Modal */}
      <Modal
        open={unseatedStudents.length > 0}
        onClose={() => setUnseatedStudents([])}
        title="Irregular students unseated"
      >
        <div className="flex flex-col gap-4">
          <p className="font-body text-sm leading-relaxed text-slate-500 dark:text-slate-400">
            Clearing the section removed these students from borrowed class offerings. They now need to be seated again.
          </p>
          <ul className="divide-y divide-slate-200 rounded-lg border border-slate-200 dark:divide-white/10 dark:border-white/10">
            {unseatedStudents.map((student) => (
              <li key={student.studentProfileId} className="px-3 py-2 font-body text-sm">
                <span className="font-semibold text-navy-800 dark:text-mist-100">{student.name}</span>
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

      {/* Submit Release Dialog */}
      <ScheduleSubmitDialog
        open={submitTarget !== null}
        release={submitTarget}
        onClose={() => setSubmitTarget(null)}
        onConfirm={handleSubmitRelease}
      />

      {/* Withdraw Release Confirm Dialog */}
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
