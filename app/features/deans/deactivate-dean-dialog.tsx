import { ConfirmDialog } from "~/components/ui/modal";
import type { Dean } from "~/types/dean";

type DeactivateDeanDialogProps = {
  dean: Dean | null;
  onClose: () => void;
  onConfirm: (dean: Dean) => Promise<void>;
};

export function DeactivateDeanDialog({ dean, onClose, onConfirm }: DeactivateDeanDialogProps) {
  return (
    <ConfirmDialog
      open={dean !== null}
      onClose={onClose}
      title="Deactivate dean"
      confirmLabel="Deactivate"
      loadingLabel="Deactivating…"
      confirmVariant="danger"
      onConfirm={() => onConfirm(dean!)}
    >
      <span className="font-medium text-navy-700 dark:text-mist-100">{dean?.name}</span> will be
      marked as inactive. Their data is kept and can be reactivated anytime.
    </ConfirmDialog>
  );
}
