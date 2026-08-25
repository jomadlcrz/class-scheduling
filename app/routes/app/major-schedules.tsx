import { useEffect, useMemo, useRef, useState, useDeferredValue } from "react";
import { toast } from "sonner";
import * as XLSX from "xlsx";
import { RoleGuard } from "~/auth/role-guard";
import { DataLoadAlert } from "~/components/feedback/data-load-alert";
import { EmptyState } from "~/components/feedback/empty-state";
import { FormError } from "~/components/forms/form-error";
import { Badge, type BadgeTone } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { Card } from "~/components/ui/card";
import {
  AlertTriangleIcon,
  CalendarIcon,
  CheckIcon,
  ClockIcon,
  EditIcon,
  EyeIcon,
  FileSearchIcon,
  FlaskConicalIcon,
  GridIcon,
  HelpCircleIcon,
  ListIcon,
  LockIcon,
  PlusIcon,
  RotateIcon,
  SearchIcon,
  TrashIcon,
  UploadIcon,
} from "~/components/ui/icons";
import { FieldChrome, inputClassName } from "~/components/ui/input";
import { ConfirmDialog, Modal, ModalActions } from "~/components/ui/modal";
import { Popover } from "~/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "~/components/ui/select";
import { MappingSkeleton, TableSkeleton } from "~/components/ui/skeleton";
import { StickyFooter } from "~/components/ui/sticky-footer";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "~/components/ui/table";
import { Textarea } from "~/components/ui/textarea";
import { MappingLegend } from "~/features/classroom-mapping/mapping-legend";
import { filterClassrooms } from "~/features/classroom-mapping/mapping-model";
import {
  MajorSchedulesMappingGrid,
} from "~/features/schedules/major-schedules-mapping-grid";
import { useAuth } from "~/hooks/use-auth";
import { useCachedData } from "~/hooks/use-cached-data";
import { useEnums } from "~/hooks/use-enums";
import { useSchoolYears } from "~/hooks/use-school-years";
import { useSemesters } from "~/hooks/use-semesters";
import { PageHeader } from "~/layouts/page-header";
import { formatTime12h } from "~/lib/time";
import { authorityWorkflowService } from "~/services/authority-workflow.service";
import { buildingService } from "~/services/building.service";
import { classroomMappingService } from "~/services/classroom-mapping.service";
import { deanService } from "~/services/dean.service";
import { programService } from "~/services/program.service";
import { scheduleService } from "~/services/schedule.service";
import { setService } from "~/services/set.service";
import { subjectService } from "~/services/subject.service";
import type {
  MajorSchedule,
  MajorScheduleAuditLogResult,
  MajorScheduleConflict,
  MajorScheduleDeletionNote,
  MajorScheduleEditRequest,
  MajorScheduleMeetingInput,
  MajorScheduleRequirements,
  MajorScheduleSubmission,
} from "~/types/authority-workflow";

export function meta() {
  return [
    { title: "Major Schedules — GWC Class Scheduling" },
    { name: "description", content: "Interactive room mapping and scheduling for Major with Lab and Major without Lab subjects." },
  ];
}

const STATUS_TONES: Record<string, BadgeTone> = {
  draft: "slate",
  reopened: "gold",
  submitted: "navy",
  finalized: "emerald",
  pending: "gold",
  approved: "emerald",
  rejected: "red",
};

type DecisionTarget = { request: MajorScheduleEditRequest; approve: boolean };
type ViewMode = "grid" | "table" | "audit";

type ImportRow = Record<string, unknown>;
type ImportIssue = { row: number; message: string };

const IMPORT_HEADERS = ["Set", "Subject Code", "Room", "Day", "Start Time", "End Time", "Instructor Email", "Override Pattern", "Class Mode", "Session Mode"];

function importValue(row: ImportRow, name: string) {
  const key = Object.keys(row).find((candidate) => candidate.trim().toLowerCase() === name.toLowerCase());
  return String(key == null ? "" : row[key] ?? "").trim();
}

function importTime(value: string) {
  const match = value.trim().match(/^(\d{1,2}):(\d{2})(?:\s*([AaPp][Mm]))?$/);
  if (!match) return null;
  let hour = Number(match[1]);
  const minute = Number(match[2]);
  if (minute > 59) return null;
  if (match[3]) {
    if (hour < 1 || hour > 12) return null;
    if (match[3].toLowerCase() === "pm" && hour !== 12) hour += 12;
    if (match[3].toLowerCase() === "am" && hour === 12) hour = 0;
  } else if (hour > 23) return null;
  return `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
}

function MajorSchedulesPage() {
  const { user } = useAuth();
  const { schoolYears } = useSchoolYears();
  const { semesters, semesterLabel } = useSemesters();

  const [syId, setSyId] = useState(0);
  const [semesterNumber, setSemesterNumber] = useState(0);
  const [buildingFilter, setBuildingFilter] = useState("all");
  const [rawSearch, setRawSearch] = useState("");
  const [viewMode, setViewMode] = useState<ViewMode>("grid");

  const [selectedSchedule, setSelectedSchedule] = useState<MajorSchedule | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<MajorSchedule | null>(null);
  const [registrarDeleteTarget, setRegistrarDeleteTarget] = useState<MajorSchedule | null>(null);
  const [editRequestTarget, setEditRequestTarget] = useState<MajorScheduleSubmission | null>(null);
  const [decisionTarget, setDecisionTarget] = useState<DecisionTarget | null>(null);
  const [conflicts, setConflicts] = useState<MajorScheduleConflict[] | null>(null);
  const [floatingTarget, setFloatingTarget] = useState<MajorSchedule | null>(null);
  const [reopenTarget, setReopenTarget] = useState<MajorScheduleSubmission | null>(null);
  const [submitTarget, setSubmitTarget] = useState<MajorScheduleSubmission | null>(null);
  const [deletionNotesOpen, setDeletionNotesOpen] = useState(false);
  const [scheduleToEdit, setScheduleToEdit] = useState<MajorSchedule | null>(null);

  const [requirements, setRequirements] = useState<MajorScheduleRequirements | null>(null);
  const [requirementsOpen, setRequirementsOpen] = useState(false);
  const [requirementsError, setRequirementsError] = useState<string | null>(null);

  const [floatingInstructorId, setFloatingInstructorId] = useState(0);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const importInputRef = useRef<HTMLInputElement>(null);
  const [importRows, setImportRows] = useState<ImportRow[]>([]);
  const [importIssues, setImportIssues] = useState<ImportIssue[]>([]);
  const [importOpen, setImportOpen] = useState(false);
  const [importing, setImporting] = useState(false);

  useEffect(() => {
    if (!syId && schoolYears.length) setSyId(schoolYears[0].id);
  }, [schoolYears, syId]);

  useEffect(() => {
    if (!semesterNumber && semesters.length) {
      const defaultSem = semesters.find((row) => row.semesterNumber !== 3) ?? semesters[0];
      setSemesterNumber(defaultSem.semesterNumber);
    }
  }, [semesterNumber, semesters]);

  const regularSemesters = semesters.filter((row) => row.semesterNumber !== 3);
  const currentSchoolYear = schoolYears.find((y) => y.id === syId)?.schoolYear ?? "";
  const scopeReady = syId > 0 && semesterNumber > 0 && currentSchoolYear !== "";

  const { data: buildingsData } = useCachedData("buildings", () => buildingService.list());
  const buildings = buildingsData ?? [];
  const selectedBuildingName = buildings.find((b) => String(b.id) === buildingFilter)?.name;

  const { data: roomsData } = useCachedData(
    "major-schedule-rooms",
    () => scheduleService.listScheduleRooms(),
  );
  const rooms = roomsData ?? [];

  const {
    data: submissions,
    error: submissionsError,
    reload: reloadSubmissions,
  } = useCachedData(
    `major-schedule-submissions:${syId}:${semesterNumber}`,
    () => authorityWorkflowService.listMajorScheduleSubmissions({ syId, semesterNumber }),
    { enabled: scopeReady, cache: false },
  );

  const mappingKey = `classroom-mapping:${currentSchoolYear}:${semesterNumber}:${selectedBuildingName ?? "all"}`;
  const {
    data: classrooms,
    error: classroomsError,
    reload: reloadClassrooms,
  } = useCachedData(
    mappingKey,
    () =>
      classroomMappingService
        .list({
          schoolYear: currentSchoolYear,
          semesterNumber,
          building: selectedBuildingName,
        })
        .then((result) => result.classrooms),
    { enabled: scopeReady },
  );

  const { data: editRequests, reload: reloadEditRequests } = useCachedData(
    "major-schedule-edit-requests",
    () => authorityWorkflowService.listMajorScheduleEditRequests(),
    { enabled: user?.role === "registrar", cache: false },
  );

  const { data: labSlots } = useCachedData(
    "major-schedule-lab-slots",
    () => authorityWorkflowService.listMajorLabTimeSlots(),
  );

  const { data: auditLog, reload: reloadAuditLog } = useCachedData<MajorScheduleAuditLogResult>(
    `major-schedule-audit:${syId}:${semesterNumber}`,
    () => authorityWorkflowService.listMajorScheduleAuditLogs({ syId, semesterNumber, perPage: 20 }),
    { enabled: scopeReady && viewMode === "audit", cache: false },
  );

  const { data: instructors } = useCachedData(
    "major-schedule-instructors",
    () => deanService.listDepartmentInstructors(),
  );

  const search = useDeferredValue(rawSearch);
  const filteredClassrooms = useMemo(() => {
    if (!classrooms) return [];
    return filterClassrooms(classrooms, search);
  }, [classrooms, search]);

  const allDeletionNotes = useMemo(() => {
    return (submissions ?? []).flatMap((s) => s.deletionNotes ?? []);
  }, [submissions]);
  const importDisabled = !scopeReady || (submissions ?? []).some(
    (submission) => !["draft", "reopened"].includes(submission.status),
  );

  async function withRefresh(action: () => Promise<{ message?: string } | string>) {
    setSaving(true);
    setFormError(null);
    try {
      const result = await action();
      const message = typeof result === "string" ? result : result.message;
      if (message) toast.success(message);
      await Promise.all([
        reloadSubmissions(),
        reloadClassrooms(),
        user?.role === "registrar" ? reloadEditRequests() : Promise.resolve(),
        viewMode === "audit" ? reloadAuditLog() : Promise.resolve(),
      ]);
      return true;
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "");
      return false;
    } finally {
      setSaving(false);
    }
  }

  async function handleCreateMeeting(input: MajorScheduleMeetingInput) {
    return withRefresh(async () => {
      const result = await authorityWorkflowService.createMajorSchedule(
        input,
        user?.role === "dean" ? "dean" : "registrar",
      );
      return result;
    });
  }

  async function handleUpdateMeeting(id: number, input: MajorScheduleMeetingInput) {
    return withRefresh(async () => {
      const result = await authorityWorkflowService.updateMajorSchedule(
        id,
        input,
        user?.role === "dean" ? "dean" : "registrar",
      );
      return result;
    });
  }

  async function handleImportFile(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    try {
      const workbook = XLSX.read(await file.arrayBuffer(), { type: "array" });
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      const rows = XLSX.utils.sheet_to_json<ImportRow>(sheet, { defval: "", raw: false })
        .filter((row) => Object.values(row).some((value) => String(value).trim()));
      const headers = new Set(rows.length ? Object.keys(rows[0]).map((header) => header.trim().toLowerCase()) : []);
      const missing = IMPORT_HEADERS.filter((header) => !headers.has(header.toLowerCase()));
      if (missing.length) throw new Error(`Missing column${missing.length > 1 ? "s" : ""}: ${missing.join(", ")}.`);
      if (!rows.length) throw new Error("The selected file has no schedule rows.");
      setImportRows(rows);
      setImportIssues([]);
      setImportOpen(true);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Unable to read the selected file.");
    }
  }

  function openImportFilePicker(accept: string) {
    if (!importInputRef.current) return;
    importInputRef.current.accept = accept;
    importInputRef.current.click();
  }

  async function importSchedules() {
    if (!scopeReady || !importRows.length) return;
    setImporting(true);
    setImportIssues([]);
    try {
      const [programs, sets, subjects, importRooms, importInstructors] = await Promise.all([
        programService.list(), setService.list({ syId, semesterNumber }), subjectService.list(),
        scheduleService.listScheduleRooms(), deanService.listDepartmentInstructors(),
      ]);
      const issues: ImportIssue[] = [];
      const inputs: MajorScheduleMeetingInput[] = [];
      for (const [index, row] of importRows.entries()) {
        const setName = importValue(row, "Set");
        const match = setName.match(/^(.+)-(\d+)([A-Za-z]+)$/);
        const subjectCode = importValue(row, "Subject Code");
        const roomName = importValue(row, "Room");
        const instructorEmail = importValue(row, "Instructor Email");
        const classMode = (importValue(row, "Class Mode") || "F2F").toUpperCase();
        const sessionMode = (importValue(row, "Session Mode") || "LEC").toUpperCase();
        const startTime = importTime(importValue(row, "Start Time"));
        const endTime = importTime(importValue(row, "End Time"));
        const dayOfWeek = importValue(row, "Day");
        const program = match && programs.find((item) => item.abbrev.toLowerCase() === match[1].toLowerCase());
        const set = match && sets.find((item) => item.program.toLowerCase() === match[1].toLowerCase() && item.yearLevel === Number(match[2]) && item.setCode.toLowerCase() === match[3].toLowerCase());
        const subject = match && subjects.find((item) => item.program.toLowerCase() === match[1].toLowerCase() && item.yearLevel === Number(match[2]) && item.semester === semesterNumber && item.code.toLowerCase() === subjectCode.toLowerCase());
        const room = roomName ? importRooms.find((item) => item.roomName.toLowerCase() === roomName.toLowerCase()) : undefined;
        const instructor = instructorEmail ? importInstructors.find((item) => item.email?.toLowerCase() === instructorEmail.toLowerCase()) : undefined;
        const errors = [
          !match && "valid Set (for example BSIT-1A)", !program && "program", !set && "set for this term",
          !subject && "subject for this set and semester", !dayOfWeek && "day", !startTime && "start time", !endTime && "end time",
          roomName && !room && "room", instructorEmail && !instructor && "instructor email",
          classMode === "F2F" && !room && "room for F2F",
        ].filter(Boolean);
        if (errors.length) { issues.push({ row: index + 2, message: `Missing or invalid ${errors.join(", ")}.` }); continue; }
        inputs.push({ syId, semesterNumber, programId: program!.id, setId: set!.id, subjectId: subject!.id,
          instructorId: instructor?.instructorProfileId ?? null, roomId: room?.id ?? null, dayOfWeek,
          startTime: startTime!, endTime: endTime!, classMode, sessionMode,
          overrideMeetingPattern: ["true", "yes", "1"].includes(importValue(row, "Override Pattern").toLowerCase()),
        });
      }
      if (issues.length) { setImportIssues(issues); return; }
      let imported = 0;
      for (const input of inputs) {
        await authorityWorkflowService.createMajorSchedule(input, user?.role === "dean" ? "dean" : "registrar");
        imported++;
      }
      await Promise.all([reloadSubmissions(), reloadClassrooms(), viewMode === "audit" ? reloadAuditLog() : Promise.resolve()]);
      toast.success(`Imported ${imported} major schedule${imported === 1 ? "" : "s"}.`);
      setImportOpen(false);
      setImportRows([]);
    } catch (err) {
      setImportIssues([{ row: 0, message: err instanceof Error ? err.message : "Import stopped unexpectedly." }]);
    } finally { setImporting(false); }
  }

  async function openRequirements(submissionId: number) {
    setRequirementsOpen(true);
    setRequirements(null);
    setRequirementsError(null);
    try {
      setRequirements(await authorityWorkflowService.getMajorScheduleRequirements(submissionId));
    } catch (err) {
      setRequirementsError(err instanceof Error ? err.message : "");
    }
  }

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-8 pb-28">
      <PageHeader title="Major Schedules" />

      {/* Term Context & Filters Row */}
      <div className="mt-4 flex flex-col gap-4">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div className="grid grid-cols-2 gap-3 sm:flex sm:flex-wrap">
            <div className="w-full sm:w-44">
              <FieldChrome id="major-school-year" label="School Year">
                <Select
                  items={schoolYears.map((year) => ({ value: String(year.id), label: year.schoolYear }))}
                  value={syId ? String(syId) : ""}
                  onValueChange={(value) => setSyId(Number(value))}
                >
                  <SelectTrigger id="major-school-year">
                    <SelectValue placeholder="Select school year" />
                  </SelectTrigger>
                  <SelectContent>
                    {schoolYears.map((year) => (
                      <SelectItem key={year.id} value={String(year.id)}>
                        {year.schoolYear}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FieldChrome>
            </div>

            <div className="w-full sm:w-44">
              <FieldChrome id="major-semester" label="Semester">
                <Select
                  items={regularSemesters.map((semester) => ({
                    value: String(semester.semesterNumber),
                    label: semesterLabel(semester.semesterNumber),
                  }))}
                  value={semesterNumber ? String(semesterNumber) : ""}
                  onValueChange={(value) => setSemesterNumber(Number(value))}
                >
                  <SelectTrigger id="major-semester">
                    <SelectValue placeholder="Select semester" />
                  </SelectTrigger>
                  <SelectContent>
                    {regularSemesters.map((semester) => (
                      <SelectItem key={semester.semesterNumber} value={String(semester.semesterNumber)}>
                        {semesterLabel(semester.semesterNumber)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FieldChrome>
            </div>

            <div className="w-full sm:w-44">
              <FieldChrome id="major-building" label="Building">
                <Select
                  items={[
                    { value: "all", label: "All buildings" },
                    ...buildings.map((b) => ({ value: String(b.id), label: b.name })),
                  ]}
                  value={buildingFilter}
                  onValueChange={(v) => setBuildingFilter(v as string)}
                >
                  <SelectTrigger id="major-building">
                    <SelectValue placeholder="All buildings" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All buildings</SelectItem>
                    {buildings.map((b) => (
                      <SelectItem key={b.id} value={String(b.id)}>
                        {b.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FieldChrome>
            </div>
          </div>

          <div className="flex w-full flex-wrap items-center justify-between gap-3 sm:w-auto">
            {/* View Mode Switcher */}
            <div className="inline-flex rounded-lg border border-slate-200 bg-slate-50 p-0.5 dark:border-white/10 dark:bg-white/5">
              <button
                type="button"
                onClick={() => setViewMode("grid")}
                className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 font-body text-xs font-semibold transition-colors ${
                  viewMode === "grid"
                    ? "bg-white text-navy-800 shadow-xs dark:bg-surface-raised dark:text-white"
                    : "text-slate-600 hover:text-navy-700 dark:text-slate-400 dark:hover:text-mist-100"
                }`}
              >
                <GridIcon size={14} />
                <span>Room Map</span>
              </button>
              <button
                type="button"
                onClick={() => setViewMode("table")}
                className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 font-body text-xs font-semibold transition-colors ${
                  viewMode === "table"
                    ? "bg-white text-navy-800 shadow-xs dark:bg-surface-raised dark:text-white"
                    : "text-slate-600 hover:text-navy-700 dark:text-slate-400 dark:hover:text-mist-100"
                }`}
              >
                <ListIcon size={14} />
                <span>Submissions</span>
              </button>
              <button
                type="button"
                onClick={() => setViewMode("audit")}
                className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 font-body text-xs font-semibold transition-colors ${
                  viewMode === "audit"
                    ? "bg-white text-navy-800 shadow-xs dark:bg-surface-raised dark:text-white"
                    : "text-slate-600 hover:text-navy-700 dark:text-slate-400 dark:hover:text-mist-100"
                }`}
              >
                <ClockIcon size={14} />
                <span>History</span>
              </button>
            </div>

            {user?.role === "dean" && <div>
              <input ref={importInputRef} type="file" className="sr-only" onChange={handleImportFile} />
              <Popover
                label="Import"
                trigger={<><UploadIcon size={16} />Import</>}
                triggerClassName="flex cursor-pointer items-center justify-center gap-2 rounded-lg border border-slate-300 px-3 py-2 font-body text-sm font-medium text-navy-700 transition-all hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-400 disabled:cursor-not-allowed disabled:opacity-60 dark:border-white/15 dark:text-slate-200 dark:hover:bg-white/10"
                className="w-44 p-1.5"
                disabled={importDisabled}
              >
                {(close) => <>
                  <button type="button" role="menuitem" onClick={() => { close(); openImportFilePicker(".csv"); }} className="flex w-full items-center rounded-md p-2.5 text-left font-body text-sm font-medium text-slate-600 hover:bg-slate-100 hover:text-navy-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-400 dark:text-slate-300 dark:hover:bg-white/5 dark:hover:text-mist-100">Import CSV</button>
                  <button type="button" role="menuitem" onClick={() => { close(); openImportFilePicker(".xlsx,.xls"); }} className="flex w-full items-center rounded-md p-2.5 text-left font-body text-sm font-medium text-slate-600 hover:bg-slate-100 hover:text-navy-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-400 dark:text-slate-300 dark:hover:bg-white/5 dark:hover:text-mist-100">Import Excel</button>
                </>}
              </Popover>
            </div>}

            {viewMode === "grid" && (
              <div className="relative w-full sm:w-56">
                <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-slate-400">
                  <SearchIcon />
                </span>
                <input
                  type="search"
                  placeholder="Filter rooms…"
                  value={rawSearch}
                  onChange={(e) => setRawSearch(e.target.value)}
                  aria-label="Search rooms"
                  className={`${inputClassName} pl-9 pr-4`}
                />
              </div>
            )}
          </div>
        </div>

        <FormError message={formError} />

        {/* Standard Lab Time Slots Reference Banner (Compact / Informative) */}
        {labSlots?.labTimeSlots.length ? (
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-blue-100 bg-blue-50/60 px-4 py-2.5 dark:border-blue-400/15 dark:bg-blue-400/5">
            <div className="flex items-center gap-2 text-xs text-blue-900 dark:text-blue-200">
              <span className="inline-flex size-4 items-center justify-center">
                <FlaskConicalIcon />
              </span>
              <span className="font-semibold">Lab Slots Standard Windows:</span>
              <span className="text-slate-600 dark:text-slate-300">
                {labSlots.labTimeSlots.map((s) => `${formatTime12h(s.startTime)}–${formatTime12h(s.endTime)}`).join(" · ")}
              </span>
              {labSlots.requiredMeetingHours !== null && (
                <span className="text-blue-700 dark:text-blue-300">
                  ({labSlots.requiredMeetingHours}h per meeting)
                </span>
              )}
            </div>
            <span className="font-body text-[11px] text-slate-500 dark:text-slate-400">
              Applies to Major with Lab sessions
            </span>
          </div>
        ) : null}

        {/* View 1: Interactive Room Mapping Grid */}
        {viewMode === "grid" && (
          <div className="space-y-3">
            <MappingLegend />

            {classroomsError && classrooms === null && rooms.length === 0 ? (
              <EmptyState title="Unable to load classrooms">{classroomsError}</EmptyState>
            ) : classrooms === null && rooms.length === 0 ? (
              <MappingSkeleton rooms={4} />
            ) : filteredClassrooms.length === 0 && rooms.length === 0 ? (
              <EmptyState
                title={rawSearch.trim() || buildingFilter !== "all" ? "No classrooms match" : "No classrooms configured"}
              >
                {rawSearch.trim() || buildingFilter !== "all"
                  ? "No classrooms match your search or building filter."
                  : "No classrooms are configured for this term yet."}
              </EmptyState>
            ) : (
              <MajorSchedulesMappingGrid
                classrooms={filteredClassrooms}
                submissions={submissions ?? []}
                rooms={rooms}
                schoolYear={currentSchoolYear}
                syId={syId}
                semesterNumber={semesterNumber}
                userRole={user?.role ?? ""}
                onCreate={handleCreateMeeting}
                onUpdate={handleUpdateMeeting}
                scheduleToEdit={scheduleToEdit}
                onCloseEdit={() => setScheduleToEdit(null)}
                onSelectSchedule={(schedule) => {
                  setSelectedSchedule(schedule);
                }}
              />
            )}
          </div>
        )}

        {/* View 2: Submissions & Sections Table View */}
        {viewMode === "table" && (
          <div className="space-y-6">
            {submissionsError && submissions === null ? (
              <EmptyState title="Couldn't load major schedules">{submissionsError}</EmptyState>
            ) : submissions === null ? (
              <TableSkeleton columns={6} rows={6} />
            ) : submissions.length === 0 ? (
              <EmptyState title="No major schedules">
                No major schedule submission exists for this term. Use the Room Map to select a room and time range to assign.
              </EmptyState>
            ) : (
              submissions.map((submission) => (
                <section key={submission.id} className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="font-display text-base tracking-wide text-navy-700 dark:text-mist-100">
                      {submission.departmentAbbrev} Timetable Meetings ({submission.schedules.length})
                    </h3>
                  </div>

                  <Table>
                    <TableHead>
                      <TableHeader>Subject</TableHeader>
                      <TableHeader>Section</TableHeader>
                      <TableHeader>Schedule</TableHeader>
                      <TableHeader>Room</TableHeader>
                      <TableHeader>Instructor</TableHeader>
                      <TableHeader>Type</TableHeader>
                      <TableHeader>
                        <span className="sr-only">Actions</span>
                      </TableHeader>
                    </TableHead>
                    <TableBody>
                      {submission.schedules.map((schedule) => {
                        const roomObj = rooms.find((r) => r.id === schedule.roomId);
                        const isDeanEditable =
                          user?.role === "dean" && ["draft", "reopened"].includes(submission.status);
                        const isRegistrarManageable =
                          user?.role === "registrar" && ["submitted", "finalized"].includes(submission.status);

                        return (
                          <TableRow key={schedule.id}>
                            <TableCell>
                              <span className="font-semibold text-navy-700 dark:text-mist-100">
                                {schedule.subjectCode}
                              </span>
                              <span className="block text-xs text-slate-400">{schedule.subjectTitle}</span>
                            </TableCell>
                            <TableCell>{schedule.setName}</TableCell>
                            <TableCell>
                              {schedule.dayOfWeek} · {formatTime12h(schedule.startTime)}–{formatTime12h(schedule.endTime)}
                            </TableCell>
                            <TableCell>
                              {roomObj ? `${roomObj.buildingName} · ${roomObj.roomName}` : schedule.classMode === "F2F" ? "Assigned Room" : "Online / No Room"}
                            </TableCell>
                            <TableCell>{schedule.instructorDisplay || "TBA / Floating"}</TableCell>
                            <TableCell>
                              <Badge tone={schedule.floating ? "gold" : schedule.sessionMode === "LAB" ? "navy" : "emerald"}>
                                {schedule.floating ? "Floating" : schedule.sessionMode ?? "LEC"}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <div className="flex justify-end gap-2">
                                {isDeanEditable && (
                                  <>
                                    <Button
                                      type="button"
                                      variant="outline"
                                      block={false}
                                      onClick={() => {
                                        setScheduleToEdit(schedule);
                                        setViewMode("grid");
                                      }}
                                    >
                                      Edit
                                    </Button>
                                    <Button
                                      type="button"
                                      variant="danger"
                                      block={false}
                                      onClick={() => setDeleteTarget(schedule)}
                                    >
                                      Delete
                                    </Button>
                                  </>
                                )}
                                {isRegistrarManageable && (
                                  <>
                                    <Button
                                      type="button"
                                      variant="outline"
                                      block={false}
                                      onClick={() => {
                                        setScheduleToEdit(schedule);
                                        setViewMode("grid");
                                      }}
                                    >
                                      Edit
                                    </Button>
                                    {schedule.floating && (
                                      <Button
                                        type="button"
                                        block={false}
                                        onClick={() => {
                                          setFloatingTarget(schedule);
                                          setFloatingInstructorId(0);
                                          setFormError(null);
                                        }}
                                      >
                                        Assign Faculty
                                      </Button>
                                    )}
                                    <Button
                                      type="button"
                                      variant="danger"
                                      block={false}
                                      onClick={() => setRegistrarDeleteTarget(schedule)}
                                    >
                                      Remove
                                    </Button>
                                  </>
                                )}
                              </div>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </section>
              ))
            )}

            {/* Registrar Pending Edit Requests */}
            {user?.role === "registrar" && (editRequests?.length ?? 0) > 0 && (
              <section className="mt-8">
                <h3 className="mb-3 font-display text-base tracking-wide text-navy-700 dark:text-mist-100">
                  Pending Edit Requests
                </h3>
                <Table>
                  <TableHead>
                    <TableHeader>Submission</TableHeader>
                    <TableHeader>Reason</TableHeader>
                    <TableHeader>Status</TableHeader>
                    <TableHeader>
                      <span className="sr-only">Actions</span>
                    </TableHeader>
                  </TableHead>
                  <TableBody>
                    {editRequests!.map((request) => (
                      <TableRow key={request.id}>
                        <TableCell>Submission #{request.submissionId}</TableCell>
                        <TableCell>{request.reason}</TableCell>
                        <TableCell>
                          <Badge tone={STATUS_TONES[request.status] ?? "slate"}>{request.status}</Badge>
                        </TableCell>
                        <TableCell>
                          {request.status === "pending" && (
                            <div className="flex justify-end gap-2">
                              <Button
                                type="button"
                                block={false}
                                onClick={() => setDecisionTarget({ request, approve: true })}
                              >
                                Approve
                              </Button>
                              <Button
                                type="button"
                                variant="danger"
                                block={false}
                                onClick={() => setDecisionTarget({ request, approve: false })}
                              >
                                Reject
                              </Button>
                            </div>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </section>
            )}
          </div>
        )}

        {/* View 3: Major Scheduling Audit History */}
        {viewMode === "audit" && (
          <section className="mt-4">
            <h3 className="mb-3 font-display text-base tracking-wide text-navy-700 dark:text-mist-100">
              Major Scheduling Audit Trail
            </h3>
            {!auditLog ? (
              <TableSkeleton columns={4} rows={6} />
            ) : auditLog.items.length === 0 ? (
              <EmptyState title="No history yet">
                Changes and events on Major schedules for this term will appear here.
              </EmptyState>
            ) : (
              <Table>
                <TableHead>
                  <TableHeader>Action</TableHeader>
                  <TableHeader>Department / Version</TableHeader>
                  <TableHeader>Performed By</TableHeader>
                  <TableHeader>Details</TableHeader>
                </TableHead>
                <TableBody>
                  {auditLog.items.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell>
                        <Badge tone="slate">{item.actionLabel}</Badge>
                      </TableCell>
                      <TableCell>
                        {item.departmentAbbrev ?? "—"}
                        {item.submissionVersion != null ? ` · v${item.submissionVersion}` : ""}
                      </TableCell>
                      <TableCell>{item.performedBy.name ?? "—"}</TableCell>
                      <TableCell>{item.reason ?? item.details ?? "—"}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </section>
        )}
      </div>

      {/* Schedule Detail Inspection Modal (when clicked from Grid) */}
      <Modal
        open={selectedSchedule !== null}
        onClose={() => setSelectedSchedule(null)}
        title={`${selectedSchedule?.subjectCode} · Meeting Details`}
      >
        {selectedSchedule && (
          <div className="space-y-4">
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 dark:border-white/10 dark:bg-white/5">
              <h4 className="font-display text-base text-navy-800 dark:text-mist-100">
                {selectedSchedule.subjectCode} — {selectedSchedule.subjectTitle}
              </h4>
              <p className="mt-1 font-body text-xs text-slate-500 dark:text-slate-400">
                Section: <span className="font-semibold text-navy-700 dark:text-mist-100">{selectedSchedule.setName}</span>
              </p>
            </div>

            <dl className="grid grid-cols-2 gap-3 font-body text-xs">
              <div>
                <dt className="text-slate-400 uppercase tracking-wider">Day &amp; Time</dt>
                <dd className="mt-0.5 font-semibold text-navy-700 dark:text-mist-100">
                  {selectedSchedule.dayOfWeek} · {formatTime12h(selectedSchedule.startTime)}–{formatTime12h(selectedSchedule.endTime)}
                </dd>
              </div>
              <div>
                <dt className="text-slate-400 uppercase tracking-wider">Session Type</dt>
                <dd className="mt-0.5 font-semibold text-navy-700 dark:text-mist-100">
                  {selectedSchedule.sessionMode ?? "LEC"} ({selectedSchedule.classMode ?? "F2F"})
                </dd>
              </div>
              <div>
                <dt className="text-slate-400 uppercase tracking-wider">Instructor</dt>
                <dd className="mt-0.5 font-semibold text-navy-700 dark:text-mist-100">
                  {selectedSchedule.instructorDisplay || "TBA / Floating"}
                </dd>
              </div>
              <div>
                <dt className="text-slate-400 uppercase tracking-wider">Status</dt>
                <dd className="mt-0.5">
                  <Badge tone={STATUS_TONES[selectedSchedule.workflowStatus] ?? "slate"}>
                    {selectedSchedule.workflowStatus}
                  </Badge>
                </dd>
              </div>
            </dl>

            <ModalActions>
              <Button type="button" variant="outline" block={false} onClick={() => setSelectedSchedule(null)}>
                Close
              </Button>
              {user?.role === "dean" && ["draft", "reopened"].includes(selectedSchedule.workflowStatus) && (
                <>
                  <Button
                    type="button"
                    variant="outline"
                    block={false}
                    onClick={() => {
                      setScheduleToEdit(selectedSchedule);
                      setSelectedSchedule(null);
                    }}
                  >
                    Edit Draft
                  </Button>
                  <Button
                    type="button"
                    variant="danger"
                    block={false}
                    onClick={() => {
                      setDeleteTarget(selectedSchedule);
                      setSelectedSchedule(null);
                    }}
                  >
                    Delete Meeting
                  </Button>
                </>
              )}
              {user?.role === "registrar" && ["submitted", "finalized"].includes(selectedSchedule.workflowStatus) && (
                <>
                  <Button
                    type="button"
                    variant="outline"
                    block={false}
                    onClick={() => {
                      setScheduleToEdit(selectedSchedule);
                      setSelectedSchedule(null);
                    }}
                  >
                    Edit Meeting
                  </Button>
                  <Button
                    type="button"
                    variant="danger"
                    block={false}
                    onClick={() => {
                      setRegistrarDeleteTarget(selectedSchedule);
                      setSelectedSchedule(null);
                    }}
                  >
                    Remove Meeting
                  </Button>
                </>
              )}
            </ModalActions>
          </div>
        )}
      </Modal>

      {/* Dean Delete Meeting Confirm Dialog */}
      <ConfirmDialog
        open={submitTarget !== null}
        onClose={() => setSubmitTarget(null)}
        title="Submit Major Schedule"
        confirmLabel="Submit Schedule"
        loadingLabel="Submitting…"
        onConfirm={async () => {
          if (!submitTarget) return;
          const result = await authorityWorkflowService.submitMajorSchedule(submitTarget.id);
          if (result.message) toast.success(result.message);
          await Promise.all([reloadSubmissions(), reloadClassrooms()]);
        }}
      >
        Submit the {submitTarget?.departmentAbbrev} major schedule for review? You will need to request an edit after submission to make further changes.
      </ConfirmDialog>

      <ConfirmDialog
        open={deleteTarget !== null}
        onClose={() => setDeleteTarget(null)}
        title="Delete Major Meeting"
        confirmLabel="Delete"
        loadingLabel="Deleting…"
        confirmVariant="danger"
        onConfirm={async () => {
          if (!deleteTarget) return;
          const message = await authorityWorkflowService.deleteMajorSchedule(deleteTarget.id);
          if (message) toast.success(message);
          await Promise.all([reloadSubmissions(), reloadClassrooms()]);
        }}
      >
        Delete {deleteTarget?.subjectCode} from this draft build?
      </ConfirmDialog>

      {/* Registrar Delete Meeting with Reason Note Dialog */}
      <RegistrarMajorDeleteDialog
        schedule={registrarDeleteTarget}
        saving={saving}
        error={formError}
        onClose={() => setRegistrarDeleteTarget(null)}
        onConfirm={async (reason) => {
          if (!registrarDeleteTarget) return;
          const ok = await withRefresh(async () => {
            return authorityWorkflowService.deleteMajorSchedule(
              registrarDeleteTarget.id,
              "registrar",
              reason,
            );
          });
          if (ok) setRegistrarDeleteTarget(null);
        }}
      />

      {/* Dean Edit Request Modal */}
      <Modal
        open={editRequestTarget !== null}
        onClose={() => setEditRequestTarget(null)}
        title="Request Schedule Edit"
      >
        <form
          onSubmit={async (event) => {
            event.preventDefault();
            const reason = String(new FormData(event.currentTarget).get("reason") ?? "");
            const ok = await withRefresh(() =>
              authorityWorkflowService.requestMajorScheduleEdit(editRequestTarget!.id, reason),
            );
            if (ok) setEditRequestTarget(null);
          }}
          className="space-y-4"
        >
          <FormError message={formError} />
          <Textarea
            id="reason"
            label="Reason for unlocking"
            hint="Explain what changes need to be made (minimum 10 characters)"
            required
            minLength={10}
          />
          <ModalActions>
            <Button type="button" variant="outline" block={false} onClick={() => setEditRequestTarget(null)}>
              Cancel
            </Button>
            <Button type="submit" block={false} isLoading={saving} loadingLabel="Sending…">
              Send Request
            </Button>
          </ModalActions>
        </form>
      </Modal>

      {/* Registrar Edit Request Decision Modal */}
      <Modal
        open={decisionTarget !== null}
        onClose={() => setDecisionTarget(null)}
        title={`${decisionTarget?.approve ? "Approve" : "Reject"} Edit Request`}
      >
        <form
          onSubmit={async (event) => {
            event.preventDefault();
            const note = String(new FormData(event.currentTarget).get("note") ?? "");
            const ok = await withRefresh(() =>
              authorityWorkflowService.decideMajorScheduleEdit(
                decisionTarget!.request.id,
                decisionTarget!.approve,
                note || undefined,
              ),
            );
            if (ok) setDecisionTarget(null);
          }}
          className="space-y-4"
        >
          <FormError message={formError} />
          <Textarea id="note" label="Decision note" hint="Optional note to the Dean" />
          <ModalActions>
            <Button type="button" variant="outline" block={false} onClick={() => setDecisionTarget(null)}>
              Cancel
            </Button>
            <Button
              type="submit"
              variant={decisionTarget?.approve ? "primary" : "danger"}
              block={false}
              isLoading={saving}
              loadingLabel="Saving…"
            >
              Confirm {decisionTarget?.approve ? "Approval" : "Rejection"}
            </Button>
          </ModalActions>
        </form>
      </Modal>

      {/* Conflict Check Modal */}
      <Modal
        open={conflicts !== null}
        onClose={() => setConflicts(null)}
        title="Submission Conflict Analysis"
        wide
      >
        {conflicts?.length === 0 ? (
          <EmptyState title="No conflicts found">
            This submission has zero cross-department conflicts and is ready to finalize.
          </EmptyState>
        ) : (
          <div className="space-y-3">
            <p className="font-body text-xs text-slate-500">
              The following meetings conflict with other department or room allocations:
            </p>
            {conflicts?.map((conflict) => (
              <div
                key={`${conflict.scheduleId}:${conflict.conflictingScheduleId}`}
                className="rounded-lg border border-amber-200 bg-amber-50/50 p-3 text-xs dark:border-amber-400/20 dark:bg-amber-400/5"
              >
                <strong>{conflict.schedule.subjectCode}</strong> ({conflict.schedule.setName}) conflicts with{" "}
                <strong>{conflict.conflictingSchedule.subjectCode}</strong> ({conflict.conflictingSchedule.setName}) on{" "}
                {conflict.dayOfWeek} ({conflict.conflictTypes.join(", ")}).
              </div>
            ))}
          </div>
        )}
      </Modal>

      {/* Requirements Modal */}
      <Modal
        open={requirementsOpen}
        onClose={() => setRequirementsOpen(false)}
        title="Major Curriculum Requirements"
        wide
      >
        {requirementsError ? (
          <DataLoadAlert title="Requirements unavailable" message={requirementsError} />
        ) : !requirements ? (
          <TableSkeleton columns={4} rows={5} />
        ) : (
          <div className="space-y-3">
            <p className="font-body text-sm text-slate-500 dark:text-slate-400">
              {requirements.unsatisfiedCount === 0
                ? "All section major curriculum requirements are satisfied."
                : `${requirements.unsatisfiedCount} requirement${requirements.unsatisfiedCount === 1 ? "" : "s"} still need attention.`}
            </p>
            <Table>
              <TableHead>
                <TableHeader>Section</TableHeader>
                <TableHeader>Subject</TableHeader>
                <TableHeader>Required</TableHeader>
                <TableHeader>Status</TableHeader>
              </TableHead>
              <TableBody>
                {requirements.requirements.map((item) => (
                  <TableRow key={`${item.setId}:${item.subjectId}`}>
                    <TableCell>{item.setName}</TableCell>
                    <TableCell>
                      {item.subjectCode} — {item.subjectTitle}
                    </TableCell>
                    <TableCell>
                      {(item.requiredSessionModes ?? item.requiredMeetingKinds ?? []).join(" + ")}
                    </TableCell>
                    <TableCell>
                      <Badge tone={item.isSatisfied ? "emerald" : "gold"}>
                        {item.isSatisfied
                          ? "Complete"
                          : item.blended && !item.blended.isPaired
                            ? "Missing in-room session (Blended)"
                            : `Missing ${(item.missingSessionModes ?? item.missingMeetingKinds ?? []).join(", ")}`}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </Modal>

      {/* Reopen Finalized Submission Modal */}
      <Modal
        open={reopenTarget !== null}
        onClose={() => setReopenTarget(null)}
        title={`Reopen Finalized Submission (${reopenTarget?.departmentAbbrev ?? ""})`}
      >
        <form
          onSubmit={async (event) => {
            event.preventDefault();
            const reason = String(new FormData(event.currentTarget).get("reopen-reason") ?? "").trim();
            if (reason.length < 10) {
              setFormError("Please provide an explanation of at least 10 characters.");
              return;
            }
            const ok = await withRefresh(() =>
              authorityWorkflowService.reopenFinalizedMajorSchedule(reopenTarget!.id, reason),
            );
            if (ok) setReopenTarget(null);
          }}
          className="space-y-4"
        >
          <FormError message={formError} />
          <p className="font-body text-xs text-slate-500 dark:text-slate-400">
            Reopening this finalized major schedule will unprotect its meetings and return the submission to Registrar control.
          </p>
          <Textarea id="reopen-reason" label="Reason for reopening" hint="Minimum 10 characters required" required minLength={10} />
          <ModalActions>
            <Button type="button" variant="outline" block={false} onClick={() => setReopenTarget(null)}>
              Cancel
            </Button>
            <Button type="submit" block={false} isLoading={saving} loadingLabel="Reopening…">
              Reopen Submission
            </Button>
          </ModalActions>
        </form>
      </Modal>

      {/* Assign Floating Instructor Modal */}
      <Modal
        open={floatingTarget !== null}
        onClose={() => setFloatingTarget(null)}
        title="Assign Floating Instructor"
      >
        <form
          onSubmit={async (event) => {
            event.preventDefault();
            if (!floatingInstructorId) {
              setFormError("Select an instructor.");
              return;
            }
            const ok = await withRefresh(() =>
              authorityWorkflowService.assignFloatingInstructor(
                floatingTarget!.id,
                floatingInstructorId,
              ),
            );
            if (ok) setFloatingTarget(null);
          }}
          className="space-y-4"
          noValidate
        >
          <FormError message={formError} />
          <FieldChrome id="floating-instructor" label="Instructor" required>
            <Select
              items={(instructors ?? []).map((instructor) => ({
                value: String(instructor.instructorProfileId),
                label: `${instructor.firstName} ${instructor.lastName}`,
              }))}
              value={floatingInstructorId ? String(floatingInstructorId) : ""}
              onValueChange={(value) => setFloatingInstructorId(Number(value))}
            >
              <SelectTrigger id="floating-instructor">
                <SelectValue placeholder="Select instructor" />
              </SelectTrigger>
              <SelectContent>
                {(instructors ?? []).map((instructor) => (
                  <SelectItem
                    key={instructor.instructorProfileId}
                    value={String(instructor.instructorProfileId)}
                  >
                    {instructor.firstName} {instructor.lastName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FieldChrome>
          <ModalActions>
            <Button type="button" variant="outline" block={false} onClick={() => setFloatingTarget(null)}>
              Cancel
            </Button>
            <Button
              type="submit"
              block={false}
              isLoading={saving}
              loadingLabel="Assigning…"
              disabled={!floatingInstructorId}
            >
              Assign Instructor
            </Button>
          </ModalActions>
        </form>
      </Modal>

      {/* Deletion Notes Modal ("Removed by Registrar") */}
      <Modal
        open={deletionNotesOpen}
        onClose={() => setDeletionNotesOpen(false)}
        title="Meetings Removed by the Registrar"
        wide
      >
        <div className="space-y-3">
          <p className="font-body text-xs text-slate-500 dark:text-slate-400">
            Historical record of major meetings removed by the Registrar during conflict resolution:
          </p>
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {allDeletionNotes.map((note) => (
              <div
                key={note.id}
                className="rounded-lg border border-slate-200 p-3 text-xs dark:border-white/10 dark:bg-white/5"
              >
                <div className="flex items-center justify-between">
                  <strong className="font-semibold text-navy-800 dark:text-mist-100">
                    {note.subjectCode ?? "Major meeting"} · {note.setName ?? "—"}
                  </strong>
                  <span className="text-slate-400">
                    {note.dayOfWeek} · {note.startTime && formatTime12h(note.startTime)}–{note.endTime && formatTime12h(note.endTime)}
                  </span>
                </div>
                <p className="mt-2 text-slate-600 dark:text-slate-300">
                  <span className="font-semibold">Reason:</span> {note.reason}
                </p>
                <p className="mt-1 text-[11px] text-slate-400">
                  Removed by {note.deletedBy ?? "Registrar"} on {new Date(note.deletedAt).toLocaleDateString()}
                </p>
              </div>
            ))}
          </div>
          <ModalActions>
            <Button type="button" variant="outline" block={false} onClick={() => setDeletionNotesOpen(false)}>
              Close
            </Button>
          </ModalActions>
        </div>
      </Modal>

      <Modal open={importOpen} onClose={() => !importing && setImportOpen(false)} title="Import Major Schedules" wide>
        <div className="space-y-4">
          <p className="text-sm text-slate-600 dark:text-slate-300">
            {importRows.length} row{importRows.length === 1 ? "" : "s"} ready for {currentSchoolYear}, {semesterLabel(semesterNumber)}. The import uses the selected term above.
          </p>
          <p className="text-xs text-slate-500">
            Required columns: {IMPORT_HEADERS.join(", ")}. Sets, subjects, rooms, and instructor emails must already exist.
          </p>
          {importIssues.length > 0 && (
            <div className="max-h-56 space-y-1 overflow-y-auto rounded-lg border border-red-200 bg-red-50 p-3 text-xs text-red-800 dark:border-red-400/20 dark:bg-red-400/5 dark:text-red-200">
              {importIssues.map((issue, index) => <p key={`${issue.row}:${index}`}>{issue.row ? `Row ${issue.row}: ` : ""}{issue.message}</p>)}
            </div>
          )}
          <div className="max-h-64 overflow-auto rounded-lg border border-slate-200 dark:border-white/10">
            <Table>
              <TableHead><TableHeader>Set</TableHeader><TableHeader>Subject</TableHeader><TableHeader>Day / Time</TableHeader><TableHeader>Room</TableHeader><TableHeader>Instructor</TableHeader></TableHead>
              <TableBody>
                {importRows.slice(0, 20).map((row, index) => (
                  <TableRow key={index}><TableCell>{importValue(row, "Set")}</TableCell><TableCell>{importValue(row, "Subject Code")}</TableCell><TableCell>{importValue(row, "Day")} · {importValue(row, "Start Time")}–{importValue(row, "End Time")}</TableCell><TableCell>{importValue(row, "Room") || "—"}</TableCell><TableCell>{importValue(row, "Instructor Email") || "Floating"}</TableCell></TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          {importRows.length > 20 && <p className="text-xs text-slate-500">Showing the first 20 rows.</p>}
          <ModalActions>
            <Button type="button" variant="outline" block={false} onClick={() => setImportOpen(false)} disabled={importing}>Cancel</Button>
            <Button type="button" block={false} onClick={() => void importSchedules()} isLoading={importing} loadingLabel="Importing…">Import {importRows.length} Rows</Button>
          </ModalActions>
        </div>
      </Modal>

      {/* Sticky Submission Footer */}
      <MajorScheduleStickyFooter
        submissions={submissions ?? []}
        userRole={user?.role ?? ""}
        allDeletionNotes={allDeletionNotes}
        saving={saving}
        onOpenDeletionNotes={() => setDeletionNotesOpen(true)}
        onSubmit={(submissionId) => setSubmitTarget(submissions?.find((submission) => submission.id === submissionId) ?? null)}
        onRequestEdit={(submission) => {
          setEditRequestTarget(submission);
          setFormError(null);
        }}
        onOpenRequirements={openRequirements}
        onCheckConflicts={async (submissionId) => {
          setFormError(null);
          try {
            const result = await authorityWorkflowService.getMajorScheduleConflicts(submissionId);
            setConflicts(result.conflicts);
            if (result.message) toast.success(result.message);
          } catch (err) {
            setFormError(err instanceof Error ? err.message : "");
          }
        }}
        onFinalize={(submissionId) =>
          void withRefresh(() => authorityWorkflowService.finalizeMajorSchedule(submissionId))
        }
        onReopen={(submissionId) => {
          const s = submissions?.find((sub) => sub.id === submissionId);
          if (s) {
            setReopenTarget(s);
            setFormError(null);
          }
        }}
      />
    </div>
  );
}

function MajorScheduleStickyFooter({
  submissions,
  userRole,
  allDeletionNotes,
  saving,
  onOpenDeletionNotes,
  onSubmit,
  onRequestEdit,
  onOpenRequirements,
  onCheckConflicts,
  onFinalize,
  onReopen,
}: {
  submissions: MajorScheduleSubmission[];
  userRole: string;
  allDeletionNotes: MajorScheduleDeletionNote[];
  saving: boolean;
  onOpenDeletionNotes: () => void;
  onSubmit: (submissionId: number) => void;
  onRequestEdit: (submission: MajorScheduleSubmission) => void;
  onOpenRequirements: (submissionId: number) => void;
  onCheckConflicts: (submissionId: number) => void;
  onFinalize: (submissionId: number) => void;
  onReopen: (submissionId: number) => void;
}) {
  const [selectedSubmissionId, setSelectedSubmissionId] = useState<number | null>(null);

  const activeSubmission = useMemo(() => {
    if (!submissions || submissions.length === 0) return null;
    if (selectedSubmissionId) {
      return submissions.find((s) => s.id === selectedSubmissionId) ?? submissions[0];
    }
    return submissions[0];
  }, [submissions, selectedSubmissionId]);

  if (!activeSubmission) return null;

  return (
      <StickyFooter>
      {/* Left: Department context, status & meetings summary */}
      <div className="flex flex-wrap items-center gap-3">
        {submissions.length > 1 ? (
          <div className="w-52">
            <Select
              items={submissions.map((s) => ({
                value: String(s.id),
                label: `${s.departmentAbbrev} (${s.status})`,
              }))}
              value={String(activeSubmission.id)}
              onValueChange={(val) => setSelectedSubmissionId(Number(val))}
            >
              <SelectTrigger className="h-8 text-xs font-semibold">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {submissions.map((s) => (
                  <SelectItem key={s.id} value={String(s.id)}>
                    {s.departmentAbbrev} — {s.departmentName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <h2 className="font-display text-sm font-semibold tracking-wide text-navy-800 dark:text-mist-100">
              {activeSubmission.departmentAbbrev}
            </h2>
            <span className="hidden text-xs text-slate-400 sm:inline">
              {activeSubmission.departmentName}
            </span>
          </div>
        )}

        <div className="flex items-center gap-2 border-l border-slate-200 pl-3 dark:border-white/10">
          <Badge tone={STATUS_TONES[activeSubmission.status] ?? "slate"}>
            {activeSubmission.status}
          </Badge>
          <span className="font-body text-xs text-slate-500 dark:text-slate-400">
            v{activeSubmission.version} · {activeSubmission.schedules.length} meeting{activeSubmission.schedules.length === 1 ? "" : "s"}
          </span>
        </div>
      </div>

      {/* Right: Actions */}
      <div className="flex flex-wrap items-center gap-2">
        {allDeletionNotes.length > 0 && (
          <Button
            type="button"
            variant="outline"
            block={false}
            className="h-8 text-xs"
            onClick={onOpenDeletionNotes}
          >
            <FileSearchIcon />
            <span>Removed by Registrar ({allDeletionNotes.length})</span>
          </Button>
        )}

        {/* Dean buttons */}
        {userRole === "dean" && ["draft", "reopened"].includes(activeSubmission.status) && (
          <Button
            type="button"
            block={false}
            className="h-8 text-xs"
            disabled={saving}
            onClick={() => onSubmit(activeSubmission.id)}
          >
            <CheckIcon size={14} />
            <span>Submit Major Schedule</span>
          </Button>
        )}

        {userRole === "dean" && ["submitted", "finalized"].includes(activeSubmission.status) && (
          <Button
            type="button"
            variant="outline"
            block={false}
            className="h-8 text-xs"
            onClick={() => onRequestEdit(activeSubmission)}
          >
            <EditIcon />
            <span>Request Edit</span>
          </Button>
        )}

        {/* Registrar buttons */}
        {userRole === "registrar" && activeSubmission.status === "submitted" && (
          <>
            <Button
              type="button"
              variant="outline"
              block={false}
              className="h-8 text-xs"
              onClick={() => onOpenRequirements(activeSubmission.id)}
            >
              <span>Requirements</span>
            </Button>
            <Button
              type="button"
              variant="outline"
              block={false}
              className="h-8 text-xs"
              onClick={() => onCheckConflicts(activeSubmission.id)}
            >
              <AlertTriangleIcon />
              <span>Check Conflicts</span>
            </Button>
            <Button
              type="button"
              block={false}
              className="h-8 text-xs"
              disabled={saving}
              onClick={() => onFinalize(activeSubmission.id)}
            >
              <CheckIcon size={14} />
              <span>Finalize</span>
            </Button>
          </>
        )}

        {userRole === "registrar" && activeSubmission.status === "finalized" && (
          <Button
            type="button"
            variant="outline"
            block={false}
            className="h-8 text-xs"
            disabled={saving}
            onClick={() => onReopen(activeSubmission.id)}
          >
            <RotateIcon />
            <span>Reopen for Dean</span>
          </Button>
        )}
      </div>
    </StickyFooter>
  );
}

function RegistrarMajorDeleteDialog({
  schedule,
  saving,
  error,
  onClose,
  onConfirm,
}: {
  schedule: MajorSchedule | null;
  saving: boolean;
  error: string | null;
  onClose: () => void;
  onConfirm: (reason: string) => Promise<void>;
}) {
  const [reason, setReason] = useState("");
  useEffect(() => {
    if (schedule) setReason("");
  }, [schedule]);

  return (
    <Modal open={schedule !== null} onClose={onClose} title="Remove Major Meeting">
      <form
        onSubmit={(event) => {
          event.preventDefault();
          void onConfirm(reason.trim());
        }}
        className="space-y-4"
        noValidate
      >
        <FormError message={error} />
        <p className="font-body text-sm text-slate-600 dark:text-slate-300">
          Remove <strong>{schedule?.subjectCode}</strong> from <strong>{schedule?.setName}</strong>? This change is permanent; an explanation is automatically recorded for the Dean.
        </p>
        <Textarea
          id="registrar-delete-reason"
          label="Reason for removal"
          hint="Explain why this meeting is being removed (minimum 10 characters)"
          value={reason}
          onChange={(event) => setReason(event.target.value)}
          required
          minLength={10}
        />
        <ModalActions>
          <Button type="button" variant="outline" block={false} onClick={onClose}>
            Cancel
          </Button>
          <Button
            type="submit"
            variant="danger"
            block={false}
            isLoading={saving}
            loadingLabel="Removing…"
            disabled={reason.trim().length < 10}
          >
            Remove Meeting
          </Button>
        </ModalActions>
      </form>
    </Modal>
  );
}

export default function MajorSchedulesRoute() {
  return (
    <RoleGuard allow={["dean", "registrar"]}>
      <MajorSchedulesPage />
    </RoleGuard>
  );
}
