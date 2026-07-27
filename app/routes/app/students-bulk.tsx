import { useRef, useState, useMemo } from "react";
import { useNavigate } from "react-router";
import { toast } from "sonner";
import { RoleGuard } from "~/auth/role-guard";
import { FormError } from "~/components/forms/form-error";
import { Button } from "~/components/ui/button";
import { Card } from "~/components/ui/card";
import { Input } from "~/components/ui/input";
import { ConfirmDialog } from "~/components/ui/modal";
import { SectionHeading } from "~/components/ui/section-heading";
import { Textarea } from "~/components/ui/textarea";
import { DownloadIcon, PlusIcon, TrashIcon, UploadIcon } from "~/components/ui/icons";
import { PageHeader } from "~/layouts/page-header";
import { useUnsavedChangesGuard } from "~/hooks/use-unsaved-changes-guard";
import { studentService, type ImportStudentResponse } from "~/services/student.service";

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
  "Section",
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
    if (["student number", "student_number", "studentid", "student id"].includes(firstCell)) continue;
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

  const isDirty = useMemo(
    () => rows.some((r) => Object.values(r).some((v) => v.trim() !== "")),
    [rows],
  );

  const { blocker, reloadPromptOpen, setReloadPromptOpen, confirmReload } =
    useUnsavedChangesGuard(isDirty, !isLoading);

  const validRows = useMemo(
    () => rows.filter((r) => r.firstName.trim() && r.lastName.trim()),
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
            placeholder={`Student Number,First Name,Middle Name,Last Name,Contact Number,Email,Program,Year Level,Section,Enrolled Status,Student Type,School Year,Semester,Subject Codes\n2024-0001,Juan,Santos,Dela Cruz,09171234567,juan.delacruz@example.com,BSIT,1,A,Regular,New Student,2026-2027,1st Semester,`}
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
                <Input id={`s${index}-contactNumber`} label="Contact Number" value={row.contactNumber} disabled={isLoading} placeholder="e.g. 09171234567" onChange={(e) => updateRow(index, (r) => ({ ...r, contactNumber: e.target.value }))} />
                <Input id={`s${index}-email`} label="Email" type="email" value={row.email} disabled={isLoading} placeholder="student@example.com" onChange={(e) => updateRow(index, (r) => ({ ...r, email: e.target.value }))} />
                <Input id={`s${index}-program`} label="Program" value={row.program} disabled={isLoading} placeholder="e.g. BSIT" onChange={(e) => updateRow(index, (r) => ({ ...r, program: e.target.value }))} />
                <Input id={`s${index}-yearLevel`} label="Year Level" value={row.yearLevel} disabled={isLoading} placeholder="e.g. 1" onChange={(e) => updateRow(index, (r) => ({ ...r, yearLevel: e.target.value }))} />
                <Input id={`s${index}-section`} label="Section" value={row.section} disabled={isLoading} placeholder="e.g. A" onChange={(e) => updateRow(index, (r) => ({ ...r, section: e.target.value }))} />
                <Input id={`s${index}-enrolledStatus`} label="Enrolled Status" value={row.enrolledStatus} disabled={isLoading} placeholder="e.g. Regular" onChange={(e) => updateRow(index, (r) => ({ ...r, enrolledStatus: e.target.value }))} />
                <Input id={`s${index}-studentType`} label="Student Type" value={row.studentType} disabled={isLoading} placeholder="e.g. New Student" onChange={(e) => updateRow(index, (r) => ({ ...r, studentType: e.target.value }))} />
                <Input id={`s${index}-schoolYear`} label="School Year" value={row.schoolYear} disabled={isLoading} placeholder="e.g. 2026-2027" onChange={(e) => updateRow(index, (r) => ({ ...r, schoolYear: e.target.value }))} />
                <Input id={`s${index}-semester`} label="Semester" value={row.semester} disabled={isLoading} placeholder="e.g. 1st Semester" onChange={(e) => updateRow(index, (r) => ({ ...r, semester: e.target.value }))} />
                <Input id={`s${index}-subjectCodes`} label="Subject Codes" value={row.subjectCodes} disabled={isLoading} placeholder="e.g. CS101,CS102 (comma-separated)" onChange={(e) => updateRow(index, (r) => ({ ...r, subjectCodes: e.target.value }))} />
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
