import { useMemo, useState } from "react";
import { toast } from "sonner";
import { FormError } from "~/components/forms/form-error";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { Card } from "~/components/ui/card";
import { AlertIcon, ArrowLeftIcon, RotateIcon } from "~/components/ui/icons";
import { inputClassName } from "~/components/ui/input";
import { ConfirmDialog, Modal, ModalActions } from "~/components/ui/modal";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import { useEnums } from "~/hooks/use-enums";
import { InstructorProposalGrid } from "~/features/schedules/instructor-proposal-grid";
import {
  distributedProposal,
  isMeetingChanged,
  roomAccessLabel,
  unplaceMeeting,
  validatePlacement,
  type ProposalChange,
  type ProposalMeeting,
} from "~/features/schedules/instructor-proposal-model";
import { InstructorProposalRulesDrawer } from "~/features/schedules/instructor-proposal-rules-drawer";
import { formatSectionSetName } from "~/features/schedules/scheduling-routes";
import { ApiError } from "~/lib/api";
import { formatTime12h } from "~/lib/time";
import { instructorReviewService } from "~/services/instructor-review.service";
import type { InstructorReviewDetail } from "~/types/instructor-review";
import type { Room } from "~/types/room";
import { useClassModes } from "~/hooks/use-class-modes";
import type { ClassMode } from "~/types/schedule";
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

  const [step, setStep] = useState<EditorStep>("edit");
  const [reason, setReason] = useState(detail.reason ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [discardOpen, setDiscardOpen] = useState(false);

  const [pendingSlot, setPendingSlot] = useState<{ dayOfWeek: string; startTime: string; endTime: string } | null>(null);
  const [selectedMeetingId, setSelectedMeetingId] = useState<number | null>(null);
  const [editingMeeting, setEditingMeeting] = useState<ProposalMeeting | null>(null);
  const [classMode, setClassMode] = useState<ClassMode>("F2F");
  const [roomId, setRoomId] = useState<number | null>(null);
  const [slotError, setSlotError] = useState<string | null>(null);

  const initialMeetings = useMemo(
    () => distributedProposal(detail, rooms, setLabel),
    [detail, rooms, setLabel],
  );

  const [meetings, setMeetings] = useState<ProposalMeeting[]>(initialMeetings);

  const originalMeetings = useMemo(
    () => distributedProposal(detail, rooms, setLabel),
    [detail, rooms, setLabel],
  );

  const otherMeetings = useMemo(() => {
    const list: ProposalMeeting[] = [];
    for (const dist of distributed) {
      if (dist.releaseId === detail.releaseId) continue;
      const otherLabel =
        dist.programAbbrev && dist.yearLevel != null && dist.setCode
          ? formatSectionSetName(dist.programAbbrev, dist.yearLevel, dist.setCode)
          : dist.setCode ?? `Set ${dist.setId}`;
      for (const m of dist.meetings) {
        list.push({
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
          movable: false,
          placed: true,
        });
      }
    }
    return list;
  }, [detail.releaseId, distributed]);

  const changes: ProposalChange[] = useMemo(() => {
    const origMap = new Map(originalMeetings.map((m) => [m.scheduleId, m]));
    const result: ProposalChange[] = [];
    for (const prop of meetings) {
      const orig = origMap.get(prop.scheduleId);
      if (orig && isMeetingChanged(orig, prop)) {
        result.push({ original: orig, proposed: prop });
      } else if (!orig && prop.placed) {
        result.push({
          original: {
            ...prop,
            dayOfWeek: "None",
            startTime: "—",
            endTime: "—",
            roomId: null,
            roomName: null,
          },
          proposed: prop,
        });
      }
    }
    return result;
  }, [meetings, originalMeetings]);

  const hasChanges = changes.length > 0;

  const blockers = useMemo(() => {
    const list: string[] = [];
    const unplaced = meetings.filter((m) => !m.placed);
    if (unplaced.length > 0) {
      list.push(
        `${unplaced.length} class session${unplaced.length === 1 ? "" : "s"} ${
          unplaced.length === 1 ? "is" : "are"
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
  }, [meetings]);

  const availableRooms = useMemo(() => {
    return rooms.filter((r) => r.status !== "Archived" && r.status !== "Non-Schedulable");
  }, [rooms]);

  function handleCommitSlot(slot: { dayOfWeek: string; startTime: string; endTime: string }) {
    setPendingSlot(slot);
    setSlotError(null);
    const unplacedList = meetings.filter((m) => !m.placed && m.movable);
    if (unplacedList.length > 0) {
      setSelectedMeetingId(unplacedList[0].scheduleId);
      setClassMode(unplacedList[0].classMode || "F2F");
      setRoomId(unplacedList[0].roomId);
    } else {
      const movableList = meetings.filter((m) => m.movable);
      if (movableList.length > 0) {
        setSelectedMeetingId(movableList[0].scheduleId);
        setClassMode(movableList[0].classMode || "F2F");
        setRoomId(movableList[0].roomId);
      }
    }
  }

  function handleEditMeeting(meeting: ProposalMeeting) {
    setEditingMeeting(meeting);
    setSelectedMeetingId(meeting.scheduleId);
    setPendingSlot({
      dayOfWeek: meeting.dayOfWeek,
      startTime: meeting.startTime,
      endTime: meeting.endTime,
    });
    setClassMode(meeting.classMode || "F2F");
    setRoomId(meeting.roomId);
    setSlotError(null);
  }

  function handleRemoveMeeting(meeting: ProposalMeeting) {
    setMeetings((prev) => unplaceMeeting(prev, meeting.scheduleId));
  }

  function saveSlotPlacement() {
    if (!pendingSlot || selectedMeetingId == null) return;
    const target = meetings.find((m) => m.scheduleId === selectedMeetingId);
    if (!target) return;

    const validation = validatePlacement(
      [...meetings, ...otherMeetings],
      target,
      pendingSlot,
    );
    if (!validation.valid) {
      setSlotError(validation.reason || "Invalid slot placement.");
      return;
    }

    const isF2F = classMode === "F2F";
    const isOnline = classMode === "Synchronous" || classMode === "Asynchronous" || classMode === "Online";

    if (isF2F && roomId == null) {
      setSlotError("Classroom selection is required for this delivery mode.");
      return;
    }

    const room = roomId != null ? rooms.find((r) => r.id === roomId) ?? null : null;

    setMeetings((prev) =>
      prev.map((m) =>
        m.scheduleId === selectedMeetingId
          ? {
              ...m,
              dayOfWeek: pendingSlot.dayOfWeek,
              startTime: pendingSlot.startTime,
              endTime: pendingSlot.endTime,
              classMode,
              roomId: isOnline ? null : roomId,
              roomName: isOnline
                ? "No room (online)"
                : room?.name ?? null,
              placed: true,
            }
          : m,
      ),
    );

    setPendingSlot(null);
    setEditingMeeting(null);
    setSelectedMeetingId(null);
    setSlotError(null);
  }

  function resetAll() {
    setMeetings(distributedProposal(detail, rooms, setLabel));
    setDiscardOpen(false);
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
        .filter((m) => m.placed)
        .map((m) => ({
          scheduleId: m.scheduleId > 0 ? m.scheduleId : null,
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

  const selectedMeeting = meetings.find((m) => m.scheduleId === selectedMeetingId);
  const choices = meetings.filter((m) => m.movable);
  const forbidsRoom = classMode === "Synchronous" || classMode === "Asynchronous" || classMode === "Online";
  const needsRoom = classMode === "F2F";

  if (step === "review") {
    return (
      <div className="space-y-6">
        <Card className="p-5">
          <div className="border-b border-slate-200 pb-4 dark:border-white/10">
            <h2 className="font-display text-lg tracking-wide text-navy-800 dark:text-mist-100">
              Review Your Shift Request
            </h2>
            <p className="mt-0.5 font-body text-xs text-slate-500 dark:text-slate-400">
              A.Y. {detail.schoolYear ?? detail.syId} · Semester {detail.semesterNumber} · {setLabel}
            </p>
          </div>

          {error && <div className="mt-4"><FormError message={error} /></div>}

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

          <div className="mt-5 space-y-3">
            <h3 className="font-display text-base tracking-wide text-navy-800 dark:text-mist-100">
              Proposed Changes ({changes.length})
            </h3>
            <div className="divide-y divide-slate-200 rounded-lg border border-slate-200 bg-slate-50/50 dark:divide-white/10 dark:border-white/10 dark:bg-white/2">
              {changes.map(({ original: orig, proposed: prop }, index) => (
                <div key={index} className="grid gap-3 p-3 sm:grid-cols-[1fr_auto_1fr] sm:items-center">
                  <div className="rounded-lg border border-slate-200 bg-white p-3 dark:border-white/10 dark:bg-white/5">
                    <p className="font-body text-[10px] font-bold uppercase tracking-wide text-slate-400">
                      Original
                    </p>
                    <p className="mt-0.5 font-body text-xs font-semibold text-navy-800 dark:text-mist-100">
                      {orig.subjectCode} — {orig.subjectTitle}
                    </p>
                    <p className="mt-1 font-body text-xs text-slate-600 dark:text-slate-300">
                      {orig.dayOfWeek} · {formatTime12h(orig.startTime)}–{formatTime12h(orig.endTime)}
                    </p>
                    <p className="font-body text-xs text-slate-500">{orig.roomName ?? "No room"}</p>
                    <div className="mt-2 flex gap-1">
                      <Badge tone="slate">{orig.classMode}</Badge>
                      {orig.sessionMode && <Badge tone="navy">{orig.sessionMode}</Badge>}
                    </div>
                  </div>

                  <span className="hidden text-center font-body text-lg text-slate-400 sm:block">→</span>

                  <div className="rounded-lg border border-sky-200 bg-sky-50/70 p-3 dark:border-sky-400/20 dark:bg-sky-400/5">
                    <p className="font-body text-[10px] font-bold uppercase tracking-wide text-sky-700 dark:text-sky-300">
                      Proposed
                    </p>
                    <p className="mt-0.5 font-body text-xs font-semibold text-navy-800 dark:text-mist-100">
                      {prop.subjectCode} — {prop.subjectTitle}
                    </p>
                    <p className="mt-1 font-body text-xs font-semibold text-sky-800 dark:text-sky-200">
                      {prop.dayOfWeek} · {formatTime12h(prop.startTime)}–{formatTime12h(prop.endTime)}
                    </p>
                    <p className="font-body text-xs text-slate-600 dark:text-slate-300">
                      {prop.roomName ?? "No room (online)"}
                    </p>
                    <div className="mt-2 flex gap-1">
                      <Badge tone="sky">{prop.classMode}</Badge>
                      {prop.sessionMode && <Badge tone="navy">{prop.sessionMode}</Badge>}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-5 space-y-2">
            <label htmlFor="proposal-reason" className="block font-body text-xs font-semibold text-slate-700 dark:text-slate-300">
              Reason for Shift Request <span className="text-red-500">*</span>
            </label>
            <textarea
              id="proposal-reason"
              rows={3}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Explain clearly why this schedule change is requested..."
              className={inputClassName}
            />
          </div>

          <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 pt-4 dark:border-white/10">
            <Button
              type="button"
              variant="outline"
              block={false}
              onClick={() => setStep("edit")}
            >
              Back to Editing
            </Button>
            <Button
              type="button"
              variant="primary"
              block={false}
              disabled={saving || blockers.length > 0 || !reason.trim()}
              onClick={() => void submit()}
            >
              {saving ? "Submitting..." : "Submit Shift Request"}
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card className="p-5">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 pb-4 dark:border-white/10">
          <div className="flex items-center gap-3">
            <Button
              type="button"
              variant="outline"
              block={false}
              onClick={() => {
                if (hasChanges) setDiscardOpen(true);
                else onCancel();
              }}
            >
              <ArrowLeftIcon size={14} />
              Back
            </Button>
            <div>
              <h2 className="font-display text-lg tracking-wide text-navy-800 dark:text-mist-100">
                Suggest Schedule Changes
              </h2>
              <p className="mt-0.5 font-body text-xs text-slate-500 dark:text-slate-400">
                Click and drag across open timetable cells to propose new slots for your classes.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <InstructorProposalRulesDrawer allocations={allocations} />
            <Button
              type="button"
              variant="outline"
              block={false}
              disabled={!hasChanges}
              onClick={resetAll}
            >
              <RotateIcon size={14} />
              Reset
            </Button>
            <Button
              type="button"
              variant="primary"
              block={false}
              disabled={!hasChanges || blockers.length > 0}
              onClick={() => setStep("review")}
            >
              Review & Submit ({changes.length})
            </Button>
          </div>
        </div>

        {roomsError && <div className="mt-4"><FormError message={roomsError} /></div>}

        <div className="mt-4">
          <InstructorProposalGrid
            meetings={meetings}
            originalMeetings={originalMeetings}
            otherMeetings={otherMeetings}
            onCommitSlot={handleCommitSlot}
            onEditMeeting={handleEditMeeting}
            onRemoveMeeting={handleRemoveMeeting}
          />
        </div>
      </Card>

      {/* Slot Placement Modal */}
      <Modal
        open={pendingSlot != null}
        onClose={() => {
          setPendingSlot(null);
          setEditingMeeting(null);
          setSlotError(null);
        }}
        title={editingMeeting ? "Edit Class Slot" : "Place Class Slot"}
      >
        <div className="space-y-4 font-body text-xs">
          {slotError && <FormError message={slotError} />}

          {pendingSlot && (
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 dark:border-white/10 dark:bg-white/5">
              <span className="font-semibold text-navy-800 dark:text-mist-100">Selected Slot: </span>
              <span className="text-slate-600 dark:text-slate-300">
                {pendingSlot.dayOfWeek}, {formatTime12h(pendingSlot.startTime)} – {formatTime12h(pendingSlot.endTime)}
              </span>
            </div>
          )}

          {!editingMeeting && choices.length > 1 ? (
            <div className="space-y-1.5">
              <label className="block font-semibold text-slate-700 dark:text-slate-300">
                Select Class to Place
              </label>
              <Select
                value={selectedMeetingId ? String(selectedMeetingId) : ""}
                onValueChange={(val) => setSelectedMeetingId(Number(val))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Choose a class..." />
                </SelectTrigger>
                <SelectContent>
                  {choices.map((meeting) => (
                    <SelectItem key={meeting.scheduleId} value={String(meeting.scheduleId)}>
                      {meeting.subjectCode} — {meeting.subjectTitle} ({meeting.setLabel}
                      {meeting.sessionMode ? ` · ${meeting.sessionMode}` : ""})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          ) : selectedMeeting ? (
            <div className="rounded-lg border border-slate-200 p-3 dark:border-white/10">
              <p className="font-semibold text-navy-800 dark:text-mist-100">
                {selectedMeeting.subjectCode} — {selectedMeeting.subjectTitle}
              </p>
              <p className="mt-0.5 text-slate-500">
                {selectedMeeting.setLabel} · {selectedMeeting.subjectType ?? "Subject"}
                {selectedMeeting.sessionMode ? ` · ${selectedMeeting.sessionMode}` : ""}
              </p>
            </div>
          ) : null}

          <div className="space-y-1.5">
            <label className="block font-semibold text-slate-700 dark:text-slate-300">
              Delivery Mode
            </label>
            <Select
              value={classMode}
              onValueChange={(val) => setClassMode((val as ClassMode) ?? "F2F")}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select delivery mode..." />
              </SelectTrigger>
              <SelectContent>
                {classModes.map((mode) => (
                  <SelectItem key={mode} value={mode}>
                    {mode}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {!forbidsRoom && (
            <div className="space-y-1.5">
              <label className="block font-semibold text-slate-700 dark:text-slate-300">
                Room Preference {needsRoom && <span className="text-red-500">*</span>}
              </label>
              <Select
                value={roomId ? String(roomId) : ""}
                onValueChange={(val) => setRoomId(Number(val))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Choose classroom..." />
                </SelectTrigger>
                <SelectContent>
                  {availableRooms.map((room) => {
                    const access = roomAccessLabel(room, selectedMeeting?.programAbbrev ?? null);
                    return (
                      <SelectItem key={room.id} value={String(room.id)}>
                        {room.name} ({room.type}{access ? ` · ${access}` : ""})
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>
          )}

          <ModalActions>
            <Button
              type="button"
              variant="outline"
              block={false}
              onClick={() => {
                setPendingSlot(null);
                setEditingMeeting(null);
                setSlotError(null);
              }}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="primary"
              block={false}
              disabled={selectedMeetingId == null}
              onClick={saveSlotPlacement}
            >
              Save Placement
            </Button>
          </ModalActions>
        </div>
      </Modal>

      <ConfirmDialog
        open={discardOpen}
        onClose={() => setDiscardOpen(false)}
        title="Discard changes?"
        confirmLabel="Discard"
        loadingLabel="Discarding..."
        confirmVariant="danger"
        onConfirm={async () => {
          onCancel();
        }}
      >
        <p className="font-body text-sm text-slate-600 dark:text-slate-300">
          You have unsaved changes to this schedule proposal. Discarding will lose all changes made in this session.
        </p>
      </ConfirmDialog>
    </div>
  );
}
