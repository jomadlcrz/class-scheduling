import { useEffect, useState } from "react";
import { toast } from "sonner";
import { FormError } from "~/components/forms/form-error";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Modal } from "~/components/ui/modal";
import { enrollmentService } from "~/services/enrollment.service";

export function SetCapacityDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [value, setValue] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    setValue(null);
    setError(null);
    enrollmentService.getSetCapacity().then(setValue).catch((err) => setError(err instanceof Error ? err.message : ""));
  }, [open]);

  async function save(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const next = Number(new FormData(event.currentTarget).get("capacity"));
    setSaving(true);
    setError(null);
    try {
      const result = await enrollmentService.updateSetCapacity(next);
      setValue(result.value);
      if (result.message) toast.success(result.message);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="Class Size Cap">
      <FormError message={error} />
      {value == null ? !error && <p className="font-body text-sm text-slate-500 dark:text-slate-400">Loading…</p> : (
        <form className="flex flex-col gap-4" onSubmit={save} noValidate>
          <Input id="set-capacity" name="capacity" type="number" min="1" label="Maximum students per set" defaultValue={value} required />
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" block={false} onClick={onClose}>Cancel</Button>
            <Button type="submit" block={false} isLoading={saving} loadingLabel="Saving…">Save</Button>
          </div>
        </form>
      )}
    </Modal>
  );
}
