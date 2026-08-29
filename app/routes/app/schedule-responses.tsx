import { useMemo, useState } from "react";
import { toast } from "sonner";
import { RoleGuard } from "~/auth/role-guard";
import { DataLoadAlert } from "~/components/feedback/data-load-alert";
import { EmptyState } from "~/components/feedback/empty-state";
import { FormError } from "~/components/forms/form-error";
import { Badge, type BadgeTone } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { Card } from "~/components/ui/card";
import { FieldChrome } from "~/components/ui/input";
import { Modal, ModalActions } from "~/components/ui/modal";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "~/components/ui/select";
import { Skeleton } from "~/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "~/components/ui/table";
import { Textarea } from "~/components/ui/textarea";
import { PhaseBanner } from "~/features/academic-terms/phase-banner";
import { useAuth } from "~/hooks/use-auth";
import { useCachedData } from "~/hooks/use-cached-data";
import { useClassModes } from "~/hooks/use-class-modes";
import { useDays } from "~/hooks/use-days";
import { useSchoolYears } from "~/hooks/use-school-years";
import { useSemesters } from "~/hooks/use-semesters";
import { PageHeader } from "~/layouts/page-header";
import { formatTime12h, normalizeTime, timeToMinutes } from "~/lib/time";
import { authorityWorkflowService } from "~/services/authority-workflow.service";
import { scheduleService } from "~/services/schedule.service";
import type { InstructorScheduleResponse, ProposedScheduleMeeting } from "~/types/authority-workflow";
import { DAY_LABELS, generateTimeSlots, type Schedule } from "~/types/schedule";

export function meta() {
  return [{ title: "Schedule Responses — GWC Class Scheduling" }];
}

const STATUS_TONES: Record<string, BadgeTone> = {
  pending: "gold",
  forwarded: "navy",
  applied: "emerald",
  rejected: "red",
};

const TIME_OPTIONS = generateTimeSlots().map(formatTime12h);
const emptyMeeting = (mode = "", dayOfWeek = ""): ProposedScheduleMeeting => ({
  dayOfWeek,
  startTime: "7:00 AM",
  endTime: "8:00 AM",
  roomId: null,
  classMode: mode,
});

type TabType = "needs_you" | "in_flight" | "decided" | "accepted" | "awaiting";

function ScheduleResponsesPage() {
  const { user } = useAuth();
  const { defaultSchoolYear, schoolYears } = useSchoolYears();
  const { semesters } = useSemesters();
  const { classModes } = useClassModes();
  const { dayLabels } = useDays();
  const dayOptions = Object.values(dayLabels);

  const currentSyId = schoolYears.find((y) => y.schoolYear === defaultSchoolYear)?.id ?? null;
  const currentSemNum = semesters.find((s) => s.semesterNumber !== 3)?.semesterNumber ?? 1;

  const [activeTab, setActiveTab] = useState<TabType>("needs_you");

  const [responseTarget, setResponseTarget] = useState<Schedule | null>(null);
  const [responseType, setResponseType] = useState<"accept" | "suggest_change">("accept");
  const [meetings, setMeetings] = useState<ProposedScheduleMeeting[]>([emptyMeeting()]);
  const [decisionTarget, setDecisionTarget] = useState<{ row: InstructorScheduleResponse; approve: boolean } | null>(null);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const {
    data: responses,
    error,
    reload,
  } = useCachedData(
    "instructor-schedule-responses",
    () => authorityWorkflowService.listInstructorScheduleResponses(),
    { cache: false },
  );

  const { data: workflowSummary } = useCachedData(
    `instructor-response-summary:${currentSyId ?? "none"}:${currentSemNum}`,
    () => authorityWorkflowService.getInstructorResponseSummary(currentSyId ?? undefined, currentSemNum),
    { enabled: currentSyId != null, cache: false },
  );

  const { data: acceptedResponsesData } = useCachedData(
    `instructor-responses-accepted:${currentSyId ?? "none"}:${currentSemNum}`,
    () => authorityWorkflowService.listAcceptedInstructorResponses(currentSyId ?? undefined, currentSemNum),
    { enabled: currentSyId != null, cache: false },
  );
  const acceptedResponses = acceptedResponsesData ?? [];

  const { data: awaitingResponsesData } = useCachedData(
    `instructor-responses-awaiting:${currentSyId ?? "none"}:${currentSemNum}`,
    () => authorityWorkflowService.listAwaitingResponseInstructors(currentSyId ?? undefined, currentSemNum),
    { enabled: currentSyId != null, cache: false },
  );
  const awaitingResponses = awaitingResponsesData ?? [];

  const { data: acceptanceSummary } = useCachedData(
    `instructor-acceptance-summary:${currentSyId ?? "none"}:${currentSemNum}`,
    () => authorityWorkflowService.getInstructorAcceptanceSummary(currentSyId ?? 0, currentSemNum),
    { enabled: currentSyId != null, cache: false },
  );

  const {
    data: schedules,
    error: schedulesError,
    reload: reloadSchedules,
  } = useCachedData("schedule-response-schedules", () => scheduleService.view(), {
    enabled: user?.role === "faculty",
  });

  const {
    data: rooms,
    error: roomsError,
    reload: reloadRooms,
  } = useCachedData("schedule-response-rooms", () => scheduleService.listScheduleRooms(), {
    enabled: user?.role === "faculty",
  });

  const respondedScheduleIds = new Set((responses ?? []).map((row) => row.scheduleId));
  const availableSchedules = (schedules ?? []).filter((row) => !respondedScheduleIds.has(Number(row.id)));

  const allResponses = responses ?? [];

  // Categorize queues
  const waitingOnYouCount = useMemo(() => {
    if (user?.role === "faculty") return availableSchedules.length;
    if (user?.role === "dean") return allResponses.filter((r) => r.status === "pending").length;
    if (user?.role === "registrar") return allResponses.filter((r) => r.status === "forwarded").length;
    return 0;
  }, [user?.role, availableSchedules.length, allResponses]);

  const withDeanCount = useMemo(
    () => workflowSummary?.pendingWithDean ?? allResponses.filter((r) => r.status === "pending").length,
    [workflowSummary, allResponses],
  );

  const withRegistrarCount = useMemo(
    () => workflowSummary?.withRegistrar ?? allResponses.filter((r) => r.status === "forwarded").length,
    [workflowSummary, allResponses],
  );

  const decidedCount = useMemo(
    () =>
      workflowSummary != null
        ? workflowSummary.applied + workflowSummary.rejected
        : allResponses.filter((r) => r.status === "applied" || r.status === "rejected" || r.resolutionOutcome != null).length,
    [workflowSummary, allResponses],
  );

  const filteredResponses = useMemo(() => {
    if (activeTab === "accepted") return acceptedResponses;
    if (activeTab === "awaiting") return awaitingResponses;
    if (activeTab === "needs_you") {
      if (user?.role === "dean") return allResponses.filter((r) => r.status === "pending");
      if (user?.role === "registrar") return allResponses.filter((r) => r.status === "forwarded");
      return [];
    }
    if (activeTab === "in_flight") {
      if (user?.role === "faculty") {
        return allResponses.filter((r) => r.status === "pending" || r.status === "forwarded");
      }
      if (user?.role === "dean") return allResponses.filter((r) => r.status === "forwarded");
      if (user?.role === "registrar") return allResponses.filter((r) => r.status === "pending");
      return allResponses.filter((r) => r.status === "pending" || r.status === "forwarded");
    }
    // "decided"
    return allResponses.filter((r) => r.status === "applied" || r.status === "rejected" || r.resolutionOutcome != null);
  }, [activeTab, allResponses, user?.role, acceptedResponses, awaitingResponses]);

  async function submitResponse(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!responseTarget) return;
    const values = new FormData(event.currentTarget);
    if (responseType === "suggest_change") {
      if (!String(values.get("reason") ?? "").trim()) {
        setFormError("Explain why you are proposing this schedule change.");
        return;
      }
      const incomplete = meetings.some((meeting) =>
        !meeting.dayOfWeek || !meeting.startTime || !meeting.endTime ||
        (meeting.classMode === "F2F" && !meeting.roomId),
      );
      if (incomplete) {
        setFormError("Complete every proposed meeting before submitting.");
        return;
      }
      const invalidRange = meetings.find((meeting) => timeToMinutes(meeting.endTime) <= timeToMinutes(meeting.startTime));
      if (invalidRange) {
        setFormError("Each meeting's end time must be after its start time.");
        return;
      }
    }
    setSaving(true);
    setFormError(null);
    try {
      const result = await authorityWorkflowService.respondToInstructorSchedule(Number(responseTarget.id), {
        responseType,
        reason: String(values.get("reason") ?? "") || undefined,
        meetings: responseType === "suggest_change" ? meetings.map((m) => ({
          ...m,
          startTime: normalizeTime(m.startTime),
          endTime: normalizeTime(m.endTime),
        })) : [],
      });
      if (result.message) toast.success(result.message);
      setResponseTarget(null);
      await reload();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "");
    } finally {
      setSaving(false);
    }
  }

  async function submitDecision(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!decisionTarget || (user?.role !== "dean" && user?.role !== "registrar")) return;
    const values = new FormData(event.currentTarget);
    setSaving(true);
    setFormError(null);
    try {
      const result = await authorityWorkflowService.decideInstructorScheduleResponse(
        decisionTarget.row.id,
        user.role === "dean" ? "deans" : "registrar",
        decisionTarget.approve,
        String(values.get("note") ?? "") || undefined,
      );
      if (result.message) toast.success(result.message);
      setDecisionTarget(null);
      await reload();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "");
    } finally {
      setSaving(false);
    }
  }

  function updateMeeting(index: number, changes: Partial<ProposedScheduleMeeting>) {
    setMeetings((current) =>
      current.map((meeting, meetingIndex) =>
        meetingIndex === index ? { ...meeting, ...changes } : meeting,
      ),
    );
    setFormError(null);
  }

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-8">
      <PageHeader title="Schedule Responses" />

      {/* Phase Banner */}
      <div className="mt-4">
        <PhaseBanner syId={currentSyId} semesterNumber={currentSemNum} role={user?.role} />
      </div>

      {/* Summary Queue Counts */}
      <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Card className="p-3 text-center">
          <span className="font-display text-xl font-bold text-navy-800 dark:text-mist-100">
            {waitingOnYouCount}
          </span>
          <p className="text-xs text-slate-500 dark:text-slate-400">Waiting on you</p>
        </Card>
        <Card className="p-3 text-center">
          <span className="font-display text-xl font-bold text-navy-800 dark:text-mist-100">
            {withDeanCount}
          </span>
          <p className="text-xs text-slate-500 dark:text-slate-400">With the Dean</p>
        </Card>
        <Card className="p-3 text-center">
          <span className="font-display text-xl font-bold text-navy-800 dark:text-mist-100">
            {withRegistrarCount}
          </span>
          <p className="text-xs text-slate-500 dark:text-slate-400">With the Registrar</p>
        </Card>
        <Card className="p-3 text-center">
          <span className="font-display text-xl font-bold text-emerald-600 dark:text-emerald-400">
            {decidedCount}
          </span>
          <p className="text-xs text-slate-500 dark:text-slate-400">Decided</p>
        </Card>
      </div>

      {acceptanceSummary && (
        <Card className="mt-4 p-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-sm font-semibold text-navy-800 dark:text-mist-100">Instructor acceptance</h2>
              <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                Acceptance is separate from suggested changes. Instructors who did not respond become automatically accepted only after Shift Request closes.
              </p>
            </div>
            <div className="flex flex-wrap gap-2 text-xs">
              <Badge tone="emerald">{acceptanceSummary.accepted} accepted</Badge>
              <Badge tone="slate">{acceptanceSummary.automaticallyAccepted} automatically accepted</Badge>
              <Badge tone="gold">{acceptanceSummary.awaitingResponse} awaiting response</Badge>
            </div>
          </div>
        </Card>
      )}

      {user?.role === "faculty" && schedulesError && (
        <DataLoadAlert
          className="mt-6"
          title="Schedules unavailable"
          message={schedulesError}
          onRetry={reloadSchedules}
          permission={schedulesError.toLowerCase().includes("permission")}
        />
      )}

      {/* Faculty Schedule Waiting to be Responded */}
      {user?.role === "faculty" && availableSchedules.length > 0 && (
        <section className="mt-6">
          <h2 className="mb-3 text-base font-semibold text-navy-800 dark:text-mist-100">
            Awaiting Your Response ({availableSchedules.length})
          </h2>
          <Table>
            <TableHead>
              <TableHeader>Subject</TableHeader>
              <TableHeader>Section</TableHeader>
              <TableHeader>Schedule</TableHeader>
              <TableHeader>
                <span className="sr-only">Respond</span>
              </TableHeader>
            </TableHead>
            <TableBody>
              {availableSchedules.map((schedule) => (
                <TableRow key={schedule.id}>
                  <TableCell>
                    <span className="font-semibold text-navy-700 dark:text-mist-100">
                      {schedule.subjectCode}
                    </span>
                    <span className="block text-xs text-slate-400">{schedule.subjectTitle}</span>
                  </TableCell>
                  <TableCell>{schedule.setCode}</TableCell>
                  <TableCell>
                    {DAY_LABELS[schedule.day]} · {formatTime12h(schedule.startTime)}–
                    {formatTime12h(schedule.endTime)}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      type="button"
                      block={false}
                      onClick={() => {
                        setResponseTarget(schedule);
                        setResponseType("accept");
                        setMeetings([emptyMeeting(schedule.mode, dayOptions[0] ?? "")]);
                        setFormError(null);
                      }}
                    >
                      Respond
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </section>
      )}

      {/* Tabs Navigation */}
      <div className="mt-8 flex border-b border-slate-200 dark:border-white/10">
        <button
          type="button"
          onClick={() => setActiveTab("needs_you")}
          className={`border-b-2 px-4 py-2 text-xs font-semibold tracking-wide transition-colors ${
            activeTab === "needs_you"
              ? "border-sky-500 text-sky-600 dark:border-sky-400 dark:text-sky-300"
              : "border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-mist-200"
          }`}
        >
          Needs you ({user?.role === "faculty" ? availableSchedules.length : waitingOnYouCount})
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("in_flight")}
          className={`border-b-2 px-4 py-2 text-xs font-semibold tracking-wide transition-colors ${
            activeTab === "in_flight"
              ? "border-sky-500 text-sky-600 dark:border-sky-400 dark:text-sky-300"
              : "border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-mist-200"
          }`}
        >
          With other office ({withDeanCount + withRegistrarCount - waitingOnYouCount})
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("decided")}
          className={`border-b-2 px-4 py-2 text-xs font-semibold tracking-wide transition-colors ${
            activeTab === "decided"
              ? "border-sky-500 text-sky-600 dark:border-sky-400 dark:text-sky-300"
              : "border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-mist-200"
          }`}
        >
          Decided ({decidedCount})
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("accepted")}
          className={`border-b-2 px-4 py-2 text-xs font-semibold tracking-wide transition-colors ${
            activeTab === "accepted"
              ? "border-sky-500 text-sky-600 dark:border-sky-400 dark:text-sky-300"
              : "border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-mist-200"
          }`}
        >
          Accepted ({acceptedResponses.length})
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("awaiting")}
          className={`border-b-2 px-4 py-2 text-xs font-semibold tracking-wide transition-colors ${
            activeTab === "awaiting"
              ? "border-sky-500 text-sky-600 dark:border-sky-400 dark:text-sky-300"
              : "border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-mist-200"
          }`}
        >
          Awaiting response ({awaitingResponses.length})
        </button>
      </div>

      {/* Responses Table */}
      <section className="mt-4">
        {error && responses === null ? (
          <DataLoadAlert
            title="Schedule responses unavailable"
            message={error}
            onRetry={reload}
            permission={error.toLowerCase().includes("permission")}
          />
        ) : responses === null ? (
          <Skeleton className="h-64 rounded-xl" />
        ) : filteredResponses.length === 0 ? (
          <EmptyState title="No responses in this queue">
            {activeTab === "needs_you"
              ? "You have no responses waiting on your review."
              : activeTab === "in_flight"
                ? "No schedule responses are currently in-flight."
                : activeTab === "accepted"
                  ? "No accepted instructor schedules for this term."
                  : activeTab === "awaiting"
                    ? "No instructors are currently awaiting response."
                    : "No schedule responses have been decided yet."}
          </EmptyState>
        ) : (
          <Table>
            <TableHead>
              <TableHeader>Instructor</TableHeader>
              <TableHeader>Subject &amp; Section</TableHeader>
              <TableHeader>Response</TableHeader>
              <TableHeader>Status / Resolution</TableHeader>
              <TableHeader className="hidden md:table-cell">Details / Moves</TableHeader>
              {activeTab === "needs_you" && user?.role !== "faculty" && (
                <TableHeader>
                  <span className="sr-only">Actions</span>
                </TableHeader>
              )}
            </TableHead>
            <TableBody>
              {filteredResponses.map((row) => {
                const isSettled = row.status === "applied" || row.status === "rejected" || row.resolutionOutcome != null;
                const canAct = !isSettled && (
                  (user?.role === "dean" && row.status === "pending") ||
                  (user?.role === "registrar" && row.status === "forwarded")
                );

                return (
                  <TableRow key={row.id}>
                    <TableCell className="font-medium text-navy-700 dark:text-mist-100">
                      {row.instructorName}
                    </TableCell>
                    <TableCell>
                      <span className="font-medium">{row.subjectCode ?? "—"}</span>
                      {row.setCode && (
                        <span className="block text-xs text-slate-400">{row.setCode}</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {row.responseType === "accept" ? (
                        <Badge tone="emerald">Accepted</Badge>
                      ) : (
                        <Badge tone="slate">Suggested change</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      {row.resolutionOutcome ? (
                        <Badge
                          tone={
                            row.resolutionOutcome === "satisfied"
                              ? "emerald"
                              : row.resolutionOutcome === "blocked_by_major"
                                ? "gold"
                                : "red"
                          }
                        >
                          {row.resolutionOutcome === "blocked_by_major"
                            ? "Blocked by Major"
                            : row.resolutionOutcome}
                        </Badge>
                      ) : (
                        <Badge tone={STATUS_TONES[row.status] ?? "slate"}>{row.status}</Badge>
                      )}
                    </TableCell>
                    <TableCell className="hidden max-w-md md:table-cell text-xs text-slate-600 dark:text-slate-300">
                      {row.moves && row.moves.length > 0 ? (
                        <div className="space-y-1">
                          {row.moves.map((m, idx) => (
                            <div key={idx} className="flex items-center gap-1.5 font-mono text-[11px]">
                              <span>{m.original.dayOfWeek} {m.original.startTime}</span>
                              <span>➔</span>
                              <span className="font-semibold text-navy-800 dark:text-mist-100">
                                {m.proposed.dayOfWeek} {m.proposed.startTime} ({m.proposed.roomName ?? "TBD"})
                              </span>
                            </div>
                          ))}
                        </div>
                      ) : row.reason ? (
                        <span>{row.reason}</span>
                      ) : (
                        "—"
                      )}
                    </TableCell>
                    {activeTab === "needs_you" && user?.role !== "faculty" && (
                      <TableCell>
                        {canAct && (
                          <div className="flex justify-end gap-2">
                            <Button
                              type="button"
                              block={false}
                              onClick={() => {
                                setDecisionTarget({ row, approve: true });
                                setFormError(null);
                              }}
                            >
                              Approve
                            </Button>
                            <Button
                              type="button"
                              variant="danger"
                              block={false}
                              onClick={() => {
                                setDecisionTarget({ row, approve: false });
                                setFormError(null);
                              }}
                            >
                              Reject
                            </Button>
                          </div>
                        )}
                      </TableCell>
                    )}
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </section>

      {/* Faculty Response Modal */}
      <Modal
        open={responseTarget !== null}
        onClose={() => setResponseTarget(null)}
        title={`Respond to ${responseTarget?.subjectCode ?? "Schedule"}`}
        wide
      >
        <form onSubmit={submitResponse} className="space-y-5" noValidate>
          <FormError message={formError} />
          {roomsError && responseType === "suggest_change" && (
            <DataLoadAlert
              title="Rooms unavailable"
              message={roomsError}
              onRetry={reloadRooms}
              permission={roomsError.toLowerCase().includes("permission")}
            />
          )}
          {responseTarget && (
            <div className="rounded-lg border border-blue-100 bg-blue-50 px-4 py-3 dark:border-blue-400/15 dark:bg-blue-400/5">
              <p className="font-body text-xs font-semibold uppercase tracking-wide text-blue-700 dark:text-blue-300">
                Assigned schedule
              </p>
              <p className="mt-1 font-body text-sm text-navy-700 dark:text-mist-100">
                {DAY_LABELS[responseTarget.day]} · {formatTime12h(responseTarget.startTime)}–
                {formatTime12h(responseTarget.endTime)}
              </p>
            </div>
          )}
          <FieldChrome id="schedule-response-type" label="Response" required>
            <Select
              items={[
                { value: "accept", label: "Accept schedule" },
                { value: "suggest_change", label: "Suggest a change" },
              ]}
              value={responseType}
              onValueChange={(value) => {
                setResponseType((value ?? "accept") as typeof responseType);
                setFormError(null);
              }}
            >
              <SelectTrigger id="schedule-response-type">
                <SelectValue placeholder="Select response" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="accept">Accept schedule</SelectItem>
                <SelectItem value="suggest_change">Suggest a change</SelectItem>
              </SelectContent>
            </Select>
          </FieldChrome>
          {responseType === "suggest_change" && (
            <div className="space-y-4">
              {meetings.map((meeting, index) => (
                <div
                  key={index}
                  className="rounded-lg border border-slate-200 bg-slate-50/70 p-4 dark:border-white/10 dark:bg-white/3"
                >
                  <div className="mb-3 flex items-center justify-between gap-3">
                    <h3 className="text-sm font-semibold text-navy-800 dark:text-mist-100">
                      Proposed meeting {index + 1}
                    </h3>
                    {meetings.length > 1 && (
                      <Button
                        type="button"
                        variant="danger"
                        block={false}
                        onClick={() =>
                          setMeetings((current) => current.filter((_, meetingIndex) => meetingIndex !== index))
                        }
                      >
                        Remove
                      </Button>
                    )}
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <FieldChrome id={`response-day-${index}`} label="Day" required>
                      <Select
                        items={dayOptions.map((day) => ({ value: day, label: day }))}
                        value={meeting.dayOfWeek}
                        onValueChange={(value) => updateMeeting(index, { dayOfWeek: value ?? dayOptions[0] ?? "" })}
                      >
                        <SelectTrigger id={`response-day-${index}`}>
                          <SelectValue placeholder="Select day" />
                        </SelectTrigger>
                        <SelectContent>
                          {dayOptions.map((day) => (
                            <SelectItem key={day} value={day}>
                              {day}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </FieldChrome>
                    <FieldChrome id={`response-mode-${index}`} label="Class mode">
                      <Select
                        items={classModes.map((mode) => ({ value: mode, label: mode }))}
                        value={meeting.classMode ?? ""}
                        onValueChange={(value) => updateMeeting(index, {
                          classMode: value ?? "",
                          ...(value === "Synchronous" || value === "Asynchronous" ? { roomId: null } : {}),
                        })}
                        disabled={classModes.length === 0}
                      >
                        <SelectTrigger id={`response-mode-${index}`}><SelectValue placeholder="Select class mode" /></SelectTrigger>
                        <SelectContent>{classModes.map((mode) => <SelectItem key={mode} value={mode}>{mode}</SelectItem>)}</SelectContent>
                      </Select>
                    </FieldChrome>
                    <FieldChrome id={`response-room-${index}`} label="Room" required={meeting.classMode === "F2F"}>
                      <Select
                        items={(rooms ?? []).map((room) => ({
                          value: String(room.id),
                          label: `${room.buildingName} · ${room.roomName}`,
                        }))}
                        value={meeting.roomId ? String(meeting.roomId) : ""}
                        onValueChange={(value) => updateMeeting(index, { roomId: value ? Number(value) : null })}
                        disabled={Boolean(roomsError) || meeting.classMode === "Synchronous" || meeting.classMode === "Asynchronous"}
                      >
                        <SelectTrigger id={`response-room-${index}`}>
                          <SelectValue placeholder="Select room" />
                        </SelectTrigger>
                        <SelectContent>
                          {(rooms ?? []).map((room) => (
                            <SelectItem key={room.id} value={String(room.id)}>
                              {room.buildingName} · {room.roomName}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </FieldChrome>
                    <FieldChrome id={`response-start-${index}`} label="Start time" required>
                      <Select
                        items={TIME_OPTIONS.map((time) => ({ value: time, label: time }))}
                        value={meeting.startTime}
                        onValueChange={(value) => {
                          const startTime = value ?? "";
                          updateMeeting(index, {
                            startTime,
                            ...(meeting.endTime && timeToMinutes(meeting.endTime) <= timeToMinutes(startTime)
                              ? { endTime: "" }
                              : {}),
                          });
                        }}
                      >
                        <SelectTrigger id={`response-start-${index}`}>
                          <SelectValue placeholder="Select start time" />
                        </SelectTrigger>
                        <SelectContent>
                          {TIME_OPTIONS.map((time) => (
                            <SelectItem key={time} value={time}>
                              {time}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </FieldChrome>
                    <FieldChrome id={`response-end-${index}`} label="End time" required>
                      <Select
                        items={TIME_OPTIONS.filter(
                          (time) => !meeting.startTime || timeToMinutes(time) > timeToMinutes(meeting.startTime),
                        ).map((time) => ({ value: time, label: time }))}
                        value={meeting.endTime}
                        onValueChange={(value) => updateMeeting(index, { endTime: value ?? "" })}
                        disabled={!meeting.startTime}
                      >
                        <SelectTrigger id={`response-end-${index}`}>
                          <SelectValue placeholder="Select end time" />
                        </SelectTrigger>
                        <SelectContent>
                          {TIME_OPTIONS.filter(
                            (time) => !meeting.startTime || timeToMinutes(time) > timeToMinutes(meeting.startTime),
                          ).map((time) => (
                            <SelectItem key={time} value={time}>
                              {time}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </FieldChrome>
                  </div>
                </div>
              ))}
              <Button
                type="button"
                variant="outline"
                block={false}
                onClick={() => setMeetings((current) => [...current, emptyMeeting(responseTarget?.mode ?? "", dayOptions[0] ?? "")])}
              >
                Add Meeting
              </Button>
              <Textarea id="reason" name="reason" label="Reason for the proposed change" required />
            </div>
          )}
          <ModalActions>
            <Button type="button" variant="outline" block={false} onClick={() => setResponseTarget(null)}>
              Cancel
            </Button>
            <Button
              type="submit"
              block={false}
              isLoading={saving}
              loadingLabel="Submitting…"
              disabled={responseType === "suggest_change" && Boolean(roomsError)}
            >
              Submit Response
            </Button>
          </ModalActions>
        </form>
      </Modal>

      {/* Decision Modal */}
      <Modal
        open={decisionTarget !== null}
        onClose={() => setDecisionTarget(null)}
        title={`${decisionTarget?.approve ? "Approve" : "Reject"} Schedule Response`}
      >
        <form onSubmit={submitDecision} className="space-y-4">
          <FormError message={formError} />
          <Textarea id="note" name="note" label="Decision note" />
          <ModalActions>
            <Button type="button" variant="outline" block={false} onClick={() => setDecisionTarget(null)}>
              Cancel
            </Button>
            <Button
              type="submit"
              variant={decisionTarget?.approve ? "primary" : "danger"}
              block={false}
              isLoading={saving}
              loadingLabel="Saving…"
            >
              Confirm
            </Button>
          </ModalActions>
        </form>
      </Modal>
    </div>
  );
}

export default function ScheduleResponsesRoute() {
  return (
    <RoleGuard allow={["faculty", "dean", "registrar"]}>
      <ScheduleResponsesPage />
    </RoleGuard>
  );
}
