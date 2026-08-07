import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import * as XLSX from "xlsx";
import { FormError } from "~/components/forms/form-error";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { DownloadIcon, PlusIcon, TrashIcon, UploadIcon } from "~/components/ui/icons";
import { FieldChrome, Input } from "~/components/ui/input";
import { Popover } from "~/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "~/components/ui/select";
import { EnrollmentSectionCard } from "~/features/enrollment/enrollment-section-card";
import { EnrolledStatusPicker } from "~/features/enrollment/enrolled-status-picker";
import { ProgramWizardFooter } from "~/features/subjects/program-wizard-footer";
import { useYearLevels } from "~/hooks/use-year-levels";
import {
  studentService,
  type ImportStudentInput,
  type ImportStudentResponse,
} from "~/services/student.service";
import type { SchoolYearOption } from "~/services/school-year.service";
import type { Program } from "~/types/program";
import type { Semester } from "~/types/semester";
import type { ClassSet } from "~/types/set";
import type { Subject } from "~/types/subject";

export type BatchEnrolledStatus = "Regular" | "Irregular";

type RosterRow = {
  studentNumber: string;
  firstName: string;
  middleName: string;
  lastName: string;
  contactNumber: string;
  email: string;
  programId: string;
  yearLevel: string;
  setId: string;
  studentType: string;
  syId: string;
  semesterNumber: string;
  subjectCodes: string;
};

const EMPTY_ROW: RosterRow = {
  studentNumber: "",
  firstName: "",
  middleName: "",
  lastName: "",
  contactNumber: "",
  email: "",
  programId: "",
  yearLevel: "",
  setId: "",
  studentType: "",
  syId: "",
  semesterNumber: "",
  subjectCodes: "",
};

const CSV_HEADERS = [
  "Student Number",
  "First Name",
  "Middle Name",
  "Last Name",
  "Contact Number",
  "Email",
  "Program",
  "Year Level",
  "Set",
  "Student Type",
  "School Year",
  "Semester",
  "Subject Codes",
];

const TEMPLATE_ROW = [
  "2024-0001",
  "Juan",
  "Santos",
  "Dela Cruz",
  "09171234567",
  "juan.delacruz@example.com",
  "BSIT",
  "1",
  "A",
  "New Student",
  "2026-2027",
  "1st Semester",
  "",
];

function downloadTemplate(filename: string) {
  const lines = [
    CSV_HEADERS.map((h) => `"${h}"`).join(","),
    TEMPLATE_ROW.map((c) => `"${c}"`).join(","),
  ];
  const blob = new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function parseCsvLine(line: string): string[] {
  const cells: string[] = [];
  let current = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (ch === "," && !inQuotes) {
      cells.push(current.trim());
      current = "";
    } else {
      current += ch;
    }
  }
  cells.push(current.trim());
  return cells;
}

type ParsedCsvRow = {
  studentNumber: string;
  firstName: string;
  middleName: string;
  lastName: string;
  contactNumber: string;
  email: string;
  program: string;
  yearLevel: string;
  section: string;
  studentType: string;
  schoolYear: string;
  semester: string;
  subjectCodes: string;
};

function parseCsv(text: string): ParsedCsvRow[] {
  const keys: (keyof ParsedCsvRow)[] = [
    "studentNumber",
    "firstName",
    "middleName",
    "lastName",
    "contactNumber",
    "email",
    "program",
    "yearLevel",
    "section",
    "studentType",
    "schoolYear",
    "semester",
    "subjectCodes",
  ];
  const lines = text
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);
  const rows: ParsedCsvRow[] = [];
  for (const line of lines) {
    const cells = parseCsvLine(line);
    const firstCell = (cells[0] || "").toLowerCase();
    if (
      ["student number", "student_number", "studentid", "student id", "set", "section"].includes(
        firstCell,
      )
    ) {
      continue;
    }
    const row = {
      studentNumber: "",
      firstName: "",
      middleName: "",
      lastName: "",
      contactNumber: "",
      email: "",
      program: "",
      yearLevel: "",
      section: "",
      studentType: "",
      schoolYear: "",
      semester: "",
      subjectCodes: "",
    } satisfies ParsedCsvRow;
    keys.forEach((key, i) => {
      row[key] = cells[i] ?? "";
    });
    if (row.firstName || row.lastName) rows.push(row);
  }
  return rows;
}

function rowHasContent(row: RosterRow): boolean {
  return Object.values(row).some((v) => v.trim() !== "");
}

type EnrollmentBatchImportProps = {
  programs: Program[];
  sets: ClassSet[];
  subjects: Subject[];
  schoolYears: SchoolYearOption[];
  semesters: Semester[];
  studentTypes: string[];
  academicStatuses: string[];
  onDirtyChange: (dirty: boolean) => void;
  onCancel: () => void;
  onFinished: (message: string) => void;
};

/** Batch enroll with labeled fields per student; file import is optional. */
export function EnrollmentBatchImport({
  programs,
  sets,
  subjects,
  schoolYears,
  semesters,
  studentTypes,
  academicStatuses,
  onDirtyChange,
  onCancel,
  onFinished,
}: EnrollmentBatchImportProps) {
  const fileRef = useRef<HTMLInputElement>(null);
  const { yearLevelIds, yearLevelLabel } = useYearLevels();
  const [enrolledStatus, setEnrolledStatus] = useState<BatchEnrolledStatus>("Regular");
  const [rows, setRows] = useState<RosterRow[]>([{ ...EMPTY_ROW }]);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<ImportStudentResponse | null>(null);

  const isIrregular = enrolledStatus === "Irregular";

  useEffect(() => {
    onDirtyChange(rows.some(rowHasContent));
  }, [rows, onDirtyChange]);

  const readyCount = useMemo(
    () =>
      rows.filter(
        (r) =>
          r.firstName.trim() &&
          r.lastName.trim() &&
          r.contactNumber.trim() &&
          r.email.trim() &&
          r.programId &&
          r.yearLevel &&
          r.studentType &&
          r.syId &&
          r.semesterNumber &&
          (isIrregular || r.setId) &&
          (!isIrregular || r.subjectCodes.trim()),
      ).length,
    [rows, isIrregular],
  );

  function mapCsvToRoster(parsed: ParsedCsvRow[]): RosterRow[] {
    return parsed.map((row) => {
      const program = programs.find(
        (p) => p.abbrev.toLowerCase() === row.program.trim().toLowerCase(),
      );
      const yearLevel = Number(row.yearLevel);
      const schoolYear = schoolYears.find(
        (sy) => sy.schoolYear.toLowerCase() === row.schoolYear.trim().toLowerCase(),
      );
      const semester = semesters.find((s) => {
        const value = row.semester.trim().toLowerCase();
        return (
          s.semester.toLowerCase() === value ||
          s.displayName?.toLowerCase() === value ||
          String(s.semesterNumber) === value
        );
      });
      const set = program
        ? sets.find(
            (s) =>
              s.program.toLowerCase() === row.program.trim().toLowerCase() &&
              s.yearLevel === yearLevel &&
              s.setCode.toLowerCase() === row.section.trim().toLowerCase(),
          )
        : undefined;

      return {
        studentNumber: row.studentNumber,
        firstName: row.firstName,
        middleName: row.middleName,
        lastName: row.lastName,
        contactNumber: row.contactNumber,
        email: row.email,
        programId: program ? String(program.id) : "",
        yearLevel: Number.isInteger(yearLevel) && yearLevel > 0 ? String(yearLevel) : "",
        setId: set ? String(set.id) : "",
        studentType: row.studentType,
        syId: schoolYear ? String(schoolYear.id) : "",
        semesterNumber: semester ? String(semester.semesterNumber) : "",
        subjectCodes: row.subjectCodes,
      };
    });
  }

  function loadFromCsv(text: string, label: string) {
    const parsed = parseCsv(text);
    if (parsed.length === 0) {
      setError(`No valid student rows found in ${label}.`);
      return;
    }
    setRows(mapCsvToRoster(parsed));
    setResult(null);
    setError(null);
    toast.success(`Loaded ${parsed.length} student${parsed.length === 1 ? "" : "s"}.`);
  }

  function readFile(file: File) {
    const isXlsx = file.name.toLowerCase().endsWith(".xlsx");
    if (isXlsx) {
      const reader = new FileReader();
      reader.onload = (ev) => {
        const data = new Uint8Array(ev.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: "array" });
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        loadFromCsv(XLSX.utils.sheet_to_csv(sheet), "the file");
      };
      reader.readAsArrayBuffer(file);
      return;
    }
    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result;
      if (typeof text === "string") loadFromCsv(text, "the file");
    };
    reader.readAsText(file);
  }

  function openFilePicker(accept: ".csv" | ".xlsx") {
    const input = fileRef.current;
    if (!input) return;
    input.accept = accept;
    input.click();
  }

  function updateRow(index: number, patch: Partial<RosterRow>) {
    setRows((prev) => prev.map((row, i) => (i === index ? { ...row, ...patch } : row)));
  }

  function prepareRow(row: RosterRow): ImportStudentInput {
    const program = programs.find((p) => String(p.id) === row.programId);
    const yearLevel = Number(row.yearLevel);
    const schoolYear = schoolYears.find((sy) => String(sy.id) === row.syId);
    const semester = semesters.find((s) => String(s.semesterNumber) === row.semesterNumber);
    const set = sets.find((s) => String(s.id) === row.setId);
    const codes = row.subjectCodes
      .split(/[,;]+/)
      .map((c) => c.trim())
      .filter(Boolean);
    const subjectIds = codes.map(
      (code) =>
        subjects.find(
          (s) =>
            program &&
            s.program.toLowerCase() === program.abbrev.toLowerCase() &&
            s.code.toLowerCase() === code.toLowerCase(),
        )?.id,
    );

    const missing: string[] = [];
    if (!program) missing.push("program");
    if (!Number.isInteger(yearLevel) || yearLevel < 1) missing.push("year level");
    if (!schoolYear) missing.push("school year");
    if (!semester) missing.push("semester");
    if (!isIrregular && !set) missing.push("set");
    if (!row.studentType.trim()) missing.push("student type");
    if (isIrregular && codes.length === 0) missing.push("subject codes");
    if (isIrregular && subjectIds.some((id) => id == null)) missing.push("recognized subject codes");
    if (missing.length > 0 || !program || !schoolYear || !semester) {
      return {
        error: `Invalid or missing ${missing.join(", ")}.`,
        studentId: row.studentNumber.trim() || undefined,
      };
    }

    return {
      input: {
        studentId: row.studentNumber.trim() || undefined,
        firstName: row.firstName.trim(),
        midName: row.middleName.trim() || undefined,
        lastName: row.lastName.trim(),
        mobile: row.contactNumber.trim(),
        email: row.email.trim(),
        programId: program.id,
        yearLevel,
        setId: isIrregular ? null : (set?.id ?? null),
        studentType: row.studentType.trim(),
        enrolledStatus,
        syId: schoolYear.id,
        semesterNumber: semester.semesterNumber,
        subjectIds: subjectIds.filter((id): id is number => id != null),
      },
    };
  }

  async function handleEnroll() {
    const valid = rows.filter(rowHasContent);
    if (valid.length === 0) {
      setError("Add at least one student before enrolling.");
      return;
    }
    setError(null);
    setIsLoading(true);
    try {
      const res = await studentService.importRecords(valid.map(prepareRow));
      setResult(res);
      setRows([{ ...EMPTY_ROW }]);
      onDirtyChange(false);
      if (res.failed === 0) {
        onFinished(`Enrolled ${res.created} student${res.created === 1 ? "" : "s"}.`);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Import failed.");
    } finally {
      setIsLoading(false);
    }
  }

  if (result) {
    return (
      <div className="flex flex-col gap-5">
        <EnrollmentSectionCard title="Import results">
          <div className="grid grid-cols-3 gap-4 border-b border-slate-200 pb-4 dark:border-white/10">
            <div>
              <p className="font-body text-xs text-slate-500">Created</p>
              <p className="mt-0.5 font-display text-2xl tabular-nums text-emerald-600 dark:text-emerald-400">
                {result.created}
              </p>
            </div>
            <div>
              <p className="font-body text-xs text-slate-500">Failed</p>
              <p className="mt-0.5 font-display text-2xl tabular-nums text-red-600 dark:text-red-400">
                {result.failed}
              </p>
            </div>
            <div>
              <p className="font-body text-xs text-slate-500">Total</p>
              <p className="mt-0.5 font-display text-2xl tabular-nums text-navy-800 dark:text-mist-100">
                {result.total}
              </p>
            </div>
          </div>
          <ul className="mt-3 max-h-64 divide-y divide-slate-100 overflow-y-auto dark:divide-white/5">
            {result.results.map((r) => (
              <li key={r.row} className="flex items-center justify-between gap-3 py-2.5">
                <div className="min-w-0">
                  <p className="font-body text-sm text-navy-800 dark:text-mist-100">
                    Row {r.row}
                    {r.student_id ? (
                      <span className="ml-2 font-body text-xs text-slate-400">{r.student_id}</span>
                    ) : null}
                  </p>
                  {r.message ? (
                    <p className="truncate font-body text-xs text-slate-500">{r.message}</p>
                  ) : null}
                </div>
                <Badge tone={r.status === "created" ? "emerald" : "red"}>
                  {r.status === "created" ? "Created" : "Failed"}
                </Badge>
              </li>
            ))}
          </ul>
        </EnrollmentSectionCard>

        <ProgramWizardFooter
          backLabel="Add more"
          onBack={() => {
            setResult(null);
            setRows([{ ...EMPTY_ROW }]);
          }}
          primaryLabel="Done"
          onPrimary={() => onFinished("")}
        />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5">
      <FormError message={error} />

      <EnrollmentSectionCard
        title="Batch settings"
        action={
          <div className="flex flex-wrap items-center gap-2">
            <input
              ref={fileRef}
              type="file"
              accept=".csv,.xlsx"
              className="sr-only"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) readFile(file);
                if (fileRef.current) fileRef.current.value = "";
              }}
            />
            <Popover
              label="Import"
              trigger={
                <>
                  <UploadIcon size={14} />
                  Import
                </>
              }
              triggerClassName="flex cursor-pointer items-center justify-center gap-2 rounded-lg border border-slate-300 px-3 py-1.5 font-body text-sm font-medium text-navy-700 transition-all duration-150 hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-400 disabled:cursor-not-allowed disabled:opacity-60 dark:border-white/15 dark:text-slate-200 dark:hover:bg-white/10"
              className="w-44 p-1.5"
            >
              {(close) => (
                <>
                  <button
                    type="button"
                    role="menuitem"
                    onClick={() => {
                      close();
                      openFilePicker(".csv");
                    }}
                    disabled={isLoading}
                    className="flex w-full cursor-pointer items-center gap-2.5 rounded-md p-2.5 text-left font-body text-sm font-medium text-slate-600 transition-colors duration-150 hover:bg-slate-100 hover:text-navy-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-400 disabled:cursor-not-allowed disabled:opacity-60 dark:text-slate-300 dark:hover:bg-white/5 dark:hover:text-white"
                  >
                    Import CSV
                  </button>
                  <button
                    type="button"
                    role="menuitem"
                    onClick={() => {
                      close();
                      openFilePicker(".xlsx");
                    }}
                    disabled={isLoading}
                    className="flex w-full cursor-pointer items-center gap-2.5 rounded-md p-2.5 text-left font-body text-sm font-medium text-slate-600 transition-colors duration-150 hover:bg-slate-100 hover:text-navy-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-400 disabled:cursor-not-allowed disabled:opacity-60 dark:text-slate-300 dark:hover:bg-white/5 dark:hover:text-white"
                  >
                    Import Excel
                  </button>
                </>
              )}
            </Popover>
            <button
              type="button"
              onClick={() =>
                downloadTemplate(
                  isIrregular
                    ? "enrollment-irregular-roster.csv"
                    : "enrollment-regular-roster.csv",
                )
              }
              className="inline-flex cursor-pointer items-center gap-1.5 font-body text-xs font-medium text-navy-700 hover:text-navy-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-400 dark:text-gold-300"
            >
              <DownloadIcon size={14} />
              Template
            </button>
          </div>
        }
      >
        <EnrolledStatusPicker
          value={enrolledStatus}
          options={academicStatuses.length > 0 ? academicStatuses : ["Regular", "Irregular"]}
          onChange={(v) => {
            setEnrolledStatus(v as BatchEnrolledStatus);
            setRows((prev) => prev.map((row) => ({ ...row, setId: v === "Irregular" ? "" : row.setId })));
          }}
        />
        <p className="mt-3 font-body text-xs text-slate-500 dark:text-slate-400">
          Fill the student forms below, or use Import to load a CSV/Excel roster into the fields.
        </p>
      </EnrollmentSectionCard>

      {rows.map((row, index) => {
        const selectedProgram = programs.find((p) => String(p.id) === row.programId);
        const yearOptions = yearLevelIds.filter((y) => y <= (selectedProgram?.lengthYears ?? 6));
        const filteredSets = selectedProgram
          ? sets.filter(
              (s) =>
                s.program === selectedProgram.abbrev &&
                (!row.yearLevel || String(s.yearLevel) === row.yearLevel),
            )
          : [];

        return (
          <EnrollmentSectionCard
            key={index}
            title={`Student ${index + 1}`}
            action={
              rows.length > 1 ? (
                <button
                  type="button"
                  aria-label={`Remove student ${index + 1}`}
                  disabled={isLoading}
                  onClick={() => setRows((prev) => prev.filter((_, i) => i !== index))}
                  className="inline-flex cursor-pointer items-center gap-1 font-body text-xs font-medium text-slate-500 hover:text-red-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-400 disabled:opacity-40"
                >
                  <TrashIcon />
                  Remove
                </button>
              ) : undefined
            }
          >
            <div className="flex flex-col gap-4">
              <h3 className="font-body text-sm font-semibold text-navy-800 dark:text-mist-100">
                Basic Information
              </h3>
              <div className="grid gap-3 sm:grid-cols-2">
                <Input
                  id={`batch-${index}-id`}
                  label="Student ID (Optional)"
                  value={row.studentNumber}
                  disabled={isLoading}
                  placeholder="e.g. 2024-0001"
                  onChange={(e) => updateRow(index, { studentNumber: e.target.value })}
                />
                <Input
                  id={`batch-${index}-type`}
                  label="Student Type"
                  value={row.studentType}
                  disabled={isLoading}
                  list={`batch-${index}-type-list`}
                  placeholder="Select or type"
                  required
                  onChange={(e) => updateRow(index, { studentType: e.target.value })}
                />
                <datalist id={`batch-${index}-type-list`}>
                  {studentTypes.map((t) => (
                    <option key={t} value={t} />
                  ))}
                </datalist>
              </div>
              <div className="grid gap-3 sm:grid-cols-3">
                <Input
                  id={`batch-${index}-first`}
                  label="First Name"
                  required
                  value={row.firstName}
                  disabled={isLoading}
                  onChange={(e) => updateRow(index, { firstName: e.target.value })}
                />
                <Input
                  id={`batch-${index}-mid`}
                  label="Middle Name (Optional)"
                  value={row.middleName}
                  disabled={isLoading}
                  onChange={(e) => updateRow(index, { middleName: e.target.value })}
                />
                <Input
                  id={`batch-${index}-last`}
                  label="Last Name"
                  required
                  value={row.lastName}
                  disabled={isLoading}
                  onChange={(e) => updateRow(index, { lastName: e.target.value })}
                />
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <Input
                  id={`batch-${index}-mobile`}
                  label="Mobile Number"
                  required
                  inputMode="numeric"
                  maxLength={11}
                  value={row.contactNumber}
                  disabled={isLoading}
                  placeholder="e.g. 09171234567"
                  onChange={(e) =>
                    updateRow(index, {
                      contactNumber: e.target.value.replace(/\D/g, "").slice(0, 11),
                    })
                  }
                />
                <Input
                  id={`batch-${index}-email`}
                  label="Email Address"
                  type="email"
                  required
                  value={row.email}
                  disabled={isLoading}
                  onChange={(e) => updateRow(index, { email: e.target.value })}
                />
              </div>

              <h3 className="mt-2 font-body text-sm font-semibold text-navy-800 dark:text-mist-100">
                Academic Information
              </h3>
              <div className="grid gap-3 sm:grid-cols-2">
                <FieldChrome id={`batch-${index}-program`} label="Program" required>
                  <Select
                    items={[
                      { value: "", label: "Select a program" },
                      ...programs.map((p) => ({
                        value: String(p.id),
                        label: `${p.abbrev} — ${p.name}`,
                      })),
                    ]}
                    value={row.programId}
                    onValueChange={(v) =>
                      updateRow(index, { programId: v as string, setId: "", yearLevel: "" })
                    }
                  >
                    <SelectTrigger id={`batch-${index}-program`} disabled={isLoading}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Select a program</SelectItem>
                      {programs.map((p) => (
                        <SelectItem key={p.id} value={String(p.id)}>
                          {p.abbrev} — {p.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </FieldChrome>

                <FieldChrome id={`batch-${index}-year`} label="Year Level" required>
                  <Select
                    items={[
                      { value: "", label: "Select a year" },
                      ...yearOptions.map((y) => ({ value: String(y), label: yearLevelLabel(y) })),
                    ]}
                    value={row.yearLevel}
                    onValueChange={(v) => updateRow(index, { yearLevel: v as string, setId: "" })}
                  >
                    <SelectTrigger id={`batch-${index}-year`} disabled={isLoading}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Select a year</SelectItem>
                      {yearOptions.map((y) => (
                        <SelectItem key={y} value={String(y)}>
                          {yearLevelLabel(y)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </FieldChrome>
              </div>

              <div className={`grid gap-3 ${isIrregular ? "sm:grid-cols-2" : "sm:grid-cols-3"}`}>
                {!isIrregular ? (
                  <FieldChrome id={`batch-${index}-set`} label="Class Set" required>
                    <Select
                      items={[
                        { value: "", label: "Select a set" },
                        ...filteredSets.map((s) => ({ value: String(s.id), label: s.setCode })),
                      ]}
                      value={row.setId}
                      onValueChange={(v) => updateRow(index, { setId: v as string })}
                    >
                      <SelectTrigger id={`batch-${index}-set`} disabled={isLoading}>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">Select a set</SelectItem>
                        {filteredSets.map((s) => (
                          <SelectItem key={s.id} value={String(s.id)}>
                            {s.setCode}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </FieldChrome>
                ) : (
                  <Input
                    id={`batch-${index}-subjects`}
                    label="Subject Codes"
                    required
                    hint="Comma-separated, e.g. IT 101, IT 102"
                    value={row.subjectCodes}
                    disabled={isLoading}
                    onChange={(e) => updateRow(index, { subjectCodes: e.target.value })}
                  />
                )}

                <FieldChrome id={`batch-${index}-sy`} label="School Year" required>
                  <Select
                    items={[
                      { value: "", label: "Select a school year" },
                      ...schoolYears.map((sy) => ({
                        value: String(sy.id),
                        label: sy.schoolYear,
                      })),
                    ]}
                    value={row.syId}
                    onValueChange={(v) => updateRow(index, { syId: v as string })}
                  >
                    <SelectTrigger id={`batch-${index}-sy`} disabled={isLoading}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Select a school year</SelectItem>
                      {schoolYears.map((sy) => (
                        <SelectItem key={sy.id} value={String(sy.id)}>
                          {sy.schoolYear}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </FieldChrome>

                <FieldChrome id={`batch-${index}-sem`} label="Semester" required>
                  <Select
                    items={[
                      { value: "", label: "Select a semester" },
                      ...semesters.map((s) => ({
                        value: String(s.semesterNumber),
                        label: s.semester,
                      })),
                    ]}
                    value={row.semesterNumber}
                    onValueChange={(v) => updateRow(index, { semesterNumber: v as string })}
                  >
                    <SelectTrigger id={`batch-${index}-sem`} disabled={isLoading}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Select a semester</SelectItem>
                      {semesters.map((s) => (
                        <SelectItem key={s.semesterNumber} value={String(s.semesterNumber)}>
                          {s.semester}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </FieldChrome>
              </div>
            </div>
          </EnrollmentSectionCard>
        );
      })}

      <Button
        type="button"
        variant="outline"
        block={false}
        disabled={isLoading}
        onClick={() => setRows((prev) => [...prev, { ...EMPTY_ROW }])}
      >
        <PlusIcon />
        Add another student
      </Button>

      <ProgramWizardFooter
        backLabel="Cancel"
        onBack={onCancel}
        primaryLabel={
          readyCount > 0
            ? `Enroll ${readyCount} student${readyCount === 1 ? "" : "s"}`
            : "Enroll students"
        }
        onPrimary={handleEnroll}
        primaryDisabled={readyCount === 0}
        isSaving={isLoading}
        leadingContent={
          <span className="font-body text-xs text-slate-500 dark:text-slate-400">
            {rows.length} form{rows.length === 1 ? "" : "s"} · {readyCount} ready
          </span>
        }
      />
    </div>
  );
}
