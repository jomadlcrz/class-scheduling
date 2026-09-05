import { useMemo, useState } from "react";
import { toast } from "sonner";
import { FormError } from "~/components/forms/form-error";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { Card } from "~/components/ui/card";
import {
  AlertIcon,
  ArrowLeftIcon,
  LockIcon,
} from "~/components/ui/icons";
import { FieldChrome } from "~/components/ui/input";
import { ConfirmDialog } from "~/components/ui/modal";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "~/components/ui/table";
import { Textarea } from "~/components/ui/textarea";
import { useClassModes } from "~/hooks/use-class-modes";
import { useDays } from "~/hooks/use-days";
import {
  distributedProposal,
  isMeetingChanged,
  roomAccessLabel,
  SLOT_STARTS,
  validatePlacement,
  type ProposalChange,
  type ProposalMeeting,
} from "~/features/schedules/instructor-proposal-model";
import { InstructorProposalRulesDrawer } from "~/features/schedules/instructor-proposal-rules-drawer";
import { ApiError } from "~/lib/api";
import { formatTime12h, timeToMinutes } from "~/lib/time";
import { instructorReviewService } from "~/services/instructor-review.service";
import type { InstructorReviewDetail } from "~/types/instructor-review";
import type { Room } from "~/types/room";
import { type ClassMode } from "~/types/schedule";
import type { WeeklyHourAllocation } from "~/types/weekly-hour-allocation";

type EditorStep = "edit" | "review";

export type InstructorProposalEditorProps = {
  detail: InstructorReviewDetail;
  setLabel: string;
  rooms: Room[];
  roomsError?: string | null;
  allocations: WeeklyHourAllocation[];
  distributed: InstructorReviewDetail[];
  onCancel: () => void;
  onSubmitted: () => void;
};

function endTimesAfter(start: string): string[] {
  const startMin = timeToMinutes(start);
  return SLOT_STARTS.filter((t) => timeToMinutes(t) > startMin);
}

export function InstructorProposalEditor({
  detail,
  setLabel,
  rooms,
  roomsError,
  allocations,
  distributed,
  onCancel,
  onSubmitted,
}: InstructorProposalEditorProps) {
  const { classModes } = useClassModes();
  const { dayLabels, days: backendDays } = useDays();

  const [step, setStep] = useState<EditorStep>("edit");
  const [reason, setReason] = useState(detail.reason ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [discardOpen, setDiscardOpen] = useState(false);

  const initialMeetings = useMemo(() => {
    const currentSection = distributedProposal(detail, rooms, setLabel);
    const allMeetings: ProposalMeeting[] = [...currentSection];
    for (const dist of distributed) {
      if (dist.releaseId === detail.releaseId) continue;
      const otherLabel =
        dist.programAbbrev && dist.yearLevel != null && dist.setCode
          ? `${dist.programAbbrev} ${dist.yearLevel} - ${dist.setCode}`
          : dist.setCode ?? `Set ${dist.setId}`;
      for (const m of dist.meetings) {
        allMeetings.push({
          scheduleId: m.scheduleId,
          setId: dist.setId,
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
          setLabel: otherLabel,
          programAbbrev: dist.programAbbrev ?? null,
          movable: !m.isProtected,
          placed: true,
        });
      }
    }
    return allMeetings;
  }, [detail, rooms, setLabel, distributed]);

  const originalMeetings = useMemo(
    () => [...initialMeetings],
    [initialMeetings],
  );

  const [meetings, setMeetings] = useState<ProposalMeeting[]>(initialMeetings);

  const originalByScheduleId = useMemo(
    () => new Map(originalMeetings.map((m) => [m.scheduleId, m])),
    [originalMeetings],
  );

  const changes: ProposalChange[] = useMemo(() => {
    const result: ProposalChange[] = [];
    for (const prop of meetings) {
      const orig = originalByScheduleId.get(prop.scheduleId);
      if (orig && isMeetingChanged(orig, prop)) {
        result.push({ original: orig, proposed: prop });
      }
    }
    return result;
  }, [meetings, originalByScheduleId]);

  const hasChanges = changes.length > 0;

  const unplacedMeetings = useMemo(() => meetings.filter((m) => !m.placed), [meetings]);

  const blockers = useMemo(() => {
    const list: string[] = [];
    if (unplacedMeetings.length > 0) {
      list.push(
        `${unplacedMeetings.length} class session${unplacedMeetings.length === 1 ? "" : "s"} ${
          unplacedMeetings.length === 1 ? "is" : "are"
        } not placed on the timetable.`,
      );
    }
    for (const m of meetings) {
      if (!m.placed) continue;
      const mode = m.classMode || "F2F";
      if (mode === "F2F" && m.roomId == null) {
        list.push(`${m.subjectCode} (${mode}) requires a classroom.`);
      }
    }
    return list;
  }, [meetings, unplacedMeetings]);

  const availableRooms = useMemo(() => {
    const filtered = rooms.filter((r) => r.status !== "Archived" && r.status !== "Non-Schedulable");
    // Ensure currently assigned rooms are always in the list (even if archived)
    for (const m of meetings) {
      if (m.roomId != null && !filtered.some((r) => r.id === m.roomId)) {
        const assigned = rooms.find((r) => r.id === m.roomId);
        if (assigned) filtered.push(assigned);
      }
    }
    return filtered;
  }, [rooms, meetings]);

  const dayOptions = useMemo(() => {
    if (backendDays && backendDays.length > 0) {
      return backendDays.map((d) => ({ code: d.name, label: d.name }));
    }
    return Object.entries(dayLabels).map(([code, label]) => ({ code, label }));
  }, [backendDays, dayLabels]);

  function updateMeeting(scheduleId: number, changes: Partial<ProposalMeeting>) {
    setMeetings((prev) =>
      prev.map((m) => (m.scheduleId === scheduleId ? { ...m, ...changes } : m)),
    );
  }

  function handleDayChange(scheduleId: number, newDay: string | null) {
    if (!newDay) return;
    const meeting = meetings.find((m) => m.scheduleId === scheduleId);
    if (!meeting) return;

    const validation = validatePlacement(meetings, meeting, {
      dayOfWeek: newDay,
      startTime: meeting.startTime,
      endTime: meeting.endTime,
    });

    if (!validation.valid) {
      toast.error(validation.reason || "Invalid placement.");
      return;
    }

    updateMeeting(scheduleId, { dayOfWeek: newDay });
  }

  function handleTimeChange(scheduleId: number, field: "startTime" | "endTime", value: string | null) {
    if (!value) return;
    const meeting = meetings.find((m) => m.scheduleId === scheduleId);
    if (!meeting) return;

    const startTime = field === "startTime" ? value : meeting.startTime;
    const endTime = field === "endTime" ? value : meeting.endTime;

    if (timeToMinutes(endTime) <= timeToMinutes(startTime)) {
      toast.error("End time must be after start time.");
      return;
    }

    const validation = validatePlacement(meetings, meeting, {
      dayOfWeek: meeting.dayOfWeek,
      startTime,
      endTime,
    });

    if (!validation.valid) {
      toast.error(validation.reason || "Invalid placement.");
      return;
    }

    updateMeeting(scheduleId, { [field]: value });
  }

  function handleRoomChange(scheduleId: number, roomIdStr: string | null) {
    const roomId = roomIdStr ? Number(roomIdStr) : null;
    const room = roomId != null ? availableRooms.find((r) => r.id === roomId) ?? null : null;
    updateMeeting(scheduleId, {
      roomId,
      roomName: room?.name ?? null,
    });
  }

  async function submit() {
    if (blockers.length > 0) {
      setError(blockers[0]);
      return;
    }
    if (!reason.trim()) {
      setError("Please provide a reason for the requested schedule shift.");
      return;
    }

    setSaving(true);
    setError(null);
    try {
      const payloadMeetings = meetings
        .filter((m) => {
          if (!m.placed) return false;
          const orig = originalByScheduleId.get(m.scheduleId);
          return orig ? isMeetingChanged(orig, m) : false;
        })
        .map((m) => ({
          scheduleId: m.scheduleId > 0 ? m.scheduleId : null,
          setId: m.setId,
          subjectId: m.subjectId,
          classMode: m.classMode,
          sessionMode: m.sessionMode,
          dayOfWeek: m.dayOfWeek,
          startTime: m.startTime,
          endTime: m.endTime,
          roomId: m.roomId,
        }));

      const res = await instructorReviewService.suggestInstructorChange(
        detail.releaseId,
        {
          reason: reason.trim(),
          meetings: payloadMeetings,
        },
      );
      toast.success(res.message || "Shift request submitted successfully.");
      onSubmitted();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to submit shift request.");
    } finally {
      setSaving(false);
    }
  }

  if (step === "review") {
    return (
      <div className="flex flex-col gap-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Button
            type="button"
            variant="outline"
            block={false}
            onClick={() => setStep("edit")}
          >
            <ArrowLeftIcon size={14} />
            Back to Editing
          </Button>
          <Button
            type="button"
            block={false}
            disabled={saving || blockers.length > 0 || !reason.trim()}
            isLoading={saving}
            loadingLabel="Submitting..."
            onClick={() => void submit()}
          >
            Submit shift request
          </Button>
        </div>

        <Card className="p-6">
          <div className="border-b border-slate-200 pb-4 dark:border-white/10">
            <h2 className="font-display text-lg tracking-wide text-navy-800 dark:text-mist-100">
              Review Proposed Changes
            </h2>
            <p className="mt-0.5 font-body text-xs text-slate-500 dark:text-slate-400">
              A.Y. {detail.schoolYear ?? detail.syId} - Semester {detail.semesterNumber} - {setLabel}
            </p>
          </div>

          {error && (
            <div className="mt-4">
              <FormError message={error} />
            </div>
          )}

          {blockers.length > 0 && (
            <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-4 dark:border-red-400/20 dark:bg-red-400/10">
              <div className="flex items-start gap-2.5">
                <span className="mt-0.5 text-red-600 dark:text-red-400">
                  <AlertIcon />
                </span>
                <div>
                  <h4 className="font-body text-sm font-semibold text-red-900 dark:text-red-200">
                    Resolve these issues before submitting
                  </h4>
                  <ul className="mt-1 list-disc space-y-1 pl-4 font-body text-xs text-red-800 dark:text-red-300">
                    {blockers.map((b, i) => (
                      <li key={i}>{b}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}

          <div className="mt-6 flex flex-col gap-3">
            <h3 className="font-display text-base tracking-wide text-navy-700 dark:text-mist-100">
              Proposed Changes ({changes.length})
            </h3>
            <Table>
              <TableHead>
                <TableHeader>Subject</TableHeader>
                <TableHeader>Section</TableHeader>
                <TableHeader>Original Schedule</TableHeader>
                <TableHeader>Proposed Schedule</TableHeader>
                <TableHeader>Classroom</TableHeader>
                <TableHeader>Delivery Mode</TableHeader>
              </TableHead>
              <TableBody>
                {changes.map(({ original: orig, proposed: prop }, index) => (
                  <TableRow key={index}>
                    <TableCell>
                      <span className="font-semibold text-navy-700 dark:text-mist-100">
                        {prop.subjectCode}
                      </span>
                      <span className="block text-xs text-slate-400">{prop.subjectTitle}</span>
                    </TableCell>
                    <TableCell>
                      <Badge tone="sky">{prop.setLabel}</Badge>
                    </TableCell>
                    <TableCell>
                      <span className="text-slate-500 line-through">
                        {orig.dayOfWeek} - {formatTime12h(orig.startTime)}-{formatTime12h(orig.endTime)}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className="font-semibold text-sky-700 dark:text-sky-300">
                        {prop.dayOfWeek} - {formatTime12h(prop.startTime)}-{formatTime12h(prop.endTime)}
                      </span>
                    </TableCell>
                    <TableCell>
                      {prop.roomName ?? "No room (online)"}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1.5">
                        <Badge tone={prop.classMode === "F2F" ? "emerald" : "sky"}>
                          {prop.classMode}
                        </Badge>
                        {prop.sessionMode && <Badge tone="navy">{prop.sessionMode}</Badge>}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          <div className="mt-6">
            <Textarea
              id="proposal-reason"
              label="Reason for Shift Request"
              required
              rows={3}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
            />
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Top Action Controls */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <InstructorProposalRulesDrawer allocations={allocations} />

        <Button
          type="button"
          block={false}
          disabled={!hasChanges || blockers.length > 0}
          onClick={() => setStep("review")}
        >
          Review &amp; Submit ({changes.length})
        </Button>
      </div>

      {roomsError && (
        <FormError message={roomsError} />
      )}

      {error && (
        <FormError message={error} />
      )}

      {/* Unplaced Sessions */}
      {unplacedMeetings.length > 0 && (
        <div className="rounded-xl border border-amber-200 bg-amber-50/70 p-4 dark:border-gold-400/25 dark:bg-gold-400/8">
          <p className="font-semibold text-navy-800 dark:text-mist-100">
            Unplaced Class Sessions ({unplacedMeetings.length})
          </p>
          <p className="mt-0.5 font-body text-xs text-slate-600 dark:text-slate-300">
            Use the dropdowns below to assign a day and time to each session.
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            {unplacedMeetings.map((m) => (
              <span
                key={m.scheduleId}
                className="inline-flex items-center gap-1.5 rounded-md border border-amber-300 bg-white px-2.5 py-1 font-body text-xs font-medium text-navy-800 dark:border-gold-400/30 dark:bg-navy-900 dark:text-mist-100"
              >
                <span>{m.subjectCode}</span>
                <span className="text-slate-400">-</span>
                <span className="text-slate-500 dark:text-slate-400">{m.sessionMode ?? "Class"}</span>
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Meeting Editor List */}
      <Card className="p-5">
        <div className="border-b border-slate-200 pb-4 dark:border-white/10">
          <h2 className="font-display text-lg tracking-wide text-navy-800 dark:text-mist-100">
            Class Sessions
          </h2>
          <p className="mt-0.5 font-body text-xs text-slate-500 dark:text-slate-400">
            Edit day, time, delivery mode, and room for any of your sessions across all sections. Protected sessions cannot be changed.
          </p>
        </div>

        <div className="mt-4 divide-y divide-slate-200 dark:divide-white/10">
          {meetings.map((meeting) => {
            const orig = originalByScheduleId.get(meeting.scheduleId);
            const changed = orig ? isMeetingChanged(orig, meeting) : false;
            const isProtected = meeting.isProtected;

            return (
              <div
                key={meeting.scheduleId}
                className={`py-4 first:pt-0 last:pb-0 ${
                  changed ? "rounded-lg bg-amber-50/50 px-3 -mx-3 dark:bg-amber-400/5" : ""
                }`}
              >
                {/* Session Header */}
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-body text-sm font-semibold text-navy-800 dark:text-mist-100">
                    {meeting.subjectCode}
                  </span>
                  {meeting.sessionMode && (
                    <Badge tone={meeting.sessionMode === "LAB" ? "navy" : "slate"}>
                      {meeting.sessionMode}
                    </Badge>
                  )}
                  <Badge tone={meeting.classMode === "F2F" ? "emerald" : "sky"}>
                    {meeting.classMode}
                  </Badge>
                  {isProtected && (
                    <span className="inline-flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400">
                      <LockIcon size={12} />
                      Protected
                    </span>
                  )}
                  {changed && (
                    <Badge tone="gold">Modified</Badge>
                  )}
                  <span className="text-xs text-slate-500 dark:text-slate-400">
                    {meeting.setLabel}
                  </span>
                </div>

                <p className="mt-0.5 font-body text-xs text-slate-500 dark:text-slate-400">
                  {meeting.subjectTitle}
                </p>

                {/* Form Fields */}
                {isProtected ? (
                  <div className="mt-2 flex flex-wrap items-center gap-3 font-body text-xs text-slate-600 dark:text-slate-300">
                    <span>{meeting.dayOfWeek}</span>
                    <span>-</span>
                    <span>{formatTime12h(meeting.startTime)} - {formatTime12h(meeting.endTime)}</span>
                    <span>-</span>
                    <span>{meeting.roomName ?? "No room"}</span>
                  </div>
                ) : (
                  <div className="mt-2 grid gap-2 sm:grid-cols-2 lg:grid-cols-5">
                    {/* Day */}
                    <FieldChrome id={`day-${meeting.scheduleId}`} label="Day">
                      <Select
                        value={meeting.dayOfWeek}
                        onValueChange={(val) => handleDayChange(meeting.scheduleId, val)}
                      >
                        <SelectTrigger id={`day-${meeting.scheduleId}`}>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {dayOptions.map((opt) => (
                            <SelectItem key={opt.code} value={opt.label}>
                              {opt.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </FieldChrome>

                    {/* Start Time */}
                    <FieldChrome id={`start-${meeting.scheduleId}`} label="Start Time">
                      <Select
                        value={meeting.startTime}
                        onValueChange={(val) => handleTimeChange(meeting.scheduleId, "startTime", val)}
                      >
                        <SelectTrigger id={`start-${meeting.scheduleId}`}>
                          <SelectValue>{formatTime12h(meeting.startTime)}</SelectValue>
                        </SelectTrigger>
                        <SelectContent>
                          {(() => {
                            const slots = [...SLOT_STARTS];
                            if (meeting.startTime && !slots.includes(meeting.startTime)) {
                              slots.unshift(meeting.startTime);
                            }
                            return slots.map((t) => (
                              <SelectItem key={t} value={t}>
                                {formatTime12h(t)}
                              </SelectItem>
                            ));
                          })()}
                        </SelectContent>
                      </Select>
                    </FieldChrome>

                    {/* End Time */}
                    <FieldChrome id={`end-${meeting.scheduleId}`} label="End Time">
                      <Select
                        value={meeting.endTime}
                        onValueChange={(val) => handleTimeChange(meeting.scheduleId, "endTime", val)}
                      >
                        <SelectTrigger id={`end-${meeting.scheduleId}`}>
                          <SelectValue>{formatTime12h(meeting.endTime)}</SelectValue>
                        </SelectTrigger>
                        <SelectContent>
                          {(() => {
                            const slots = endTimesAfter(meeting.startTime);
                            if (meeting.endTime && !slots.includes(meeting.endTime)) {
                              slots.push(meeting.endTime);
                              slots.sort((a, b) => timeToMinutes(a) - timeToMinutes(b));
                            }
                            return slots.map((t) => (
                              <SelectItem key={t} value={t}>
                                {formatTime12h(t)}
                              </SelectItem>
                            ));
                          })()}
                        </SelectContent>
                      </Select>
                    </FieldChrome>

                    {/* Delivery Mode */}
                    <FieldChrome id={`mode-${meeting.scheduleId}`} label="Delivery Mode">
                      <Select
                        value={meeting.classMode}
                        onValueChange={(val) => updateMeeting(meeting.scheduleId, { classMode: val as ClassMode })}
                      >
                        <SelectTrigger id={`mode-${meeting.scheduleId}`}>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {classModes.map((mode) => (
                            <SelectItem key={mode} value={mode}>
                              {mode}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </FieldChrome>

                    {/* Room (only for F2F) */}
                    {(meeting.classMode === "F2F" || meeting.classMode === "Blended") ? (
                      <FieldChrome id={`room-${meeting.scheduleId}`} label="Room" required>
                        <Select
                          value={meeting.roomId ? String(meeting.roomId) : ""}
                          onValueChange={(val) => handleRoomChange(meeting.scheduleId, val)}
                        >
                          <SelectTrigger id={`room-${meeting.scheduleId}`}>
                            <SelectValue placeholder="Choose room...">
                              {meeting.roomId != null
                                ? availableRooms.find((r) => r.id === meeting.roomId)?.name ?? `Room #${meeting.roomId}`
                                : null}
                            </SelectValue>
                          </SelectTrigger>
                          <SelectContent>
                            {availableRooms.map((room) => {
                              const access = roomAccessLabel(room, meeting.programAbbrev);
                              return (
                                <SelectItem key={room.id} value={String(room.id)}>
                                  {room.name} ({room.type}{access ? ` - ${access}` : ""})
                                </SelectItem>
                              );
                            })}
                          </SelectContent>
                        </Select>
                      </FieldChrome>
                    ) : (
                      <div className="flex items-end pb-2.5 font-body text-xs text-slate-500 dark:text-slate-400">
                        No room needed for {meeting.classMode}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </Card>

      {/* Reason */}
      <Card className="p-5">
        <Textarea
          id="proposal-reason"
          label="Reason for Shift Request"
          required
          rows={3}
          value={reason}
          onChange={(e) => setReason(e.target.value)}
        />
      </Card>

      {/* Discard Confirmation Dialog */}
      <ConfirmDialog
        open={discardOpen}
        onClose={() => setDiscardOpen(false)}
        title="Discard changes?"
        confirmLabel="Discard"
        loadingLabel="Discarding..."
        confirmVariant="danger"
        onConfirm={async () => onCancel()}
      >
        <p className="font-body text-sm text-slate-600 dark:text-slate-300">
          You have unsaved changes to this schedule proposal. Discarding will lose all changes made in this session.
        </p>
      </ConfirmDialog>
    </div>
  );
}
