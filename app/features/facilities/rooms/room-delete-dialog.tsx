import { useEffect, useState } from "react";
import { FormError } from "~/components/forms/form-error";
import { Alert, AlertDescription, AlertTitle } from "~/components/ui/alert";
import { Button } from "~/components/ui/button";
import { AlertTriangleIcon, CalendarIcon } from "~/components/ui/icons";
import { inputClassName } from "~/components/ui/input";
import { Modal } from "~/components/ui/modal";
import { Spinner } from "~/components/ui/spinner";
import { roomService } from "~/services/room.service";
import type { Room, RoomDeletePreview } from "~/types/room";

type RoomDeleteDialogProps = {
  room: Room | null;
  onClose: () => void;
  onConfirm: (room: Room) => Promise<void>;
};

/** Confirm-preview dialog for deleting a room: fetches GET /rooms/:id/delete-preview.
 * Unlike Program/Set/Subject, a room still blocks while a real schedule uses it —
 * the type-to-confirm on the room's own name is the only other guard. */
export function RoomDeleteDialog({ room, onClose, onConfirm }: RoomDeleteDialogProps) {
  const [preview, setPreview] = useState<RoomDeletePreview | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmValue, setConfirmValue] = useState("");
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (!room) return;
    setPreview(null);
    setError(null);
    setConfirmValue("");
    setDeleting(false);
    setLoading(true);
    roomService
      .getDeletePreview(room.id)
      .then(setPreview)
      .catch((err) => setError(err instanceof Error ? err.message : ""))
      .finally(() => setLoading(false));
  }, [room]);

  const confirmed = preview !== null && confirmValue.trim() === preview.room.room_name;

  async function handleDelete() {
    if (!room) return;
    setError(null);
    setDeleting(true);
    try {
      await onConfirm(room);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "");
    } finally {
      setDeleting(false);
    }
  }

  function renderBody() {
    if (loading) {
      return (
        <div
          role="status"
          aria-label="Loading delete preview"
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

    if (!preview.deletable) {
      return (
        <div className="flex flex-col gap-4">
          <Alert variant="destructive">
            <AlertTriangleIcon />
            <AlertTitle>This room is still in use</AlertTitle>
            <AlertDescription>
              <span className="flex items-center gap-2">
                <CalendarIcon />
                {preview.blockers.regular_schedules}{" "}
                {preview.blockers.regular_schedules === 1 ? "schedule session" : "schedule sessions"}{" "}
                still use this room.
              </span>
            </AlertDescription>
          </Alert>
          <p className="font-body text-sm leading-relaxed text-slate-600 dark:text-slate-300">
            Deleting a room never touches the curriculum, so a schedule that
            depends on it can't be cascaded away — that would leave a set
            half-scheduled with no room to reassign to. Move those classes to
            another room first, then retry.
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
          Deleting{" "}
          <span className="font-medium text-navy-700 dark:text-mist-100">
            {preview.room.room_name}
          </span>{" "}
          only soft-deletes the room — no curriculum or schedule is touched. It
          can be restored from Recently Deleted until it is purged after the
          standard 30-day window.
        </p>

        <div className="flex flex-col gap-1.5">
          <label
            htmlFor="room-delete-confirm"
            className="font-body text-sm font-medium text-navy-700 dark:text-mist-100"
          >
            Type{" "}
            <span className="font-semibold text-navy-700 dark:text-mist-100">
              {preview.room.room_name}
            </span>{" "}
            to confirm deletion
          </label>
          <input
            id="room-delete-confirm"
            type="text"
            autoComplete="off"
            spellCheck={false}
            value={confirmValue}
            onChange={(e) => setConfirmValue(e.target.value)}
            placeholder={preview.room.room_name}
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
            isLoading={deleting}
            loadingLabel="Deleting…"
            onClick={handleDelete}
          >
            Delete room
          </Button>
        </div>
      </div>
    );
  }

  return (
    <Modal open={room !== null} onClose={onClose} title="Delete room" wide>
      {renderBody()}
    </Modal>
  );
}
