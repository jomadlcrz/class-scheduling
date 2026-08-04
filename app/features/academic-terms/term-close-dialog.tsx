import { useEffect, useState } from "react";
import { Button } from "~/components/ui/button";
import { FormError } from "~/components/forms/form-error";
import { Modal } from "~/components/ui/modal";
import { Textarea } from "~/components/ui/textarea";
import { Spinner } from "~/components/ui/spinner";
import { ClosureEffectsPanel } from "~/features/academic-terms/closure-effects-panel";
import { termClosureService } from "~/services/term-closure.service";
import type { TermClosePreview } from "~/types/term-closure";

type TermCloseDialogProps = {
  open: boolean;
  syId: number | null;
  semesterNumber: number | null;
  onClose: () => void;
  onConfirm: (reason: string) => Promise<void>;
};

export function TermCloseDialog({ open, syId, semesterNumber, onClose, onConfirm }: TermCloseDialogProps) {
  const [preview, setPreview] = useState<TermClosePreview | null>(null);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [reason, setReason] = useState("");

  useEffect(() => {
    if (!open || syId == null || semesterNumber == null) {
      setPreview(null);
      setReason("");
      setError(null);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError(null);
    termClosureService
      .getTermStatePreview(syId, semesterNumber)
      .then((data) => {
        if (!cancelled) {
          setPreview(data);
          const defaultReason =
            semesterNumber === 1 ? "1st semester posted" : semesterNumber === 2 ? "2nd semester posted" : "";
          setReason(defaultReason);
        }
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
  }, [open, syId, semesterNumber]);

  function handleClose() {
    if (submitting) return;
    onClose();
  }

  async function handleConfirm() {
    if (preview?.confirmation.closureReasonRequired && !reason.trim()) {
      setError("A reason is required before posting this term.");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      await onConfirm(reason.trim());
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to post term.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Modal open={open} onClose={handleClose} title={preview?.confirmation.title ?? "Post term"} wide>
      <div className="flex flex-col gap-4">
        <FormError message={error} />

        {loading ? (
          <div role="status" aria-label="Loading close preview" className="grid place-items-center py-10">
            <Spinner />
          </div>
        ) : preview ? (
          <>
            <p className="font-body text-sm text-slate-600 dark:text-slate-300">{preview.confirmation.message}</p>

            {preview.closureEffects.length > 0 && (
              <ClosureEffectsPanel effects={preview.closureEffects} variant="compact" />
            )}

            <Textarea
              id="term-close-reason"
              label={preview.confirmation.closureReasonLabel}
              value={reason}
              onChange={(event) => setReason(event.target.value)}
              placeholder="Optional notes for the audit trail"
              required={preview.confirmation.closureReasonRequired}
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
            loadingLabel="Posting…"
            onClick={handleConfirm}
          >
            Post term
          </Button>
        </div>
      </div>
    </Modal>
  );
}
