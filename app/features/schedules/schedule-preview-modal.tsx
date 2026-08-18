import { useEffect, useState } from "react";
import { DataLoadAlert } from "~/components/feedback/data-load-alert";
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
import { formatDateTime } from "~/lib/time";
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
        {error && <DataLoadAlert title="Schedule preview unavailable" message={error} permission={error.toLowerCase().includes("permission")} />}

        {loading ? (
          <div role="status" aria-label="Loading schedule preview" className="grid place-items-center py-12">
            <Spinner />
          </div>
        ) : release ? (
          <>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-2 font-body text-sm text-slate-500 dark:text-slate-400">
                <span className="font-semibold text-navy-800 dark:text-mist-100">
                  {release.programAbbrev} {release.setCode}
                </span>
                <StatusBadge tone={scheduleReleaseStatusTone(release.releaseStatus)}>
                  {scheduleReleaseStatusLabel(release.releaseStatus)}
                </StatusBadge>
                <span>{release.sessionCount} sessions</span>
              </div>
              <ScheduleViewToggle value={viewMode} onChange={setViewMode} />
            </div>

            <dl className="grid grid-cols-2 gap-x-4 gap-y-2 rounded-lg bg-slate-50 p-3 font-body text-xs text-slate-600 dark:bg-white/5 dark:text-slate-300 sm:grid-cols-4">
              <div><dt className="text-slate-400">Reference</dt><dd>{release.referenceCode ?? `Release #${release.id}`}</dd></div>
              <div><dt className="text-slate-400">Subjects</dt><dd>{release.subjectCount}</dd></div>
              <div><dt className="text-slate-400">Meetings</dt><dd>{release.generatedMeetingCount} generated · {release.majorMeetingCount} major · {release.tbaCount} TBA</dd></div>
              <div><dt className="text-slate-400">Submitted by</dt><dd>{release.submittedBy?.name ?? "—"}</dd></div>
              <div><dt className="text-slate-400">Submitted</dt><dd>{formatDateTime(release.submittedAt) || "—"}</dd></div>
              <div><dt className="text-slate-400">Reviewed</dt><dd>{formatDateTime(release.reviewedAt) || "—"}</dd></div>
              <div><dt className="text-slate-400">Approved</dt><dd>{formatDateTime(release.approvedAt) || "—"}</dd></div>
              {release.submissionNote && <div><dt className="text-slate-400">Submission note</dt><dd>{release.submissionNote}</dd></div>}
              {release.rejectionReason && <div className="col-span-2 sm:col-span-4"><dt className="text-red-500">Rejection reason</dt><dd className="text-red-600 dark:text-red-300">{release.rejectionReason}</dd></div>}
            </dl>

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
