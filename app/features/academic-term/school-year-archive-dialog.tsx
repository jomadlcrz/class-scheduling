import { useEffect, useState } from "react";
import { FormError } from "~/components/forms/form-error";
import { Alert, AlertDescription, AlertTitle } from "~/components/ui/alert";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { AlertTriangleIcon } from "~/components/ui/icons";
import { inputClassName } from "~/components/ui/input";
import { Modal } from "~/components/ui/modal";
import { Spinner } from "~/components/ui/spinner";
import { schoolYearService, type SchoolYearOption, type SchoolYearArchivePreview } from "~/services/school-year.service";

type SchoolYearArchiveDialogProps = {
  schoolYear: SchoolYearOption | null;
  onClose: () => void;
  onConfirm: (schoolYear: SchoolYearOption) => Promise<void>;
};

function formatDate(value: string | null | undefined) {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : new Intl.DateTimeFormat(undefined, { dateStyle: "medium", timeStyle: "short" }).format(date);
}

function Details({ schoolYear, preview }: { schoolYear: SchoolYearOption; preview: SchoolYearArchivePreview }) {
  const createdAt = formatDate(schoolYear.createdAt);
  return (
    <dl className="grid gap-4 rounded-lg border border-slate-200 bg-slate-50/70 p-4 sm:grid-cols-3 dark:border-white/10 dark:bg-white/5">
      <div><dt className="font-body text-xs text-slate-500 dark:text-slate-400">School Year</dt><dd className="mt-1 font-body text-sm font-semibold text-navy-700 dark:text-white">{preview.schoolYear.schoolYear}</dd></div>
      {schoolYear.status && <div><dt className="font-body text-xs text-slate-500 dark:text-slate-400">Calendar Status</dt><dd className="mt-1"><Badge tone="slate">{schoolYear.status}</Badge></dd></div>}
      {createdAt && <div><dt className="font-body text-xs text-slate-500 dark:text-slate-400">Created At</dt><dd className="mt-1 font-body text-sm font-medium text-navy-700 dark:text-white">{createdAt}</dd></div>}
    </dl>
  );
}

/** Archive flow with an impact preview and the exact-name confirmation required by the API. */
export function SchoolYearArchiveDialog({ schoolYear, onClose, onConfirm }: SchoolYearArchiveDialogProps) {
  const [preview, setPreview] = useState<SchoolYearArchivePreview | null>(null);
  const [loading, setLoading] = useState(false);
  const [archiving, setArchiving] = useState(false);
  const [confirmValue, setConfirmValue] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!schoolYear) return;
    setPreview(null); setConfirmValue(""); setError(null); setArchiving(false); setLoading(true);
    schoolYearService.getArchivePreview(schoolYear.id).then(setPreview).catch((err) => setError(err instanceof Error ? err.message : "")).finally(() => setLoading(false));
  }, [schoolYear]);

  function handleClose() { if (!archiving) onClose(); }
  async function handleArchive() {
    if (!schoolYear) return;
    setError(null); setArchiving(true);
    try { await onConfirm(schoolYear); onClose(); } catch (err) { setError(err instanceof Error ? err.message : ""); } finally { setArchiving(false); }
  }

  const isConfirmed = preview !== null && confirmValue === preview.schoolYear.schoolYear;
  return (
    <Modal open={schoolYear !== null} onClose={handleClose} title="Archive School Year" wide>
      {loading ? <div role="status" aria-label="Loading archive preview" className="grid place-items-center py-12 text-navy-700 dark:text-slate-200"><Spinner /></div> : error && !preview ? (
        <div className="flex flex-col gap-4"><FormError message={error} /><div className="flex justify-end"><Button type="button" variant="outline" block={false} onClick={handleClose}>Close</Button></div></div>
      ) : preview && schoolYear ? (
        <div className="flex flex-col gap-5">
          <div className="flex gap-3"><span className="grid size-10 shrink-0 place-items-center rounded-full bg-amber-100 text-amber-600 dark:bg-amber-400/10 dark:text-gold-300"><AlertTriangleIcon /></span><div><p className="font-body text-sm leading-relaxed text-slate-600 dark:text-slate-300">Are you sure you want to archive this school year?</p><p className="mt-1 font-body text-xs leading-relaxed text-slate-500 dark:text-slate-400">It will be removed from active dropdowns and reports. Historical records will remain accessible.</p></div></div>
          <Details schoolYear={schoolYear} preview={preview} />
          {!preview.archivable ? <Alert variant="destructive"><AlertTriangleIcon /><AlertTitle>This school year is still in use</AlertTitle><AlertDescription><ul className="mt-1 list-disc space-y-1 pl-4">{preview.blockers.items.map((item) => <li key={item.key}>{item.count} {item.label.toLowerCase()}</li>)}</ul></AlertDescription></Alert> : (
            <div className="flex flex-col gap-1.5"><label htmlFor="school-year-archive-confirm" className="font-body text-sm font-medium text-navy-700 dark:text-mist-100">Type <span className="font-semibold">{preview.schoolYear.schoolYear}</span> to confirm archival</label><input id="school-year-archive-confirm" type="text" autoComplete="off" spellCheck={false} value={confirmValue} onChange={(event) => setConfirmValue(event.target.value)} placeholder={preview.schoolYear.schoolYear} className={inputClassName} /></div>
          )}
          <FormError message={error} />
          <div className="flex flex-col-reverse justify-end gap-2 sm:flex-row"><Button type="button" variant="outline" block={false} onClick={handleClose}>{preview.archivable ? "Cancel" : "Close"}</Button>{preview.archivable && <Button type="button" variant="danger" block={false} disabled={!isConfirmed} isLoading={archiving} loadingLabel="Archiving…" onClick={handleArchive}>Archive School Year</Button>}</div>
        </div>
      ) : null}
    </Modal>
  );
}
