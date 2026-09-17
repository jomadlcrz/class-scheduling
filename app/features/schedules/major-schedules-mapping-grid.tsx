import { useEffect, useMemo, useRef, useState, type PointerEvent as ReactPointerEvent } from "react";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { Drawer } from "~/components/ui/drawer";
import { EmptyState } from "~/components/feedback/empty-state";
import { FieldChrome, inputClassName } from "~/components/ui/input";
import { HelpCircleIcon, SearchIcon } from "~/components/ui/icons";
import { Popover } from "~/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "~/components/ui/select";
import { useCachedData } from "~/hooks/use-cached-data";
import { useEnums } from "~/hooks/use-enums";
import { formatTime12h, normalizeTime, timeToMinutes } from "~/lib/time";
import { deanService } from "~/services/dean.service";
import { programService } from "~/services/program.service";
import { scheduleService, type ScheduleRoomOption } from "~/services/schedule.service";
import { setService } from "~/services/set.service";
import type { MajorSchedule, MajorScheduleMeetingInput, MajorScheduleSubmission } from "~/types/authority-workflow";
import {
  DAYS,
  DAY_STYLES,
  ROOM_COL_W,
  DAY_COL_W,
  SLOT_COL_W,
  TYPE_STYLES,
  buildTimeSlots,
  type Classroom,
  type ClassEntry,
  type DayOfWeek,
  type SubjectType,
} from "~/features/classroom-mapping/mapping-model";

export type Selection = {
  room: Classroom;
  day: DayOfWeek;
  start: number; // minutes from midnight
  end: number;   // minutes from midnight
};

type Props = {
  classrooms: Classroom[];
  submissions: MajorScheduleSubmission[];
  rooms: ScheduleRoomOption[];
  schoolYear: string;
  syId: number;
  semesterNumber: number;
  userRole: string;
  onCreate: (input: MajorScheduleMeetingInput) => Promise<boolean>;
  onUpdate?: (id: number, input: MajorScheduleMeetingInput) => Promise<boolean>;
  onSelectSchedule?: (schedule: MajorSchedule) => void;
  scheduleToEdit?: MajorSchedule | null;
  onCloseEdit?: () => void;
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

export function MajorSchedulesMappingGrid({
  classrooms,
  submissions,
  rooms,
  schoolYear,
  syId,
  semesterNumber,
  userRole,
  onCreate,
  onUpdate,
  onSelectSchedule,
  scheduleToEdit,
  onCloseEdit,
}: Props) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<Selection | null>(null);
  const autoScrollFrameRef = useRef<number | null>(null);
  const pointerRef = useRef({ x: 0, y: 0 });

  // Map of all major schedules across submissions for quick lookup by room/day/time
  const allMajorSchedules = useMemo(() => {
    return submissions.flatMap((s) => s.schedules);
  }, [submissions]);

  // Combine base classrooms with all major schedules from submissions so they render directly on the mapping grid
  const enrichedClassrooms = useMemo(() => {
    const roomMapById = new Map<number, ScheduleRoomOption>();
    const roomMapByName = new Map<string, ScheduleRoomOption>();
    for (const r of rooms) {
      roomMapById.set(r.id, r);
      roomMapByName.set(r.roomName.toLowerCase(), r);
    }

    const roomNameToClassroom = new Map<string, Classroom>();

    for (const c of classrooms) {
      roomNameToClassroom.set(c.name.toLowerCase(), {
        id: c.id,
        name: c.name,
        entries: [...c.entries],
      });
    }

    // Ensure all rooms from the room catalog exist in the grid
    for (const r of rooms) {
      const key = r.roomName.toLowerCase();
      if (!roomNameToClassroom.has(key)) {
        roomNameToClassroom.set(key, {
          id: String(r.id),
          name: r.roomName,
          entries: [],
        });
      }
    }

    // Overlay all major schedules from submissions onto their respective rooms
    for (const ms of allMajorSchedules) {
      let targetClassroom: Classroom | undefined;

      if (ms.roomId) {
        const roomObj = roomMapById.get(ms.roomId);
        if (roomObj) {
          targetClassroom = roomNameToClassroom.get(roomObj.roomName.toLowerCase());
        }
      }

      if (targetClassroom) {
        const startNorm = normalizeTime(formatTime12h(ms.startTime));
        const endNorm = normalizeTime(formatTime12h(ms.endTime));
        const day = ms.dayOfWeek as DayOfWeek;

        const existingIdx = targetClassroom.entries.findIndex(
          (e) => e.day === day && timeToMinutes(e.startTime) === timeToMinutes(startNorm),
        );

        const newEntry: ClassEntry = {
          day,
          startTime: startNorm,
          endTime: endNorm,
          type:
            (ms.subjectType as SubjectType) ||
            (ms.sessionMode === "LAB" ? "Major with Lab" : "Major without Lab"),
          subjectCode: ms.subjectCode,
          descriptiveTitle: ms.subjectTitle,
          instructor: ms.instructorDisplay || "TBA / Floating",
          section: ms.setName,
        };

        if (existingIdx >= 0) {
          targetClassroom.entries[existingIdx] = newEntry;
        } else {
          targetClassroom.entries.push(newEntry);
        }
      }
    }

    return Array.from(roomNameToClassroom.values());
  }, [classrooms, rooms, allMajorSchedules]);

  const slots = useMemo(() => buildTimeSlots(enrichedClassrooms), [enrichedClassrooms]);
  const deanCreationLocked = userRole === "dean" && submissions.some(
    (submission) => !["draft", "reopened"].includes(submission.status),
  );
  const [selection, setSelection] = useState<Selection | null>(null);
  const [dragging, setDragging] = useState<Selection | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [panning, setPanning] = useState<{ x: number; left: number } | null>(null);
  const [pointerPosition, setPointerPosition] = useState({ x: 0, y: 0 });
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [fullscreenRoomQuery, setFullscreenRoomQuery] = useState("");
  const visibleClassrooms = useMemo(() => {
    const query = fullscreenRoomQuery.trim().toLowerCase();
    if (!query) return enrichedClassrooms;
    return enrichedClassrooms.filter((room) => room.name.toLowerCase().includes(query));
  }, [enrichedClassrooms, fullscreenRoomQuery]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        dragRef.current = null;
        setDragging(null);
        setSelection(null);
        setDrawerOpen(false);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  useEffect(() => {
    if (!isFullscreen) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [isFullscreen]);

  function occupied(room: Classroom, day: DayOfWeek, minute: number) {
    return room.entries.some(
      (entry) =>
        entry.day === day &&
        timeToMinutes(entry.startTime) < minute + 30 &&
        timeToMinutes(entry.endTime) > minute,
    );
  }

  function start(
    event: ReactPointerEvent<HTMLDivElement>,
    room: Classroom,
    day: DayOfWeek,
    minute: number,
  ) {
    if (deanCreationLocked || event.button !== 0 || occupied(room, day, minute)) return;
    event.currentTarget.setPointerCapture(event.pointerId);
    const next = { room, day, start: minute, end: minute + 30 };
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
      ?.closest<HTMLElement>("[data-room][data-day][data-minute]");
    if (!target) return;
    const room = enrichedClassrooms.find((item) => item.id === target.dataset.room);
    const day = target.dataset.day as DayOfWeek;
    const minute = Number(target.dataset.minute);
    if (!room || room.id !== activeDrag.room.id || day !== activeDrag.day || !Number.isFinite(minute))
      return;

    const selectingLeft = minute < activeDrag.start;
    let startMinute = Math.min(activeDrag.start, minute);
    let endMinute = Math.max(activeDrag.start, minute) + 30;
    if (selectingLeft) {
      for (let probe = activeDrag.start - 30; probe >= minute; probe -= 30) {
        if (occupied(room, day, probe)) {
          startMinute = probe + 30;
          break;
        }
      }
    } else {
      for (let probe = activeDrag.start + 30; probe <= minute; probe += 30) {
        if (occupied(room, day, probe)) {
          endMinute = probe;
          break;
        }
      }
    }
    setSelection({ ...activeDrag, start: startMinute, end: endMinute });
  }

  function finish() {
    if (!dragRef.current) return;
    dragRef.current = null;
    if (autoScrollFrameRef.current) cancelAnimationFrame(autoScrollFrameRef.current);
    autoScrollFrameRef.current = null;
    setDragging(null);
    setDrawerOpen(true);
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
      ?.closest<HTMLElement>("[data-room][data-day][data-minute]");
    if (target) {
      const room = classrooms.find((item) => item.id === target.dataset.room);
      const day = target.dataset.day as DayOfWeek;
      const minute = Number(target.dataset.minute);
      if (room && room.id === activeDrag.room.id && day === activeDrag.day && Number.isFinite(minute)) {
        const selectingLeft = minute < activeDrag.start;
        let startMinute = Math.min(activeDrag.start, minute);
        let endMinute = Math.max(activeDrag.start, minute) + 30;
        if (selectingLeft) {
          for (let probe = activeDrag.start - 30; probe >= minute; probe -= 30) {
            if (occupied(room, day, probe)) {
              startMinute = probe + 30;
              break;
            }
          }
        } else {
          for (let probe = activeDrag.start + 30; probe <= minute; probe += 30) {
            if (occupied(room, day, probe)) {
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

  function isSelected(room: Classroom, day: DayOfWeek, minute: number) {
    return (
      selection?.room.id === room.id &&
      selection.day === day &&
      minute >= selection.start &&
      minute < selection.end
    );
  }

  return (
    <section
      className={
        isFullscreen
          ? "fixed inset-0 z-40 flex h-dvh flex-col gap-3 overflow-hidden bg-slate-50 p-4 dark:bg-surface-raised"
          : "space-y-3"
      }
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="font-body text-xs text-slate-500 dark:text-slate-400">
          <span className="font-semibold text-navy-700 dark:text-mist-100">Interactive Major Timetable:</span>{" "}
          Left-drag on any free slot to select a room and time range for quick assignment.
        </p>
        <div className="flex items-center gap-2">
          {isFullscreen && (
            <label className="flex h-8 w-56 items-center gap-2 rounded-lg border border-slate-300 bg-white px-2.5 text-slate-500 dark:border-white/10 dark:bg-white/5 dark:text-slate-400">
              <SearchIcon size={15} />
              <input
                type="search"
                value={fullscreenRoomQuery}
                onChange={(event) => setFullscreenRoomQuery(event.target.value)}
                placeholder="Search rooms..."
                aria-label="Search rooms"
                className="min-w-0 flex-1 bg-transparent font-body text-xs text-slate-700 outline-none placeholder:text-slate-400 dark:text-mist-100"
              />
            </label>
          )}
          <Button
            type="button"
            variant="outline"
            block={false}
            className="h-8 px-2.5 text-xs"
            onClick={() => {
              setIsFullscreen((value) => !value);
              if (isFullscreen) setFullscreenRoomQuery("");
            }}
          >
            {isFullscreen ? "Exit full screen" : "Full screen"}
          </Button>
          <Popover
            label="Controls guide"
            trigger={
              <>
                <HelpCircleIcon />
                <span>Controls guide</span>
              </>
            }
            triggerClassName="flex h-8 shrink-0 items-center gap-1.5 whitespace-nowrap rounded-lg border border-slate-300 bg-white px-2.5 font-body text-xs text-slate-600 transition-colors hover:bg-slate-50 hover:text-navy-700 dark:border-white/10 dark:bg-white/5 dark:text-slate-300 dark:hover:bg-white/10 dark:hover:text-mist-100"
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
                    <span>View / Edit existing meeting</span>
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
      </div>

      <div
        ref={scrollRef}
        onContextMenu={(event) => event.preventDefault()}
        onPointerDown={(event) => {
          if ((event.button === 1 || event.button === 2) && scrollRef.current) {
            event.preventDefault();
            setPanning({
              x: event.clientX,
              left: scrollRef.current.scrollLeft,
            });
            return;
          }
          if (event.button !== 0) return;
          const target = (event.target as HTMLElement).closest<HTMLElement>(
            "[data-room][data-day][data-minute]",
          );
          const room = enrichedClassrooms.find((item) => item.id === target?.dataset.room);
          const day = target?.dataset.day as DayOfWeek;
          const minute = Number(target?.dataset.minute);
          if (target && room && day && Number.isFinite(minute) && !deanCreationLocked && !occupied(room, day, minute)) {
            event.preventDefault();
            start(event, room, day, minute);
            if (!autoScrollFrameRef.current)
              autoScrollFrameRef.current = requestAnimationFrame(runAutoScroll);
          } else if (scrollRef.current && !(event.target as HTMLElement).closest("button, input, select, a, td.cursor-pointer")) {
            event.preventDefault();
            setPanning({
              x: event.clientX,
              left: scrollRef.current.scrollLeft,
            });
          }
        }}
        onPointerMove={(event) => {
          if (panning && scrollRef.current) {
            scrollRef.current.scrollLeft = panning.left - (event.clientX - panning.x);
            return;
          }
          move(event);
        }}
        onPointerUp={(event) => {
          if (panning) {
            setPanning(null);
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
        className={`relative min-h-0 overflow-auto rounded-xl border border-slate-300 bg-white [&::-webkit-scrollbar]:hidden dark:border-white/10 dark:bg-white/5 ${
          isFullscreen ? "flex-1" : "max-h-[70vh]"
        }`}
        style={{
          cursor: panning ? "grabbing" : dragging ? "crosshair" : "grab",
          scrollbarWidth: "none",
        }}
      >
        {isFullscreen && visibleClassrooms.length === 0 ? (
          <div className="flex h-full items-center justify-center">
            <EmptyState title={fullscreenRoomQuery.trim() ? "No rooms found" : "No classrooms configured"}>
              {fullscreenRoomQuery.trim()
                ? `No rooms match “${fullscreenRoomQuery.trim()}”.`
                : "No classrooms are available for this term and building."}
            </EmptyState>
          </div>
        ) : (
        <table
          className="text-sm"
          style={{
            borderSpacing: 0,
            borderCollapse: "separate",
            tableLayout: "fixed",
            width: ROOM_COL_W + DAY_COL_W + slots.length * SLOT_COL_W,
          }}
        >
          <colgroup>
            <col style={{ width: ROOM_COL_W }} />
            <col style={{ width: DAY_COL_W }} />
            {slots.map((_, index) => (
              <col key={index} style={{ width: SLOT_COL_W }} />
            ))}
          </colgroup>
          <thead>
            <tr>
              <th className="sticky left-0 top-0 z-30 border-r-2 border-b-2 border-slate-300 bg-slate-50 px-3 py-2 text-left font-body text-[0.65rem] font-bold uppercase tracking-wider text-slate-500 dark:border-white/10 dark:bg-surface-raised dark:text-slate-400">
                Room
              </th>
              <th
                className="sticky top-0 z-30 border-r-2 border-b-2 border-slate-300 bg-slate-50 px-3 py-2 text-left font-body text-[0.65rem] font-bold uppercase tracking-wider text-slate-500 dark:border-white/10 dark:bg-surface-raised dark:text-slate-400"
                style={{ left: ROOM_COL_W }}
              >
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
            {visibleClassrooms.length === 0 ? (
              <tr>
                <td
                  colSpan={slots.length + 2}
                  className="px-4 py-10 text-center font-body text-sm text-slate-500 dark:text-slate-400"
                >
                  No rooms match “{fullscreenRoomQuery}”.
                </td>
              </tr>
            ) : (
              visibleClassrooms.flatMap((room, roomIndex) => [
              roomIndex > 0 ? (
                <tr key={`${room.id}-gap`}>
                  <td
                    colSpan={slots.length + 2}
                    className="border-t-2 border-slate-200 dark:border-white/10"
                  />
                </tr>
              ) : null,
              ...DAYS.map((day, dayIndex) => (
                <tr key={`${room.id}-${day}`}>
                  {dayIndex === 0 && (
                    <td
                      rowSpan={DAYS.length}
                      className="sticky left-0 z-10 border-r-2 border-b border-slate-200 bg-white px-3 py-2 align-middle text-center dark:border-white/10 dark:bg-slate-900"
                    >
                      <span className="block font-display text-base tracking-tight text-slate-800 dark:text-mist-100">
                        {room.name}
                      </span>
                    </td>
                  )}
                  <td
                    className={`sticky z-10 border-r-2 border-b border-slate-200 bg-white px-3 py-2 align-middle font-body text-xs font-bold uppercase tracking-widest dark:border-white/10 dark:bg-slate-900 ${DAY_STYLES[day].color}`}
                    style={{ left: ROOM_COL_W }}
                  >
                    {day}
                  </td>
                  {slots.map((slot, index) => {
                    const minute = timeToMinutes(slot.start);
                    const event = room.entries.find(
                      (entry) => entry.day === day && timeToMinutes(entry.startTime) === minute,
                    );
                    if (event) {
                      const span = Math.max(1, (timeToMinutes(event.endTime) - minute) / 30);
                      const style = TYPE_STYLES[event.type] ?? TYPE_STYLES["Major without Lab"];
                      const matchingMajor = allMajorSchedules.find(
                        (ms) =>
                          ms.dayOfWeek === day &&
                          timeToMinutes(ms.startTime) === minute &&
                          ms.subjectCode === event.subjectCode,
                      );

                      return (
                        <td
                          key={index}
                          colSpan={span}
                          onClick={() => {
                            if (matchingMajor && onSelectSchedule) {
                              onSelectSchedule(matchingMajor);
                            }
                          }}
                          className={`group cursor-pointer border-r border-b border-l-[3px] border-slate-200 p-2 align-top transition-shadow hover:shadow-md dark:border-white/10 ${style.card} ${style.border}`}
                        >
                          <div className="flex items-start justify-between gap-1">
                            <span className={`block font-body text-xs font-bold leading-tight ${style.code}`}>
                              {event.subjectCode} · {event.section}
                            </span>
                            {matchingMajor && (
                              <span className="shrink-0 rounded bg-navy-700/10 px-1 py-0.5 text-[9px] font-semibold uppercase text-navy-800 dark:bg-white/10 dark:text-mist-100">
                                {matchingMajor.sessionMode ?? "Major"}
                              </span>
                            )}
                          </div>
                          <span className="mt-0.5 block font-body text-[0.7rem] text-slate-500 dark:text-slate-400">
                            {event.instructor || "TBA / Floating"}
                          </span>
                        </td>
                      );
                    }
                    if (
                      room.entries.some(
                        (entry) =>
                          entry.day === day &&
                          timeToMinutes(entry.startTime) < minute &&
                          timeToMinutes(entry.endTime) > minute,
                      )
                    )
                      return null;

                    const active = isSelected(room, day, minute);
                    return (
                      <td
                        key={index}
                        data-room={room.id}
                        data-day={day}
                        data-minute={minute}
                        tabIndex={0}
                        className={`h-20 border-r border-b p-2 text-center font-body text-[0.72rem] italic outline-none focus-visible:ring-2 focus-visible:ring-gold-400 dark:border-white/10 ${
                          active
                            ? "bg-blue-100 ring-2 ring-inset ring-blue-600 dark:bg-blue-400/20"
                            : deanCreationLocked
                              ? "cursor-not-allowed text-slate-300 dark:text-slate-600"
                              : "cursor-crosshair text-slate-300 hover:bg-slate-50 dark:text-slate-600 dark:hover:bg-white/5"
                        }`}
                      >
                        {active ? null : "Free"}
                      </td>
                    );
                  })}
                </tr>
              )),
              ])
            )}
          </tbody>
        </table>
        )}
      </div>

      {selection && dragging && (
        <div
          className="pointer-events-none fixed z-40 rounded-lg bg-navy-800 px-3 py-2 text-white shadow-lg"
          style={{
            left: Math.min(pointerPosition.x + 14, window.innerWidth - 290),
            top: Math.min(pointerPosition.y + 14, window.innerHeight - 76),
          }}
        >
          <strong className="block font-body text-xs">
            {selection.room.name} · {selection.day}
          </strong>
          <span className="font-body text-[0.7rem] text-blue-100">
            {rangeText(selection)} · {duration(selection.start, selection.end)}
          </span>
        </div>
      )}

      <MajorAssignmentDrawer
        open={(drawerOpen && !deanCreationLocked) || !!scheduleToEdit}
        selection={selection}
        scheduleToEdit={scheduleToEdit}
        rooms={rooms}
        schoolYear={schoolYear}
        syId={syId}
        semesterNumber={semesterNumber}
        onClose={() => {
          setDrawerOpen(false);
          setSelection(null);
          onCloseEdit?.();
        }}
        onCreate={onCreate}
        onUpdate={onUpdate}
      />
    </section>
  );
}

export function MajorAssignmentDrawer({
  open,
  selection,
  scheduleToEdit,
  rooms,
  schoolYear,
  syId,
  semesterNumber,
  onClose,
  onCreate,
  onUpdate,
}: {
  open: boolean;
  selection: Selection | null;
  scheduleToEdit?: MajorSchedule | null;
  rooms: ScheduleRoomOption[];
  schoolYear: string;
  syId: number;
  semesterNumber: number;
  onClose: () => void;
  onCreate: Props["onCreate"];
  onUpdate?: Props["onUpdate"];
}) {
  const { enums } = useEnums();
  const days = useMemo(
    () => enums?.dayOfWeek?.map((d) => d.name) ?? [],
    [enums?.dayOfWeek],
  );
  const classModes = useMemo(
    () => enums?.classMode ?? ["F2F", "Synchronous", "Asynchronous", "Blended"],
    [enums?.classMode],
  );

  const [programId, setProgramId] = useState(0);
  const [setId, setSetId] = useState(0);
  const [subjectId, setSubjectId] = useState(0);
  const [instructorId, setInstructorId] = useState<string>("floating");
  const [roomId, setRoomId] = useState(0);
  const [dayOfWeek, setDayOfWeek] = useState("Monday");
  const [startTime, setStartTime] = useState("7:00 AM");
  const [endTime, setEndTime] = useState("8:00 AM");
  const [mode, setMode] = useState("F2F");
  const [sessionMode, setSessionMode] = useState("LEC");
  const [instructorSearch, setInstructorSearch] = useState("");
  const [saving, setSaving] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  const prevOpenRef = useRef(false);
  const prevSelectionRef = useRef<Selection | null>(null);
  const prevEditRef = useRef<MajorSchedule | null>(null);

  const { data: programs } = useCachedData(
    "major-assignment-programs",
    () => programService.list(),
    { enabled: open },
  );

  const { data: sets } = useCachedData(
    `major-assignment-sets:${syId}:${semesterNumber}:${programId}`,
    () => setService.list({ syId, semesterNumber, programId }),
    { enabled: open && programId > 0 },
  );
  const availableSets = useMemo(() => sets ?? [], [sets]);
  const selectedSet = availableSets.find((row) => row.id === setId);

  const { data: subjects } = useCachedData(
    `major-assignment-subjects:${schoolYear}:${semesterNumber}:${programId}:${selectedSet?.yearLevel ?? 0}`,
    () =>
      scheduleService.listScheduleSubjects({
        schoolYear,
        programId,
        semester: semesterNumber as 1 | 2,
        yearLevel: selectedSet?.yearLevel,
        includeScheduledSets: true,
      }),
    { enabled: open && !!schoolYear && programId > 0 && !!selectedSet },
  );

  // Filter to Major subjects only (Major with Lab / Major without Lab)
  const majorSubjects = useMemo(() => {
    if (!subjects) return [];
    const majors = subjects.filter((s) =>
      s.subjectType ? s.subjectType.toLowerCase().includes("major") : true,
    );
    return majors.length > 0 ? majors : subjects;
  }, [subjects]);

  const { data: deptInstructors } = useCachedData(
    "major-assignment-dept-instructors",
    () => deanService.listDepartmentInstructors(),
    { enabled: open },
  );

  const selectedSubject = (subjects ?? []).find((row) => row.id === subjectId);
  const subjectFaculties = selectedSubject?.faculties ?? [];

  const availableFaculties = useMemo(() => {
    if (subjectFaculties.length > 0) return subjectFaculties;
    return (deptInstructors ?? []).map((d) => ({
      id: d.instructorProfileId,
      fullName: `${d.firstName} ${d.lastName}`,
      maxWeeklyHours: null,
      currentWeeklyHours: null,
    }));
  }, [subjectFaculties, deptInstructors]);

  const filteredInstructors = useMemo(() => {
    const q = instructorSearch.trim().toLowerCase();
    if (!q) return availableFaculties;
    return availableFaculties.filter((f) => f.fullName.toLowerCase().includes(q));
  }, [availableFaculties, instructorSearch]);

  // When drawer opens or selection/editTarget changes, prefill fields
  useEffect(() => {
    const justOpened = open && !prevOpenRef.current;
    const selectionChanged = open && selection !== prevSelectionRef.current;
    const editChanged = open && scheduleToEdit !== prevEditRef.current;
    prevOpenRef.current = open;
    prevSelectionRef.current = selection;
    prevEditRef.current = scheduleToEdit ?? null;

    if (!open) return;
    if (!justOpened && !selectionChanged && !editChanged) return;

    if (scheduleToEdit) {
      setProgramId(scheduleToEdit.programId);
      setSetId(scheduleToEdit.setId);
      setSubjectId(scheduleToEdit.subjectId);
      setInstructorId(
        scheduleToEdit.instructorId ? String(scheduleToEdit.instructorId) : "floating",
      );
      setMode(scheduleToEdit.classMode ?? "F2F");
      setSessionMode(scheduleToEdit.sessionMode ?? "LEC");
      setRoomId(scheduleToEdit.roomId ?? 0);
      setDayOfWeek(scheduleToEdit.dayOfWeek);
      setStartTime(formatTime12h(scheduleToEdit.startTime));
      setEndTime(formatTime12h(scheduleToEdit.endTime));
      setInstructorSearch("");
      setValidationError(null);
    } else if (selection) {
      const matchedRoom = rooms.find(
        (r) =>
          r.roomName.toLowerCase() === selection.room.name.toLowerCase() ||
          String(r.id) === selection.room.id,
      );
      setRoomId(matchedRoom?.id ?? 0);
      setDayOfWeek(selection.day);
      setStartTime(formatTime12h(slotsFrom(selection.start)));
      setEndTime(formatTime12h(slotsFrom(selection.end)));

      const isLabRoom = selection.room.name.toLowerCase().includes("lab");
      setSessionMode(isLabRoom ? "LAB" : "LEC");

      setProgramId(0);
      setSetId(0);
      setSubjectId(0);
      setInstructorId("floating");
      setMode("F2F");
      setInstructorSearch("");
      setValidationError(null);
    } else {
      setRoomId(rooms[0]?.id ?? 0);
      setDayOfWeek(days[0] ?? "Monday");
      setStartTime("7:00 AM");
      setEndTime("8:00 AM");
      setSessionMode("LEC");
      setProgramId(0);
      setSetId(0);
      setSubjectId(0);
      setInstructorId("floating");
      setMode("F2F");
      setInstructorSearch("");
      setValidationError(null);
    }
  }, [open, selection, scheduleToEdit, rooms, days]);

  // Auto-adjust session mode based on subject type
  useEffect(() => {
    if (selectedSubject) {
      if (selectedSubject.subjectType === "Major with Lab") {
        const roomObj = rooms.find((r) => r.id === roomId);
        const isLab = roomObj?.roomName.toLowerCase().includes("lab");
        setSessionMode(isLab ? "LAB" : "LEC");
      } else if (selectedSubject.subjectType === "Major without Lab") {
        setSessionMode("LEC");
      }
    }
  }, [selectedSubject, roomId, rooms]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!programId || !setId || !subjectId || !mode || !sessionMode || (!roomId && mode === "F2F")) {
      setValidationError("Please fill in all required academic fields.");
      return;
    }
    if (!startTime || !endTime) {
      setValidationError("Select both a start time and an end time.");
      return;
    }
    if (timeToMinutes(endTime) <= timeToMinutes(startTime)) {
      setValidationError("End time must be after start time.");
      return;
    }

    setSaving(true);
    setValidationError(null);
    try {
      const payload: MajorScheduleMeetingInput = {
        syId,
        semesterNumber,
        programId,
        setId,
        subjectId,
        instructorId: instructorId === "floating" ? null : Number(instructorId),
        roomId: roomId || null,
        dayOfWeek,
        startTime: normalizeTime(startTime),
        endTime: normalizeTime(endTime),
        classMode: mode,
        sessionMode,
      };
      const ok = scheduleToEdit && onUpdate
        ? await onUpdate(scheduleToEdit.id, payload)
        : await onCreate(payload);
      if (ok) {
        onClose();
      }
    } finally {
      setSaving(false);
    }
  }

  return (
    <Drawer
      open={open}
      onClose={onClose}
      title={scheduleToEdit ? "Edit Major Meeting" : "New Major Meeting"}
      description={
        scheduleToEdit
          ? "Update academic details, delivery mode, or instructor assignment for this meeting."
          : "Schedule a Major with Lab or Major without Lab timetable meeting."
      }
      footer={
        <>
          <Button type="button" variant="outline" block={false} onClick={onClose}>
            Cancel
          </Button>
          <Button
            type="button"
            block={false}
            isLoading={saving}
            loadingLabel={scheduleToEdit ? "Saving…" : "Assigning…"}
            disabled={!programId || !setId || !subjectId}
            onClick={() => {
              const form = document.querySelector<HTMLFormElement>("form#major-assignment-form");
              if (form) form.requestSubmit();
            }}
          >
            {scheduleToEdit ? "Save changes" : "Create meeting"}
          </Button>
        </>
      }
    >
      <form id="major-assignment-form" onSubmit={handleSubmit} className="space-y-4" noValidate>
        {validationError && (
          <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-xs text-red-700 dark:border-red-400/20 dark:bg-red-400/10 dark:text-red-300">
            {validationError}
          </div>
        )}

        {(selection || scheduleToEdit) && (
          <div className="rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 dark:border-blue-400/20 dark:bg-blue-400/10">
            <div className="flex items-center justify-between">
              <span className="font-display text-base tracking-wide text-navy-800 dark:text-mist-100">
                {selection?.room.name ?? rooms.find((r) => r.id === scheduleToEdit?.roomId)?.roomName ?? "Assigned Room"}
              </span>
              <Badge tone="navy">
                {selection
                  ? duration(selection.start, selection.end)
                  : scheduleToEdit
                  ? `${formatTime12h(scheduleToEdit.startTime)}–${formatTime12h(scheduleToEdit.endTime)}`
                  : ""}
              </Badge>
            </div>
            <span className="mt-1 block font-body text-xs text-slate-600 dark:text-slate-300">
              {selection
                ? `${selection.day} · ${rangeText(selection)}`
                : scheduleToEdit
                ? `${scheduleToEdit.dayOfWeek} · ${formatTime12h(scheduleToEdit.startTime)}–${formatTime12h(scheduleToEdit.endTime)}`
                : ""}
            </span>
          </div>
        )}

        <fieldset className="space-y-3 border-t border-slate-200 pt-3 dark:border-white/10">
          <legend className="font-display text-sm tracking-wide text-navy-700 dark:text-mist-100">
            1. Academic Assignment
          </legend>

          <FieldChrome id="map-program" label="Program" required>
            <Select
              items={(programs ?? []).map((p) => ({ value: String(p.id), label: `${p.abbrev} — ${p.name}` }))}
              value={programId ? String(programId) : ""}
              onValueChange={(val) => {
                setProgramId(Number(val));
                setSetId(0);
                setSubjectId(0);
                setInstructorId("floating");
              }}
            >
              <SelectTrigger id="map-program">
                <SelectValue placeholder={programs === null ? "Loading programs…" : "Select program"} />
              </SelectTrigger>
              <SelectContent>
                {(programs ?? []).map((p) => (
                  <SelectItem key={p.id} value={String(p.id)}>
                    {p.abbrev} — {p.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FieldChrome>

          <FieldChrome id="map-section" label="Section / Set" required hint={programId ? undefined : "Select a program first."}>
            <Select
              items={availableSets.map((s) => {
                const code = s.setCode.replace(/^Set\s+/i, "");
                return { value: String(s.id), label: `${s.program}-${s.yearLevel}${code}` };
              })}
              value={setId ? String(setId) : ""}
              onValueChange={(val) => {
                setSetId(Number(val));
                setSubjectId(0);
                setInstructorId("floating");
              }}
              disabled={!programId}
            >
              <SelectTrigger id="map-section">
                <SelectValue placeholder={!programId ? "Select program first" : sets === null ? "Loading sections…" : "Select section"} />
              </SelectTrigger>
              <SelectContent>
                {availableSets.map((s) => {
                  const code = s.setCode.replace(/^Set\s+/i, "");
                  return (
                    <SelectItem key={s.id} value={String(s.id)}>
                      {s.program}-{s.yearLevel}{code}
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
          </FieldChrome>

          <FieldChrome id="map-subject" label="Major subject" required hint={setId ? undefined : "Select a section to load curriculum subjects."}>
            <Select
              items={majorSubjects.map((s) => ({
                value: String(s.id),
                label: `${s.code} — ${s.title} (${s.subjectType || "Major"})`,
              }))}
              value={subjectId ? String(subjectId) : ""}
              onValueChange={(val) => {
                setSubjectId(Number(val));
                setInstructorId("floating");
              }}
              disabled={!setId}
            >
              <SelectTrigger id="map-subject">
                <SelectValue placeholder={!setId ? "Select section first" : subjects === null ? "Loading major subjects…" : "Select major subject"} />
              </SelectTrigger>
              <SelectContent>
                {majorSubjects.map((s) => (
                  <SelectItem key={s.id} value={String(s.id)}>
                    {s.code} — {s.title} ({s.subjectType || "Major"})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FieldChrome>
        </fieldset>

        <fieldset className="space-y-3 border-t border-slate-200 pt-3 dark:border-white/10">
          <legend className="font-display text-sm tracking-wide text-navy-700 dark:text-mist-100">
            2. Mode
          </legend>

          <div className="grid gap-3 sm:grid-cols-2">
            <FieldChrome id="map-mode" label="Meeting mode" required>
              <Select
                items={classModes.map((m) => ({ value: m, label: m }))}
                value={mode}
                onValueChange={(val) => setMode(val ?? "F2F")}
              >
                <SelectTrigger id="map-mode">
                  <SelectValue placeholder="Select mode" />
                </SelectTrigger>
                <SelectContent>
                  {classModes.map((m) => (
                    <SelectItem key={m} value={m}>
                      {m}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FieldChrome>

            <FieldChrome
              id="map-session-mode"
              label="Session type"
              hint={
                sessionMode === "LAB"
                  ? "Read-only: Automatically determined as Laboratory for lab room assignment."
                  : "Read-only: Automatically determined as Lecture."
              }
            >
              <div className="flex h-10 w-full items-center justify-between rounded-lg border border-slate-200 bg-slate-50 px-3 font-body text-sm text-slate-700 dark:border-white/10 dark:bg-white/5 dark:text-slate-200">
                <span className="font-medium">
                  {sessionMode === "LAB" ? "Laboratory (LAB)" : "Lecture (LEC)"}
                </span>
                <Badge tone={sessionMode === "LAB" ? "violet" : "navy"}>
                  {sessionMode}
                </Badge>
              </div>
            </FieldChrome>
          </div>
        </fieldset>

        <fieldset className="space-y-3 border-t border-slate-200 pt-3 dark:border-white/10">
          <legend className="font-display text-sm tracking-wide text-navy-700 dark:text-mist-100">
            3. Instructor Assignment
          </legend>

          <FieldChrome id="map-instructor-search" label="Search instructor" hint="Leave as TBA / Floating if instructor is not yet designated.">
            <input
              id="map-instructor-search"
              type="search"
              value={instructorSearch}
              onChange={(e) => setInstructorSearch(e.target.value)}
              placeholder="Search faculty by name…"
              className={inputClassName}
              disabled={!subjectId}
            />
          </FieldChrome>

          <div className="space-y-1.5 max-h-48 overflow-y-auto rounded-lg border border-slate-200 p-2 dark:border-white/10">
            <button
              type="button"
              onClick={() => setInstructorId("floating")}
              className={`flex w-full items-center justify-between rounded-lg p-2.5 text-left font-body transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-400 ${
                instructorId === "floating"
                  ? "border border-blue-600 bg-blue-50 text-blue-800 dark:bg-blue-400/10 dark:text-blue-300"
                  : "border border-transparent hover:bg-slate-50 dark:hover:bg-white/5"
              }`}
            >
              <div>
                <strong className="block text-xs font-semibold">TBA / Floating Instructor</strong>
                <span className="text-[11px] text-slate-500 dark:text-slate-400">Designate instructor later</span>
              </div>
              <Badge tone="gold">Floating</Badge>
            </button>

            {filteredInstructors.map((faculty) => (
              <button
                key={faculty.id}
                type="button"
                onClick={() => setInstructorId(String(faculty.id))}
                className={`flex w-full items-center justify-between rounded-lg p-2.5 text-left font-body transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-400 ${
                  instructorId === String(faculty.id)
                    ? "border border-blue-600 bg-blue-50 text-blue-800 dark:bg-blue-400/10 dark:text-blue-300"
                    : "border border-transparent hover:bg-slate-50 dark:hover:bg-white/5"
                }`}
              >
                <div>
                  <strong className="block text-xs font-semibold text-navy-800 dark:text-mist-100">
                    {faculty.fullName}
                  </strong>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400">
                    {faculty.currentWeeklyHours ?? 0} of {faculty.maxWeeklyHours ?? "—"} hrs assigned
                  </span>
                </div>
                <Badge tone="emerald">Available</Badge>
              </button>
            ))}

            {filteredInstructors.length === 0 && subjectId > 0 && (
              <p className="p-3 text-center font-body text-xs text-slate-400">
                No matching instructors found for this subject.
              </p>
            )}
          </div>
        </fieldset>
      </form>
    </Drawer>
  );
}
