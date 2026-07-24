import { useRef, useState } from "react";
import { FormError } from "~/components/forms/form-error";
import { Button } from "~/components/ui/button";
import { DownloadIcon, UploadIcon } from "~/components/ui/icons";
import type { ImportStudentResult, ImportStudentResponse } from "~/services/student.service";

const TEMPLATE_HEADERS = [
  "studentId",
  "firstName",
  "midName",
  "lastName",
  "mobile",
  "email",
  "programId",
  "yearLevel",
  "setId",
  "enrolledStatus",
  "studentType",
  "syId",
  "semId",
  "subjectIds",
];

const TEMPLATE_ROW = [
  "2024-001",
  "Juan",
  "Dela",
  "Cruz",
  "09171234567",
  "juan.cruz@gwc.edu.ph",
  "1",
  "1",
  "1",
  "REGULAR",
  "NEW_STUDENT",
  "1",
  "1",
  "",
];

function downloadTemplate() {
  const csv = [TEMPLATE_HEADERS.join(","), TEMPLATE_ROW.join(",")].join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "student-import-template.csv";
  a.click();
  URL.revokeObjectURL(url);
}

type StudentImportFormProps = {
  onSubmit: (file: File) => Promise<ImportStudentResponse>;
  onCreateAccounts: (studentIds: string[]) => Promise<void>;
  onCancel: () => void;
};

const ACCEPTED = ".csv,.xlsx";

export function StudentImportForm({ onSubmit, onCreateAccounts, onCancel }: StudentImportFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [result, setResult] = useState<ImportStudentResponse | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!file) {
      setError("Select a file to import.");
      return;
    }

    setError(null);
    setIsLoading(true);
    try {
      const res = await onSubmit(file);
      setResult(res);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }

  async function handleCreateAccounts() {
    const studentIds = (result?.results ?? [])
      .filter((r): r is ImportStudentResult & { student_id: string } => r.status === "created" && !!r.student_id)
      .map((r) => r.student_id);
    if (studentIds.length === 0) return;
    setIsCreating(true);
    try {
      await onCreateAccounts(studentIds);
    } finally {
      setIsCreating(false);
    }
  }

  function flattenErrors(errors: Record<string, unknown> | undefined): string {
    if (!errors) return "—";
    const parts: string[] = [];
    function walk(obj: Record<string, unknown>, prefix: string) {
      for (const [key, value] of Object.entries(obj)) {
        if (Array.isArray(value)) {
          parts.push(`${prefix}${key}: ${value.join(", ")}`);
        } else if (value && typeof value === "object") {
          walk(value as Record<string, unknown>, `${prefix}${key}.`);
        }
      }
    }
    walk(errors, "");
    return parts.join("; ") || "—";
  }

  if (result) {
    return (
      <div className="flex flex-col gap-4">
        <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 dark:border-white/10 dark:bg-white/5">
          <h3 className="font-display text-sm tracking-wide text-navy-700 dark:text-mist-100">
            Import Summary
          </h3>
          <div className="mt-3 grid grid-cols-3 gap-3 text-center">
            <div>
              <span className="block font-display text-2xl text-navy-700 dark:text-mist-100">
                {result.total}
              </span>
              <span className="font-body text-xs text-slate-500 dark:text-slate-400">Total</span>
            </div>
            <div>
              <span className="block font-display text-2xl text-emerald-600 dark:text-emerald-400">
                {result.created}
              </span>
              <span className="font-body text-xs text-slate-500 dark:text-slate-400">Created</span>
            </div>
            <div>
              <span className="block font-display text-2xl text-red-600 dark:text-red-400">
                {result.failed}
              </span>
              <span className="font-body text-xs text-slate-500 dark:text-slate-400">Failed</span>
            </div>
          </div>
        </div>

        {result.results.length > 0 && (
          <div className="rounded-lg border border-slate-200 p-3 dark:border-white/10">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200 dark:border-white/10">
                  <th className="pb-1 font-medium text-slate-600 dark:text-slate-300">Row</th>
                  <th className="pb-1 font-medium text-slate-600 dark:text-slate-300">Student ID</th>
                  <th className="pb-1 font-medium text-slate-600 dark:text-slate-300">Status</th>
                  <th className="pb-1 font-medium text-slate-600 dark:text-slate-300">Message</th>
                </tr>
              </thead>
              <tbody>
                {result.results.map((r) => (
                  <tr key={r.row} className="border-b border-slate-100 dark:border-white/5">
                    <td className="py-1.5 text-slate-500 dark:text-slate-400">{r.row}</td>
                    <td className="py-1.5 text-slate-600 dark:text-slate-300">{r.student_id ?? "—"}</td>
                    <td className="py-1.5">
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
                    <td className="py-1.5 text-slate-500 dark:text-slate-400">
                      {r.message ?? flattenErrors(r.errors)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" block={false} onClick={onCancel}>
            Cancel
          </Button>
          {result.created > 0 && (
            <Button
              type="button"
              block={false}
              isLoading={isCreating}
              loadingLabel="Creating accounts…"
              onClick={handleCreateAccounts}
            >
              Create Accounts
            </Button>
          )}
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
      <FormError message={error} />

      <p className="font-body text-sm text-slate-600 dark:text-slate-300">
        Upload a <span className="font-medium">.csv</span> or{" "}
        <span className="font-medium">.xlsx</span> file with student records.
      </p>

      <button
        type="button"
        onClick={downloadTemplate}
        className="flex w-fit items-center gap-1.5 font-body text-xs text-navy-700 underline decoration-navy-300 underline-offset-2 hover:text-navy-900 dark:text-mist-100 dark:decoration-white/30 dark:hover:text-white"
      >
        <DownloadIcon size={14} />
        Download CSV template
      </button>

      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        className="flex flex-col items-center gap-2 rounded-lg border-2 border-dashed border-slate-300 bg-slate-50 p-6 transition-colors duration-150 hover:border-navy-400 hover:bg-slate-100 dark:border-white/15 dark:bg-white/5 dark:hover:border-white/30 dark:hover:bg-white/10"
      >
        <UploadIcon size={24} />
        <span className="font-body text-sm text-slate-600 dark:text-slate-300">
          {file ? file.name : "Click to select a file"}
        </span>
        {file && (
          <span className="font-body text-xs text-slate-400 dark:text-slate-500">
            {(file.size / 1024).toFixed(1)} KB
          </span>
        )}
      </button>
      <input
        ref={inputRef}
        type="file"
        accept={ACCEPTED}
        onChange={(e) => setFile(e.target.files?.[0] ?? null)}
        className="hidden"
      />

      <p className="font-body text-xs leading-relaxed text-slate-400 dark:text-slate-500">
        Required columns: firstName, lastName, mobile, email, programId, yearLevel, enrolledStatus
        (REGULAR / IRREGULAR), studentType (NEW_STUDENT / TRANSFEREE / RETURNEE / CONTINUING_STUDENT),
        syId, semId. Use IDs from the system — see the template for examples.
      </p>

      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" block={false} onClick={onCancel}>
          Cancel
        </Button>
        <Button block={false} isLoading={isLoading} loadingLabel="Importing…" disabled={!file}>
          Import
        </Button>
      </div>
    </form>
  );
}
