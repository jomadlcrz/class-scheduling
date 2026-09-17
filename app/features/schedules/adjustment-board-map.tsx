import { useMemo, type ReactNode } from "react";
import { Badge } from "~/components/ui/badge";
import { Card } from "~/components/ui/card";
import { MappingLegend } from "~/features/classroom-mapping/mapping-legend";
import {
  SUBJECT_TYPES,
  type Classroom,
  type SubjectType,
} from "~/features/classroom-mapping/mapping-model";
import { MappingTableView } from "~/features/classroom-mapping/mapping-table-view";
import type { MajorTimetableSlot } from "~/features/schedules/major-scheduling-timetable-selection";
import {
  MINIMUM_SELECTION_MINUTES,
  useTimetableSlotSelection,
  type TimetableAnchorRect,
} from "~/features/schedules/use-timetable-slot-selection";
import { normalizeTime, timeToMinutes } from "~/lib/time";
import {
  toSubjectType,
  type AdjustmentMeeting,
  type AdjustmentRoom,
} from "~/types/schedule-adjustment";

export const ROOMLESS_TRACK_IDS = {
  Blended: -1,
  Asynchronous: -2,
  Synchronous: -3,
} as const;

type RoomlessMode = keyof typeof ROOMLESS_TRACK_IDS;

const ROOMLESS_GROUPS: { mode: RoomlessMode; note: string }[] = [
  { mode: "Blended", note: "Online half — no room" },
  { mode: "Asynchronous", note: "No room, no fixed hour" },
  { mode: "Synchronous", note: "Held online — no room" },
];

type Props = {
  rooms: AdjustmentRoom[];
  meetings: AdjustmentMeeting[];
  labTimeSlots?: { startTime: string; endTime: string }[];
  selectedMeetingId?: number | null;
  onMeetingSelect?: (meeting: AdjustmentMeeting) => void;
  activeSlotSelection?: MajorTimetableSlot | null;
  onFreeSlotClick?: (slot: MajorTimetableSlot, anchor: TimetableAnchorRect) => void;
  onSelectionChange?: (slot: MajorTimetableSlot) => void;
  onSelectionClear?: () => void;
  onShiftSelectionComplete?: (slot: MajorTimetableSlot, anchor: TimetableAnchorRect) => void;
  conflictMeetingIds?: ReadonlySet<number>;
  editor?: ReactNode;
  headerControls?: ReactNode;
  legendControls?: ReactNode;
  helperText?: string;
};

export function AdjustmentBoardMap({
  rooms,
  meetings,
  labTimeSlots = [],
  selectedMeetingId,
  onMeetingSelect,
  activeSlotSelection,
  onFreeSlotClick,
  onSelectionChange,
  onSelectionClear,
  onShiftSelectionComplete,
  conflictMeetingIds,
  editor,
  headerControls,
  legendControls,
  helperText,
}: Props) {
  const meetingById = useMemo(
    () => new Map(meetings.map((meeting) => [meeting.id, meeting])),
    [meetings],
  );

  function toEntry(meeting: AdjustmentMeeting): Classroom["entries"][number] {
    return {
      day: meeting.dayOfWeek as Classroom["entries"][number]["day"],
      startTime: normalizeTime(meeting.startTime),
      endTime: normalizeTime(meeting.endTime),
      subjectCode: meeting.subjectCode ?? "",
      descriptiveTitle: meeting.subjectTitle ?? "",
      instructor: meeting.instructorName,
      section: `${meeting.programAbbrev ?? ""} · ${meeting.setName ?? ""}`,
      sessionMode: meeting.sessionMode,
      classMode: meeting.classMode,
      type: toSubjectType(meeting.subjectType),
      scheduleId: meeting.id,
      isEditable: meeting.editable,
      isConflict: conflictMeetingIds?.has(meeting.id) ?? false,
      department: meeting.departmentAbbrev ?? undefined,
    };
  }

  const roomlessGroups = useMemo<Classroom[]>(
    () =>
      ROOMLESS_GROUPS.map(({ mode, note }) => ({
        id: String(ROOMLESS_TRACK_IDS[mode]),
        name: mode,
        note,
        entries: meetings
          .filter((meeting) => meeting.roomId == null && meeting.classMode === mode)
          .map(toEntry),
      })),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [meetings, conflictMeetingIds],
  );

  const roomGroups = useMemo<Classroom[]>(
    () =>
      rooms.map((room) => ({
        id: String(room.id),
        name: room.name,
        roomType: room.type ?? undefined,
        entries: meetings.filter((meeting) => meeting.roomId === room.id).map(toEntry),
      })),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [rooms, meetings, conflictMeetingIds],
  );

  const classrooms = useMemo<Classroom[]>(
    () => [...roomlessGroups, ...roomGroups],
    [roomlessGroups, roomGroups],
  );

  const legendTypes = useMemo<SubjectType[]>(() => {
    const present = new Set(meetings.map((meeting) => meeting.subjectType));
    const found = SUBJECT_TYPES.filter((type) => present.has(type));
    return found.length > 0 ? found : [...SUBJECT_TYPES];
  }, [meetings]);

  const {
    visibleSelection,
    highlightedScheduleId,
    chooseSlot,
    selectLabSlot,
    startShiftDrag,
    continueShiftDrag,
    clearSelection,
    resetShiftRange,
  } = useTimetableSlotSelection({
    activeSlotSelection,
    meetings: useMemo(
      () =>
        meetings
          .map((meeting) => {
            const roomId =
              meeting.roomId ??
              ROOMLESS_TRACK_IDS[meeting.classMode as RoomlessMode] ??
              null;
            if (roomId == null || !meeting.dayOfWeek) return null;
            return {
              id: meeting.id,
              roomId,
              dayOfWeek: meeting.dayOfWeek,
              startTime: normalizeTime(meeting.startTime),
              endTime: normalizeTime(meeting.endTime),
            };
          })
          .filter((meeting): meeting is NonNullable<typeof meeting> => meeting != null),
      [meetings],
    ),
    isLaboratoryRoom: (roomId) =>
      rooms.find((room) => room.id === roomId)?.type === "Laboratory",
    labTimeSlots,
    onFreeSlotClick,
    onSelectionChange,
    onSelectionClear,
    onShiftSelectionComplete,
  });

  const selectionUnderMinimum = Boolean(
    visibleSelection &&
      timeToMinutes(visibleSelection.endTime) - timeToMinutes(visibleSelection.startTime) <
        MINIMUM_SELECTION_MINUTES,
  );

  return (
    <Card className="overflow-hidden">
        <div className="border-b border-slate-200 bg-white px-3 py-3 dark:border-white/10 dark:bg-surface-raised sm:px-4">
          <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_minmax(25rem,auto)] lg:items-center">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="font-display text-lg tracking-wide text-navy-800 dark:text-white sm:text-xl">
                  Room scheduling map
                </h2>
                <Badge tone="sky">7:00 AM–6:00 PM</Badge>
              </div>
              {selectionUnderMinimum ? (
                <p className="mt-1 text-xs font-semibold leading-relaxed text-amber-700 dark:text-amber-300">
                  Classes require a minimum duration of 1 hour (60 mins). Please select a time block that meets the 1-hour minimum.
                </p>
              ) : (
                <p className="mt-1 text-xs leading-relaxed text-slate-500">
                  {helperText ??
                    "Select an available time block on the map to schedule. Click an existing class to move it."}
                </p>
              )}
            </div>
            {headerControls ? <div className="w-full lg:min-w-100">{headerControls}</div> : null}
          </div>
        </div>
        {editor ? (
          <div className="border-b border-slate-200 bg-white p-4 shadow-md dark:border-white/10 dark:bg-surface-raised">
            {editor}
          </div>
        ) : null}
        <div className="flex flex-col gap-2 border-b border-slate-200 p-2 dark:border-white/10 sm:flex-row sm:items-center sm:justify-between sm:px-3 sm:py-2">
          <div className="min-w-0 flex-1">
            <MappingLegend types={legendTypes} splitMajorWithLab compact />
          </div>
          {legendControls ? <div className="w-full shrink-0 sm:w-auto">{legendControls}</div> : null}
        </div>
        {classrooms.length === 0 ? (
          <div className="p-8 text-center text-sm text-slate-500">No rooms are available.</div>
        ) : (
          <MappingTableView
            classrooms={classrooms}
            labTimeSlots={labTimeSlots}
            embedded
            abbreviateDays
            dayColumnWidth={64}
            showOverlappingEntries
            selectedScheduleId={selectedMeetingId ?? highlightedScheduleId}
            selectedRange={
              visibleSelection
                ? {
                    roomId: String(visibleSelection.roomId),
                    day: visibleSelection.dayOfWeek,
                    startTime: visibleSelection.startTime,
                    endTime: visibleSelection.endTime,
                  }
                : null
            }
            onEntrySelect={(entry, event) => {
              if (entry.scheduleId == null) return;
              if (event.shiftKey) {
                clearSelection();
                return;
              }
              resetShiftRange();
              onSelectionClear?.();
              const meeting = meetingById.get(entry.scheduleId);
              if (meeting) onMeetingSelect?.(meeting);
            }}
            onFreeSlotClick={(room, day, slot, event) => {
              chooseSlot(event, {
                roomId: Number(room.id),
                dayOfWeek: day,
                startTime: normalizeTime(slot.start),
                endTime: normalizeTime(slot.end),
              });
            }}
            onLabSlotSelect={(room, day, slot) => {
              selectLabSlot({
                roomId: Number(room.id),
                dayOfWeek: day,
                startTime: normalizeTime(slot.start),
                endTime: normalizeTime(slot.end),
              });
            }}
            onFreeSlotMouseDown={(room, day, slot, event) => {
              startShiftDrag(event, {
                roomId: Number(room.id),
                dayOfWeek: day,
                startTime: normalizeTime(slot.start),
                endTime: normalizeTime(slot.end),
              });
            }}
            onFreeSlotMouseEnter={(room, day, slot, event) => {
              continueShiftDrag(event, {
                roomId: Number(room.id),
                dayOfWeek: day,
                startTime: normalizeTime(slot.start),
                endTime: normalizeTime(slot.end),
              });
            }}
          />
        )}
      </Card>
  );
}
