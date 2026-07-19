import { ConfirmDialog } from "~/components/ui/modal";
import type { Dean } from "~/types/dean";

type ActivateDeanDialogProps = {
  dean: Dean | null;
  onClose: () => void;
  onConfirm: (dean: Dean) => Promise<void>;
};

export function ActivateDeanDialog({ dean, onClose, onConfirm }: ActivateDeanDialogProps) {
  return (
    <ConfirmDialog
      open={dean !== null}
      onClose={onClose}
      title="Activate dean"
      confirmLabel="Activate"
      loadingLabel="Activating…"
      onConfirm={() => onConfirm(dean!)}
    >
      <span className="font-medium text-navy-700 dark:text-mist-100">{dean?.name}</span> will be
      restored to active status.
    </ConfirmDialog>
  );
}
