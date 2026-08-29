import { useState, useMemo, useRef, type DragEvent, type ChangeEvent } from "react";
import * as XLSX from "xlsx";
import { toast } from "sonner";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import {
  AlertTriangleIcon,
  CheckIcon,
  CloseIcon,
  DownloadIcon,
  FileSearchIcon,
  UploadIcon,
} from "~/components/ui/icons";
import { ConfirmDialog, Modal, ModalActions } from "~/components/ui/modal";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "~/components/ui/table";
import { authorityWorkflowService } from "~/services/authority-workflow.service";
import { deanService, type DepartmentInstructor } from "~/services/dean.service";
import { programService } from "~/services/program.service";
import { scheduleService } from "~/services/schedule.service";
import { setService } from "~/services/set.service";
import { subjectService } from "~/services/subject.service";
import type { MajorScheduleMeetingInput } from "~/types/authority-workflow";

const IMPORT_HEADERS = [
  "Set",
  "Subject Code",
  "Room",
  "Day",
  "Start Time",
  "End Time",
  "Instructor Email",
  "Override Pattern",
  "Class Mode",
  "Session Mode",
];

const SAMPLE_TEMPLATE_ROWS = [
  {
    Set: "BSIT-1A",
    "Subject Code": "CC101",
    Room: "SHS 102",
    Day: "Monday",
    "Start Time": "07:00 AM",
    "End Time": "09:30 AM",
    "Instructor Email": "",
    "Override Pattern": "false",
    "Class Mode": "F2F",
    "Session Mode": "LEC",
  },
  {
    Set: "BSIT-1A",
    "Subject Code": "CC101",
    Room: "COMPUTER LAB 1",
    Day: "Monday",
    "Start Time": "01:00 PM",
    "End Time": "03:30 PM",
    "Instructor Email": "",
    "Override Pattern": "false",
    "Class Mode": "F2F",
    "Session Mode": "LAB",
  },
  {
    Set: "BSIT-1A",
    "Subject Code": "CC102",
    Room: "COMPUTER LAB 2",
    Day: "Monday",
    "Start Time": "10:30 AM",
    "End Time": "01:00 PM",
    "Instructor Email": "",
    "Override Pattern": "false",
    "Class Mode": "F2F",
    "Session Mode": "LAB",
  },
  {
    Set: "BSIT-1A",
    "Subject Code": "CC102",
    Room: "SHS 101",
    Day: "Tuesday",
    "Start Time": "07:00 AM",
    "End Time": "09:30 AM",
    "Instructor Email": "",
    "Override Pattern": "false",
    "Class Mode": "F2F",
    "Session Mode": "LEC",
  },
  {
    Set: "BSIT-1B",
    "Subject Code": "CC101",
    Room: "COMPUTER LAB 1",
    Day: "Tuesday",
    "Start Time": "08:00 AM",
    "End Time": "10:30 AM",
    "Instructor Email": "",
    "Override Pattern": "false",
    "Class Mode": "F2F",
    "Session Mode": "LAB",
  },
  {
    Set: "BSIT-1B",
    "Subject Code": "CC101",
    Room: "SHS 102",
    Day: "Wednesday",
    "Start Time": "07:00 AM",
    "End Time": "09:30 AM",
    "Instructor Email": "",
    "Override Pattern": "false",
    "Class Mode": "F2F",
    "Session Mode": "LEC",
  },
];

type RawRow = Record<string, unknown>;

type ParsedScheduleRow = {
  rowNumber: number;
  setName: string;
  subjectCode: string;
  roomName: string;
  dayOfWeek: string;
  startTimeRaw: string;
  endTimeRaw: string;
  startTimeNormalized: string | null;
  endTimeNormalized: string | null;
  instructorEmail: string;
  classMode: string;
  sessionMode: string;
  overridePattern: boolean;
  isValid: boolean;
  errors: string[];
  inputPayload?: MajorScheduleMeetingInput;
};

type RowOutcome = {
  rowNumber: number;
  setName: string;
  subjectCode: string;
  status: "created" | "failed" | "skipped";
  message: string;
};

type Stage = "preview" | "importing" | "results";

function getCellValue(row: RawRow, headerName: string): string {
  const key = Object.keys(row).find(
    (candidate) => candidate.trim().toLowerCase() === headerName.toLowerCase(),
  );
  return String(key == null ? "" : row[key] ?? "").trim();
}

function parseTimeString(value: string): string | null {
  const trimmed = value.trim();
  const match = trimmed.match(/^(\d{1,2}):(\d{2})(?:\s*([AaPp][Mm]))?$/);
  if (!match) return null;
  let hour = Number(match[1]);
  const minute = Number(match[2]);
  if (minute > 59) return null;
  if (match[3]) {
    if (hour < 1 || hour > 12) return null;
    if (match[3].toLowerCase() === "pm" && hour !== 12) hour += 12;
    if (match[3].toLowerCase() === "am" && hour === 12) hour = 0;
  } else if (hour > 23) {
    return null;
  }
  return `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
}

export function downloadMajorSchedulesTemplate() {
  const worksheet = XLSX.utils.json_to_sheet(SAMPLE_TEMPLATE_ROWS, {
    header: IMPORT_HEADERS,
  });
  worksheet["!cols"] = [
    { wch: 12 }, // Set
    { wch: 15 }, // Subject Code
    { wch: 18 }, // Room
    { wch: 14 }, // Day
    { wch: 14 }, // Start Time
    { wch: 14 }, // End Time
    { wch: 26 }, // Instructor Email
    { wch: 16 }, // Override Pattern
    { wch: 14 }, // Class Mode
    { wch: 14 }, // Session Mode
  ];
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Major Schedules");
  XLSX.writeFile(workbook, "major_schedules_template.xlsx");
}

type MajorSchedulesImportModalProps = {
  open: boolean;
  onClose: () => void;
  syId: number;
  semesterNumber: number;
  userRole: string;
  onImportSuccess: () => Promise<void>;
};

export function MajorSchedulesImportModal({
  open,
  onClose,
  syId,
  semesterNumber,
  userRole,
  onImportSuccess,
}: MajorSchedulesImportModalProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [stage, setStage] = useState<Stage>("preview");
  const [isDragging, setIsDragging] = useState(false);
  const [parsing, setParsing] = useState(false);
  const [parseError, setParseError] = useState<string | null>(null);
  const [parsedRows, setParsedRows] = useState<ParsedScheduleRow[]>([]);
  const [results, setResults] = useState<RowOutcome[]>([]);
  const [importProgress, setImportProgress] = useState<{ current: number; total: number } | null>(null);
  const [filterMode, setFilterMode] = useState<"all" | "valid" | "invalid">("all");
  const [changeFileConfirmOpen, setChangeFileConfirmOpen] = useState(false);
  const [removeFileConfirmOpen, setRemoveFileConfirmOpen] = useState(false);

  const validCount = useMemo(() => parsedRows.filter((r) => r.isValid).length, [parsedRows]);
  const invalidCount = useMemo(() => parsedRows.filter((r) => !r.isValid).length, [parsedRows]);

  const displayedRows = useMemo(() => {
    if (filterMode === "valid") return parsedRows.filter((r) => r.isValid);
    if (filterMode === "invalid") return parsedRows.filter((r) => !r.isValid);
    return parsedRows;
  }, [parsedRows, filterMode]);

  function resetState() {
    setSelectedFile(null);
    setParsedRows([]);
    setParseError(null);
    setImportProgress(null);
    setFilterMode("all");
    setResults([]);
    setStage("preview");
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  function handleChangeFileClick() {
    if (parsedRows.length > 0) {
      setChangeFileConfirmOpen(true);
    } else {
      resetState();
      fileInputRef.current?.click();
    }
  }

  function handleRemoveFileClick() {
    if (parsedRows.length > 0) {
      setRemoveFileConfirmOpen(true);
    } else {
      resetState();
    }
  }

  function handleModalClose() {
    if (stage === "importing") return;
    const anyCreated = results.some((r) => r.status === "created");
    resetState();
    onClose();
    if (anyCreated) {
      void onImportSuccess();
    }
  }

  async function processFile(file: File) {
    setSelectedFile(file);
    setParsing(true);
    setParseError(null);
    setParsedRows([]);
    setStage("preview");

    try {
      const buffer = await file.arrayBuffer();
      const workbook = XLSX.read(buffer, { type: "array" });
      const firstSheetName = workbook.SheetNames[0];
      if (!firstSheetName) throw new Error("The selected workbook has no sheets.");

      const worksheet = workbook.Sheets[firstSheetName];
      const rawRows = XLSX.utils
        .sheet_to_json<RawRow>(worksheet, { defval: "", raw: false })
        .filter((row) => Object.values(row).some((val) => String(val).trim()));

      if (rawRows.length === 0) {
        throw new Error("The selected spreadsheet contains no data rows.");
      }

      // Check headers
      const sheetHeaders = new Set(
        Object.keys(rawRows[0] ?? {}).map((h) => h.trim().toLowerCase()),
      );
      const missingHeaders = IMPORT_HEADERS.filter(
        (header) => !sheetHeaders.has(header.toLowerCase()),
      );
      if (missingHeaders.length > 0) {
        throw new Error(
          `Missing required column${missingHeaders.length > 1 ? "s" : ""}: ${missingHeaders.join(", ")}.`,
        );
      }

      // Load reference data for real-time validation
      const [programs, sets, subjects, rooms, instructors] = await Promise.all([
        programService.list().catch(() => []),
        setService.list({ syId, semesterNumber }).catch(() => []),
        subjectService.list().catch(() => []),
        scheduleService.listScheduleRooms().catch(() => []),
        deanService.listDepartmentInstructors().catch(() => [] as DepartmentInstructor[]),
      ]);

      const validated: ParsedScheduleRow[] = [];

      for (let i = 0; i < rawRows.length; i++) {
        const row = rawRows[i];
        const rowNumber = i + 2; // header is row 1
        const setName = getCellValue(row, "Set");
        const subjectCode = getCellValue(row, "Subject Code");
        const roomName = getCellValue(row, "Room");
        const dayOfWeek = getCellValue(row, "Day");
        const startTimeRaw = getCellValue(row, "Start Time");
        const endTimeRaw = getCellValue(row, "End Time");
        const instructorEmail = getCellValue(row, "Instructor Email");
        const classMode = (getCellValue(row, "Class Mode") || "F2F").toUpperCase();
        const sessionMode = (getCellValue(row, "Session Mode") || "LEC").toUpperCase();
        const overridePattern = ["true", "yes", "1"].includes(
          getCellValue(row, "Override Pattern").toLowerCase(),
        );

        const startTimeNormalized = parseTimeString(startTimeRaw);
        const endTimeNormalized = parseTimeString(endTimeRaw);

        const errors: string[] = [];

        // Match Set format e.g. BSIT-1A
        const setMatch = setName.match(/^(.+)-(\d+)([A-Za-z]+)$/);
        if (!setMatch) {
          errors.push(`Invalid Set format "${setName}" (e.g. BSIT-1A)`);
        }

        const program = setMatch
          ? programs.find((p) => p.abbrev.toLowerCase() === setMatch[1].toLowerCase())
          : undefined;
        if (setMatch && !program) {
          errors.push(`Program "${setMatch[1]}" not found`);
        }

        const targetSet = setMatch
          ? sets.find(
              (s) =>
                s.program.toLowerCase() === setMatch[1].toLowerCase() &&
                s.yearLevel === Number(setMatch[2]) &&
                s.setCode.toLowerCase() === setMatch[3].toLowerCase(),
            )
          : undefined;
        if (setMatch && !targetSet) {
          errors.push(`Set "${setName}" not found for this academic term`);
        }

        const targetSubject = setMatch
          ? subjects.find(
              (subj) =>
                subj.program.toLowerCase() === setMatch[1].toLowerCase() &&
                subj.yearLevel === Number(setMatch[2]) &&
                subj.semester === semesterNumber &&
                subj.code.toLowerCase() === subjectCode.toLowerCase(),
            )
          : undefined;
        if (!subjectCode) {
          errors.push("Missing subject code");
        } else if (setMatch && !targetSubject) {
          errors.push(`Subject "${subjectCode}" not found in ${setMatch[1]} Year ${setMatch[2]} Sem ${semesterNumber}`);
        }

        if (!dayOfWeek) {
          errors.push("Missing day of week");
        }

        if (!startTimeRaw) {
          errors.push("Missing start time");
        } else if (!startTimeNormalized) {
          errors.push(`Invalid start time "${startTimeRaw}" (e.g. 08:00 AM)`);
        }

        if (!endTimeRaw) {
          errors.push("Missing end time");
        } else if (!endTimeNormalized) {
          errors.push(`Invalid end time "${endTimeRaw}" (e.g. 11:00 AM)`);
        }

        const targetRoom = roomName
          ? rooms.find((r) => r.roomName.toLowerCase() === roomName.toLowerCase())
          : undefined;
        if (classMode === "F2F" && !roomName) {
          errors.push("F2F session requires a classroom assignment");
        } else if (roomName && !targetRoom) {
          errors.push(`Room "${roomName}" not found`);
        }

        const targetInstructor = instructorEmail
          ? instructors.find((inst) => inst.email?.toLowerCase() === instructorEmail.toLowerCase())
          : undefined;
        if (instructorEmail && !targetInstructor) {
          errors.push(`Instructor "${instructorEmail}" not found in department roster`);
        }

        const isValid = errors.length === 0;

        let inputPayload: MajorScheduleMeetingInput | undefined;
        if (isValid && program && targetSet && targetSubject) {
          inputPayload = {
            syId,
            semesterNumber,
            programId: program.id,
            setId: targetSet.id,
            subjectId: targetSubject.id,
            instructorId: targetInstructor?.instructorProfileId ?? null,
            roomId: targetRoom?.id ?? null,
            dayOfWeek,
            startTime: startTimeNormalized!,
            endTime: endTimeNormalized!,
            classMode,
            sessionMode,
            overrideMeetingPattern: overridePattern,
          };
        }

        validated.push({
          rowNumber,
          setName,
          subjectCode,
          roomName,
          dayOfWeek,
          startTimeRaw,
          endTimeRaw,
          startTimeNormalized,
          endTimeNormalized,
          instructorEmail,
          classMode,
          sessionMode,
          overridePattern,
          isValid,
          errors,
          inputPayload,
        });
      }

      setParsedRows(validated);
    } catch (err) {
      setParseError(err instanceof Error ? err.message : "Failed to parse spreadsheet.");
    } finally {
      setParsing(false);
    }
  }

  function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (file) void processFile(file);
  }

  function handleDragOver(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    setIsDragging(true);
  }

  function handleDragLeave() {
    setIsDragging(false);
  }

  function handleDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    setIsDragging(false);
    const file = event.dataTransfer.files?.[0];
    if (file) void processFile(file);
  }

  async function handleImportSubmit() {
    const validRowsToImport = parsedRows.filter((r) => r.isValid && r.inputPayload);
    if (validRowsToImport.length === 0) {
      toast.error("No valid schedule rows found to import.");
      return;
    }

    setStage("importing");
    setImportProgress({ current: 0, total: validRowsToImport.length });

    const outcomes: RowOutcome[] = [];
    let successCount = 0;
    const audience = userRole === "dean" ? "dean" : "registrar";

    for (let i = 0; i < validRowsToImport.length; i++) {
      const item = validRowsToImport[i];
      try {
        await authorityWorkflowService.createMajorSchedule(item.inputPayload!, audience);
        successCount++;
        outcomes.push({
          rowNumber: item.rowNumber,
          setName: item.setName,
          subjectCode: item.subjectCode,
          status: "created",
          message: `Saved as draft (${item.sessionMode}).`,
        });
      } catch (err) {
        outcomes.push({
          rowNumber: item.rowNumber,
          setName: item.setName,
          subjectCode: item.subjectCode,
          status: "failed",
          message: err instanceof Error ? err.message : "Failed to create meeting.",
        });
      }
      setImportProgress({ current: i + 1, total: validRowsToImport.length });
    }

    // Append skipped rows with client validation errors
    const invalidRows = parsedRows.filter((r) => !r.isValid);
    for (const item of invalidRows) {
      outcomes.push({
        rowNumber: item.rowNumber,
        setName: item.setName,
        subjectCode: item.subjectCode,
        status: "skipped",
        message: item.errors.join("; ") || "Validation error.",
      });
    }

    outcomes.sort((a, b) => a.rowNumber - b.rowNumber);

    setResults(outcomes);
    setStage("results");
    setImportProgress(null);

    if (successCount > 0) {
      toast.success(
        `Successfully imported ${successCount} major schedule${successCount === 1 ? "" : "s"}.`,
      );
      await onImportSuccess();
    }
  }

  return (
    <Modal
      open={open}
      onClose={handleModalClose}
      title={stage === "results" ? "Import Results" : "Import Major Schedules"}
      hideCloseButton={stage === "importing"}
      disableClose={stage === "importing"}
      wide
      xl
    >
      {/* ── STAGE 1: PREVIEW & UPLOAD ── */}
      {stage === "preview" && (
        <div className="space-y-5">
          {/* Top Header Banner & Template Download */}
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-slate-200 bg-slate-50/70 p-3.5 dark:border-white/10 dark:bg-white/2.5">
            <div className="flex items-center gap-2.5">
              <span className="grid size-9 place-items-center rounded-lg bg-gold-100 text-gold-700 dark:bg-gold-500/15 dark:text-gold-300">
                <FileSearchIcon />
              </span>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Bulk Schedule Importer
                </p>
                <p className="text-xs text-slate-600 dark:text-slate-300">
                  Upload <code>.xlsx</code> or <code>.csv</code> containing major class schedules.
                </p>
              </div>
            </div>

            <Button
              type="button"
              variant="outline"
              block={false}
              onClick={downloadMajorSchedulesTemplate}
              className="h-8 gap-1.5 text-xs font-medium"
            >
              <DownloadIcon />
              <span>Download Template</span>
            </Button>
          </div>

          {/* Drag & Drop File Zone */}
          {!selectedFile ? (
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`group relative flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed p-8 text-center transition-all ${
                isDragging
                  ? "border-gold-500 bg-gold-50/40 dark:border-gold-400 dark:bg-gold-500/10"
                  : "border-slate-300 bg-white hover:border-slate-400 hover:bg-slate-50/60 dark:border-white/15 dark:bg-surface dark:hover:border-white/25 dark:hover:bg-white/2.5"
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx,.xls,.csv"
                onChange={handleFileChange}
                className="hidden"
              />
              <span className="grid size-12 place-items-center rounded-full bg-slate-100 text-slate-500 transition-transform group-hover:scale-105 dark:bg-white/10 dark:text-slate-300">
                <UploadIcon />
              </span>
              <p className="mt-3 text-sm font-semibold text-navy-800 dark:text-mist-100">
                Click to select or drag and drop your spreadsheet here
              </p>
              <p className="mt-1 text-xs text-slate-400 dark:text-slate-500">
                Supported formats: Microsoft Excel (<code>.xlsx</code>, <code>.xls</code>) or CSV (<code>.csv</code>)
              </p>
            </div>
          ) : (
            /* File Attached Card */
            <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-white p-3.5 dark:border-white/10 dark:bg-surface">
              <div className="flex items-center gap-3">
                <span className="grid size-10 place-items-center rounded-lg bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300">
                  <CheckIcon size={20} />
                </span>
                <div>
                  <p className="text-sm font-semibold text-navy-800 dark:text-mist-100">
                    {selectedFile.name}
                  </p>
                  <p className="text-xs text-slate-400 dark:text-slate-500">
                    {(selectedFile.size / 1024).toFixed(1)} KB · {parsedRows.length} rows processed
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  block={false}
                  className="h-8 text-xs"
                  disabled={parsing}
                  onClick={handleChangeFileClick}
                >
                  Change File
                </Button>
                <button
                  type="button"
                  disabled={parsing}
                  onClick={handleRemoveFileClick}
                  aria-label="Remove file"
                  title="Remove file"
                  className="grid size-8 place-items-center rounded-lg text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-white/10 dark:hover:text-slate-200"
                >
                  <CloseIcon size={16} />
                </button>
              </div>
            </div>
          )}

          {/* Parsing Error Callout */}
          {parseError && (
            <div className="rounded-lg border border-red-200 bg-red-50 p-3.5 text-xs text-red-700 dark:border-red-900/50 dark:bg-red-950/20 dark:text-red-300">
              <div className="flex items-start gap-2">
                <span className="mt-0.5 shrink-0 text-red-600"><AlertTriangleIcon /></span>
                <div>
                  <p className="font-semibold">Spreadsheet Validation Error</p>
                  <p className="mt-0.5">{parseError}</p>
                </div>
              </div>
            </div>
          )}

          {/* Live Validation Summary & Preview Table */}
          {parsedRows.length > 0 && (
            <div className="space-y-3">
              {/* Filter Tabs & Counter Bar */}
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 pb-2 dark:border-white/10">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setFilterMode("all")}
                    className={`rounded-md px-2.5 py-1 text-xs font-semibold transition-colors ${
                      filterMode === "all"
                        ? "bg-navy-800 text-white dark:bg-gold-400 dark:text-navy-950"
                        : "text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-white/5"
                    }`}
                  >
                    All Rows ({parsedRows.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setFilterMode("valid")}
                    className={`rounded-md px-2.5 py-1 text-xs font-semibold transition-colors ${
                      filterMode === "valid"
                        ? "bg-emerald-600 text-white dark:bg-emerald-500"
                        : "text-emerald-700 hover:bg-emerald-50 dark:text-emerald-400 dark:hover:bg-emerald-950/20"
                    }`}
                  >
                    Ready to Import ({validCount})
                  </button>
                  {invalidCount > 0 && (
                    <button
                      type="button"
                      onClick={() => setFilterMode("invalid")}
                      className={`rounded-md px-2.5 py-1 text-xs font-semibold transition-colors ${
                        filterMode === "invalid"
                          ? "bg-red-600 text-white dark:bg-red-500"
                          : "text-red-700 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/20"
                      }`}
                    >
                      Errors ({invalidCount})
                    </button>
                  )}
                </div>

                {invalidCount > 0 && (
                  <span className="text-xs text-amber-700 dark:text-amber-300">
                    {invalidCount} row{invalidCount === 1 ? "" : "s"} will be skipped due to validation errors.
                  </span>
                )}
              </div>

              {/* Scrollable Preview Table */}
              <div className="max-h-72 overflow-y-auto rounded-lg border border-slate-200 dark:border-white/10">
                <Table>
                  <TableHead>
                    <TableHeader className="w-12 text-center">Row</TableHeader>
                    <TableHeader className="w-20 text-center">Status</TableHeader>
                    <TableHeader>Set</TableHeader>
                    <TableHeader>Subject</TableHeader>
                    <TableHeader>Room</TableHeader>
                    <TableHeader>Schedule</TableHeader>
                    <TableHeader>Mode</TableHeader>
                    <TableHeader>Diagnostics</TableHeader>
                  </TableHead>
                  <TableBody>
                    {displayedRows.map((row) => (
                      <TableRow key={row.rowNumber} className={row.isValid ? "" : "bg-red-50/30 dark:bg-red-950/10"}>
                        <TableCell className="text-center font-mono text-xs text-slate-500">
                          {row.rowNumber}
                        </TableCell>
                        <TableCell className="text-center">
                          {row.isValid ? (
                            <Badge tone="emerald">Valid</Badge>
                          ) : (
                            <Badge tone="red">Error</Badge>
                          )}
                        </TableCell>
                        <TableCell className="font-semibold text-navy-800 dark:text-mist-100">
                          {row.setName}
                        </TableCell>
                        <TableCell className="font-medium text-slate-700 dark:text-slate-200">
                          {row.subjectCode}
                        </TableCell>
                        <TableCell className="text-xs text-slate-600 dark:text-slate-300">
                          {row.roomName || "—"}
                        </TableCell>
                        <TableCell className="text-xs text-slate-600 dark:text-slate-300">
                          <span className="font-medium">{row.dayOfWeek}</span>{" "}
                          <span>
                            {row.startTimeRaw}–{row.endTimeRaw}
                          </span>
                        </TableCell>
                        <TableCell className="text-xs text-slate-500 dark:text-slate-400">
                          {row.classMode} · {row.sessionMode}
                        </TableCell>
                        <TableCell className="text-xs">
                          {row.isValid ? (
                            <span className="text-emerald-600 dark:text-emerald-400">Ready to save</span>
                          ) : (
                            <div className="flex items-center gap-1 text-red-600 dark:text-red-400">
                              <span className="shrink-0 text-red-600"><AlertTriangleIcon /></span>
                              <span className="line-clamp-1">{row.errors.join("; ")}</span>
                            </div>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}

          {/* Modal Actions */}
          <ModalActions>
            <Button
              type="button"
              variant="outline"
              block={false}
              onClick={handleModalClose}
            >
              Cancel
            </Button>

            <Button
              type="button"
              block={false}
              disabled={validCount === 0 || parsing}
              onClick={handleImportSubmit}
            >
              <CheckIcon size={16} />
              <span>
                {validCount > 0 ? `Import ${validCount} Schedule${validCount === 1 ? "" : "s"}` : "Import Schedules"}
              </span>
            </Button>
          </ModalActions>
        </div>
      )}

      {/* ── STAGE 2: IMPORTING PROGRESS (REPLACES MODAL BODY) ── */}
      {stage === "importing" && (
        <div className="flex flex-col items-center justify-center gap-4 py-12 text-center">
          <div className="space-y-1">
            <p className="font-display text-lg font-normal text-navy-800 dark:text-mist-100">
              Importing Major Schedules…
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Saving meeting {importProgress?.current ?? 0} of {importProgress?.total ?? validCount}
            </p>
          </div>
          <div className="h-2 w-full max-w-sm overflow-hidden rounded-full bg-slate-200 dark:bg-white/10">
            <div
              className="h-full bg-gold-500 transition-all duration-150"
              style={{
                width: `${
                  importProgress && importProgress.total > 0
                    ? Math.round((importProgress.current / importProgress.total) * 100)
                    : 0
                }%`,
              }}
            />
          </div>
          <span className="font-mono text-xs text-slate-500 dark:text-slate-400">
            {importProgress && importProgress.total > 0
              ? Math.round((importProgress.current / importProgress.total) * 100)
              : 0}%
          </span>
        </div>
      )}

      {/* ── STAGE 3: RESULTS TABLE (REPLACES MODAL BODY) ── */}
      {stage === "results" && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-slate-200 bg-slate-50/70 p-3.5 dark:border-white/10 dark:bg-white/2.5">
            <div className="flex items-center gap-2">
              <Badge tone="emerald">
                {results.filter((r) => r.status === "created").length} created
              </Badge>
              {results.some((r) => r.status !== "created") && (
                <Badge tone="red">
                  {results.filter((r) => r.status !== "created").length} not created
                </Badge>
              )}
              <span className="text-xs text-slate-500 dark:text-slate-400">
                — saved as drafts under the current build.
              </span>
            </div>
          </div>

          <div className="max-h-80 overflow-y-auto rounded-lg border border-slate-200 dark:border-white/10">
            <Table>
              <TableHead>
                <TableHeader className="w-16 text-center">Row</TableHeader>
                <TableHeader className="w-24 text-center">Status</TableHeader>
                <TableHeader>Set</TableHeader>
                <TableHeader>Subject</TableHeader>
                <TableHeader>Result</TableHeader>
              </TableHead>
              <TableBody>
                {results.map((row) => (
                  <TableRow
                    key={row.rowNumber}
                    className={row.status === "created" ? "" : "bg-red-50/30 dark:bg-red-950/10"}
                  >
                    <TableCell className="text-center font-mono text-xs text-slate-500">
                      {row.rowNumber}
                    </TableCell>
                    <TableCell className="text-center">
                      {row.status === "created" ? (
                        <Badge tone="emerald">Saved</Badge>
                      ) : row.status === "failed" ? (
                        <Badge tone="red">Failed</Badge>
                      ) : (
                        <Badge tone="slate">Skipped</Badge>
                      )}
                    </TableCell>
                    <TableCell className="font-semibold text-navy-800 dark:text-mist-100">
                      {row.setName}
                    </TableCell>
                    <TableCell className="font-medium text-slate-700 dark:text-slate-200">
                      {row.subjectCode}
                    </TableCell>
                    <TableCell className="text-xs">
                      {row.status === "created" ? (
                        <span className="font-medium text-emerald-600 dark:text-emerald-400">
                          {row.message}
                        </span>
                      ) : (
                        <span className="text-red-600 dark:text-red-400">{row.message}</span>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          <ModalActions>
            <Button type="button" variant="outline" block={false} onClick={resetState}>
              Import Another File
            </Button>
            <Button type="button" block={false} onClick={handleModalClose}>
              Done
            </Button>
          </ModalActions>
        </div>
      )}

      {/* Change File Confirmation Dialog */}
      <ConfirmDialog
        open={changeFileConfirmOpen}
        onClose={() => setChangeFileConfirmOpen(false)}
        onConfirm={async () => {
          setChangeFileConfirmOpen(false);
          resetState();
          fileInputRef.current?.click();
        }}
        title="Change Spreadsheet File?"
        confirmLabel="Change File"
        confirmVariant="danger"
        loadingLabel="Changing…"
      >
        <p>
          You currently have <strong>{parsedRows.length}</strong> schedule row{parsedRows.length === 1 ? "" : "s"} loaded from <strong>{selectedFile?.name}</strong>.
        </p>
        <p className="mt-2 text-xs text-slate-500">
          Selecting a new file will discard the current preview and validation results. Are you sure you want to continue?
        </p>
      </ConfirmDialog>

      {/* Remove File Confirmation Dialog */}
      <ConfirmDialog
        open={removeFileConfirmOpen}
        onClose={() => setRemoveFileConfirmOpen(false)}
        onConfirm={async () => {
          setRemoveFileConfirmOpen(false);
          resetState();
        }}
        title="Remove Selected File?"
        confirmLabel="Remove File"
        confirmVariant="danger"
        loadingLabel="Removing…"
      >
        <p>
          Are you sure you want to remove <strong>{selectedFile?.name}</strong>?
        </p>
        <p className="mt-2 text-xs text-slate-500">
          The <strong>{parsedRows.length}</strong> loaded schedule row{parsedRows.length === 1 ? "" : "s"} and diagnostic results will be discarded.
        </p>
      </ConfirmDialog>
    </Modal>
  );
}
