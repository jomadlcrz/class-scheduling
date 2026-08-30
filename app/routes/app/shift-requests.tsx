import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router";
import { toast } from "sonner";
import { RoleGuard } from "~/auth/role-guard";
import { EmptyState } from "~/components/feedback/empty-state";
import { Spinner } from "~/components/ui/spinner";
import { Badge, type BadgeTone } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { Card } from "~/components/ui/card";
import { ChevronDownIcon, RotateIcon } from "~/components/ui/icons";
import { ConfirmDialog } from "~/components/ui/modal";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "~/components/ui/table";
import { PageHeader } from "~/layouts/page-header";
import { DecisionMessage } from "~/features/schedules/decision-message";
import { ModeBadge } from "~/features/schedules/mode-badge";
import { SuggestionValidationSummary } from "~/features/schedules/suggestion-validation-summary";
import {
  snapshotOriginalMeetings,
  type ProposalMeeting,
} from "~/features/schedules/instructor-proposal-model";
import { formatSectionSetName } from "~/features/schedules/scheduling-routes";
import { ApiError } from "~/lib/api";
import { formatDateTime, formatTime12h, timeToMinutes } from "~/lib/time";
import { termSchedulingService } from "~/services/term-scheduling.service";
import { instructorReviewService } from "~/services/instructor-review.service";
import { roomService } from "~/services/room.service";
import type { TermSchedulingCalendar } from "~/types/term-scheduling";
import { useDays } from "~/hooks/use-days";
import type {
  InstructorMeetingReviewState,
  InstructorReviewDetail,
  InstructorReviewMeeting,
  InstructorReviewSummary,
  ProposedMeeting,
} from "~/types/instructor-review";
import type { Room } from "~/types/room";
import { DAYS, DAY_LABELS } from "~/types/schedule";

export function meta() {
  return [{ title: "Shift Requests — GWC Class Scheduling" }];
}

type DistributedSchedule = InstructorReviewMeeting & {
  setLabel: string;
};

type HistoryChange = {
  original: ProposalMeeting | null;
  suggested: ProposalMeeting;
};

const DISTRIBUTED_STATUS_STYLES: Record<
  InstructorMeetingReviewState,
  { tone: BadgeTone }
> = {
  protected: { tone: "slate" },
  accepted: { tone: "emerald" },
  awaiting_decision: { tone: "gold" },
  applied: { tone: "emerald" },
  not_applied: { tone: "slate" },
  unchanged: { tone: "slate" },
};

function requestSetLabel(
  request: Pick<InstructorReviewSummary, "setId" | "setCode" | "programAbbrev" | "yearLevel">,
): string {
  if (request.programAbbrev && request.yearLevel != null && request.setCode) {
    return formatSectionSetName(request.programAbbrev, request.yearLevel, request.setCode);
  }
  return request.setCode ?? `Set ${request.setId}`;
}

function historyStatus(request: InstructorReviewDetail): {
  label: string;
  tone: BadgeTone;
  description: string;
} {
  const status = request.responseStatus;
  if (status === "applied") {
    return {
      label: "Applied",
      tone: "emerald",
      description: "Dean and Registrar approved these changes into the official timetable.",
    };
  }
  if (status === "rejected") {
    return {
      label: "Not Applied",
      tone: "red",
      description: "The request was turned down and the original distributed timetable was kept.",
    };
  }
  if (status === "forwarded") {
    return {
      label: "With Registrar",
      tone: "gold",
      description: "Dean forwarded your suggestion to the Registrar for conflict checks.",
    };
  }
  return {
    label: "Awaiting Dean",
    tone: "gold",
    description: "Your suggestion is currently awaiting review by your Dean.",
  };
}

function suggestionChanges(
  request: InstructorReviewDetail,
  rooms: Room[],
): HistoryChange[] {
  if (request.proposedMeetings.length === 0) return [];
  const roomById = new Map(rooms.map((r) => [r.id, r]));

  const liveMeetings: ProposalMeeting[] = request.meetings.map((m: InstructorReviewMeeting) => ({
    scheduleId: m.scheduleId,
    setId: request.setId,
    subjectId: m.subjectId,
    subjectCode: m.subjectCode ?? "",
    subjectTitle: m.subjectTitle ?? "",
    subjectType: m.subjectType ?? null,
    classMode: m.classMode,
    sessionMode: m.sessionMode ?? null,
    dayOfWeek: m.dayOfWeek,
    startTime: m.startTime,
    endTime: m.endTime,
    roomId: m.roomId,
    roomName: m.roomName,
    isProtected: m.isProtected,
    setLabel: requestSetLabel(request),
    programAbbrev: request.programAbbrev ?? null,
    movable: true,
    placed: true,
  }));

  const baselineMeetings = snapshotOriginalMeetings(
    liveMeetings,
    request.proposedMeetings,
    rooms,
  );
  const baselineBySchedule = new Map(baselineMeetings.map((m: ProposalMeeting) => [m.scheduleId, m]));

  return request.proposedMeetings.map((proposed: ProposedMeeting) => {
    const original: ProposalMeeting | null =
      proposed.scheduleId != null ? baselineBySchedule.get(proposed.scheduleId) ?? null : null;
    const room = proposed.roomId != null ? roomById.get(proposed.roomId) ?? null : null;

    const suggested: ProposalMeeting = {
      scheduleId: proposed.scheduleId ?? -1,
      setId: proposed.setId ?? request.setId,
      subjectId: proposed.subjectId ?? original?.subjectId ?? 0,
      subjectCode: original?.subjectCode ?? "",
      subjectTitle: original?.subjectTitle ?? "",
      subjectType: original?.subjectType ?? null,
      classMode: proposed.classMode ?? original?.classMode ?? "F2F",
      sessionMode: proposed.sessionMode ?? original?.sessionMode ?? null,
      dayOfWeek: proposed.dayOfWeek,
      startTime: proposed.startTime,
      endTime: proposed.endTime,
      roomId: proposed.roomId,
      roomName: room?.name ?? (proposed.roomId == null ? "No room (online)" : `Room #${proposed.roomId}`),
      isProtected: original?.isProtected ?? false,
      setLabel: requestSetLabel(request),
      programAbbrev: request.programAbbrev ?? null,
      movable: true,
      placed: true,
    };

    return { original, suggested };
  });
}

export default function ShiftRequestsRoute() {
  const navigate = useNavigate();
  const { days: backendDays } = useDays();
  const weekDays = useMemo(() => {
    if (backendDays && backendDays.length > 0) {
      return backendDays.map((d) => d.name);
    }
    return DAYS.map((d) => DAY_LABELS[d]);
  }, [backendDays]);

  const [calendar, setCalendar] = useState<TermSchedulingCalendar | null>(null);
  const [requests, setRequests] = useState<InstructorReviewDetail[]>([]);
  const [history, setHistory] = useState<InstructorReviewDetail[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedRequestIds, setExpandedRequestIds] = useState<Set<number> | null>(null);
  const [acceptAllOpen, setAcceptAllOpen] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [cal, summaries, hist, roomList] = await Promise.all([
        termSchedulingService.getCurrentCalendar().catch(() => null),
        instructorReviewService.listInstructorReviews(),
        instructorReviewService.listInstructorReviewHistory(),
        roomService.list().catch(() => []),
      ]);
      setCalendar(cal);
      setHistory(hist);
      setRooms(roomList);

      const detailedSettled = await Promise.allSettled(
        summaries.map((s: InstructorReviewSummary) => instructorReviewService.getInstructorReviewDetail(s.releaseId)),
      );
      const detailed = detailedSettled.flatMap(
        (res: PromiseSettledResult<InstructorReviewDetail>) =>
          res.status === "fulfilled" ? [res.value] : [],
      );
      setRequests(detailed);
    } catch (err: unknown) {
      setRequests([]);
      setHistory([]);
      setRooms([]);
      setError(err instanceof ApiError ? err.message : "Shift requests could not be loaded.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    setExpandedRequestIds((current) => {
      if (history.length === 0) return current;
      if (current == null) return new Set([history[0].responseId]);
      const availableIds = new Set(history.map((request) => request.responseId));
      return new Set([...current].filter((id) => availableIds.has(id)));
    });
  }, [history]);

  const distributed = useMemo(() => {
    const byScheduleId = new Map<number, DistributedSchedule>();
    for (const request of requests) {
      for (const meeting of request.meetings) {
        if (byScheduleId.has(meeting.scheduleId)) continue;
        byScheduleId.set(meeting.scheduleId, {
          ...meeting,
          setLabel: requestSetLabel(request),
        });
      }
    }
    return [...byScheduleId.values()];
  }, [requests]);

  const distributedByDay = useMemo(
    () =>
      weekDays.map((day) => ({
        day,
        schedules: distributed
          .filter((meeting) => meeting.dayOfWeek.trim().toLowerCase() === day.toLowerCase())
          .sort(
            (a, b) =>
              timeToMinutes(a.startTime) - timeToMinutes(b.startTime) ||
              timeToMinutes(a.endTime) - timeToMinutes(b.endTime) ||
              (a.subjectCode ?? "").localeCompare(b.subjectCode ?? ""),
          ),
      })),
    [distributed, weekDays],
  );

  const openRequests = useMemo(
    () =>
      requests
        .filter((request) => request.canSuggest ?? request.canRespond)
        .sort((a, b) => requestSetLabel(a).localeCompare(requestSetLabel(b))),
    [requests],
  );

  const acceptAllTerm = useMemo(() => {
    if (calendar) {
      return { syId: calendar.syId, semesterNumber: calendar.semesterNumber };
    }
    const first = requests[0];
    return first ? { syId: first.syId, semesterNumber: first.semesterNumber } : null;
  }, [calendar, requests]);

  const acceptAllTermRequests = useMemo(
    () =>
      acceptAllTerm
        ? requests.filter(
            (r) =>
              r.syId === acceptAllTerm.syId &&
              r.semesterNumber === acceptAllTerm.semesterNumber,
          )
        : [],
    [acceptAllTerm, requests],
  );

  const isFinalAcceptance = (r: InstructorReviewDetail) => r.responseStatus === "applied";

  const acceptAllCanSubmit =
    acceptAllTermRequests.length > 0 &&
    acceptAllTermRequests.every((r) => r.canRespond || isFinalAcceptance(r));

  const everyScheduleAccepted =
    acceptAllTermRequests.length > 0 && acceptAllTermRequests.every(isFinalAcceptance);

  const suggestionAttemptPolicy = useMemo(() => {
    const allDetails = [...requests, ...history];
    const scopedDetails = calendar
      ? allDetails.filter(
          (d) =>
            d.syId === calendar.syId &&
            d.semesterNumber === calendar.semesterNumber,
        )
      : allDetails;
    const attemptLimit =
      calendar?.suggestionAttemptLimit ??
      scopedDetails.find((d) => d.suggestionAttemptLimit != null)?.suggestionAttemptLimit ??
      null;
    if (attemptLimit == null) return null;
    const attemptsUsed = Math.max(0, ...scopedDetails.map((d) => d.suggestionAttemptsUsed ?? 0));
    return { attemptLimit, attemptsUsed };
  }, [calendar, history, requests]);

  function openShiftRequest() {
    if (openRequests.length > 0) {
      void navigate(`/shift-requests/${openRequests[0].releaseId}`);
    }
  }

  function toggleHistoryRequest(responseId: number) {
    setExpandedRequestIds((current) => {
      const next = new Set(current ?? []);
      if (next.has(responseId)) next.delete(responseId);
      else next.add(responseId);
      return next;
    });
  }

  async function acceptAllSchedules() {
    if (!acceptAllTerm) return;
    try {
      const result = await instructorReviewService.acceptAllInstructorReviews(
        acceptAllTerm.syId,
        acceptAllTerm.semesterNumber,
      );
      toast.success(
        result.message || "All distributed schedules were accepted as your final schedule.",
      );
      await load();
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : "Failed to accept all schedules.";
      toast.error(msg);
    }
  }

  return (
    <RoleGuard allow={["faculty"]}>
      <div className="mx-auto w-full max-w-7xl space-y-6 px-4 py-8">
        <PageHeader title="Shift Requests" />

        {loading ? (
          <div
            role="status"
            aria-label="Loading shift requests"
            className="grid min-h-52 place-items-center rounded-xl border border-slate-300 bg-white text-navy-700 dark:border-white/10 dark:bg-white/5 dark:text-slate-200"
          >
            <Spinner />
          </div>
        ) : error ? (
          <Card className="p-5">
            <EmptyState title="Couldn't load shift requests">{error}</EmptyState>
          </Card>
        ) : (
          <div className="space-y-6">
            {/* Distributed Schedules Section */}
            <Card className="p-5">
              <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 pb-4 dark:border-white/10">
                <div>
                  <h2 className="font-display text-lg tracking-wide text-navy-800 dark:text-mist-100">
                    Distributed Schedules
                  </h2>
                  <p className="mt-0.5 font-body text-xs text-slate-500 dark:text-slate-400">
                    Actual distributed classes by weekday, ordered from earliest to latest.
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                  {suggestionAttemptPolicy && (
                    <div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 dark:border-white/10 dark:bg-white/5">
                      <span className="font-body text-xs font-medium text-slate-600 dark:text-slate-300">
                        Shift Request Limit:
                      </span>
                      <Badge
                        tone={
                          suggestionAttemptPolicy.attemptsUsed >= suggestionAttemptPolicy.attemptLimit
                            ? "red"
                            : "navy"
                        }
                      >
                        {suggestionAttemptPolicy.attemptsUsed} / {suggestionAttemptPolicy.attemptLimit}
                      </Badge>
                    </div>
                  )}

                  <Button
                    type="button"
                    variant="outline"
                    block={false}
                    disabled={openRequests.length === 0}
                    onClick={openShiftRequest}
                  >
                    Request Shift
                  </Button>
                  <Button
                    type="button"
                    variant="primary"
                    block={false}
                    disabled={
                      acceptAllTerm == null ||
                      acceptAllTermRequests.length === 0 ||
                      everyScheduleAccepted ||
                      !acceptAllCanSubmit
                    }
                    onClick={() => setAcceptAllOpen(true)}
                  >
                    Accept All
                  </Button>
                </div>
              </div>

              {distributed.length === 0 ? (
                <EmptyState title="No distributed schedules">
                  Classes will appear here after your Dean distributes a schedule to you.
                </EmptyState>
              ) : (
                <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
                  {distributedByDay.map(({ day, schedules }) => (
                    <div
                      key={day}
                      className="rounded-lg border border-slate-200 bg-slate-50/50 p-3 dark:border-white/10 dark:bg-white/[0.02]"
                    >
                      <div className="mb-2.5 flex items-center justify-between border-b border-slate-200 pb-2 dark:border-white/10">
                        <span className="font-display text-sm tracking-wide text-navy-800 dark:text-mist-100">
                          {day}
                        </span>
                        <span className="font-body text-[11px] text-slate-400 dark:text-slate-500">
                          {schedules.length} {schedules.length === 1 ? "class" : "classes"}
                        </span>
                      </div>

                      {schedules.length === 0 ? (
                        <p className="py-4 text-center font-body text-xs text-slate-400 dark:text-slate-500">
                          No classes
                        </p>
                      ) : (
                        <div className="space-y-2">
                          {schedules.map((meeting) => (
                            <div
                              key={meeting.scheduleId}
                              className="rounded-lg border border-slate-200 bg-white p-2.5 shadow-xs dark:border-white/10 dark:bg-white/5"
                            >
                              <div className="font-body text-xs font-semibold text-navy-800 dark:text-mist-100">
                                {meeting.subjectCode || "Subject"}
                              </div>
                              {meeting.subjectTitle && (
                                <div className="line-clamp-1 font-body text-[11px] text-slate-500 dark:text-slate-400">
                                  {meeting.subjectTitle}
                                </div>
                              )}
                              <div className="mt-1 font-body text-xs font-medium text-navy-600 dark:text-gold-300">
                                {formatTime12h(meeting.startTime)} – {formatTime12h(meeting.endTime)}
                              </div>
                              <div className="font-body text-[11px] text-slate-500 dark:text-slate-400">
                                {meeting.roomName ?? "No room"}
                              </div>
                              <div className="mt-2 flex flex-wrap items-center gap-1">
                                <Badge tone="sky">{meeting.setLabel}</Badge>
                                <ModeBadge mode={meeting.classMode} />
                                {meeting.sessionMode && (
                                  <Badge tone={meeting.sessionMode === "LAB" ? "navy" : "slate"}>
                                    {meeting.sessionMode}
                                  </Badge>
                                )}
                                {meeting.reviewState && (
                                  <Badge tone={DISTRIBUTED_STATUS_STYLES[meeting.reviewState]?.tone ?? "slate"}>
                                    {meeting.reviewStateLabel ?? meeting.reviewState}
                                  </Badge>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </Card>

            <ConfirmDialog
              open={acceptAllOpen}
              onClose={() => setAcceptAllOpen(false)}
              title="Accept all distributed schedules?"
              confirmLabel="Accept All"
              loadingLabel="Accepting all..."
              confirmVariant="danger"
              onConfirm={acceptAllSchedules}
            >
              {acceptAllCanSubmit ? (
                <div className="space-y-2 font-body text-sm text-slate-600 dark:text-slate-300">
                  <p>
                    You are accepting every distributed schedule for this semester exactly as shown.
                  </p>
                  <p className="font-semibold text-red-700 dark:text-red-300">
                    This action is irreversible. These schedules will be your final teaching
                    schedule until the end of the semester.
                  </p>
                </div>
              ) : (
                <p className="font-body text-sm text-slate-600 dark:text-slate-300">
                  Accept All is unavailable while one or more of your schedule suggestions are
                  still awaiting a decision.
                </p>
              )}
            </ConfirmDialog>

            {/* Request History Section */}
            <Card className="p-5">
              <div className="flex items-center justify-between border-b border-slate-200 pb-4 dark:border-white/10">
                <div>
                  <h2 className="font-display text-lg tracking-wide text-navy-800 dark:text-mist-100">
                    Your Requests
                  </h2>
                  <p className="mt-0.5 font-body text-xs text-slate-500 dark:text-slate-400">
                    Your submitted shift request history.
                  </p>
                </div>
                <Badge tone={history.length > 0 ? "navy" : "slate"}>
                  {history.length} {history.length === 1 ? "request" : "requests"}
                </Badge>
              </div>

              {history.length === 0 ? (
                <EmptyState title="No request history">
                  Suggestions you submit will appear here as Original → Suggestion comparisons.
                </EmptyState>
              ) : (
                <div className="mt-4 divide-y divide-slate-200 dark:divide-white/10">
                  {history.map((request, index) => {
                    const status = historyStatus(request);
                    const changes = suggestionChanges(request, rooms);
                    const includedSets = Array.from(
                      new Set(
                        changes
                          .map(({ suggested }) => suggested.setLabel)
                          .filter((setLabel): setLabel is string => Boolean(setLabel)),
                      ),
                    );
                    if (includedSets.length === 0) includedSets.push(requestSetLabel(request));
                    const expanded = expandedRequestIds?.has(request.responseId) ?? index === 0;

                    return (
                      <div key={request.responseId} className="pt-4 first:pt-0">
                        <div
                          role="button"
                          tabIndex={0}
                          onClick={() => toggleHistoryRequest(request.responseId)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter" || e.key === " ") toggleHistoryRequest(request.responseId);
                          }}
                          className="flex cursor-pointer items-center justify-between gap-4 rounded-lg p-3 transition-colors hover:bg-slate-50 dark:hover:bg-white/5"
                        >
                          <div className="flex items-center gap-3">
                            <span className="flex size-7 items-center justify-center rounded-md border border-slate-200 bg-slate-100 font-body text-xs font-semibold text-navy-800 dark:border-white/10 dark:bg-white/10 dark:text-mist-100">
                              {index + 1}
                            </span>
                            <div>
                              <div className="flex flex-wrap items-center gap-2">
                                <span className="font-display text-sm tracking-wide text-navy-800 dark:text-mist-100">
                                  Shift Request
                                </span>
                                {includedSets.map((set) => (
                                  <Badge key={set} tone="sky">{set}</Badge>
                                ))}
                              </div>
                              <p className="font-body text-xs text-slate-500 dark:text-slate-400">
                                Submitted {formatDateTime(request.respondedAt) || "—"} · A.Y.{" "}
                                {request.schoolYear ?? request.syId} · Semester {request.semesterNumber}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <Badge tone={status.tone}>{status.label}</Badge>
                            <span className={`text-slate-400 transition-transform duration-150 ${expanded ? "rotate-180" : ""}`}>
                              <ChevronDownIcon />
                            </span>
                          </div>
                        </div>

                        {expanded && (
                          <div className="mt-3 space-y-4 rounded-lg border border-slate-200 bg-slate-50/50 p-4 dark:border-white/10 dark:bg-white/[0.02]">
                            <div className="rounded-lg border border-slate-200 bg-white p-3 font-body text-xs text-slate-700 dark:border-white/10 dark:bg-white/5 dark:text-slate-300">
                              {status.description}
                            </div>

                            {request.reason && (
                              <div>
                                <span className="font-body text-xs font-semibold text-navy-800 dark:text-mist-100">
                                  Reason for Request:
                                </span>
                                <p className="mt-1 font-body text-xs text-slate-600 dark:text-slate-400">
                                  {request.reason}
                                </p>
                              </div>
                            )}

                            {request.deanDecisionNote && (
                              <div>
                                <span className="font-body text-xs font-semibold text-navy-800 dark:text-mist-100">
                                  Dean Decision Note:
                                </span>
                                <p className="mt-1 font-body text-xs text-slate-600 dark:text-slate-400">
                                  {request.deanDecisionNote}
                                </p>
                              </div>
                            )}
                            {request.registrarDecisionNote && (
                              <div>
                                <span className="font-body text-xs font-semibold text-navy-800 dark:text-mist-100">
                                  Registrar Decision Note:
                                </span>
                                <p className="mt-1 font-body text-xs text-slate-600 dark:text-slate-400">
                                  {request.registrarDecisionNote}
                                </p>
                              </div>
                            )}
                            {request.resolution && (
                              <div>
                                <span className="font-body text-xs font-semibold text-navy-800 dark:text-mist-100">
                                  Resolution:
                                </span>
                                <div className="mt-1">
                                  <DecisionMessage
                                    message={request.resolution.detail || request.resolution.headline}
                                  />
                                </div>
                              </div>
                            )}

                            {request.validations?.length > 0 && (
                              <SuggestionValidationSummary validations={request.validations} />
                            )}

                            {changes.length > 0 && (
                              <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white dark:border-white/10 dark:bg-white/5">
                                <Table>
                                  <TableHeader>
                                    <TableRow>
                                      <TableHead>Class</TableHead>
                                      <TableHead>Original Schedule</TableHead>
                                      <TableHead>Requested Change</TableHead>
                                    </TableRow>
                                  </TableHeader>
                                  <TableBody>
                                    {changes.map(({ original, suggested }, i) => (
                                      <TableRow key={i}>
                                        <TableCell>
                                          <div className="font-semibold text-navy-800 dark:text-mist-100">
                                            {suggested.subjectCode}
                                          </div>
                                          <div className="text-xs text-slate-500 dark:text-slate-400">
                                            {suggested.setLabel}
                                          </div>
                                        </TableCell>
                                        <TableCell>
                                          {original ? (
                                            <div className="text-xs text-slate-600 dark:text-slate-400">
                                              <div>
                                                {original.dayOfWeek}, {formatTime12h(original.startTime)} – {formatTime12h(original.endTime)}
                                              </div>
                                              <div className="text-slate-500">
                                                {original.roomName ?? "No room"} ({original.classMode})
                                              </div>
                                            </div>
                                          ) : (
                                            <span className="text-xs italic text-slate-400">
                                              None (added session)
                                            </span>
                                          )}
                                        </TableCell>
                                        <TableCell>
                                          <div className="text-xs font-medium text-navy-800 dark:text-mist-100">
                                            <div>
                                              {suggested.dayOfWeek}, {formatTime12h(suggested.startTime)} – {formatTime12h(suggested.endTime)}
                                            </div>
                                            <div className="text-slate-500">
                                              {suggested.roomName ?? "No room"} ({suggested.classMode})
                                            </div>
                                          </div>
                                        </TableCell>
                                      </TableRow>
                                    ))}
                                  </TableBody>
                                </Table>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </Card>
          </div>
        )}
      </div>
    </RoleGuard>
  );
}
