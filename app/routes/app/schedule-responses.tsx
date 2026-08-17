import { useState } from "react";
import { toast } from "sonner";
import { RoleGuard } from "~/auth/role-guard";
import { FormError } from "~/components/forms/form-error";
import { DataLoadAlert } from "~/components/feedback/data-load-alert";
import { EmptyState } from "~/components/feedback/empty-state";
import { Badge, type BadgeTone } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { FieldChrome } from "~/components/ui/input";
import { Modal, ModalActions } from "~/components/ui/modal";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "~/components/ui/select";
import { Skeleton } from "~/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "~/components/ui/table";
import { Textarea } from "~/components/ui/textarea";
import { useAuth } from "~/hooks/use-auth";
import { useCachedData } from "~/hooks/use-cached-data";
import { PageHeader } from "~/layouts/page-header";
import { formatTime12h, timeToMinutes } from "~/lib/time";
import { authorityWorkflowService } from "~/services/authority-workflow.service";
import { scheduleService } from "~/services/schedule.service";
import type { InstructorScheduleResponse, ProposedScheduleMeeting } from "~/types/authority-workflow";
import { DAY_LABELS, generateTimeSlots, type Schedule } from "~/types/schedule";

export function meta() {
  return [{ title: "Schedule Responses — GWC Class Scheduling" }];
}

const STATUS_TONES: Record<string, BadgeTone> = {
  pending: "gold", forwarded: "navy", applied: "emerald", rejected: "red",
};

const TIME_OPTIONS = generateTimeSlots().map(formatTime12h);
const emptyMeeting = (): ProposedScheduleMeeting => ({ dayOfWeek: "Monday", startTime: "7:00 AM", endTime: "8:00 AM", roomId: 0 });

function ScheduleResponsesPage() {
  const { user } = useAuth();
  const [responseTarget, setResponseTarget] = useState<Schedule | null>(null);
  const [responseType, setResponseType] = useState<"accept" | "suggest_change">("accept");
  const [meetings, setMeetings] = useState<ProposedScheduleMeeting[]>([emptyMeeting()]);
  const [decisionTarget, setDecisionTarget] = useState<{ row: InstructorScheduleResponse; approve: boolean } | null>(null);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const { data: responses, error, reload } = useCachedData("instructor-schedule-responses", () => authorityWorkflowService.listInstructorScheduleResponses(), { cache: false });
  const { data: schedules, error: schedulesError, reload: reloadSchedules } = useCachedData("schedule-response-schedules", () => scheduleService.view(), { enabled: user?.role === "faculty" });
  const { data: rooms, error: roomsError, reload: reloadRooms } = useCachedData("schedule-response-rooms", () => scheduleService.listScheduleRooms(), { enabled: user?.role === "faculty" });
  const respondedScheduleIds = new Set((responses ?? []).map((row) => row.scheduleId));
  const availableSchedules = (schedules ?? []).filter((row) => !respondedScheduleIds.has(Number(row.id)));

  async function submitResponse(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!responseTarget) return;
    const values = new FormData(event.currentTarget);
    if (responseType === "suggest_change") {
      if (!String(values.get("reason") ?? "").trim()) {
        setFormError("Explain why you are proposing this schedule change.");
        return;
      }
      const incomplete = meetings.some((meeting) => !meeting.dayOfWeek || !meeting.startTime || !meeting.endTime || !meeting.roomId);
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
        meetings: responseType === "suggest_change" ? meetings : [],
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

  const actionable = (row: InstructorScheduleResponse) =>
    (user?.role === "dean" && row.status === "pending") ||
    (user?.role === "registrar" && row.status === "forwarded");

  function updateMeeting(index: number, changes: Partial<ProposedScheduleMeeting>) {
    setMeetings((current) => current.map((meeting, meetingIndex) => meetingIndex === index ? { ...meeting, ...changes } : meeting));
    setFormError(null);
  }

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-8">
      <PageHeader title="Schedule Responses" />

      {user?.role === "faculty" && schedulesError && <DataLoadAlert className="mt-6" title="Schedules unavailable" message={schedulesError} onRetry={reloadSchedules} permission={schedulesError.toLowerCase().includes("permission")} />}

      {user?.role === "faculty" && availableSchedules.length > 0 && (
        <section className="mt-6">
          <h2 className="mb-3 font-display text-base tracking-wide text-navy-700 dark:text-mist-100">Awaiting Your Response</h2>
          <Table>
            <TableHead><TableHeader>Subject</TableHeader><TableHeader>Section</TableHeader><TableHeader>Schedule</TableHeader><TableHeader><span className="sr-only">Respond</span></TableHeader></TableHead>
            <TableBody>
              {availableSchedules.map((schedule) => (
                <TableRow key={schedule.id}>
                  <TableCell><span className="font-semibold text-navy-700 dark:text-mist-100">{schedule.subjectCode}</span><span className="block text-xs text-slate-400">{schedule.subjectTitle}</span></TableCell>
                  <TableCell>{schedule.setCode}</TableCell>
                  <TableCell>{DAY_LABELS[schedule.day]} · {formatTime12h(schedule.startTime)}–{formatTime12h(schedule.endTime)}</TableCell>
                  <TableCell className="text-right"><Button type="button" block={false} onClick={() => { setResponseTarget(schedule); setResponseType("accept"); setMeetings([emptyMeeting()]); setFormError(null); }}>Respond</Button></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </section>
      )}

      <section className="mt-6">
        <h2 className="mb-3 font-display text-base tracking-wide text-navy-700 dark:text-mist-100">Response History</h2>
        {error && responses === null ? (
          <DataLoadAlert title="Schedule responses unavailable" message={error} onRetry={reload} permission={error.toLowerCase().includes("permission")} />
        ) : responses === null ? (
          <Skeleton className="h-64 rounded-xl" />
        ) : responses.length === 0 ? (
          <EmptyState title="No schedule responses">No schedule responses have been submitted.</EmptyState>
        ) : (
          <Table>
            <TableHead><TableHeader>Instructor</TableHeader><TableHeader>Subject</TableHeader><TableHeader>Response</TableHeader><TableHeader>Status</TableHeader><TableHeader className="hidden md:table-cell">Reason</TableHeader>{user?.role !== "faculty" && <TableHeader><span className="sr-only">Actions</span></TableHeader>}</TableHead>
            <TableBody>
              {responses.map((row) => (
                <TableRow key={row.id}>
                  <TableCell>{row.instructorName}</TableCell>
                  <TableCell>{row.subjectCode ?? "—"}</TableCell>
                  <TableCell>{row.responseType === "accept" ? "Accepted" : "Suggested change"}</TableCell>
                  <TableCell><Badge tone={STATUS_TONES[row.status] ?? "slate"}>{row.status}</Badge></TableCell>
                  <TableCell className="hidden max-w-md md:table-cell">{row.reason ?? "—"}</TableCell>
                  {user?.role !== "faculty" && (
                    <TableCell>
                      {actionable(row) && <div className="flex justify-end gap-2"><Button type="button" block={false} onClick={() => { setDecisionTarget({ row, approve: true }); setFormError(null); }}>Approve</Button><Button type="button" variant="danger" block={false} onClick={() => { setDecisionTarget({ row, approve: false }); setFormError(null); }}>Reject</Button></div>}
                    </TableCell>
                  )}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </section>

      <Modal open={responseTarget !== null} onClose={() => setResponseTarget(null)} title={`Respond to ${responseTarget?.subjectCode ?? "Schedule"}`} wide>
        <form onSubmit={submitResponse} className="space-y-5" noValidate>
          <FormError message={formError} />
          {roomsError && responseType === "suggest_change" && <DataLoadAlert title="Rooms unavailable" message={roomsError} onRetry={reloadRooms} permission={roomsError.toLowerCase().includes("permission")} />}
          {responseTarget && (
            <div className="rounded-lg border border-blue-100 bg-blue-50 px-4 py-3 dark:border-blue-400/15 dark:bg-blue-400/5">
              <p className="font-body text-xs font-semibold uppercase tracking-wide text-blue-700 dark:text-blue-300">Assigned schedule</p>
              <p className="mt-1 font-body text-sm text-navy-700 dark:text-mist-100">{DAY_LABELS[responseTarget.day]} · {formatTime12h(responseTarget.startTime)}–{formatTime12h(responseTarget.endTime)}</p>
            </div>
          )}
          <FieldChrome id="schedule-response-type" label="Response" required>
            <Select items={[{ value: "accept", label: "Accept schedule" }, { value: "suggest_change", label: "Suggest a change" }]} value={responseType} onValueChange={(value) => { setResponseType((value ?? "accept") as typeof responseType); setFormError(null); }}>
              <SelectTrigger id="schedule-response-type"><SelectValue /></SelectTrigger>
              <SelectContent><SelectItem value="accept">Accept schedule</SelectItem><SelectItem value="suggest_change">Suggest a change</SelectItem></SelectContent>
            </Select>
          </FieldChrome>
          {responseType === "suggest_change" && (
            <div className="space-y-4">
              {meetings.map((meeting, index) => (
                <div key={index} className="rounded-lg border border-slate-200 bg-slate-50/70 p-4 dark:border-white/10 dark:bg-white/3">
                  <div className="mb-3 flex items-center justify-between gap-3">
                    <h3 className="font-display text-sm tracking-wide text-navy-700 dark:text-mist-100">Proposed meeting {index + 1}</h3>
                    {meetings.length > 1 && <Button type="button" variant="danger" block={false} onClick={() => setMeetings((current) => current.filter((_, meetingIndex) => meetingIndex !== index))}>Remove</Button>}
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <FieldChrome id={`response-day-${index}`} label="Day" required>
                      <Select items={Object.values(DAY_LABELS).map((day) => ({ value: day, label: day }))} value={meeting.dayOfWeek} onValueChange={(value) => updateMeeting(index, { dayOfWeek: value ?? "Monday" })}>
                        <SelectTrigger id={`response-day-${index}`}><SelectValue /></SelectTrigger>
                        <SelectContent>{Object.values(DAY_LABELS).map((day) => <SelectItem key={day} value={day}>{day}</SelectItem>)}</SelectContent>
                      </Select>
                    </FieldChrome>
                    <FieldChrome id={`response-room-${index}`} label="Room" required>
                      <Select items={(rooms ?? []).map((room) => ({ value: String(room.id), label: `${room.buildingName} · ${room.roomName}` }))} value={meeting.roomId ? String(meeting.roomId) : ""} onValueChange={(value) => updateMeeting(index, { roomId: Number(value) })} disabled={Boolean(roomsError)}>
                        <SelectTrigger id={`response-room-${index}`}><SelectValue placeholder="Select room" /></SelectTrigger>
                        <SelectContent>{(rooms ?? []).map((room) => <SelectItem key={room.id} value={String(room.id)}>{room.buildingName} · {room.roomName}</SelectItem>)}</SelectContent>
                      </Select>
                    </FieldChrome>
                    <FieldChrome id={`response-start-${index}`} label="Start time" required>
                      <Select items={TIME_OPTIONS.map((time) => ({ value: time, label: time }))} value={meeting.startTime} onValueChange={(value) => { const startTime = value ?? ""; updateMeeting(index, { startTime, ...(meeting.endTime && timeToMinutes(meeting.endTime) <= timeToMinutes(startTime) ? { endTime: "" } : {}) }); }}>
                        <SelectTrigger id={`response-start-${index}`}><SelectValue placeholder="Select start time" /></SelectTrigger>
                        <SelectContent>{TIME_OPTIONS.map((time) => <SelectItem key={time} value={time}>{time}</SelectItem>)}</SelectContent>
                      </Select>
                    </FieldChrome>
                    <FieldChrome id={`response-end-${index}`} label="End time" required>
                      <Select items={TIME_OPTIONS.filter((time) => !meeting.startTime || timeToMinutes(time) > timeToMinutes(meeting.startTime)).map((time) => ({ value: time, label: time }))} value={meeting.endTime} onValueChange={(value) => updateMeeting(index, { endTime: value ?? "" })} disabled={!meeting.startTime}>
                        <SelectTrigger id={`response-end-${index}`}><SelectValue placeholder="Select end time" /></SelectTrigger>
                        <SelectContent>{TIME_OPTIONS.filter((time) => !meeting.startTime || timeToMinutes(time) > timeToMinutes(meeting.startTime)).map((time) => <SelectItem key={time} value={time}>{time}</SelectItem>)}</SelectContent>
                      </Select>
                    </FieldChrome>
                  </div>
                </div>
              ))}
              <Button type="button" variant="outline" block={false} onClick={() => setMeetings((current) => [...current, emptyMeeting()])}>Add Meeting</Button>
              <Textarea id="reason" name="reason" label="Reason for the proposed change" required />
            </div>
          )}
          <ModalActions><Button type="button" variant="outline" block={false} onClick={() => setResponseTarget(null)}>Cancel</Button><Button type="submit" block={false} isLoading={saving} loadingLabel="Submitting…" disabled={responseType === "suggest_change" && Boolean(roomsError)}>Submit Response</Button></ModalActions>
        </form>
      </Modal>

      <Modal open={decisionTarget !== null} onClose={() => setDecisionTarget(null)} title={`${decisionTarget?.approve ? "Approve" : "Reject"} Schedule Response`}>
        <form onSubmit={submitDecision} className="space-y-4"><FormError message={formError} /><Textarea id="note" name="note" label="Decision note" /><ModalActions><Button type="button" variant="outline" block={false} onClick={() => setDecisionTarget(null)}>Cancel</Button><Button type="submit" variant={decisionTarget?.approve ? "primary" : "danger"} block={false} isLoading={saving} loadingLabel="Saving…">Confirm</Button></ModalActions></form>
      </Modal>
    </div>
  );
}

export default function ScheduleResponsesRoute() {
  return <RoleGuard allow={["faculty", "dean", "registrar"]}><ScheduleResponsesPage /></RoleGuard>;
}
