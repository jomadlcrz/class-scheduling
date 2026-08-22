import { useEffect, useState } from "react";
import { toast } from "sonner";
import { useNavigate, useParams } from "react-router";
import { Button } from "~/components/ui/button";
import { DataLoadAlert } from "~/components/feedback/data-load-alert";
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
  const [finalApproveLoading, setFinalApproveLoading] = useState(false);

  useEffect(() => {
    if (!releaseId) return;
    let cancelled = false;
    setLoading(true);
    setError(null);
    Promise.all([
      scheduleReleaseService.getApproval(releaseId),
      scheduleReleaseService.getApprovalPreview(releaseId),
    ])
      .then(([release, data]) => {
        if (!cancelled) setPreview({ ...data, release });
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

  async function handleSendToInstructors() {
    try {
      const { message } = await scheduleReleaseService.sendToInstructors(releaseId);
      if (message) toast.success(message);
      navigate("/dean/schedule-approvals");
    } catch (err) {
      await scheduleReleaseService.getApprovalPreview(releaseId).then(setPreview).catch(() => {});
      throw err instanceof Error ? err : new Error("Unable to send the schedule to instructors.");
    }
  }

  async function handleFinalApprove() {
    setFinalApproveLoading(true);
    try {
      const { message } = await scheduleReleaseService.finalApprove(releaseId);
      if (message) toast.success(message || "Schedule approved and signed.");
      const updated = await scheduleReleaseService.getApproval(releaseId);
      setPreview((prev) => (prev ? { ...prev, release: updated } : null));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Unable to give final approval.");
    } finally {
      setFinalApproveLoading(false);
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
      <div className="mx-auto w-full max-w-7xl px-4 py-8">
        <div role="status" aria-label="Loading schedule" className="grid place-items-center py-16">
          <Spinner />
        </div>
      </div>
    );
  }

  if (error || !preview) {
    return (
      <div className="mx-auto w-full max-w-7xl px-4 py-8">
        <PageHeader
          title={error ? "Unable to load schedule" : "Schedule Not Found"}
          actions={
            <Button type="button" variant="outline" block={false} onClick={() => navigate("/dean/schedule-approvals")}>
              <ArrowLeftIcon /> Back
            </Button>
          }
        />
        <div className="mt-6">
          {error ? (
            <DataLoadAlert title="Schedule unavailable" message={error} permission={error.toLowerCase().includes("permission")} />
          ) : (
            <p className="font-body text-sm text-slate-500 dark:text-slate-400">The requested schedule could not be found.</p>
          )}
        </div>
      </div>
    );
  }

  const { release, daySchedules } = preview;
  const schedules = scheduleReleaseService.mapPreviewToSchedules(preview);
  const canReview = release.releaseStatus === "pending_dean_review";
  const canFinalApprove = release.releaseStatus === "pending_final_approval";

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-8">
      <PageHeader
        title={`${release.programAbbrev ?? ""} ${release.setCode ?? ""}`.trim()}
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
                  Send to instructors
                </Button>
              </>
            )}
            {canFinalApprove && (
              <Button
                type="button"
                block={false}
                isLoading={finalApproveLoading}
                loadingLabel="Signing…"
                onClick={handleFinalApprove}
              >
                <CheckIcon size={14} />
                Final Approve (Sign Schedule)
              </Button>
            )}
          </div>
        }
      />

      {release.releaseStatus === "approved" && release.approvedBy && (
        <div className="mt-4 flex items-center gap-3 rounded-xl border border-emerald-200 bg-emerald-50/60 p-4 text-xs text-emerald-900 dark:border-emerald-800/40 dark:bg-emerald-950/20 dark:text-emerald-300">
          <span className="shrink-0 text-emerald-600">
            <CheckIcon size={18} />
          </span>
          <div>
            <p className="font-semibold">Approved &amp; Signed by Dean {release.approvedBy.name}</p>
            {release.approvedAt && (
              <p className="text-emerald-700/80 dark:text-emerald-400">
                {new Date(release.approvedAt).toLocaleString()}
              </p>
            )}
          </div>
        </div>
      )}

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
        onConfirm={handleSendToInstructors}
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
