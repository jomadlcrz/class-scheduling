import { useMemo, useState } from "react";
import { toast } from "sonner";
import { RoleGuard } from "~/auth/role-guard";
import { EmptyState } from "~/components/feedback/empty-state";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { Card } from "~/components/ui/card";
import { MobileScheduleSkeleton } from "~/components/ui/skeleton";
import { Modal, ModalActions } from "~/components/ui/modal";
import { PrinterIcon } from "~/components/ui/icons";
import { StatCard } from "~/components/ui/stat-card";
import { Tooltip } from "~/components/ui/tooltip";
import { useTermContext } from "~/features/academic-terms/term-context-provider";
import { MobileWeeklySchedule } from "~/features/schedules/mobile-weekly-schedule";
import { openInstructorSchedulePrint } from "~/features/schedules/print-instructor-schedule";
import { ScheduleViewer } from "~/features/schedules/schedule-viewer";
import type { ScheduleViewMode } from "~/features/schedules/schedule-view-toggle";
import { TodayClasses } from "~/features/schedules/today-classes";
import { useMySchedule } from "~/features/schedules/use-my-schedule";
import { useAuth } from "~/hooks/use-auth";
import { useCachedData } from "~/hooks/use-cached-data";
import { useSemesters } from "~/hooks/use-semesters";
import { PageHeader } from "~/layouts/page-header";
import { deanService } from "~/services/dean.service";
import { authorityWorkflowService } from "~/services/authority-workflow.service";
import type { InstructorScheduleReviewDetail, ProposedScheduleMeeting } from "~/types/authority-workflow";

export function meta() {
  return [
    { title: "My Schedule — GWC Class Scheduling" },
    { name: "description", content: "Your teaching schedule for the current academic term." },
  ];
}

export default function FacultyScheduleRoute() {
  return (
    <RoleGuard allow={["faculty"]}>
      <FacultySchedulePage />
    </RoleGuard>
  );
}

function FacultySchedulePage() {
  const { user } = useAuth();
  const { semesterLabel } = useSemesters();
  const { context: termContext, loading: termContextLoading } = useTermContext();
  const [viewMode, setViewMode] = useState<ScheduleViewMode>("table");
  const [selectedReviewId, setSelectedReviewId] = useState<number | null>(null);
  const [reviewActionLoading, setReviewActionLoading] = useState(false);
  const [suggestionOpen, setSuggestionOpen] = useState(false);
  const [suggestionReason, setSuggestionReason] = useState("");
  const [proposedMeetings, setProposedMeetings] = useState<ProposedScheduleMeeting[]>([]);

  const {
    isLoading,
    loadError,
    schoolYear,
    semester,
    visibleSchedules,
    attestations,
    attestationsLoading,
  } = useMySchedule();

  const selectedTerm = termContext?.selection;
  const selectedTermReady = selectedTerm?.syId != null && selectedTerm.semesterNumber != null;
  const facultyLoadKey = `faculty-schedule-empty-state:${selectedTerm?.syId ?? "none"}:${selectedTerm?.semesterNumber ?? "none"}`;
  const { data: facultyLoading, error: facultyLoadingError } = useCachedData(
    facultyLoadKey,
    () => deanService.getFacultyLoading(selectedTerm!.syId!, selectedTerm!.semesterNumber!),
    { enabled: !isLoading && visibleSchedules.length === 0 && selectedTermReady },
  );
  const { data: reviewReleases, reload: reloadReviewReleases } = useCachedData(
    "instructor-schedule-reviews",
    () => authorityWorkflowService.listInstructorScheduleReviews(),
  );
  const { data: selectedReview, reload: reloadSelectedReview } = useCachedData<InstructorScheduleReviewDetail>(
    `instructor-schedule-review:${selectedReviewId ?? "none"}`,
    () => authorityWorkflowService.getInstructorScheduleReview(selectedReviewId!),
    { enabled: selectedReviewId !== null },
  );

  async function handleAcceptReview(releaseId: number) {
    setReviewActionLoading(true);
    try {
      const result = await authorityWorkflowService.acceptInstructorScheduleReview(releaseId);
      toast.success(result.message || "Schedule accepted.");
      setSelectedReviewId(null);
      await reloadReviewReleases();
      await reloadSelectedReview();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Unable to accept this schedule.");
    } finally {
      setReviewActionLoading(false);
    }
  }

  function openSuggestion(detail: InstructorScheduleReviewDetail) {
    setSuggestionReason("");
    setProposedMeetings(detail.meetings.map((meeting) => ({
      scheduleId: meeting.scheduleId,
      setId: detail.setId,
      subjectId: meeting.subjectId,
      dayOfWeek: meeting.dayOfWeek,
      startTime: meeting.startTime,
      endTime: meeting.endTime,
      roomId: meeting.roomId,
      classMode: meeting.mode,
    })));
    setSuggestionOpen(true);
  }

  async function handleSuggestion() {
    if (!selectedReview) return;
    setReviewActionLoading(true);
    try {
      const result = await authorityWorkflowService.suggestInstructorScheduleChange(selectedReview.releaseId, {
        reason: suggestionReason,
        proposedMeetings,
      });
      toast.success(result.message || "Schedule suggestion submitted for Dean review.");
      setSuggestionOpen(false);
      setSelectedReviewId(null);
      await reloadReviewReleases();
      await reloadSelectedReview();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Unable to submit your suggestion.");
    } finally {
      setReviewActionLoading(false);
    }
  }

  const emptyContextLoading =
    !isLoading &&
    visibleSchedules.length === 0 &&
    (termContextLoading || (selectedTermReady && facultyLoading === null && !facultyLoadingError));

  const emptyScheduleState = useMemo(() => {
    if (termContext && termContext.schoolYears.length === 0) {
      return {
        title: "No academic term available",
        message: "Your teaching schedule will appear after the registrar creates an academic term.",
      };
    }

    const facultyEntry = facultyLoading?.[0];
    if (selectedTermReady && facultyLoading && (!facultyEntry || facultyEntry.subjects.length === 0)) {
      return {
        title: "No teaching assignments",
        message: `You have no assigned subjects for ${selectedTerm?.schoolYear ?? "the selected term"}, ${semesterLabel(selectedTerm!.semesterNumber!)}.`,
      };
    }

    if (facultyEntry?.subjects.length) {
      return {
        title: "Schedule not available yet",
        message: "Your subjects are assigned, but the timetable is not public yet. It will appear after final approval and term-wide publication.",
      };
    }

    return {
      title: "No classes scheduled",
      message: "You have no classes for the selected term.",
    };
  }, [facultyLoading, semesterLabel, selectedTerm, selectedTermReady, termContext]);

  const totalUnits = useMemo(() => {
    const seen = new Set<string>();
    let sum = 0;
    for (const s of visibleSchedules) {
      if (seen.has(s.subjectCode)) continue;
      seen.add(s.subjectCode);
      sum += s.units ?? 0;
    }
    return sum;
  }, [visibleSchedules]);

  const totalSubjects = useMemo(
    () => new Set(visibleSchedules.map((s) => s.subjectCode)).size,
    [visibleSchedules],
  );

  const totalSets = useMemo(
    () => new Set(visibleSchedules.map((s) => s.setCode)).size,
    [visibleSchedules],
  );

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-8">
      <PageHeader
        title="My Teaching Schedule"

        actions={
          <Tooltip label="Print schedule">
            <button
              type="button"
              aria-label="Print schedule"
              disabled={visibleSchedules.length === 0 || attestationsLoading}
              onClick={() =>
                openInstructorSchedulePrint(visibleSchedules, {
                  schoolYear,
                  semesterLabel: semesterLabel(semester),
                  instructorName: user?.name ?? "",
                  semesterNumber: semester,
                  attestations,
                })
              }
              className="grid size-9 cursor-pointer place-items-center rounded-lg border border-slate-300 text-slate-500 transition-colors duration-150 hover:bg-slate-100 hover:text-navy-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-400 disabled:cursor-not-allowed disabled:opacity-60 dark:border-white/10 dark:text-slate-400 dark:hover:bg-white/10 dark:hover:text-mist-100"
            >
              <PrinterIcon />
            </button>
          </Tooltip>
        }
      />

      {reviewReleases && reviewReleases.length > 0 && (
        <Card className="mt-4 border-violet-200 bg-violet-50/50 p-5 dark:border-violet-400/25 dark:bg-violet-400/8">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-display text-lg tracking-wide text-navy-800 dark:text-mist-100">Schedules for Review</h2>
                <Badge tone="violet">Action required</Badge>
              </div>
              <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
                These proposed schedules are visible only for instructor review. They are not yet official or published.
              </p>
            </div>
          </div>

          <div className="mt-4 grid gap-2">
            {reviewReleases.map((review) => (
              <div key={review.releaseId} className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-violet-200 bg-white p-3 dark:border-violet-400/20 dark:bg-navy-900">
                <div>
                  <p className="font-semibold text-navy-800 dark:text-mist-100">
                    {review.programAbbrev ?? "Program"} · {review.setCode}
                  </p>
                  <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                    {review.meetingCount} meeting{review.meetingCount === 1 ? "" : "s"} · {review.schoolYear} · Semester {review.semesterNumber}
                  </p>
                </div>
                <Button type="button" variant="outline" block={false} onClick={() => setSelectedReviewId(review.releaseId)}>
                  Review schedule
                </Button>
              </div>
            ))}
          </div>

          {selectedReview && (
            <div className="mt-4 rounded-lg border border-violet-200 bg-white p-4 dark:border-violet-400/20 dark:bg-navy-900">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="font-semibold text-navy-800 dark:text-mist-100">
                    {selectedReview.programAbbrev ?? "Program"} · {selectedReview.setCode}
                  </p>
                  <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">Review the proposed meetings before accepting.</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  {selectedReview.canSuggest && (
                    <Button type="button" variant="outline" block={false} disabled={reviewActionLoading} onClick={() => openSuggestion(selectedReview)}>
                      Suggest changes
                    </Button>
                  )}
                  {selectedReview.canRespond && (
                    <Button type="button" block={false} isLoading={reviewActionLoading} onClick={() => handleAcceptReview(selectedReview.releaseId)}>
                      Accept schedule
                    </Button>
                  )}
                </div>
              </div>
              <div className="mt-3 divide-y divide-slate-100 rounded-md border border-slate-200 dark:divide-white/10 dark:border-white/10">
                {selectedReview.meetings.map((meeting) => (
                  <div key={meeting.scheduleId} className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 px-3 py-2 text-sm">
                    <span className="font-medium text-navy-800 dark:text-mist-100">{meeting.subjectCode} — {meeting.subjectTitle}</span>
                    <span className="text-slate-600 dark:text-slate-300">{meeting.dayOfWeek} · {meeting.startTime}–{meeting.endTime} · {meeting.roomName ?? "No room"}</span>
                  </div>
                ))}
              </div>
              {!selectedReview.canRespond && (
                <div className="mt-3 rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-600 dark:border-white/10 dark:bg-white/5 dark:text-slate-300">
                  {selectedReview.resolution?.detail ?? "This review is not accepting responses right now. The Registrar controls when the Shift Request window is open."}
                </div>
              )}
            </div>
          )}
        </Card>
      )}

      {loadError && isLoading ? (
        <EmptyState title="Couldn't load your schedule">{loadError}</EmptyState>
      ) : (
        <>
          {isLoading || emptyContextLoading ? (
            <div className="mt-8 sm:hidden">
              <MobileScheduleSkeleton rows={4} />
            </div>
          ) : visibleSchedules.length === 0 ? (
            <div className="mt-6 sm:hidden">
              <EmptyState title={emptyScheduleState.title}>
                {emptyScheduleState.message}
              </EmptyState>
            </div>
          ) : (
            <>
              <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <StatCard label="Total Units" value={totalUnits} />
                <StatCard
                  label="Weekly Classes"
                  value={visibleSchedules.length}
                />
                <StatCard
                  label="Subjects"
                  value={totalSubjects}
                />
                <StatCard
                  label="Sets"
                  value={totalSets}
                />
              </div>

              <div className="mt-4">
                <TodayClasses schedules={visibleSchedules} hideInstructor />
              </div>

              <div className="mt-4 sm:hidden">
                <MobileWeeklySchedule schedules={visibleSchedules} hideInstructor />
              </div>
            </>
          )}

          <div className="hidden sm:block">
            <ScheduleViewer
              schedules={visibleSchedules}
              isLoading={isLoading || emptyContextLoading}
              viewMode={viewMode}
              onViewModeChange={setViewMode}
              emptyTitle={emptyScheduleState.title}
              emptyMessage={emptyScheduleState.message}
              showSet
              hideInstructor
            />
          </div>
        </>
      )}

      <Modal
        open={suggestionOpen}
        onClose={() => setSuggestionOpen(false)}
        title="Suggest schedule changes"
      >
        <div className="space-y-4">
          <p className="text-sm text-slate-600 dark:text-slate-300">Propose a replacement arrangement for your own meetings. This does not change the live timetable; your Dean and the Registrar review it first.</p>
          <label className="block text-sm font-medium text-navy-800 dark:text-mist-100">
            Reason for the change
            <textarea
              value={suggestionReason}
              onChange={(event) => setSuggestionReason(event.target.value)}
              rows={3}
              className="mt-1.5 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-navy-800 outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-200 dark:border-white/15 dark:bg-navy-900 dark:text-mist-100"
              placeholder="Explain why this arrangement is needed."
            />
          </label>
          <div className="space-y-3">
            {proposedMeetings.map((meeting, index) => (
              <div key={meeting.scheduleId ?? index} className="rounded-lg border border-slate-200 p-3 dark:border-white/10">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Meeting {index + 1}</p>
                <div className="mt-2 grid gap-2 sm:grid-cols-3">
                  <label className="text-xs text-slate-600 dark:text-slate-300">Day
                    <input value={meeting.dayOfWeek} onChange={(event) => setProposedMeetings((rows) => rows.map((row, rowIndex) => rowIndex === index ? { ...row, dayOfWeek: event.target.value } : row))} className="mt-1 w-full rounded-md border border-slate-300 bg-white px-2 py-1.5 text-sm dark:border-white/15 dark:bg-navy-900" />
                  </label>
                  <label className="text-xs text-slate-600 dark:text-slate-300">Start time
                    <input type="time" value={meeting.startTime} onChange={(event) => setProposedMeetings((rows) => rows.map((row, rowIndex) => rowIndex === index ? { ...row, startTime: event.target.value } : row))} className="mt-1 w-full rounded-md border border-slate-300 bg-white px-2 py-1.5 text-sm dark:border-white/15 dark:bg-navy-900" />
                  </label>
                  <label className="text-xs text-slate-600 dark:text-slate-300">End time
                    <input type="time" value={meeting.endTime} onChange={(event) => setProposedMeetings((rows) => rows.map((row, rowIndex) => rowIndex === index ? { ...row, endTime: event.target.value } : row))} className="mt-1 w-full rounded-md border border-slate-300 bg-white px-2 py-1.5 text-sm dark:border-white/15 dark:bg-navy-900" />
                  </label>
                </div>
              </div>
            ))}
          </div>
        </div>
        <ModalActions>
          <Button type="button" variant="outline" block={false} disabled={reviewActionLoading} onClick={() => setSuggestionOpen(false)}>Cancel</Button>
          <Button type="button" block={false} isLoading={reviewActionLoading} onClick={handleSuggestion}>Submit suggestion</Button>
        </ModalActions>
      </Modal>
    </div>
  );
}
