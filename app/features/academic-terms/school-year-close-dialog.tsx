import { useEffect, useState } from "react";
import { Button } from "~/components/ui/button";
import { FormError } from "~/components/forms/form-error";
import { Modal } from "~/components/ui/modal";
import { Textarea } from "~/components/ui/textarea";
import { Spinner } from "~/components/ui/spinner";
import { termClosureService } from "~/services/term-closure.service";
import type { SchoolYearClosePreview } from "~/types/term-closure";

type SchoolYearCloseDialogProps = {
  open: boolean;
  syId: number | null;
  onClose: () => void;
  onConfirm: (reason: string) => Promise<void>;
};

export function SchoolYearCloseDialog({ open, syId, onClose, onConfirm }: SchoolYearCloseDialogProps) {
  const [preview, setPreview] = useState<SchoolYearClosePreview | null>(null);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [reason, setReason] = useState("");

  useEffect(() => {
    if (!open || syId == null) {
      setPreview(null);
      setReason("");
      setError(null);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError(null);
    termClosureService
      .getSchoolYearClosePreview(syId)
      .then((data) => {
        if (!cancelled) setPreview(data);
      })
      .catch((err) => {
        if (!cancelled) setError(err instanceof Error ? err.message : "Unable to load preview.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [open, syId]);

  function handleClose() {
    if (submitting) return;
    onClose();
  }

  async function handleConfirm() {
    if (preview?.confirmation.completionReasonRequired && !reason.trim()) {
      setError("A reason is required before closing this school year.");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      await onConfirm(reason.trim());
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to close school year.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Modal open={open} onClose={handleClose} title={preview?.confirmation.title ?? "Close school year"} wide>
      <div className="flex flex-col gap-4">
        <FormError message={error} />

        {loading ? (
          <div role="status" aria-label="Loading close preview" className="grid place-items-center py-10">
            <Spinner />
          </div>
        ) : preview ? (
          <>
            <p className="font-body text-sm text-slate-600 dark:text-slate-300">{preview.confirmation.message}</p>

            {preview.missingSemesters.length > 0 && (
              <p className="font-body text-sm text-amber-700 dark:text-amber-300">
                Still open: semester {preview.missingSemesters.join(", ")}.
              </p>
            )}

            <Textarea
              id="school-year-close-reason"
              label={preview.confirmation.completionReasonLabel}
              value={reason}
              onChange={(event) => setReason(event.target.value)}
              placeholder="Optional notes for the audit trail"
              required={preview.confirmation.completionReasonRequired}
            />
          </>
        ) : null}

        <div className="flex justify-end gap-2 border-t border-slate-200 pt-4 dark:border-white/10">
          <Button type="button" variant="outline" block={false} disabled={submitting} onClick={handleClose}>
            Cancel
          </Button>
          <Button
            type="button"
            block={false}
            disabled={loading || submitting || preview?.canClose === false}
            isLoading={submitting}
            loadingLabel="Closing…"
            onClick={handleConfirm}
          >
            Close school year
          </Button>
        </div>
      </div>
    </Modal>
  );
}
