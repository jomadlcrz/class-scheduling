import { useEffect, useMemo, useRef, useState } from "react";
import { NavLink, useNavigate } from "react-router";
import { toast } from "sonner";
import * as XLSX from "xlsx";
import { FormError } from "~/components/forms/form-error";
import { Button } from "~/components/ui/button";
import { Card } from "~/components/ui/card";
import { DownloadIcon, PlusIcon, TrashIcon, UploadIcon } from "~/components/ui/icons";
import { FieldChrome, Input, inputClassName } from "~/components/ui/input";
import { ConfirmDialog } from "~/components/ui/modal";
import { Popover } from "~/components/ui/popover";
import { SectionHeading } from "~/components/ui/section-heading";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "~/components/ui/select";
import { Textarea } from "~/components/ui/textarea";
import { useUnsavedChangesGuard } from "~/hooks/use-unsaved-changes-guard";
import { PageHeader } from "~/layouts/page-header";
import { enumService, type EnumOptions } from "~/services/enum.service";
import { programService } from "~/services/program.service";
import { schoolYearService, type SchoolYearOption } from "~/services/school-year.service";
import { semesterService } from "~/services/semester.service";
import { setService } from "~/services/set.service";
import {
  studentService,
  type ImportStudentInput,
  type ImportStudentResponse,
} from "~/services/student.service";
import { subjectService } from "~/services/subject.service";
import type { Program } from "~/types/program";
import type { Semester } from "~/types/semester";
import type { ClassSet } from "~/types/set";
import type { Subject } from "~/types/subject";

export type BulkEnrolledStatus = "Regular" | "Irregular";

type StudentBulkImportProps = {
  /** The enrollment kind this bulk import creates — fixed per route, never selectable. */
  enrolledStatus: BulkEnrolledStatus;
};

type StudentRow = {
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

const EMPTY_ROW: StudentRow = {
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

const CSV_KEYS: (keyof StudentRow)[] = [
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

function downloadTemplate(filename: string) {
  const csv = [CSV_HEADERS.join(","), TEMPLATE_ROW.join(",")].join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
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
    if (inQuotes) {
      if (ch === '"') {
        if (i + 1 < line.length && line[i + 1] === '"') {
          current += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        current += ch;
      }
    } else {
      if (ch === '"') {
        inQuotes = true;
      } else if (ch === "," || ch === "\t") {
        cells.push(current.trim());
        current = "";
      } else {
        current += ch;
      }
    }
  }
  cells.push(current.trim());
  return cells;
}

function parseCsv(text: string): StudentRow[] {
  const lines = text.split("\n").map((l) => l.trim()).filter(Boolean);
  const rows: StudentRow[] = [];
  for (const line of lines) {
    const cells = parseCsvLine(line);
    const firstCell = (cells[0] || "").toLowerCase();
    if (["student number", "student_number", "studentid", "student id", "set", "section"].includes(firstCell)) continue;
    const row: StudentRow = { ...EMPTY_ROW };
    CSV_KEYS.forEach((key, i) => { row[key] = cells[i] ?? ""; });
    if (row.firstName || row.lastName) rows.push(row);
  }
  return rows;
}

function BulkStatusTabs() {
  return (
    <div className="flex gap-2 border-b border-slate-200 dark:border-white/10">
      {[
        { to: "/students-regular/bulk", label: "Regular Students" },
        { to: "/students-irregular/bulk", label: "Irregular Students" },
      ].map((tab) => (
        <NavLink
          key={tab.to}
          to={tab.to}
          end
          className={({ isActive }) =>
            `-mb-px border-b-2 px-4 py-2 font-body text-sm font-medium transition-colors duration-150 ${
              isActive
                ? "border-navy-800 text-navy-800 dark:border-white dark:text-mist-100"
                : "border-transparent text-slate-500 hover:text-navy-700 dark:text-slate-400 dark:hover:text-slate-200"
            }`
          }
        >
          {tab.label}
        </NavLink>
      ))}
    </div>
  );
}

export function StudentBulkImport({ enrolledStatus }: StudentBulkImportProps) {
  const navigate = useNavigate();
  const isIrregular = enrolledStatus === "Irregular";
  const listRoute = isIrregular ? "/students-irregular" : "/students-regular";
  const pageTitle = `Bulk Import ${enrolledStatus} Students`;
  const pageDescription = isIrregular
    ? "Import irregular students with their own subject list from a CSV file or pasted data."
    : "Import regular students into a class set from a CSV file or pasted data.";
  const templateFilename = isIrregular
    ? "irregular-student-import-template.csv"
    : "regular-student-import-template.csv";

  const fileInputRef = useRef<HTMLInputElement>(null);

  const [rows, setRows] = useState<StudentRow[]>([{ ...EMPTY_ROW }]);
  const [showPaste, setShowPaste] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<ImportStudentResponse | null>(null);
  const [submittedRows, setSubmittedRows] = useState<StudentRow[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [programs, setPrograms] = useState<Program[]>([]);
  const [sets, setSets] = useState<ClassSet[]>([]);
  const [schoolYears, setSchoolYears] = useState<SchoolYearOption[]>([]);
  const [semesters, setSemesters] = useState<Semester[]>([]);
  const [enumOpts, setEnumOpts] = useState<EnumOptions | null>(null);

  useEffect(() => {
    subjectService.list().then(setSubjects).catch(() => {});
    programService.list().then(setPrograms).catch(() => {});
    setService.list().then(setSets).catch(() => {});
    schoolYearService.list().then(setSchoolYears).catch(() => {});
    semesterService.list().then(setSemesters).catch(() => {});
    enumService.getOptions().then(setEnumOpts).catch(() => {});
  }, []);

  const isDirty = useMemo(
    () => rows.some((r) => Object.values(r).some((v) => v.trim() !== "")),
    [rows],
  );

  const { blocker, reloadPromptOpen, setReloadPromptOpen, confirmReload } =
    useUnsavedChangesGuard(isDirty, !isLoading);

  const validRows = useMemo(
    () => rows.filter((r) => r.firstName.trim() && r.lastName.trim() && r.contactNumber.trim() && r.email.trim()),
    [rows],
  );

  const subjectCodes = useMemo(
    () => [...new Set(subjects.map((subject) => subject.code))],
    [subjects],
  );

  function prepareImportRow(row: StudentRow): ImportStudentInput {
    const program = programs.find(
      (option) => option.abbrev.toLowerCase() === row.program.trim().toLowerCase(),
    );
    const yearLevel = Number(row.yearLevel);
    const schoolYear = schoolYears.find(
      (option) => option.schoolYear.toLowerCase() === row.schoolYear.trim().toLowerCase(),
    );
    const semester = semesters.find((option) => {
      const value = row.semester.trim().toLowerCase();
      return option.semester.toLowerCase() === value ||
        option.displayName?.toLowerCase() === value ||
        String(option.semesterNumber) === value;
    });
    const set = isIrregular
      ? null
      : sets.find(
          (option) =>
            option.program.toLowerCase() === row.program.trim().toLowerCase() &&
            option.yearLevel === yearLevel &&
            option.setCode.toLowerCase() === row.section.trim().toLowerCase(),
        );
    const requestedSubjectCodes = row.subjectCodes
      .split(/[,;]+/)
      .map((code) => code.trim())
      .filter(Boolean);
    const subjectIds = requestedSubjectCodes.map((code) =>
      subjects.find(
        (subject) =>
          subject.program.toLowerCase() === row.program.trim().toLowerCase() &&
          subject.code.toLowerCase() === code.toLowerCase(),
      )?.id,
    );

    const missing: string[] = [];
    if (!program) missing.push("program");
    if (!Number.isInteger(yearLevel) || yearLevel < 1) missing.push("year level");
    if (!schoolYear) missing.push("school year");
    if (!semester) missing.push("semester");
    if (!isIrregular && !set) missing.push("set");
    if (!row.studentType.trim()) missing.push("student type");
    if (isIrregular && requestedSubjectCodes.length === 0) missing.push("subject codes");
    if (subjectIds.some((id) => id == null)) missing.push("recognized subject codes");
    if (missing.length > 0 || !program || !schoolYear || !semester) {
      return {
        error: `Invalid or missing ${missing.join(", ")}.`,
        studentId: row.studentNumber.trim() || undefined,
      };
    }

    return {
      input: {
        studentId: row.studentNumber.trim() || undefined,
        firstName: row.firstName,
        midName: row.middleName.trim() || undefined,
        lastName: row.lastName,
        mobile: row.contactNumber,
        email: row.email,
        programId: program.id,
        yearLevel,
        setId: set?.id ?? null,
        studentType: row.studentType,
        enrolledStatus,
        syId: schoolYear.id,
        semesterNumber: semester.semesterNumber,
        subjectIds: subjectIds.filter((id): id is number => id != null),
      },
    };
  }

  function updateRow(index: number, updater: (row: StudentRow) => StudentRow) {
    setRows((prev) => prev.map((row, i) => (i === index ? updater(row) : row)));
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const isXlsx = file.name.endsWith(".xlsx");
    if (isXlsx) {
      const reader = new FileReader();
      reader.onload = (ev) => {
        const data = new Uint8Array(ev.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: "array" });
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        const csv = XLSX.utils.sheet_to_csv(sheet);
        const parsed = parseCsv(csv);
        if (parsed.length > 0) {
          setRows(parsed);
          setError(null);
          toast.success(`Loaded ${parsed.length} row${parsed.length > 1 ? "s" : ""}.`);
        } else {
          setError("No valid rows found in the file.");
        }
      };
      reader.readAsArrayBuffer(file);
    } else {
      const reader = new FileReader();
      reader.onload = (ev) => {
        const text = ev.target?.result;
        if (typeof text === "string") {
          const parsed = parseCsv(text);
          if (parsed.length > 0) {
            setRows(parsed);
            setError(null);
            toast.success(`Loaded ${parsed.length} row${parsed.length > 1 ? "s" : ""}.`);
          } else {
            setError("No valid rows found in the file.");
          }
        }
      };
      reader.readAsText(file);
    }
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  /** Opens the native file picker filtered to just the chosen format; handleFileChange still auto-detects by extension either way. */
  function openFilePicker(accept: ".csv" | ".xlsx") {
    const input = fileInputRef.current;
    if (!input) return;
    input.accept = accept;
    input.click();
  }

  function handlePaste(e: React.ClipboardEvent<HTMLTextAreaElement>) {
    const text = e.clipboardData.getData("text");
    if (!text) return;
    const parsed = parseCsv(text);
    if (parsed.length > 0) {
      setRows(parsed);
      setError(null);
      toast.success(`Loaded ${parsed.length} row${parsed.length > 1 ? "s" : ""}.`);
    } else {
      setError("No valid rows found in the pasted data.");
    }
    e.preventDefault();
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (validRows.length === 0) {
      setError("Add at least one student with a first and last name.");
      return;
    }
    setError(null);
    setIsLoading(true);
    try {
      const res = await studentService.importRecords(validRows.map(prepareImportRow));
      setSubmittedRows(validRows);
      setResult(res);
      setRows([{ ...EMPTY_ROW }]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "");
    } finally {
      setIsLoading(false);
    }
  }

  function flattenErrors(errors: Record<string, unknown> | undefined): string {
    if (!errors) return "—";
    const parts: string[] = [];
    function walk(obj: Record<string, unknown>, prefix: string) {
      for (const [key, value] of Object.entries(obj)) {
        if (key === "_general" && Array.isArray(value)) {
          parts.push(value.join(". "));
        } else if (Array.isArray(value)) {
          const label = prefix ? `${prefix}${key}` : key.replace(/_/g, " ");
          parts.push(`${label}: ${value.join(". ")}`);
        } else if (value && typeof value === "object") {
          walk(value as Record<string, unknown>, prefix ? `${prefix}${key}.` : `${key}.`);
        }
      }
    }
    walk(errors, "");
    return parts.join("; ") || "—";
  }

  /* ── Results view ── */
  if (result) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-8">
        <PageHeader
          title={pageTitle}
          description={pageDescription}
        />

        <div className="mt-6">
          <BulkStatusTabs />
        </div>

        <div className="mt-6 flex flex-col gap-4">
          <Card className="p-4">
            <h3 className="font-display text-sm tracking-wide text-navy-700 dark:text-mist-100">
              Import Summary
            </h3>
            <div className="mt-3 grid grid-cols-3 gap-3 text-center">
              <div>
                <span className="block font-display text-2xl text-navy-700 dark:text-mist-100">{result.total}</span>
                <span className="font-body text-xs text-slate-500 dark:text-slate-400">Total</span>
              </div>
              <div>
                <span className="block font-display text-2xl text-emerald-600 dark:text-emerald-400">{result.created}</span>
                <span className="font-body text-xs text-slate-500 dark:text-slate-400">Created</span>
              </div>
              <div>
                <span className="block font-display text-2xl text-red-600 dark:text-red-400">{result.failed}</span>
                <span className="font-body text-xs text-slate-500 dark:text-slate-400">Failed</span>
              </div>
            </div>
          </Card>

          {result.results.length > 0 && (
            <Card className="overflow-hidden p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50 dark:border-white/10 dark:bg-white/5">
                      <th className="px-3 py-2 font-medium text-slate-600 dark:text-slate-300">#</th>
                      <th className="px-3 py-2 font-medium text-slate-600 dark:text-slate-300">Name</th>
                      <th className="px-3 py-2 font-medium text-slate-600 dark:text-slate-300">Student ID</th>
                      <th className="px-3 py-2 font-medium text-slate-600 dark:text-slate-300 hidden sm:table-cell">Email</th>
                      <th className="px-3 py-2 font-medium text-slate-600 dark:text-slate-300">Status</th>
                      <th className="px-3 py-2 font-medium text-slate-600 dark:text-slate-300">Message</th>
                    </tr>
                  </thead>
                  <tbody>
                    {result.results.map((r) => {
                      const original = submittedRows[r.row - 1];
                      const name = original
                        ? [original.lastName, original.firstName].filter(Boolean).join(", ") || "—"
                        : "—";
                      const email = original?.email || "—";
                      const studentId = r.student_id || original?.studentNumber || "—";
                      return (
                      <tr key={r.row} className="border-b border-slate-100 dark:border-white/5">
                        <td className="px-3 py-1.5 text-slate-500 dark:text-slate-400">{r.row}</td>
                        <td className="px-3 py-1.5 font-medium text-navy-700 dark:text-mist-100">{name}</td>
                        <td className="px-3 py-1.5 text-slate-600 dark:text-slate-300">{studentId}</td>
                        <td className="px-3 py-1.5 text-slate-500 dark:text-slate-400 hidden sm:table-cell">{email}</td>
                        <td className="px-3 py-1.5">
                          <span
                            className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${
                              r.status === "created"
                                ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
                                : "bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                            }`}
                          >
                            {r.status === "created" ? "created" : "error"}
                          </span>
                        </td>
                        <td className="px-3 py-1.5 text-slate-500 dark:text-slate-400">
                          {r.message ?? flattenErrors(r.errors)}
                        </td>
                      </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </Card>
          )}

          <div className="sticky bottom-0 flex justify-end gap-2 border-t border-slate-200 bg-slate-50/95 py-4 backdrop-blur dark:border-white/10 dark:bg-surface/95">
            <Button type="button" variant="outline" block={false} onClick={() => { setResult(null); setSubmittedRows([]); setRows([{ ...EMPTY_ROW }]); }}>
              Import Another
            </Button>
          </div>
        </div>
      </div>
    );
  }

  /* ── Form view ── */
  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <PageHeader
        title={pageTitle}
        description={pageDescription}
      />

      <div className="mt-6">
        <BulkStatusTabs />
      </div>

      <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-4" noValidate>
        <FormError message={error} />

        <input
          ref={fileInputRef}
          type="file"
          accept=".csv,.xlsx"
          onChange={handleFileChange}
          className="hidden"
        />

        {/* ── Action buttons ── */}
        <div className="flex flex-wrap items-center gap-2">
          <Popover
            label="Import"
            trigger={
              <>
                <UploadIcon size={14} />
                Import
              </>
            }
            triggerClassName="flex cursor-pointer items-center justify-center gap-2 rounded-lg border border-slate-300 px-4 py-2 font-body text-sm font-medium text-navy-700 transition-all duration-150 hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-400 disabled:cursor-not-allowed disabled:opacity-60 dark:border-white/15 dark:text-slate-200 dark:hover:bg-white/10"
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
          <Button type="button" variant="outline" block={false} onClick={() => setShowPaste((v) => !v)} disabled={isLoading}>
            {showPaste ? "Hide Paste" : "Paste CSV"}
          </Button>
          <Button type="button" variant="outline" block={false} onClick={() => setRows((prev) => [...prev, { ...EMPTY_ROW }])} disabled={isLoading}>
            <PlusIcon />
            Add Student
          </Button>
          <button
            type="button"
            onClick={() => downloadTemplate(templateFilename)}
            className="ml-auto flex items-center gap-1.5 font-body text-xs text-navy-700 underline decoration-navy-300 underline-offset-2 hover:text-navy-900 dark:text-mist-100 dark:decoration-white/30 dark:hover:text-white"
          >
            <DownloadIcon size={14} />
            Download template
          </button>
        </div>

        {/* ── Paste area (toggle) ── */}
        {showPaste && (
          <Textarea
            id="paste-data"
            label="Paste CSV data"
            onPaste={handlePaste}
            placeholder={`Student Number,First Name,Middle Name,Last Name,Contact Number,Email,Program,Year Level,Set,Student Type,School Year,Semester,Subject Codes\n2024-0001,Juan,Santos,Dela Cruz,09171234567,juan.delacruz@example.com,BSIT,1,A,New Student,2026-2027,1st Semester,`}
            disabled={isLoading}
            rows={8}
          />
        )}

        {/* ── Student cards ── */}
        <div className="flex flex-col gap-4">
          {rows.map((row, index) => (
            <Card key={index} className="overflow-hidden p-0">
              {/* Card header */}
              <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50 px-5 py-3 dark:border-white/10 dark:bg-white/5">
                <div>
                  <span className="font-display text-sm tracking-wide text-navy-700 dark:text-mist-100">
                    #{index + 1}
                  </span>
                  <p className="font-body text-xs text-slate-500 dark:text-slate-400">
                    {row.firstName || row.lastName
                      ? `${row.lastName || ""}${row.lastName && row.firstName ? ", " : ""}${row.firstName || ""}`
                      : "Fill out the student details below."}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    if (rows.length === 1) setError("Cannot delete the last row.");
                    else setRows((prev) => prev.filter((_, i) => i !== index));
                  }}
                  disabled={isLoading || rows.length === 1}
                  className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-red-50 hover:text-red-600 disabled:opacity-40 dark:text-slate-500 dark:hover:bg-red-900/20 dark:hover:text-red-400"
                  aria-label={`Remove student ${index + 1}`}
                >
                  <TrashIcon />
                </button>
              </div>

              {/* Card body — form fields */}
              <div className="grid grid-cols-1 gap-4 p-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {/* Section divider */}
                <div className="col-span-full">
                  <SectionHeading>Student Information</SectionHeading>
                </div>

                <Input id={`s${index}-studentNumber`} label="Student Number" value={row.studentNumber} disabled={isLoading} placeholder="e.g. 2024-0001" onChange={(e) => updateRow(index, (r) => ({ ...r, studentNumber: e.target.value }))} />
                <Input id={`s${index}-firstName`} label="First Name" value={row.firstName} disabled={isLoading} placeholder="Enter first name" required onChange={(e) => updateRow(index, (r) => ({ ...r, firstName: e.target.value }))} />
                <Input id={`s${index}-middleName`} label="Middle Name" value={row.middleName} disabled={isLoading} placeholder="Optional" onChange={(e) => updateRow(index, (r) => ({ ...r, middleName: e.target.value }))} />
                <Input id={`s${index}-lastName`} label="Last Name" value={row.lastName} disabled={isLoading} placeholder="Enter last name" required onChange={(e) => updateRow(index, (r) => ({ ...r, lastName: e.target.value }))} />
                <Input
                  id={`s${index}-contactNumber`}
                  label="Contact Number"
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={11}
                  required
                  value={row.contactNumber}
                  disabled={isLoading}
                  placeholder="e.g. 09171234567"
                  onChange={(e) => {
                    const cleaned = e.target.value.replace(/\D/g, "").slice(0, 11);
                    updateRow(index, (r) => ({ ...r, contactNumber: cleaned }));
                  }}
                />
                <Input id={`s${index}-email`} label="Email" type="email" required value={row.email} disabled={isLoading} placeholder="student@example.com" onChange={(e) => updateRow(index, (r) => ({ ...r, email: e.target.value }))} />
                <FieldChrome id={`s${index}-program`} label="Program" required>
                  <Select
                    items={[{ value: "", label: "Select a program" }, ...programs.map((p) => ({ value: p.abbrev, label: `${p.abbrev} — ${p.name}` }))]}
                    value={row.program}
                    onValueChange={(v) => updateRow(index, (r) => ({ ...r, program: v as string, yearLevel: "", section: "" }))}
                  >
                    <SelectTrigger id={`s${index}-program`}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Select a program</SelectItem>
                      {programs.map((p) => (
                        <SelectItem key={p.id} value={p.abbrev}>{p.abbrev} — {p.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </FieldChrome>
                <FieldChrome id={`s${index}-yearLevel`} label="Year Level" required>
                  <Select
                    items={[{ value: "", label: "Select a year" }, ...(enumOpts?.yearLevels ?? []).map((y) => ({ value: String(y.id), label: y.name }))]}
                    value={row.yearLevel}
                    onValueChange={(v) => updateRow(index, (r) => ({ ...r, yearLevel: v as string, section: "" }))}
                    disabled={!row.program}
                  >
                    <SelectTrigger id={`s${index}-yearLevel`}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Select a year</SelectItem>
                      {(enumOpts?.yearLevels ?? []).map((y) => (
                        <SelectItem key={y.id} value={String(y.id)}>{y.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </FieldChrome>
                {!isIrregular && (
                <FieldChrome id={`s${index}-section`} label="Set" required>
                  <Select
                    items={[{ value: "", label: "Select a set" }, ...sets.filter((s) => (!row.program || s.program === row.program) && (!row.yearLevel || String(s.yearLevel) === row.yearLevel)).map((s) => ({ value: s.setCode, label: s.setCode }))]}
                    value={row.section}
                    onValueChange={(v) => updateRow(index, (r) => ({ ...r, section: v as string }))}
                    disabled={!row.program || !row.yearLevel}
                  >
                    <SelectTrigger id={`s${index}-section`}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Select a set</SelectItem>
                      {sets
                        .filter((s) => (!row.program || s.program === row.program) && (!row.yearLevel || String(s.yearLevel) === row.yearLevel))
                        .map((s) => (
                          <SelectItem key={s.id} value={s.setCode}>{s.setCode}</SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </FieldChrome>
                )}
                <FieldChrome id={`s${index}-studentType`} label="Student Type" required>
                  <Select
                    items={[{ value: "", label: "Select a type" }, ...(enumOpts?.studentType ?? []).map((t) => ({ value: t, label: t }))]}
                    value={row.studentType}
                    onValueChange={(v) => updateRow(index, (r) => ({ ...r, studentType: v as string }))}
                  >
                    <SelectTrigger id={`s${index}-studentType`}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Select a type</SelectItem>
                      {(enumOpts?.studentType ?? []).map((t) => (
                        <SelectItem key={t} value={t}>{t}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </FieldChrome>
                <FieldChrome id={`s${index}-schoolYear`} label="School Year" required>
                  <Select
                    items={[{ value: "", label: "Select a school year" }, ...schoolYears.map((sy) => ({ value: sy.schoolYear, label: sy.schoolYear }))]}
                    value={row.schoolYear}
                    onValueChange={(v) => updateRow(index, (r) => ({ ...r, schoolYear: v as string }))}
                  >
                    <SelectTrigger id={`s${index}-schoolYear`}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Select a school year</SelectItem>
                      {schoolYears.map((sy) => (
                        <SelectItem key={sy.id} value={sy.schoolYear}>{sy.schoolYear}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </FieldChrome>
                <FieldChrome id={`s${index}-semester`} label="Semester" required>
                  <Select
                    items={[{ value: "", label: "Select a semester" }, ...semesters.map((s) => ({ value: s.semester, label: s.semester }))]}
                    value={row.semester}
                    onValueChange={(v) => updateRow(index, (r) => ({ ...r, semester: v as string }))}
                  >
                    <SelectTrigger id={`s${index}-semester`}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Select a semester</SelectItem>
                      {semesters.map((s) => (
                        <SelectItem key={s.id} value={s.semester}>{s.semester}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </FieldChrome>
                {isIrregular && (
                <FieldChrome id={`s${index}-subjectCodes`} label="Subject Codes" required>
                  <input
                    id={`s${index}-subjectCodes`}
                    name={`s${index}-subjectCodes`}
                    list={`s${index}-subjectCodes-list`}
                    className={inputClassName}
                    value={row.subjectCodes}
                    disabled={isLoading}
                    placeholder="e.g. CS101,CS102 (comma-separated)"
                    onChange={(e) => updateRow(index, (r) => ({ ...r, subjectCodes: e.target.value }))}
                  />
                  <datalist id={`s${index}-subjectCodes-list`}>
                    {subjectCodes.map((code) => (
                      <option key={code} value={code} />
                    ))}
                  </datalist>
                </FieldChrome>
                )}
              </div>
            </Card>
          ))}
        </div>

        {/* ── Footer ── */}
        <Card className="px-4 py-3">
          <p className="font-body text-sm text-slate-600 dark:text-slate-400">
            {validRows.length} of {rows.length} student card(s) ready
          </p>
        </Card>

        <div className="sticky bottom-0 flex justify-between border-t border-slate-200 bg-slate-50/95 py-4 backdrop-blur dark:border-white/10 dark:bg-surface/95">
          <Button type="button" variant="outline" block={false} onClick={() => navigate(listRoute)} disabled={isLoading}>
            Cancel
          </Button>
          <Button type="submit" block={false} isLoading={isLoading} loadingLabel="Creating records…" disabled={validRows.length === 0}>
            Create Records
          </Button>
        </div>
      </form>

      <ConfirmDialog
        open={blocker.state === "blocked"}
        onClose={() => blocker.reset?.()}
        title="Discard unsaved students?"
        confirmLabel="Discard"
        loadingLabel="Discarding…"
        confirmVariant="danger"
        onConfirm={async () => blocker.proceed?.()}
      >
        You have unsaved student data. Leaving this page will discard all entries.
      </ConfirmDialog>

      <ConfirmDialog
        open={reloadPromptOpen}
        onClose={() => setReloadPromptOpen(false)}
        title="Discard unsaved students?"
        confirmLabel="Discard & Reload"
        loadingLabel="Reloading…"
        confirmVariant="danger"
        onConfirm={async () => confirmReload()}
      >
        You have unsaved student data. Reloading the page will discard all entries.
      </ConfirmDialog>
    </div>
  );
}
