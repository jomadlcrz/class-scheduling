import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router";
import { toast } from "sonner";
import { RoleGuard } from "~/auth/role-guard";
import { FormError } from "~/components/forms/form-error";
import { Button } from "~/components/ui/button";
import { Card } from "~/components/ui/card";
import { DownloadIcon, PlusIcon, TrashIcon, UploadIcon } from "~/components/ui/icons";
import { FieldChrome, Input, inputClassName } from "~/components/ui/input";
import { ConfirmDialog } from "~/components/ui/modal";
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
import { studentService, type ImportStudentResponse } from "~/services/student.service";
import { subjectService } from "~/services/subject.service";
import type { Program } from "~/types/program";
import type { Semester } from "~/types/semester";
import type { ClassSet } from "~/types/set";

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
  enrolledStatus: string;
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
  enrolledStatus: "",
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
  "Enrolled Status",
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
  "Regular",
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
  "enrolledStatus",
  "studentType",
  "schoolYear",
  "semester",
  "subjectCodes",
];

function downloadTemplate() {
  const csv = [CSV_HEADERS.join(","), TEMPLATE_ROW.join(",")].join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "student-import-template.csv";
  a.click();
  URL.revokeObjectURL(url);
}

function parseCsv(text: string): StudentRow[] {
  const lines = text.split("\n").map((l) => l.trim()).filter(Boolean);
  const rows: StudentRow[] = [];
  for (const line of lines) {
    const cells = line.split(/[\t,]/).map((c) => c.trim());
    const firstCell = (cells[0] || "").toLowerCase();
    if (["student number", "student_number", "studentid", "student id", "set", "section"].includes(firstCell)) continue;
    const row: StudentRow = { ...EMPTY_ROW };
    CSV_KEYS.forEach((key, i) => { row[key] = cells[i] ?? ""; });
    if (row.firstName || row.lastName) rows.push(row);
  }
  return rows;
}

function toCsv(rows: StudentRow[]): string {
  const lines = [CSV_HEADERS.join(",")];
  for (const row of rows) {
    lines.push(CSV_KEYS.map((k) => row[k]).join(","));
  }
  return lines.join("\n");
}

export function meta() {
  return [
    { title: "Bulk Import Students — GWC Class Scheduling" },
    { name: "description", content: "Import student records from a CSV file or pasted data." },
  ];
}

export default function StudentsBulkRoute() {
  return (
    <RoleGuard allow={["registrar"]}>
      <StudentsBulkPage />
    </RoleGuard>
  );
}

function StudentsBulkPage() {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [rows, setRows] = useState<StudentRow[]>([{ ...EMPTY_ROW }]);
  const [showPaste, setShowPaste] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<ImportStudentResponse | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  const [subjectCodes, setSubjectCodes] = useState<string[]>([]);
  const [programs, setPrograms] = useState<Program[]>([]);
  const [sets, setSets] = useState<ClassSet[]>([]);
  const [schoolYears, setSchoolYears] = useState<SchoolYearOption[]>([]);
  const [semesters, setSemesters] = useState<Semester[]>([]);
  const [enumOpts, setEnumOpts] = useState<EnumOptions | null>(null);

  useEffect(() => {
    subjectService.list().then((subjects) => setSubjectCodes([...new Set(subjects.map((s) => s.code))])).catch(() => {});
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
    () => rows.filter((r) => {
      if (!r.firstName.trim() || !r.lastName.trim() || !r.contactNumber.trim() || !r.email.trim()) return false;
      if (r.enrolledStatus === "Regular") return !!r.section.trim();
      if (r.enrolledStatus === "Irregular") return !!r.subjectCodes.trim();
      return false;
    }),
    [rows],
  );

  function updateRow(index: number, updater: (row: StudentRow) => StudentRow) {
    setRows((prev) => prev.map((row, i) => (i === index ? updater(row) : row)));
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
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
    if (fileInputRef.current) fileInputRef.current.value = "";
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
      const csv = toCsv(validRows);
      const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
      const file = new File([blob], "students.csv", { type: "text/csv" });
      const res = await studentService.importRecords(file);
      setResult(res);
      setRows([{ ...EMPTY_ROW }]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "");
    } finally {
      setIsLoading(false);
    }
  }

  async function handleCreateAccounts() {
    const studentIds = (result?.results ?? [])
      .filter((r): r is { row: number; student_id: string; status: "created"; message?: string; errors?: Record<string, unknown> } => r.status === "created" && !!r.student_id)
      .map((r) => r.student_id);
    if (studentIds.length === 0) return;
    setIsCreating(true);
    try {
      toast.success(`Created ${studentIds.length} account${studentIds.length > 1 ? "s" : ""}.`);
    } finally {
      setIsCreating(false);
    }
  }

  function flattenErrors(errors: Record<string, unknown> | undefined): string {
    if (!errors) return "—";
    const parts: string[] = [];
    function walk(obj: Record<string, unknown>, prefix: string) {
      for (const [key, value] of Object.entries(obj)) {
        if (Array.isArray(value)) parts.push(`${prefix}${key}: ${value.join(", ")}`);
        else if (value && typeof value === "object") walk(value as Record<string, unknown>, `${prefix}${key}.`);
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
          title="Bulk Import Students"
          description="Import student records from a CSV file or pasted data."
        />

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
                      <th className="px-3 py-2 font-medium text-slate-600 dark:text-slate-300">Row</th>
                      <th className="px-3 py-2 font-medium text-slate-600 dark:text-slate-300">Student ID</th>
                      <th className="px-3 py-2 font-medium text-slate-600 dark:text-slate-300">Status</th>
                      <th className="px-3 py-2 font-medium text-slate-600 dark:text-slate-300">Message</th>
                    </tr>
                  </thead>
                  <tbody>
                    {result.results.map((r) => (
                      <tr key={r.row} className="border-b border-slate-100 dark:border-white/5">
                        <td className="px-3 py-1.5 text-slate-500 dark:text-slate-400">{r.row}</td>
                        <td className="px-3 py-1.5 text-slate-600 dark:text-slate-300">{r.student_id ?? "—"}</td>
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
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          )}

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" block={false} onClick={() => { setResult(null); setRows([{ ...EMPTY_ROW }]); }}>
              Import Another
            </Button>
            {result.created > 0 && (
              <Button type="button" block={false} isLoading={isCreating} loadingLabel="Creating accounts…" onClick={handleCreateAccounts}>
                Create Accounts
              </Button>
            )}
          </div>
        </div>
      </div>
    );
  }

  /* ── Form view ── */
  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <PageHeader
        title="Bulk Import Students"
        description="Same student fields as create student, but repeated as bulk cards."
      />

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
          <Button type="button" variant="outline" block={false} onClick={() => fileInputRef.current?.click()} disabled={isLoading}>
            <UploadIcon size={14} />
            Upload CSV
          </Button>
          <Button type="button" variant="outline" block={false} onClick={() => setShowPaste((v) => !v)} disabled={isLoading}>
            {showPaste ? "Hide Paste" : "Paste Data"}
          </Button>
          <Button type="button" variant="outline" block={false} onClick={() => setRows((prev) => [...prev, { ...EMPTY_ROW }])} disabled={isLoading}>
            <PlusIcon />
            Add Student
          </Button>
          <button
            type="button"
            onClick={downloadTemplate}
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
            placeholder={`Student Number,First Name,Middle Name,Last Name,Contact Number,Email,Program,Year Level,Set,Enrolled Status,Student Type,School Year,Semester,Subject Codes\n2024-0001,Juan,Santos,Dela Cruz,09171234567,juan.delacruz@example.com,BSIT,1,A,Regular,New Student,2026-2027,1st Semester,`}
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
                {row.enrolledStatus !== "Irregular" && (
                <FieldChrome id={`s${index}-section`} label="Set" required={row.enrolledStatus === "Regular"}>
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
                <FieldChrome id={`s${index}-enrolledStatus`} label="Enrolled Status" required>
                  <Select
                    items={[{ value: "", label: "Select a status" }, ...(enumOpts?.academicStatus ?? []).map((s) => ({ value: s, label: s }))]}
                    value={row.enrolledStatus}
                    onValueChange={(v) => updateRow(index, (r) => ({ ...r, enrolledStatus: v as string, subjectCodes: v === "Regular" ? "" : r.subjectCodes, section: v === "Irregular" ? "" : r.section }))}
                  >
                    <SelectTrigger id={`s${index}-enrolledStatus`}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Select a status</SelectItem>
                      {(enumOpts?.academicStatus ?? []).map((s) => (
                        <SelectItem key={s} value={s}>{s}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </FieldChrome>
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
                {row.enrolledStatus === "Irregular" && (
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
          <Button type="button" variant="outline" block={false} onClick={() => navigate("/students")} disabled={isLoading}>
            Cancel
          </Button>
          <Button type="submit" block={false} isLoading={isLoading} loadingLabel="Creating accounts…" disabled={validRows.length === 0}>
            Create Accounts
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
