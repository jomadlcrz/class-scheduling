import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { RoleGuard } from "~/auth/role-guard";
import { EmptyState } from "~/components/feedback/empty-state";
import { Badge, type BadgeTone } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { Card } from "~/components/ui/card";
import { ChevronDownIcon } from "~/components/ui/icons";
import { ConfirmDialog, Modal } from "~/components/ui/modal";
import { Spinner } from "~/components/ui/spinner";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "~/components/ui/table";
import { DecisionMessage } from "~/features/schedules/decision-message";
import {
  snapshotOriginalMeetings,
  type ProposalMeeting,
} from "~/features/schedules/instructor-proposal-model";
import { InstructorProposalEditor } from "~/features/schedules/instructor-proposal-editor";
import { ScheduleViewer } from "~/features/schedules/schedule-viewer";
import type { ScheduleViewMode } from "~/features/schedules/schedule-view-toggle";
import { formatSectionSetName } from "~/features/schedules/scheduling-routes";
import { SuggestionValidationSummary } from "~/features/schedules/suggestion-validation-summary";
import { useDays } from "~/hooks/use-days";
import { PageHeader } from "~/layouts/page-header";
import { ApiError } from "~/lib/api";
import { formatDateTime, formatTime12h } from "~/lib/time";
import { instructorReviewService } from "~/services/instructor-review.service";
import { roomService } from "~/services/room.service";
import { termSchedulingService } from "~/services/term-scheduling.service";
import { weeklyHourService } from "~/services/weekly-hour-allocation.service";
import type {
  InstructorReviewDetail,
  InstructorReviewMeeting,
  InstructorReviewSummary,
  ProposedMeeting,
} from "~/types/instructor-review";
import type { Room } from "~/types/room";
import type { Schedule } from "~/types/schedule";
import type { TermSchedulingCalendar } from "~/types/term-scheduling";
import type { WeeklyHourAllocation } from "~/types/weekly-hour-allocation";

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
      label: "Not applied",
      tone: "red",
      description: "The request was turned down and the original distributed timetable was kept.",
    };
  }
  if (status === "forwarded") {
    return {
      label: "With registrar",
      tone: "gold",
      description: "Dean forwarded your suggestion to the Registrar for conflict checks.",
    };
  }
  return {
    label: "Awaiting dean",
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
  const { dayLabels } = useDays();

  const dayNameToCode = useMemo(() => {
    const map: Record<string, string> = {};
    for (const [code, name] of Object.entries(dayLabels)) {
      map[name.toLowerCase()] = code;
    }
    return map;
  }, [dayLabels]);

  const [viewMode, setViewMode] = useState<ScheduleViewMode>("table");
  const [calendar, setCalendar] = useState<TermSchedulingCalendar | null>(null);
  const [requests, setRequests] = useState<InstructorReviewDetail[]>([]);
  const [history, setHistory] = useState<InstructorReviewDetail[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedRequestIds, setExpandedRequestIds] = useState<Set<number> | null>(null);
  const [acceptAllOpen, setAcceptAllOpen] = useState(false);

  const [editingReleaseId, setEditingReleaseId] = useState<number | null>(null);
  const [editingDetail, setEditingDetail] = useState<InstructorReviewDetail | null>(null);
  const [editingDistributed, setEditingDistributed] = useState<InstructorReviewDetail[]>([]);
  const [editingLoading, setEditingLoading] = useState(false);
  const [editingError, setEditingError] = useState<string | null>(null);
  const [allocations, setAllocations] = useState<WeeklyHourAllocation[]>([]);

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

  const distributedSchedules = useMemo(() => {
    const requestBySetCode = new Map<string, InstructorReviewDetail>();
    for (const request of requests) {
      const label = requestSetLabel(request);
      if (!requestBySetCode.has(label)) requestBySetCode.set(label, request);
    }

    return distributed.map((meeting): Schedule => {
      const setLabel = meeting.setLabel;
      const request = requestBySetCode.get(setLabel) ?? requests[0];
      const dayCode = dayNameToCode[meeting.dayOfWeek.trim().toLowerCase()] ?? "M";
      return {
        id: String(meeting.scheduleId),
        schoolYear: request?.schoolYear ?? "",
        semester: request?.semesterNumber ?? 1,
        subjectId: String(meeting.subjectId),
        subjectCode: meeting.subjectCode ?? "",
        subjectTitle: meeting.subjectTitle ?? "",
        subjectType: meeting.subjectType ?? undefined,
        setId: request ? String(request.setId) : "",
        setCode: request?.setCode ?? setLabel,
        program: request?.programAbbrev ?? "",
        departmentCode: "",
        yearLevel: request?.yearLevel ?? 1,
        facultyId: "",
        facultyName: "",
        roomId: String(meeting.roomId ?? ""),
        roomName: meeting.roomName ?? "No room",
        mode: meeting.classMode,
        sessionMode: meeting.sessionMode ?? undefined,
        day: dayCode as Schedule["day"],
        startTime: meeting.startTime,
        endTime: meeting.endTime,
        origin: meeting.scheduleOrigin ?? undefined,
      };
    });
  }, [distributed, dayNameToCode, requests]);

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



  async function openShiftRequest() {
    if (openRequests.length === 0) return;
    const target = openRequests[0];
    setEditingReleaseId(target.releaseId);
    setEditingLoading(true);
    setEditingError(null);
    try {
      const [detail, roomList, allocList, summaries] = await Promise.all([
        instructorReviewService.getInstructorReviewDetail(target.releaseId),
        roomService.list().catch(() => []),
        weeklyHourService.list().catch(() => []),
        instructorReviewService.listInstructorReviews().catch(() => []),
      ]);
      setEditingDetail(detail);
      setRooms(roomList);
      setAllocations(allocList);
      const allReleases = await Promise.allSettled(
        summaries.map((s: InstructorReviewSummary) => instructorReviewService.getInstructorReviewDetail(s.releaseId)),
      );
      setEditingDistributed(
        allReleases.flatMap((r: PromiseSettledResult<InstructorReviewDetail>) =>
          r.status === "fulfilled" ? [r.value] : [],
        ),
      );
    } catch (err: unknown) {
      setEditingError(err instanceof ApiError ? err.message : "Failed to load schedule detail.");
    } finally {
      setEditingLoading(false);
    }
  }

  function closeEditor() {
    setEditingReleaseId(null);
    setEditingDetail(null);
    setEditingDistributed([]);
    setEditingError(null);
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
      <div className="mx-auto w-full max-w-7xl px-4 py-8">
        <PageHeader
          title="Shift Requests"
          actions={
            <div className="flex flex-wrap justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                block={false}
                disabled={openRequests.length === 0 || editingReleaseId != null}
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
          }
        />

        {suggestionAttemptPolicy && (
          <div className="mt-4 flex items-center justify-end gap-2 font-body text-xs text-slate-500 dark:text-slate-400">
            <span>Shift Request Limit:</span>
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

        {loading ? (
          <div className="mt-6 grid min-h-52 place-items-center rounded-xl border border-slate-300 bg-white text-navy-700 dark:border-white/10 dark:bg-white/5 dark:text-slate-200">
            <Spinner />
          </div>
        ) : error ? (
          <Card className="mt-6 p-5">
            <EmptyState title="Couldn't load shift requests">{error}</EmptyState>
          </Card>
        ) : (
          <div className="mt-6 space-y-6">
            <Card className="p-5">
              <div className="border-b border-slate-200 pb-4 dark:border-white/10">
                <h2 className="font-display text-lg tracking-wide text-navy-700 dark:text-mist-100">
                  Distributed Schedules
                </h2>
                <p className="mt-0.5 font-body text-xs text-slate-500 dark:text-slate-400">
                  Your assigned classes by weekday, ordered from earliest to latest.
                </p>
              </div>

              <ScheduleViewer
                schedules={distributedSchedules}
                isLoading={false}
                viewMode={viewMode}
                onViewModeChange={setViewMode}
                emptyTitle="No distributed schedules"
                emptyMessage="Your Dean has not distributed a schedule for this semester yet."
                showSet
                hideInstructor
              />
            </Card>

            <Modal
              open={editingReleaseId != null}
              onClose={closeEditor}
              title="Request Schedule Change"
              xl
            >
              {editingLoading ? (
                <div className="grid min-h-40 place-items-center py-8">
                  <Spinner />
                </div>
              ) : editingError ? (
                <EmptyState title="Couldn't load schedule detail">{editingError}</EmptyState>
              ) : editingDetail ? (
                <InstructorProposalEditor
                  detail={editingDetail}
                  setLabel={requestSetLabel(editingDetail)}
                  rooms={rooms}
                  allocations={allocations}
                  distributed={editingDistributed}
                  onCancel={closeEditor}
                  onSubmitted={() => {
                    closeEditor();
                    void load();
                  }}
                />
              ) : null}
            </Modal>

            <Card className="p-5">
              <div className="flex items-center justify-between border-b border-slate-200 pb-4 dark:border-white/10">
                <div>
                  <h2 className="font-display text-lg tracking-wide text-navy-700 dark:text-mist-100">
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
                                <span className="font-display text-sm tracking-wide text-navy-700 dark:text-mist-100">
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
                          <div className="mt-3 space-y-4 rounded-lg border border-slate-200 bg-slate-50/50 p-4 dark:border-white/10 dark:bg-white/2">
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
                                      <TableHead>Original schedule</TableHead>
                                      <TableHead>Requested change</TableHead>
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

            <ConfirmDialog
              open={acceptAllOpen}
              onClose={() => setAcceptAllOpen(false)}
              title="Accept all distributed schedules?"
              confirmLabel="Accept all"
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
          </div>
        )}
      </div>
    </RoleGuard>
  );
}
