import { useEffect, useMemo, useRef, useState, type PointerEvent as ReactPointerEvent } from "react";
import { toast } from "sonner";
import { FormError } from "~/components/forms/form-error";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { Card } from "~/components/ui/card";
import {
  AlertIcon,
  ArrowLeftIcon,
  EditIcon,
  HelpCircleIcon,
  LockIcon,
  TrashIcon,
} from "~/components/ui/icons";
import { FieldChrome } from "~/components/ui/input";
import { ConfirmDialog, Modal, ModalActions } from "~/components/ui/modal";
import { Popover } from "~/components/ui/popover";
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
import { MappingLegend } from "~/features/classroom-mapping/mapping-legend";
import {
  DAY_COL_W,
  DAY_STYLES,
  SLOT_COL_W,
  SUBJECT_TYPES,
  TYPE_STYLES,
  buildTimeSlots,
  type DayOfWeek,
  type SubjectType,
} from "~/features/classroom-mapping/mapping-model";
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
import { formatTime12h, timeToMinutes } from "~/lib/time";
import { instructorReviewService } from "~/services/instructor-review.service";
import type { InstructorReviewDetail } from "~/types/instructor-review";
import type { Room } from "~/types/room";
import { DAYS, DAY_LABELS, type ClassMode, type Day } from "~/types/schedule";
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

export type Selection = {
  day: string;
  start: number; // minutes from midnight
  end: number;   // minutes from midnight
};

function slotsFrom(minutes: number) {
  const hh = String(Math.floor(minutes / 60)).padStart(2, "0");
  const mm = String(minutes % 60).padStart(2, "0");
  return `${hh}:${mm}`;
}

function rangeText(selection: Selection) {
  return `${formatTime12h(slotsFrom(selection.start))} – ${formatTime12h(slotsFrom(selection.end))}`;
}

function duration(start: number, end: number) {
  const value = Math.max(0, end - start);
  const hours = Math.floor(value / 60);
  const mins = value % 60;
  return `${hours}h${mins ? ` ${mins}m` : ""}`;
}

const UNRESOLVED_TYPE_STYLE = {
  card: "bg-slate-100 dark:bg-white/[0.06]",
  border: "border-l-slate-400 dark:border-l-white/20",
  code: "text-slate-700 dark:text-slate-300",
};

function subjectTypeStyle(entry: { subjectType: string | null; sessionMode: "LEC" | "LAB" | null }) {
  const isKnownType = (SUBJECT_TYPES as readonly string[]).includes(entry.subjectType ?? "");
  if (!isKnownType) return UNRESOLVED_TYPE_STYLE;
  const type = entry.subjectType as SubjectType;
  return TYPE_STYLES[type] ?? UNRESOLVED_TYPE_STYLE;
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
  const { days: backendDays } = useDays();

  const [step, setStep] = useState<EditorStep>("edit");
  const [reason, setReason] = useState(detail.reason ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [discardOpen, setDiscardOpen] = useState(false);

  // Timetable Drag & Pan state
  const scrollRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<Selection | null>(null);
  const autoScrollFrameRef = useRef<number | null>(null);
  const pointerRef = useRef({ x: 0, y: 0 });
  const [selection, setSelection] = useState<Selection | null>(null);
  const [dragging, setDragging] = useState<Selection | null>(null);
  const [panning, setPanning] = useState<{ x: number; y: number; left: number; top: number } | null>(null);
  const [pointerPosition, setPointerPosition] = useState({ x: 0, y: 0 });

  // Modal State for Placing / Editing
  const [placementModalOpen, setPlacementModalOpen] = useState(false);
  const [selectedMeetingId, setSelectedMeetingId] = useState<number | null>(null);
  const [editingMeeting, setEditingMeeting] = useState<ProposalMeeting | null>(null);
  const [slotDay, setSlotDay] = useState<string>("Monday");
  const [slotStartTime, setSlotStartTime] = useState<string>("08:00");
  const [slotEndTime, setSlotEndTime] = useState<string>("09:30");
  const [slotClassMode, setSlotClassMode] = useState<ClassMode>("F2F");
  const [slotRoomId, setSlotRoomId] = useState<number | null>(null);
  const [modalError, setModalError] = useState<string | null>(null);

  const initialMeetings = useMemo(
    () => distributedProposal(detail, rooms, setLabel),
    [detail, rooms, setLabel],
  );

  const [meetings, setMeetings] = useState<ProposalMeeting[]>(initialMeetings);

  const originalMeetings = useMemo(
    () => distributedProposal(detail, rooms, setLabel),
    [detail, rooms, setLabel],
  );

  const originalByScheduleId = useMemo(
    () => new Map(originalMeetings.map((m) => [m.scheduleId, m])),
    [originalMeetings],
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

  const allPlacedMeetings = useMemo(
    () => [...meetings, ...otherMeetings].filter((m) => m.placed),
    [meetings, otherMeetings],
  );

  // Build continuous time slots matching baseline grid and active classes
  const slots = useMemo(() => {
    const dummyClassroom = {
      id: "all",
      name: "All",
      entries: allPlacedMeetings.map((m) => ({
        day: m.dayOfWeek as DayOfWeek,
        startTime: m.startTime,
        endTime: m.endTime,
        subjectCode: m.subjectCode,
        descriptiveTitle: m.subjectTitle,
        instructor: "",
        section: m.setLabel,
        type: (m.subjectType as SubjectType) || "Major without Lab",
      })),
    };
    return buildTimeSlots([dummyClassroom]);
  }, [allPlacedMeetings]);

  const dayRows = useMemo(() => {
    if (backendDays && backendDays.length > 0) {
      return backendDays.map((d) => ({
        day: (DAYS[d.id] ?? "M") as Day,
        label: d.name,
      }));
    }
    return DAYS.map((d) => ({
      day: d as Day,
      label: DAY_LABELS[d as Day] ?? d,
    }));
  }, [backendDays]);

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
    return rooms.filter((r) => r.status !== "Archived" && r.status !== "Non-Schedulable");
  }, [rooms]);

  // Global escape key to cancel dragging
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        dragRef.current = null;
        setDragging(null);
        setSelection(null);
        setPanning(null);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  function occupied(day: string, minute: number) {
    return allPlacedMeetings.some(
      (entry) =>
        entry.dayOfWeek.trim().toLowerCase() === day.trim().toLowerCase() &&
        timeToMinutes(entry.startTime) < minute + 30 &&
        timeToMinutes(entry.endTime) > minute,
    );
  }

  function start(
    event: ReactPointerEvent<HTMLDivElement>,
    day: string,
    minute: number,
  ) {
    if (event.button !== 0 || occupied(day, minute)) return;
    event.currentTarget.setPointerCapture(event.pointerId);
    const next = { day, start: minute, end: minute + 30 };
    dragRef.current = next;
    pointerRef.current = { x: event.clientX, y: event.clientY };
    setPointerPosition(pointerRef.current);
    setDragging(next);
    setSelection(next);
  }

  function move(event: ReactPointerEvent<HTMLElement>) {
    const activeDrag = dragRef.current;
    if (!activeDrag) return;
    pointerRef.current = { x: event.clientX, y: event.clientY };
    setPointerPosition(pointerRef.current);
    const target = document
      .elementFromPoint(event.clientX, event.clientY)
      ?.closest<HTMLElement>("[data-day][data-minute]");
    if (!target) return;
    const day = target.dataset.day;
    const minute = Number(target.dataset.minute);
    if (!day || day !== activeDrag.day || !Number.isFinite(minute))
      return;

    const selectingLeft = minute < activeDrag.start;
    let startMinute = Math.min(activeDrag.start, minute);
    let endMinute = Math.max(activeDrag.start, minute) + 30;
    if (selectingLeft) {
      for (let probe = activeDrag.start - 30; probe >= minute; probe -= 30) {
        if (occupied(day, probe)) {
          startMinute = probe + 30;
          break;
        }
      }
    } else {
      for (let probe = activeDrag.start + 30; probe <= minute; probe += 30) {
        if (occupied(day, probe)) {
          endMinute = probe;
          break;
        }
      }
    }
    setSelection({ ...activeDrag, start: startMinute, end: endMinute });
  }

  function finish() {
    if (!dragRef.current) return;
    const finalSel = selection || dragRef.current;
    dragRef.current = null;
    if (autoScrollFrameRef.current) cancelAnimationFrame(autoScrollFrameRef.current);
    autoScrollFrameRef.current = null;
    setDragging(null);

    if (finalSel) {
      const sTime = slotsFrom(finalSel.start);
      const eTime = slotsFrom(finalSel.end);
      setSlotDay(finalSel.day);
      setSlotStartTime(sTime);
      setSlotEndTime(eTime);
      setEditingMeeting(null);

      const unplacedChoices = meetings.filter((m) => !m.placed && m.movable);
      if (unplacedChoices.length > 0) {
        setSelectedMeetingId(unplacedChoices[0].scheduleId);
        setSlotClassMode((unplacedChoices[0].classMode as ClassMode) || "F2F");
        setSlotRoomId(unplacedChoices[0].roomId);
      } else {
        const movableList = meetings.filter((m) => m.movable);
        if (movableList.length > 0) {
          setSelectedMeetingId(movableList[0].scheduleId);
          setSlotClassMode((movableList[0].classMode as ClassMode) || "F2F");
          setSlotRoomId(movableList[0].roomId);
        }
      }

      setModalError(null);
      setPlacementModalOpen(true);
    }
  }

  function cancelDrag() {
    dragRef.current = null;
    if (autoScrollFrameRef.current) cancelAnimationFrame(autoScrollFrameRef.current);
    autoScrollFrameRef.current = null;
    setDragging(null);
    setSelection(null);
  }

  function runAutoScroll() {
    const container = scrollRef.current;
    const activeDrag = dragRef.current;
    if (!container || !activeDrag) {
      autoScrollFrameRef.current = null;
      return;
    }
    const bounds = container.getBoundingClientRect();
    const edge = 64;
    const { x, y } = pointerRef.current;
    if (x > bounds.right - edge) container.scrollLeft += 14;
    else if (x < bounds.left + edge) container.scrollLeft -= 14;
    if (y > bounds.bottom - edge) container.scrollTop += 10;
    else if (y < bounds.top + edge) container.scrollTop -= 10;
    const target = document
      .elementFromPoint(x, y)
      ?.closest<HTMLElement>("[data-day][data-minute]");
    if (target) {
      const day = target.dataset.day;
      const minute = Number(target.dataset.minute);
      if (day && day === activeDrag.day && Number.isFinite(minute)) {
        const selectingLeft = minute < activeDrag.start;
        let startMinute = Math.min(activeDrag.start, minute);
        let endMinute = Math.max(activeDrag.start, minute) + 30;
        if (selectingLeft) {
          for (let probe = activeDrag.start - 30; probe >= minute; probe -= 30) {
            if (occupied(day, probe)) {
              startMinute = probe + 30;
              break;
            }
          }
        } else {
          for (let probe = activeDrag.start + 30; probe <= minute; probe += 30) {
            if (occupied(day, probe)) {
              endMinute = probe;
              break;
            }
          }
        }
        setSelection({ ...activeDrag, start: startMinute, end: endMinute });
      }
    }
    autoScrollFrameRef.current = requestAnimationFrame(runAutoScroll);
  }

  function isSelected(day: string, minute: number) {
    return (
      selection?.day === day &&
      minute >= selection.start &&
      minute < selection.end
    );
  }

  function handleOpenEdit(meeting: ProposalMeeting) {
    setEditingMeeting(meeting);
    setSelectedMeetingId(meeting.scheduleId);
    setSlotDay(meeting.dayOfWeek === "None" || !meeting.dayOfWeek ? "Monday" : meeting.dayOfWeek);
    setSlotStartTime(meeting.startTime === "—" || !meeting.startTime ? "08:00" : meeting.startTime);
    setSlotEndTime(meeting.endTime === "—" || !meeting.endTime ? "09:30" : meeting.endTime);
    setSlotClassMode((meeting.classMode as ClassMode) || "F2F");
    setSlotRoomId(meeting.roomId);
    setModalError(null);
    setPlacementModalOpen(true);
  }

  function handleRemoveMeeting(meeting: ProposalMeeting) {
    setMeetings((prev) => unplaceMeeting(prev, meeting.scheduleId));
    toast.success(`${meeting.subjectCode} session moved to unplaced pool.`);
  }

  function handleSavePlacement() {
    if (selectedMeetingId == null) return;
    const target = meetings.find((m) => m.scheduleId === selectedMeetingId);
    if (!target) return;

    if (timeToMinutes(slotEndTime) <= timeToMinutes(slotStartTime)) {
      setModalError("End time must be later than start time.");
      return;
    }

    const validation = validatePlacement(
      [...meetings, ...otherMeetings],
      target,
      {
        dayOfWeek: slotDay,
        startTime: slotStartTime,
        endTime: slotEndTime,
      },
    );

    if (!validation.valid) {
      setModalError(validation.reason || "Invalid schedule slot placement.");
      return;
    }

    const isF2F = slotClassMode === "F2F";
    const isOnline = slotClassMode === "Synchronous" || slotClassMode === "Asynchronous" || slotClassMode === "Online";

    if (isF2F && slotRoomId == null) {
      setModalError("Classroom selection is required for Face-to-Face classes.");
      return;
    }

    const room = slotRoomId != null ? rooms.find((r) => r.id === slotRoomId) ?? null : null;

    setMeetings((prev) =>
      prev.map((m) =>
        m.scheduleId === selectedMeetingId
          ? {
              ...m,
              dayOfWeek: slotDay,
              startTime: slotStartTime,
              endTime: slotEndTime,
              classMode: slotClassMode,
              roomId: isOnline ? null : slotRoomId,
              roomName: isOnline ? "No room (online)" : room?.name ?? null,
              placed: true,
            }
          : m,
      ),
    );

    setPlacementModalOpen(false);
    setEditingMeeting(null);
    setSelectedMeetingId(null);
    setModalError(null);
    toast.success(`Assigned slot for ${target.subjectCode}.`);
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

  const selectedTargetMeeting = meetings.find((m) => m.scheduleId === selectedMeetingId);
  const movableChoices = meetings.filter((m) => m.movable);
  const forbidsRoom = slotClassMode === "Synchronous" || slotClassMode === "Asynchronous" || slotClassMode === "Online";
  const needsRoom = slotClassMode === "F2F";

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
            loadingLabel="Submitting…"
            onClick={() => void submit()}
          >
            Submit Shift Request
          </Button>
        </div>

        <Card className="p-6">
          <div className="border-b border-slate-200 pb-4 dark:border-white/10">
            <h2 className="font-display text-lg tracking-wide text-navy-800 dark:text-mist-100">
              Review Proposed Changes
            </h2>
            <p className="mt-0.5 font-body text-xs text-slate-500 dark:text-slate-400">
              A.Y. {detail.schoolYear ?? detail.syId} · Semester {detail.semesterNumber} · {setLabel}
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
                      <span className="text-slate-500 line-through">
                        {orig.dayOfWeek !== "None" ? `${orig.dayOfWeek} · ${formatTime12h(orig.startTime)}–${formatTime12h(orig.endTime)}` : "Unplaced"}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className="font-semibold text-sky-700 dark:text-sky-300">
                        {prop.dayOfWeek} · {formatTime12h(prop.startTime)}–${formatTime12h(prop.endTime)}
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

      {/* Subject Type Mapping Legend (matches classroom-mapping and major-schedules) */}
      <MappingLegend />

      {roomsError && (
        <FormError message={roomsError} />
      )}

      {unplacedMeetings.length > 0 && (
        <div className="rounded-xl border border-amber-200 bg-amber-50/70 p-4 dark:border-gold-400/25 dark:bg-gold-400/8">
          <p className="font-semibold text-navy-800 dark:text-mist-100">
            Unplaced Class Sessions ({unplacedMeetings.length})
          </p>
          <p className="mt-0.5 font-body text-xs text-slate-600 dark:text-slate-300">
            Left-drag across any open area on the timetable below to place a session.
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            {unplacedMeetings.map((m) => (
              <span
                key={m.scheduleId}
                className="inline-flex items-center gap-1.5 rounded-md border border-amber-300 bg-white px-2.5 py-1 font-body text-xs font-medium text-navy-800 dark:border-gold-400/30 dark:bg-navy-900 dark:text-mist-100"
              >
                <span>{m.subjectCode}</span>
                <span className="text-slate-400">·</span>
                <span className="text-slate-500 dark:text-slate-400">{m.sessionMode ?? "Class"}</span>
              </span>
            ))}
          </div>
        </div>
      )}

      <div className="space-y-3">
        {/* Timetable Controls Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="font-body text-xs text-slate-500 dark:text-slate-400">
            <span className="font-semibold text-navy-700 dark:text-mist-100">Interactive Shift Timetable:</span>{" "}
            Left-drag on any free slot to select a time range for assignment. Right-drag to pan. Click placed sessions to edit.
          </p>

          <Popover
            label="Controls Guide"
            trigger={
              <>
                <span className="inline-flex size-4 items-center justify-center">
                  <HelpCircleIcon />
                </span>
                <span>Controls Guide</span>
              </>
            }
            triggerClassName="flex h-8 shrink-0 items-center gap-1.5 whitespace-nowrap rounded-lg border border-slate-200 bg-white px-2.5 font-body text-xs font-semibold text-slate-600 hover:bg-slate-50 dark:border-white/10 dark:bg-surface-raised dark:text-slate-300"
            className="w-72 p-3"
          >
            {() => (
              <div>
                <strong className="block font-body text-xs text-slate-800 dark:text-mist-100">
                  Timetable Controls
                </strong>
                <div className="mt-2 space-y-2 font-body text-xs text-slate-500 dark:text-slate-400">
                  <p className="flex justify-between gap-3">
                    <span>Select schedule range</span>
                    <kbd className="rounded border border-slate-200 bg-slate-50 px-1.5 py-0.5 text-slate-600 dark:border-white/10 dark:bg-white/5 dark:text-slate-300">
                      Left drag
                    </kbd>
                  </p>
                  <p className="flex justify-between gap-3">
                    <span>Pan timetable</span>
                    <kbd className="rounded border border-slate-200 bg-slate-50 px-1.5 py-0.5 text-slate-600 dark:border-white/10 dark:bg-white/5 dark:text-slate-300">
                      Right drag
                    </kbd>
                  </p>
                  <p className="flex justify-between gap-3">
                    <span>View / Edit existing slot</span>
                    <kbd className="rounded border border-slate-200 bg-slate-50 px-1.5 py-0.5 text-slate-600 dark:border-white/10 dark:bg-white/5 dark:text-slate-300">
                      Left click
                    </kbd>
                  </p>
                  <p className="flex justify-between gap-3">
                    <span>Cancel selection</span>
                    <kbd className="rounded border border-slate-200 bg-slate-50 px-1.5 py-0.5 text-slate-600 dark:border-white/10 dark:bg-white/5 dark:text-slate-300">
                      Esc
                    </kbd>
                  </p>
                </div>
              </div>
            )}
          </Popover>
        </div>

        {/* Interactive Timetable Drag & Pan Surface */}
        <div
          ref={scrollRef}
          onContextMenu={(event) => event.preventDefault()}
          onPointerDown={(event) => {
            if (event.button === 2 && scrollRef.current) {
              event.preventDefault();
              event.currentTarget.setPointerCapture(event.pointerId);
              setPanning({
                x: event.clientX,
                y: event.clientY,
                left: scrollRef.current.scrollLeft,
                top: scrollRef.current.scrollTop,
              });
              return;
            }
            if (event.button !== 0) return;
            const target = (event.target as HTMLElement).closest<HTMLElement>(
              "[data-day][data-minute]",
            );
            const day = target?.dataset.day;
            const minute = Number(target?.dataset.minute);
            if (target && day && Number.isFinite(minute)) {
              event.preventDefault();
              start(event, day, minute);
              if (!autoScrollFrameRef.current)
                autoScrollFrameRef.current = requestAnimationFrame(runAutoScroll);
            }
          }}
          onPointerMove={(event) => {
            if (panning && scrollRef.current) {
              scrollRef.current.scrollLeft = panning.left - (event.clientX - panning.x);
              scrollRef.current.scrollTop = panning.top - (event.clientY - panning.y);
              return;
            }
            move(event);
          }}
          onPointerUp={(event) => {
            if (panning) {
              setPanning(null);
              try {
                event.currentTarget.releasePointerCapture(event.pointerId);
              } catch {}
              return;
            }
            finish();
            try {
              event.currentTarget.releasePointerCapture(event.pointerId);
            } catch {
              /* Pointer capture may already be released */
            }
          }}
          onPointerCancel={cancelDrag}
          className="relative min-h-0 overflow-auto rounded-xl border border-slate-300 bg-white [&::-webkit-scrollbar]:hidden dark:border-white/10 dark:bg-white/5"
          style={{
            cursor: panning ? "grabbing" : dragging ? "crosshair" : "grab",
            scrollbarWidth: "none",
          }}
        >
          <table
            className="text-sm"
            style={{
              borderSpacing: 0,
              borderCollapse: "separate",
              tableLayout: "fixed",
              width: DAY_COL_W + slots.length * SLOT_COL_W,
            }}
          >
            <colgroup>
              <col style={{ width: DAY_COL_W }} />
              {slots.map((_, index) => (
                <col key={index} style={{ width: SLOT_COL_W }} />
              ))}
            </colgroup>
            <thead>
              <tr>
                <th className="sticky left-0 top-0 z-30 border-r-2 border-b-2 border-slate-300 bg-slate-50 px-3 py-2 text-left font-body text-[0.65rem] font-bold uppercase tracking-wider text-slate-500 dark:border-white/10 dark:bg-surface-raised dark:text-slate-400">
                  Day
                </th>
                {slots.map((slot, index) => (
                  <th
                    key={index}
                    className="sticky top-0 z-20 border-r border-b-2 border-slate-300 bg-slate-50 px-3 py-2 text-left font-body text-[0.65rem] font-bold uppercase tracking-wider text-slate-500 dark:border-white/10 dark:bg-surface-raised dark:text-slate-400"
                  >
                    {slot.start} – {slot.end}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {dayRows.map(({ day, label }) => {
                const dayMeetings = allPlacedMeetings.filter(
                  (m) => m.dayOfWeek.trim().toLowerCase() === label.toLowerCase(),
                );
                const dayStyle = DAY_STYLES[day as DayOfWeek] ?? DAY_STYLES.Monday;

                return (
                  <tr key={day} className="h-20">
                    <td
                      className={`sticky left-0 z-10 border-r-2 border-b border-slate-200 bg-white px-3 py-2 align-middle font-body text-xs font-bold uppercase tracking-widest dark:border-white/10 dark:bg-slate-900 ${dayStyle.color}`}
                      style={{ width: DAY_COL_W }}
                    >
                      {label}
                    </td>

                    {slots.map((slot, index) => {
                      const minute = timeToMinutes(slot.start);
                      const event = dayMeetings.find(
                        (entry) => timeToMinutes(entry.startTime) === minute,
                      );
                      if (event) {
                        const span = Math.max(1, (timeToMinutes(event.endTime) - minute) / 30);
                        const style = subjectTypeStyle(event);
                        const isEditable = meetings.some((m) => m.scheduleId === event.scheduleId);
                        const orig = originalByScheduleId.get(event.scheduleId);
                        const changed = orig ? isMeetingChanged(orig, event) : false;

                        return (
                          <td
                            key={index}
                            colSpan={span}
                            onClick={() => {
                              if (isEditable) {
                                handleOpenEdit(event);
                              }
                            }}
                            className={`group cursor-pointer border-r border-b border-l-[3px] border-slate-200 p-2 align-top transition-shadow hover:shadow-md dark:border-white/10 ${style.card} ${style.border} ${
                              changed ? "ring-2 ring-blue-600 dark:ring-blue-400" : ""
                            }`}
                          >
                            <div className="flex items-start justify-between gap-1">
                              <span className={`block font-body text-xs font-bold leading-tight ${style.code}`}>
                                {event.subjectCode} · {event.setLabel}
                              </span>
                              <div className="flex items-center gap-1">
                                {event.isProtected && (
                                  <span className="text-slate-400" title="Protected schedule">
                                    <LockIcon size={12} />
                                  </span>
                                )}
                                {isEditable ? (
                                  <div className="flex items-center gap-0.5">
                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleOpenEdit(event);
                                      }}
                                      className="cursor-pointer rounded-sm p-0.5 text-slate-500 hover:bg-slate-200 hover:text-navy-900 dark:hover:bg-white/10 dark:hover:text-white"
                                      title="Edit slot"
                                    >
                                      <EditIcon size={12} />
                                    </button>
                                    {event.movable && (
                                      <button
                                        type="button"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleRemoveMeeting(event);
                                        }}
                                        className="cursor-pointer rounded-sm p-0.5 text-slate-500 hover:bg-red-100 hover:text-red-600 dark:hover:bg-red-400/10 dark:hover:text-red-400"
                                        title="Unplace slot"
                                      >
                                        <TrashIcon size={12} />
                                      </button>
                                    )}
                                  </div>
                                ) : (
                                  <span className="text-[10px] text-slate-400">Other Section</span>
                                )}
                              </div>
                            </div>

                            <span className="mt-0.5 block font-body text-[0.7rem] text-slate-500 dark:text-slate-400">
                              {event.subjectTitle}
                            </span>

                            <div className="mt-1 flex flex-wrap items-center gap-1 font-body text-[10px]">
                              <span className="font-semibold text-navy-700 dark:text-mist-100">
                                {formatTime12h(event.startTime)}–{formatTime12h(event.endTime)}
                              </span>
                              <span className="text-slate-500 dark:text-slate-400">
                                · {event.roomName ?? (event.classMode === "F2F" ? "Assigned Room" : "Online")}
                              </span>
                            </div>

                            <div className="mt-1 flex flex-wrap gap-1">
                              <Badge tone={event.classMode === "F2F" ? "emerald" : "sky"}>
                                {event.classMode}
                              </Badge>
                              {event.sessionMode && (
                                <Badge tone={event.sessionMode === "LAB" ? "navy" : "slate"}>
                                  {event.sessionMode}
                                </Badge>
                              )}
                            </div>
                          </td>
                        );
                      }

                      if (
                        dayMeetings.some(
                          (entry) =>
                            timeToMinutes(entry.startTime) < minute &&
                            timeToMinutes(entry.endTime) > minute,
                        )
                      ) {
                        return null;
                      }

                      const active = isSelected(label, minute);
                      return (
                        <td
                          key={index}
                          data-day={label}
                          data-minute={minute}
                          tabIndex={0}
                          className={`h-20 border-r border-b p-2 text-center font-body text-[0.72rem] italic outline-none focus-visible:ring-2 focus-visible:ring-gold-400 dark:border-white/10 ${
                            active
                              ? "bg-blue-100 ring-2 ring-inset ring-blue-600 dark:bg-blue-400/20"
                              : "cursor-crosshair text-slate-300 hover:bg-slate-50 dark:text-slate-600 dark:hover:bg-white/5"
                          }`}
                        >
                          {active ? null : "Free"}
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Floating Drag Indicator Pill (matches major-schedules styling) */}
      {selection && dragging && (
        <div
          className="pointer-events-none fixed z-40 rounded-lg bg-navy-800 px-3 py-2 text-white shadow-lg"
          style={{
            left: Math.min(pointerPosition.x + 14, window.innerWidth - 290),
            top: Math.min(pointerPosition.y + 14, window.innerHeight - 76),
          }}
        >
          <strong className="block font-body text-xs">
            {selection.day}
          </strong>
          <span className="font-body text-[0.7rem] text-blue-100">
            {rangeText(selection)} · {duration(selection.start, selection.end)}
          </span>
        </div>
      )}

      {/* Place / Edit Class Slot Modal */}
      <Modal
        open={placementModalOpen}
        onClose={() => {
          setPlacementModalOpen(false);
          setEditingMeeting(null);
          setModalError(null);
        }}
        title={editingMeeting ? `Edit Schedule — ${editingMeeting.subjectCode}` : "Place Class Slot"}
      >
        <div className="flex flex-col gap-4 font-body text-xs">
          {modalError && <FormError message={modalError} />}

          <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 dark:border-white/10 dark:bg-white/5">
            <span className="font-semibold text-navy-800 dark:text-mist-100">Selected Time: </span>
            <span className="text-slate-600 dark:text-slate-300">
              {slotDay} · {formatTime12h(slotStartTime)} – {formatTime12h(slotEndTime)} ({duration(timeToMinutes(slotStartTime), timeToMinutes(slotEndTime))})
            </span>
          </div>

          {!editingMeeting && movableChoices.length > 1 ? (
            <FieldChrome id="select-class-to-place" label="Select Class to Place" required>
              <Select
                value={selectedMeetingId ? String(selectedMeetingId) : ""}
                onValueChange={(val) => setSelectedMeetingId(Number(val))}
              >
                <SelectTrigger id="select-class-to-place">
                  <SelectValue placeholder="Choose a class..." />
                </SelectTrigger>
                <SelectContent>
                  {movableChoices.map((meeting) => (
                    <SelectItem key={meeting.scheduleId} value={String(meeting.scheduleId)}>
                      {meeting.subjectCode} — {meeting.subjectTitle} ({meeting.setLabel}
                      {meeting.sessionMode ? ` · ${meeting.sessionMode}` : ""})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FieldChrome>
          ) : selectedTargetMeeting ? (
            <div className="rounded-lg border border-slate-200 p-3 dark:border-white/10">
              <p className="font-semibold text-navy-800 dark:text-mist-100">
                {selectedTargetMeeting.subjectCode} — {selectedTargetMeeting.subjectTitle}
              </p>
              <p className="mt-0.5 text-slate-500">
                {selectedTargetMeeting.setLabel} · {selectedTargetMeeting.subjectType ?? "Subject"}
                {selectedTargetMeeting.sessionMode ? ` · ${selectedTargetMeeting.sessionMode}` : ""}
              </p>
            </div>
          ) : null}

          <FieldChrome id="delivery-mode-select" label="Delivery Mode" required>
            <Select
              value={slotClassMode}
              onValueChange={(val) => setSlotClassMode((val as ClassMode) ?? "F2F")}
            >
              <SelectTrigger id="delivery-mode-select">
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
          </FieldChrome>

          {!forbidsRoom && (
            <FieldChrome id="room-preference-select" label="Room Preference" required={needsRoom}>
              <Select
                value={slotRoomId ? String(slotRoomId) : ""}
                onValueChange={(val) => setSlotRoomId(val ? Number(val) : null)}
              >
                <SelectTrigger id="room-preference-select">
                  <SelectValue placeholder="Choose classroom..." />
                </SelectTrigger>
                <SelectContent>
                  {availableRooms.map((room) => {
                    const access = roomAccessLabel(room, selectedTargetMeeting?.programAbbrev ?? null);
                    return (
                      <SelectItem key={room.id} value={String(room.id)}>
                        {room.name} ({room.type}{access ? ` · ${access}` : ""})
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </FieldChrome>
          )}

          <ModalActions>
            <Button
              type="button"
              variant="outline"
              block={false}
              onClick={() => {
                setPlacementModalOpen(false);
                setEditingMeeting(null);
                setModalError(null);
              }}
            >
              Cancel
            </Button>
            <Button
              type="button"
              block={false}
              disabled={selectedMeetingId == null}
              onClick={handleSavePlacement}
            >
              Save Placement
            </Button>
          </ModalActions>
        </div>
      </Modal>

      {/* Discard Confirmation Dialog */}
      <ConfirmDialog
        open={discardOpen}
        onClose={() => setDiscardOpen(false)}
        title="Discard changes?"
        confirmLabel="Discard"
        loadingLabel="Discarding…"
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
