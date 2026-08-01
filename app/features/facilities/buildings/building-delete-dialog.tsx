import { useEffect, useState } from "react";
import { FormError } from "~/components/forms/form-error";
import { Alert, AlertDescription, AlertTitle } from "~/components/ui/alert";
import { Button } from "~/components/ui/button";
import { AlertTriangleIcon, DoorOpenIcon, FolderOpenIcon, UsersIcon } from "~/components/ui/icons";
import { inputClassName } from "~/components/ui/input";
import { Modal } from "~/components/ui/modal";
import { Spinner } from "~/components/ui/spinner";
import { buildingService } from "~/services/building.service";
import type { Building, BuildingDeletePreview } from "~/types/building";

type BuildingDeleteDialogProps = {
  building: Building | null;
  onClose: () => void;
  onConfirm: (building: Building) => Promise<void>;
};

const summaryRowClassName =
  "flex items-center justify-between gap-3 rounded-lg border border-slate-200 bg-white px-3.5 py-2.5 text-sm dark:border-white/10 dark:bg-white/5";

/** Confirm-preview dialog for deleting a building: fetches GET /buildings/:id/delete-preview.
 * Cascades through every department's programs and soft-deletes its rooms and
 * departments, but refuses outright if a room is in active use or a department
 * has staff assigned. Requires typing the building's own name to confirm. */
export function BuildingDeleteDialog({ building, onClose, onConfirm }: BuildingDeleteDialogProps) {
  const [preview, setPreview] = useState<BuildingDeletePreview | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmValue, setConfirmValue] = useState("");
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (!building) return;
    setPreview(null);
    setError(null);
    setConfirmValue("");
    setDeleting(false);
    setLoading(true);
    buildingService
      .getDeletePreview(building.id)
      .then(setPreview)
      .catch((err) => setError(err instanceof Error ? err.message : ""))
      .finally(() => setLoading(false));
  }, [building]);

  const confirmed = preview !== null && confirmValue.trim() === preview.building.building_name;

  async function handleDelete() {
    if (!building) return;
    setError(null);
    setDeleting(true);
    try {
      await onConfirm(building);
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
      const { rooms_in_use, departments_with_staff } = preview.blockers;
      return (
        <div className="flex flex-col gap-4">
          <Alert variant="destructive">
            <AlertTriangleIcon />
            <AlertTitle>This building can't be deleted yet</AlertTitle>
            <AlertDescription>
              Either a room is in active use or a department still has staff
              assigned.
            </AlertDescription>
          </Alert>

          {rooms_in_use.length > 0 && (
            <ul className="flex flex-col gap-1.5">
              {rooms_in_use.map((r) => (
                <li key={r.room_id} className={summaryRowClassName}>
                  <span className="flex items-center gap-2">
                    <DoorOpenIcon />
                    {r.room_name}
                  </span>
                  <span className="font-medium">
                    {r.regular_schedules}{" "}
                    {r.regular_schedules === 1 ? "session in use" : "sessions in use"}
                  </span>
                </li>
              ))}
            </ul>
          )}

          {departments_with_staff.length > 0 && (
            <ul className="flex flex-col gap-1.5">
              {departments_with_staff.map((d) => (
                <li key={d.department_id} className={summaryRowClassName}>
                  <span className="flex items-center gap-2">
                    <UsersIcon />
                    {d.department_name}
                  </span>
                  <span className="font-medium">
                    {d.staff} {d.staff === 1 ? "staff member" : "staff members"}
                  </span>
                </li>
              ))}
            </ul>
          )}

          <p className="font-body text-sm leading-relaxed text-slate-600 dark:text-slate-300">
            Move classes to another room and reassign the staff first — then you
            can retry.
          </p>
          <div className="flex justify-end">
            <Button type="button" variant="outline" block={false} onClick={onClose}>
              Close
            </Button>
          </div>
        </div>
      );
    }

    const { rooms, departments, programs } = preview.will_delete;
    return (
      <div className="flex flex-col gap-4">
        <p className="font-body text-sm leading-relaxed text-slate-600 dark:text-slate-300">
          Deleting{" "}
          <span className="font-medium text-navy-700 dark:text-mist-100">
            {preview.building.building_name}
          </span>{" "}
          soft-deletes its rooms and departments, and cascades through every
          department's programs exactly like deleting each department itself:
          curriculum, sets, schedules, instructor assignments, and irregular
          enrollments.
        </p>

        <ul className="flex flex-col gap-2">
          <li className={summaryRowClassName}>
            <span className="flex items-center gap-2">
              <DoorOpenIcon />
              Rooms soft-deleted
            </span>
            <span className="font-medium">{rooms.length}</span>
          </li>
          <li className={summaryRowClassName}>
            <span className="flex items-center gap-2">
              <FolderOpenIcon />
              Departments soft-deleted
            </span>
            <span className="font-medium">{departments.length}</span>
          </li>
          <li className="flex flex-col gap-1.5">
            <div className={summaryRowClassName}>
              <span>Programs that cascade</span>
              <span className="font-medium">{programs.length}</span>
            </div>
            {programs.length > 0 && (
              <ul className="flex flex-wrap gap-1.5">
                {programs.map((p) => (
                  <li
                    key={p.program_id}
                    className="rounded-md border border-slate-200 bg-slate-50 px-2 py-0.5 text-xs text-slate-600 dark:border-white/10 dark:bg-white/5 dark:text-slate-300"
                  >
                    {p.program_abbrev}
                  </li>
                ))}
              </ul>
            )}
          </li>
        </ul>

        <div className="flex flex-col gap-1.5">
          <label
            htmlFor="building-delete-confirm"
            className="font-body text-sm font-medium text-navy-700 dark:text-mist-100"
          >
            Type{" "}
            <span className="font-semibold text-navy-700 dark:text-mist-100">
              {preview.building.building_name}
            </span>{" "}
            to confirm deletion
          </label>
          <input
            id="building-delete-confirm"
            type="text"
            autoComplete="off"
            spellCheck={false}
            value={confirmValue}
            onChange={(e) => setConfirmValue(e.target.value)}
            placeholder={preview.building.building_name}
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
            Delete building
          </Button>
        </div>
      </div>
    );
  }

  return (
    <Modal open={building !== null} onClose={onClose} title="Delete building" wide>
      {renderBody()}
    </Modal>
  );
}
