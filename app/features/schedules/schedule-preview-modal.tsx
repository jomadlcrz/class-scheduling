import { useEffect, useState } from "react";
import { FormError } from "~/components/forms/form-error";
import { Modal } from "~/components/ui/modal";
import { Spinner } from "~/components/ui/spinner";
import {
  scheduleReleaseStatusLabel,
  scheduleReleaseStatusTone,
  StatusBadge,
} from "~/features/academic-terms/status-badges";
import { ScheduleGrid } from "~/features/schedules/schedule-grid";
import { ScheduleTable } from "~/features/schedules/schedule-table";
import { ScheduleViewToggle, type ScheduleViewMode } from "~/features/schedules/schedule-view-toggle";
import { scheduleReleaseService } from "~/services/schedule-release.service";
import type { SchedulePreview } from "~/types/schedule-release";

type SchedulePreviewModalProps = {
  open: boolean;
  releaseId: number | null;
  /** Points this shared modal at either the registrar or the dean preview endpoint. */
  fetchPreview: (id: number) => Promise<SchedulePreview>;
  onClose: () => void;
};

/** Read-only weekly grid for a schedule release, shared by the registrar and dean UIs. */
export function SchedulePreviewModal({ open, releaseId, fetchPreview, onClose }: SchedulePreviewModalProps) {
  const [preview, setPreview] = useState<SchedulePreview | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ScheduleViewMode>("table");

  useEffect(() => {
    if (!open || releaseId == null) {
      setPreview(null);
      setError(null);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError(null);
    fetchPreview(releaseId)
      .then((data) => {
        if (!cancelled) setPreview(data);
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
  }, [open, releaseId, fetchPreview]);

  const schedules = preview ? scheduleReleaseService.mapPreviewToSchedules(preview) : [];
  const release = preview?.release;

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={release ? `${release.setCode ?? "Schedule"} preview` : "Schedule preview"}
      xl
    >
      <div className="flex flex-col gap-4">
        <FormError message={error} />

        {loading ? (
          <div role="status" aria-label="Loading schedule preview" className="grid place-items-center py-12">
            <Spinner />
          </div>
        ) : release ? (
          <>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-2 font-body text-sm text-slate-600 dark:text-slate-300">
                <span className="font-semibold text-navy-700 dark:text-mist-100">
                  {release.programAbbrev} {release.setCode}
                </span>
                <StatusBadge tone={scheduleReleaseStatusTone(release.releaseStatus)}>
                  {scheduleReleaseStatusLabel(release.releaseStatus)}
                </StatusBadge>
                <span>{release.sessionCount} sessions</span>
              </div>
              <ScheduleViewToggle value={viewMode} onChange={setViewMode} />
            </div>

            {schedules.length === 0 ? (
              <p className="py-8 text-center font-body text-sm text-slate-500 dark:text-slate-400">
                No sessions saved for this schedule yet.
              </p>
            ) : viewMode === "grid" ? (
              <ScheduleGrid schedules={schedules} />
            ) : (
              <ScheduleTable schedules={schedules} />
            )}
          </>
        ) : null}
      </div>
    </Modal>
  );
}
