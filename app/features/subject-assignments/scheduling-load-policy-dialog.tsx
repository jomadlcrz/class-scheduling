import { useEffect, useState } from "react";
import { toast } from "sonner";
import { FormError } from "~/components/forms/form-error";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Modal } from "~/components/ui/modal";
import { deanService, type SchedulingLoadPolicy } from "~/services/dean.service";

type Props = {
  open: boolean;
  syId: number | null;
  semesterNumber: number | null;
  onClose: () => void;
};

export function SchedulingLoadPolicyDialog({ open, syId, semesterNumber, onClose }: Props) {
  const [policy, setPolicy] = useState<SchedulingLoadPolicy | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open || syId == null || semesterNumber == null) return;
    setPolicy(null);
    setError(null);
    deanService.getSchedulingLoadPolicy(syId, semesterNumber).then(setPolicy).catch((err) => {
      setError(err instanceof Error ? err.message : "");
    });
  }, [open, semesterNumber, syId]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!policy || syId == null || semesterNumber == null) return;
    const form = new FormData(event.currentTarget);
    setSaving(true);
    setError(null);
    try {
      const result = await deanService.updateSchedulingLoadPolicy({
        syId,
        semesterNumber,
        normalLoadHours: Number(form.get("normalLoadHours")),
        regularDailyCap: Number(form.get("regularDailyCap")),
        overloadDailyCap: Number(form.get("overloadDailyCap")),
      });
      setPolicy(result.policy);
      if (result.message) toast.success(result.message);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="Scheduling Load Policy">
      <FormError message={error} />
      {!policy ? (
        !error && <p className="font-body text-sm text-slate-500 dark:text-slate-400">Loading policy…</p>
      ) : (
        <form className="flex flex-col gap-4" onSubmit={handleSubmit} noValidate>
          {policy.isDefault && (
            <p className="font-body text-xs text-slate-500 dark:text-slate-400">Institution defaults are currently in force.</p>
          )}
          <Input id="normal-load-hours" name="normalLoadHours" type="number" step="0.5" min="1" max="66" label="Normal load hours" defaultValue={policy.normalLoadHours} disabled={policy.isClosed} required />
          <Input id="regular-daily-cap" name="regularDailyCap" type="number" step="0.5" min="1" max="11" label="Regular daily cap" defaultValue={policy.regularDailyCap} disabled={policy.isClosed} required />
          <Input id="overload-daily-cap" name="overloadDailyCap" type="number" step="0.5" min="1" max="11" label="Overload daily cap" defaultValue={policy.overloadDailyCap} disabled={policy.isClosed} required />
          {policy.guidelines.length > 0 && (
            <ul className="list-disc space-y-1 pl-5 font-body text-xs text-slate-500 dark:text-slate-400">
              {policy.guidelines.map((guideline) => <li key={guideline}>{guideline}</li>)}
            </ul>
          )}
          {policy.isClosed ? (
            <p className="font-body text-sm text-slate-500 dark:text-slate-400">This term is closed. Its policy is read-only.</p>
          ) : (
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" block={false} onClick={onClose}>Cancel</Button>
              <Button type="submit" block={false} isLoading={saving} loadingLabel="Saving…">Save Policy</Button>
            </div>
          )}
        </form>
      )}
    </Modal>
  );
}
