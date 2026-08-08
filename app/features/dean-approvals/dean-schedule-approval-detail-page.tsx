import { useEffect, useState } from "react";
import { toast } from "sonner";
import { useNavigate, useParams } from "react-router";
import { Button } from "~/components/ui/button";
import { EmptyState } from "~/components/feedback/empty-state";
import { ArrowLeftIcon, CheckIcon, CloseIcon } from "~/components/ui/icons";
import { Spinner } from "~/components/ui/spinner";
import { ScheduleApproveDialog } from "~/features/dean-approvals/schedule-approve-dialog";
import { ScheduleRejectDialog } from "~/features/dean-approvals/schedule-reject-dialog";
import { ScheduleGrid } from "~/features/schedules/schedule-grid";
import { ScheduleLifecycleRail } from "~/features/schedules/schedule-lifecycle-rail";
import { ScheduleTable } from "~/features/schedules/schedule-table";
import { ScheduleViewToggle, type ScheduleViewMode } from "~/features/schedules/schedule-view-toggle";
import { PageHeader } from "~/layouts/page-header";
import { scheduleReleaseService } from "~/services/schedule-release.service";
import type { SchedulePreview } from "~/types/schedule-release";

/** Deep-link target for the "schedule submitted for approval" notification. */
export function DeanScheduleApprovalDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const releaseId = Number(id);

  const [preview, setPreview] = useState<SchedulePreview | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ScheduleViewMode>("table");
  const [approveOpen, setApproveOpen] = useState(false);
  const [rejectOpen, setRejectOpen] = useState(false);

  useEffect(() => {
    if (!releaseId) return;
    let cancelled = false;
    setLoading(true);
    setError(null);
    scheduleReleaseService
      .getApprovalPreview(releaseId)
      .then((data) => {
        if (!cancelled) setPreview(data);
      })
      .catch((err) => {
        if (!cancelled) setError(err instanceof Error ? err.message : "Unable to load this schedule.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [releaseId]);

  async function handleApprove() {
    try {
      const { message } = await scheduleReleaseService.approveRelease(releaseId);
      if (message) toast.success(message);
      navigate("/dean/schedule-approvals");
    } catch (err) {
      // Already reviewed / term closed: refresh so the review buttons reflect the new status.
      await scheduleReleaseService.getApprovalPreview(releaseId).then(setPreview).catch(() => {});
      throw err instanceof Error ? err : new Error("Unable to approve the schedule.");
    }
  }

  async function handleReject(reason: string) {
    try {
      const { message } = await scheduleReleaseService.rejectRelease(releaseId, reason);
      if (message) toast.success(message);
      navigate("/dean/schedule-approvals");
    } catch (err) {
      await scheduleReleaseService.getApprovalPreview(releaseId).then(setPreview).catch(() => {});
      throw err instanceof Error ? err : new Error("Unable to reject the schedule.");
    }
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-8">
        <div role="status" aria-label="Loading schedule" className="grid place-items-center py-16">
          <Spinner />
        </div>
      </div>
    );
  }

  if (error || !preview) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-8">
        <PageHeader
          title="Schedule Not Found"
          description={error ?? "The requested schedule could not be loaded."}
          actions={
            <Button type="button" variant="outline" block={false} onClick={() => navigate("/dean/schedule-approvals")}>
              <ArrowLeftIcon /> Back
            </Button>
          }
        />
      </div>
    );
  }

  const { release, daySchedules } = preview;
  const schedules = scheduleReleaseService.mapPreviewToSchedules(preview);
  const canReview = release.releaseStatus === "pending_approval";

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <PageHeader
        title={`${release.programAbbrev ?? ""} ${release.setCode ?? ""}`.trim()}
        description="Review the full weekly schedule before approving or rejecting it."
        actions={
          <div className="flex flex-wrap justify-end gap-2">
            <Button type="button" variant="outline" block={false} onClick={() => navigate("/dean/schedule-approvals")}>
              <ArrowLeftIcon /> Back
            </Button>
            {canReview && (
              <>
                <Button type="button" variant="outline" block={false} onClick={() => setRejectOpen(true)}>
                  <CloseIcon size={14} />
                  Reject
                </Button>
                <Button type="button" block={false} onClick={() => setApproveOpen(true)}>
                  <CheckIcon size={14} />
                  Approve
                </Button>
              </>
            )}
          </div>
        }
      />

      <div className="mt-4">
        <ScheduleLifecycleRail release={release} audience="dean" />
      </div>

      <div className="mt-4 flex justify-end">
        <ScheduleViewToggle value={viewMode} onChange={setViewMode} />
      </div>

      <div className="mt-4">
        {daySchedules.length === 0 ? (
          <EmptyState title="No sessions saved">This schedule has no saved sessions yet.</EmptyState>
        ) : viewMode === "grid" ? (
          <ScheduleGrid schedules={schedules} />
        ) : (
          <ScheduleTable schedules={schedules} />
        )}
      </div>

      <ScheduleApproveDialog
        open={approveOpen}
        release={release}
        onClose={() => setApproveOpen(false)}
        onConfirm={handleApprove}
      />
      <ScheduleRejectDialog
        open={rejectOpen}
        release={release}
        onClose={() => setRejectOpen(false)}
        onConfirm={handleReject}
      />
    </div>
  );
}
