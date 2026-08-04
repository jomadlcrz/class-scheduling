import { useEffect, useState } from "react";
import { FormError } from "~/components/forms/form-error";
import { Alert, AlertDescription, AlertTitle } from "~/components/ui/alert";
import { Button } from "~/components/ui/button";
import { AlertTriangleIcon, CalendarIcon } from "~/components/ui/icons";
import { inputClassName } from "~/components/ui/input";
import { Modal } from "~/components/ui/modal";
import { Spinner } from "~/components/ui/spinner";
import { roomService } from "~/services/room.service";
import type { Room, RoomArchivePreview } from "~/types/room";

type RoomArchiveDialogProps = {
  room: Room | null;
  onClose: () => void;
  onConfirm: (room: Room) => Promise<void>;
};

/** Confirm-preview dialog for archiving a room: fetches GET /rooms/:id/archive-preview.
 * A room still blocks while a real schedule uses it — the type-to-confirm on the room's
 * own name is the only other guard. */
export function RoomArchiveDialog({ room, onClose, onConfirm }: RoomArchiveDialogProps) {
  const [preview, setPreview] = useState<RoomArchivePreview | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmValue, setConfirmValue] = useState("");
  const [archiving, setArchiving] = useState(false);

  useEffect(() => {
    if (!room) return;
    setPreview(null);
    setError(null);
    setConfirmValue("");
    setArchiving(false);
    setLoading(true);
    roomService
      .getArchivePreview(room.id)
      .then(setPreview)
      .catch((err) => setError(err instanceof Error ? err.message : ""))
      .finally(() => setLoading(false));
  }, [room]);

  const confirmed = preview !== null && confirmValue.trim() === preview.room.roomName;

  async function handleArchive() {
    if (!room) return;
    setError(null);
    setArchiving(true);
    try {
      await onConfirm(room);
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
      return (
        <div className="flex flex-col gap-4">
          <Alert variant="destructive">
            <AlertTriangleIcon />
            <AlertTitle>This room is still in use</AlertTitle>
            <AlertDescription>
              <span className="flex items-center gap-2">
                <CalendarIcon />
                {preview.blockers.regularSchedules}{" "}
                {preview.blockers.regularSchedules === 1 ? "schedule session" : "schedule sessions"}{" "}
                still use this room.
              </span>
            </AlertDescription>
          </Alert>
          <p className="font-body text-sm leading-relaxed text-slate-600 dark:text-slate-300">
            Move those classes to another room first, then retry.
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
            {preview.room.roomName}
          </span>{" "}
          only soft-deletes the room — no curriculum or schedule is touched. It can be restored from Archive at any time.
        </p>

        <div className="flex flex-col gap-1.5">
          <label
            htmlFor="room-archive-confirm"
            className="font-body text-sm font-medium text-navy-700 dark:text-mist-100"
          >
            Type{" "}
            <span className="font-semibold text-navy-700 dark:text-mist-100">
              {preview.room.roomName}
            </span>{" "}
            to confirm archival
          </label>
          <input
            id="room-archive-confirm"
            type="text"
            autoComplete="off"
            spellCheck={false}
            value={confirmValue}
            onChange={(e) => setConfirmValue(e.target.value)}
            placeholder={preview.room.roomName}
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
            Archive room
          </Button>
        </div>
      </div>
    );
  }

  return (
    <Modal open={room !== null} onClose={onClose} title="Archive room" wide>
      {renderBody()}
    </Modal>
  );
}
