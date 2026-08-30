import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router";
import { RoleGuard } from "~/auth/role-guard";
import { EmptyState } from "~/components/feedback/empty-state";
import { Card } from "~/components/ui/card";
import { Spinner } from "~/components/ui/spinner";
import { PageHeader } from "~/layouts/page-header";
import { InstructorProposalEditor } from "~/features/schedules/instructor-proposal-editor";
import { formatSectionSetName } from "~/features/schedules/scheduling-routes";
import { ApiError } from "~/lib/api";
import { instructorReviewService } from "~/services/instructor-review.service";
import { roomService } from "~/services/room.service";
import { weeklyHourAllocationService } from "~/services/weekly-hour-allocation.service";
import type { InstructorReviewDetail, InstructorReviewSummary } from "~/types/instructor-review";
import type { Room } from "~/types/room";
import type { WeeklyHourAllocation } from "~/types/weekly-hour-allocation";

export function meta() {
  return [{ title: "Request Schedule Shift — GWC Class Scheduling" }];
}

function setLabelOf(detail: InstructorReviewDetail): string {
  if (detail.programAbbrev && detail.yearLevel != null && detail.setCode) {
    return formatSectionSetName(detail.programAbbrev, detail.yearLevel, detail.setCode);
  }
  return detail.setCode ?? `Set ${detail.setId}`;
}

export default function ShiftRequestDetailRoute() {
  const { releaseId: releaseIdParam } = useParams();
  const releaseId = releaseIdParam ? Number(releaseIdParam) : null;
  const navigate = useNavigate();

  const [detail, setDetail] = useState<InstructorReviewDetail | null>(null);
  const [distributed, setDistributed] = useState<InstructorReviewDetail[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [roomsError, setRoomsError] = useState<string | null>(null);
  const [allocations, setAllocations] = useState<WeeklyHourAllocation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (releaseId == null || Number.isNaN(releaseId)) {
      setError("Invalid release ID.");
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError(null);

    async function loadData() {
      try {
        const [revDetail, roomList, allocList, summaries] = await Promise.all([
          instructorReviewService.getInstructorReviewDetail(releaseId!),
          roomService.list().catch((err: unknown) => {
            if (!cancelled) {
              setRoomsError(err instanceof ApiError ? err.message : "Room list could not be loaded.");
            }
            return [];
          }),
          weeklyHourAllocationService.list().catch(() => []),
          instructorReviewService.listInstructorReviews().catch(() => []),
        ]);

        if (cancelled) return;

        setDetail(revDetail);
        setRooms(roomList);
        setAllocations(allocList);

        const allReleases = await Promise.allSettled(
          summaries.map((s: InstructorReviewSummary) => instructorReviewService.getInstructorReviewDetail(s.releaseId)),
        );
        if (!cancelled) {
          setDistributed(
            allReleases.flatMap(
              (r: PromiseSettledResult<InstructorReviewDetail>) =>
                r.status === "fulfilled" ? [r.value] : [],
            ),
          );
        }
      } catch (err: unknown) {
        if (!cancelled) {
          setError(err instanceof ApiError ? err.message : "Failed to load schedule review detail.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void loadData();

    return () => {
      cancelled = true;
    };
  }, [releaseId]);

  function backToOverview() {
    void navigate("/shift-requests");
  }

  return (
    <RoleGuard allow={["faculty"]}>
      <div className="mx-auto w-full max-w-7xl space-y-6 px-4 py-8">
        <PageHeader title="Shift Requests" />

        {loading ? (
          <div
            role="status"
            aria-label="Loading schedule review"
            className="grid min-h-52 place-items-center rounded-xl border border-slate-300 bg-white text-navy-700 dark:border-white/10 dark:bg-white/5 dark:text-slate-200"
          >
            <Spinner />
          </div>
        ) : error || !detail ? (
          <Card className="p-5">
            <EmptyState title="Couldn't open shift request">{error || "Review not found."}</EmptyState>
          </Card>
        ) : !detail.canRespond && !detail.canSuggest ? (
          <Card className="p-5">
            <EmptyState
              title={
                detail.responseType === "accept"
                  ? "You already accepted this schedule"
                  : detail.responseStatus === "pending" || detail.responseStatus === "forwarded"
                    ? "Your suggestion is awaiting a decision"
                    : "This schedule review is no longer open"
              }
            >
              {detail.responseType === "suggest_change" &&
              (detail.responseStatus === "pending" || detail.responseStatus === "forwarded")
                ? "Wait for the Dean and Registrar to decide your current suggestion."
                : detail.responseType === "accept"
                  ? "Your acceptance is recorded for this schedule."
                  : "Your response is recorded and the review window is now closed."}
            </EmptyState>
          </Card>
        ) : (
          <InstructorProposalEditor
            detail={detail}
            setLabel={setLabelOf(detail)}
            rooms={rooms}
            roomsError={roomsError}
            allocations={allocations}
            distributed={distributed}
            onCancel={backToOverview}
            onSubmitted={backToOverview}
          />
        )}
      </div>
    </RoleGuard>
  );
}
