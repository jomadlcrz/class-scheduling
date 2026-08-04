import { useEffect, useState } from "react";
import { FormError } from "~/components/forms/form-error";
import { Alert, AlertDescription, AlertTitle } from "~/components/ui/alert";
import { Button } from "~/components/ui/button";
import { AlertTriangleIcon } from "~/components/ui/icons";
import { inputClassName } from "~/components/ui/input";
import { Modal } from "~/components/ui/modal";
import { Spinner } from "~/components/ui/spinner";
import {
  permissionService,
  type PermissionArchivePreview,
} from "~/services/permission.service";
import type { RolePermission } from "~/types/permission";

type PermissionArchiveDialogProps = {
  permission: RolePermission | null;
  onClose: () => void;
  onConfirm: (permission: RolePermission) => Promise<void>;
};

/** Archive confirmation backed by the permission impact-preview endpoint. */
export function PermissionArchiveDialog({
  permission,
  onClose,
  onConfirm,
}: PermissionArchiveDialogProps) {
  const [preview, setPreview] = useState<PermissionArchivePreview | null>(null);
  const [confirmValue, setConfirmValue] = useState("");
  const [loading, setLoading] = useState(false);
  const [archiving, setArchiving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!permission) return;
    setPreview(null);
    setConfirmValue("");
    setError(null);
    setArchiving(false);
    setLoading(true);
    permissionService
      .getArchivePreview(permission.id)
      .then(setPreview)
      .catch((err) => setError(err instanceof Error ? err.message : ""))
      .finally(() => setLoading(false));
  }, [permission]);

  async function handleArchive() {
    if (!permission) return;
    setError(null);
    setArchiving(true);
    try {
      await onConfirm(permission);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "");
      setArchiving(false);
    }
  }

  const slug = preview?.permission.permission_slug ?? "";

  return (
    <Modal open={permission !== null} onClose={onClose} title="Archive permission">
      {loading ? (
        <div
          role="status"
          aria-label="Loading archive preview"
          className="grid place-items-center py-10 text-navy-700 dark:text-slate-200"
        >
          <Spinner />
        </div>
      ) : error && !preview ? (
        <div className="flex flex-col gap-4">
          <FormError message={error} />
          <div className="flex justify-end">
            <Button type="button" variant="outline" block={false} onClick={onClose}>Close</Button>
          </div>
        </div>
      ) : preview && permission ? (
        <div className="flex flex-col gap-4">
          {!preview.archivable ? (
            <>
              <Alert variant="destructive">
                <AlertTriangleIcon />
                <AlertTitle>This permission can't be archived</AlertTitle>
                <AlertDescription>
                  Revoke it from every assigned role before archiving it.
                </AlertDescription>
              </Alert>
              <div className="flex justify-end">
                <Button type="button" variant="outline" block={false} onClick={onClose}>Close</Button>
              </div>
            </>
          ) : (
            <>
              <p className="font-body text-sm leading-relaxed text-slate-600 dark:text-slate-300">
                Archiving <span className="font-medium text-navy-700 dark:text-mist-100">{slug}</span> removes it from the active permission catalog. It can be restored from Archive.
              </p>
              <div className="flex flex-col gap-1.5">
                <label
                  htmlFor="permission-archive-confirm"
                  className="font-body text-sm font-medium text-navy-700 dark:text-mist-100"
                >
                  Type <span className="font-semibold">{slug}</span> to confirm archival
                </label>
                <input
                  id="permission-archive-confirm"
                  type="text"
                  autoComplete="off"
                  spellCheck={false}
                  value={confirmValue}
                  onChange={(event) => setConfirmValue(event.target.value)}
                  placeholder={slug}
                  className={inputClassName}
                />
              </div>
              <FormError message={error} />
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" block={false} onClick={onClose}>Cancel</Button>
                <Button
                  type="button"
                  variant="danger"
                  block={false}
                  disabled={confirmValue !== slug}
                  isLoading={archiving}
                  loadingLabel="Archiving…"
                  onClick={handleArchive}
                >
                  Archive permission
                </Button>
              </div>
            </>
          )}
        </div>
      ) : null}
    </Modal>
  );
}
