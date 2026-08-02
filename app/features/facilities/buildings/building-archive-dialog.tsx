import { useEffect, useState } from "react";
import { FormError } from "~/components/forms/form-error";
import { Alert, AlertDescription, AlertTitle } from "~/components/ui/alert";
import { Button } from "~/components/ui/button";
import { AlertTriangleIcon, DoorOpenIcon } from "~/components/ui/icons";
import { inputClassName } from "~/components/ui/input";
import { Modal } from "~/components/ui/modal";
import { Spinner } from "~/components/ui/spinner";
import { buildingService } from "~/services/building.service";
import type { Building, BuildingArchivePreview } from "~/types/building";

type BuildingArchiveDialogProps = {
  building: Building | null;
  onClose: () => void;
  onConfirm: (building: Building) => Promise<void>;
};

const summaryRowClassName =
  "flex items-center justify-between gap-3 rounded-lg border border-slate-200 bg-white px-3.5 py-2.5 text-sm dark:border-white/10 dark:bg-white/5";

/** Confirm-preview dialog for archiving a building: fetches GET /buildings/:id/archive-preview.
 * Cascades to active rooms in the building, but refuses if any room is still used by a schedule. */
export function BuildingArchiveDialog({ building, onClose, onConfirm }: BuildingArchiveDialogProps) {
  const [preview, setPreview] = useState<BuildingArchivePreview | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmValue, setConfirmValue] = useState("");
  const [archiving, setArchiving] = useState(false);

  useEffect(() => {
    if (!building) return;
    setPreview(null);
    setError(null);
    setConfirmValue("");
    setArchiving(false);
    setLoading(true);
    buildingService
      .getArchivePreview(building.id)
      .then(setPreview)
      .catch((err) => setError(err instanceof Error ? err.message : ""))
      .finally(() => setLoading(false));
  }, [building]);

  const confirmed = preview !== null && confirmValue.trim() === preview.building.buildingName;

  async function handleArchive() {
    if (!building) return;
    setError(null);
    setArchiving(true);
    try {
      await onConfirm(building);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "");
    } finally {
      setArchiving(false);
    }
  }

  function renderBody() {
    if (loading) {
      return (
        <div
          role="status"
          aria-label="Loading archive preview"
          className="grid place-items-center py-10 text-navy-700 dark:text-slate-200"
        >
          <Spinner />
        </div>
      );
    }

    if (error) {
      return (
        <div className="flex flex-col gap-4">
          <FormError message={error} />
          <div className="flex justify-end">
            <Button type="button" variant="outline" block={false} onClick={onClose}>
              Close
            </Button>
          </div>
        </div>
      );
    }

    if (!preview) return null;

    if (!preview.archivable) {
      const { roomsInUse } = preview.blockers;
      return (
        <div className="flex flex-col gap-4">
          <Alert variant="destructive">
            <AlertTriangleIcon />
            <AlertTitle>This building can't be archived yet</AlertTitle>
            <AlertDescription>
              One or more rooms are still used by active schedules.
            </AlertDescription>
          </Alert>

          {roomsInUse.length > 0 && (
            <ul className="flex flex-col gap-1.5">
              {roomsInUse.map((r) => (
                <li key={r.roomId} className={summaryRowClassName}>
                  <span className="flex items-center gap-2">
                    <DoorOpenIcon />
                    {r.roomName}
                  </span>
                  <span className="font-medium">
                    {r.regularSchedules}{" "}
                    {r.regularSchedules === 1 ? "session in use" : "sessions in use"}
                  </span>
                </li>
              ))}
            </ul>
          )}

          <p className="font-body text-sm leading-relaxed text-slate-600 dark:text-slate-300">
            Move classes to another room first — then you can retry.
          </p>
          <div className="flex justify-end">
            <Button type="button" variant="outline" block={false} onClick={onClose}>
              Close
            </Button>
          </div>
        </div>
      );
    }

    return (
      <div className="flex flex-col gap-4">
        <p className="font-body text-sm leading-relaxed text-slate-600 dark:text-slate-300">
          Archiving{" "}
          <span className="font-medium text-navy-700 dark:text-mist-100">
            {preview.building.buildingName}
          </span>{" "}
          soft-deletes the building and its {preview.willArchive.length}{" "}
          {preview.willArchive.length === 1 ? "active room" : "active rooms"}. Restore them from
          Recently Deleted within the standard 30-day window.
        </p>

        {preview.willArchive.length > 0 && (
          <ul className="flex flex-wrap gap-1.5">
            {preview.willArchive.map((room) => (
              <li
                key={room.roomId}
                className="rounded-md border border-slate-200 bg-slate-50 px-2 py-0.5 text-xs text-slate-600 dark:border-white/10 dark:bg-white/5 dark:text-slate-300"
              >
                {room.roomName}
              </li>
            ))}
          </ul>
        )}

        <div className="flex flex-col gap-1.5">
          <label
            htmlFor="building-archive-confirm"
            className="font-body text-sm font-medium text-navy-700 dark:text-mist-100"
          >
            Type{" "}
            <span className="font-semibold text-navy-700 dark:text-mist-100">
              {preview.building.buildingName}
            </span>{" "}
            to confirm archival
          </label>
          <input
            id="building-archive-confirm"
            type="text"
            autoComplete="off"
            spellCheck={false}
            value={confirmValue}
            onChange={(e) => setConfirmValue(e.target.value)}
            placeholder={preview.building.buildingName}
            className={inputClassName}
          />
        </div>

        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" block={false} onClick={onClose}>
            Cancel
          </Button>
          <Button
            type="button"
            variant="danger"
            block={false}
            disabled={!confirmed}
            isLoading={archiving}
            loadingLabel="Archiving…"
            onClick={handleArchive}
          >
            Archive building
          </Button>
        </div>
      </div>
    );
  }

  return (
    <Modal open={building !== null} onClose={onClose} title="Archive building" wide>
      {renderBody()}
    </Modal>
  );
}
