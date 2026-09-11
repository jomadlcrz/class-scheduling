import { useEffect, useMemo, useRef, useState } from "react";
import { RoomOccupancy } from "~/features/schedules/room-occupancy";
import {
  EditIcon,
  LockIcon,
  PlusIcon,
  TrashIcon,
  UserSmallIcon,
} from "~/components/ui/icons";
import { ConfirmDialog } from "~/components/ui/modal";
import { useDragScroll } from "~/hooks/use-drag-scroll";
import { ClassModeTag, SessionTag } from "./session-tag";
import { timeToMinutes } from "~/lib/time";

import {
  DAYS,
  DAY_STYLES,
  ROOM_COL_W,
  SLOT_COL_W,
  buildDayCells,
  buildTimeSlots,
  entryTypeStyle,
  type Classroom,
  type DayCell,
  type DayOfWeek,
  type TimeSlot,
} from "./mapping-model";

const mappingTh =
  "sticky top-0 z-10 will-change-transform [transform:translateZ(0)] border-r-2 border-b-2 border-slate-300 bg-slate-50 px-3 py-2 text-left font-body text-[0.65rem] font-bold uppercase tracking-wider text-slate-500 dark:border-white/10 dark:bg-surface-raised dark:text-slate-400";
const mappingSlotTh =
  "sticky top-0 z-[5] align-middle text-center will-change-transform [transform:translateZ(0)] border-r border-b-2 border-slate-300 bg-slate-50 px-3 py-2 font-body text-[0.65rem] font-bold uppercase tracking-wider text-slate-500 dark:border-white/10 dark:bg-surface-raised dark:text-slate-400";

type MappingTableViewProps = {
  classrooms: Classroom[];
  onEntryClick?: (entry: Classroom["entries"][number], anchor: DOMRect) => void;
  onEntrySelect?: (
    entry: Classroom["entries"][number],
    event: React.MouseEvent<HTMLButtonElement>,
  ) => void;
  onEntryDelete?: (entry: Classroom["entries"][number]) => void;
  onFreeSlotClick?: (
    room: Classroom,
    day: string,
    slot: TimeSlot,
    event: React.MouseEvent<HTMLButtonElement>,
  ) => void;
  onLabSlotSelect?: (
    room: Classroom,
    day: string,
    slot: TimeSlot,
    event: React.MouseEvent<HTMLButtonElement>,
  ) => void;
  onFreeSlotMouseDown?: (
    room: Classroom,
    day: string,
    slot: TimeSlot,
    event: React.MouseEvent<HTMLButtonElement>,
  ) => void;
  onFreeSlotMouseEnter?: (
    room: Classroom,
    day: string,
    slot: TimeSlot,
    event: React.MouseEvent<HTMLButtonElement>,
  ) => void;
  selectedRange?: {
    roomId: string;
    day: string;
    startTime: string;
    endTime: string;
  } | null;
  selectedScheduleId?: number | null;
  abbreviateDays?: boolean;
  dayColumnWidth?: number;
  embedded?: boolean;
  labTimeSlots?: { startTime: string; endTime: string }[];
  showOverlappingEntries?: boolean;
  extraRows?: Record<string, number>;
  onAddRow?: (group: Classroom, day: string) => void;
  onDeleteRow?: (group: Classroom, day: string) => void;
  onDeleteRowEntries?: (
    group: Classroom,
    day: string,
    entries: Classroom["entries"],
  ) => Promise<void> | void;
  canEditRows?: (group: Classroom) => boolean;
};

type SlotHandler = (
  room: Classroom,
  day: string,
  slot: TimeSlot,
  event: React.MouseEvent<HTMLButtonElement>,
) => void;

export function rowKey(groupId: string, day: string): string {
  return `${groupId}:${day}`;
}

function splitIntoOverlapLanes(entries: Classroom["entries"] | undefined) {
  const lanes: Classroom["entries"][] = [];
  const sorted = [...(entries ?? [])].sort(
    (left, right) => timeToMinutes(left.startTime) - timeToMinutes(right.startTime),
  );
  for (const entry of sorted) {
    const lane = lanes.find((items) =>
      items.every(
        (other) =>
          timeToMinutes(other.endTime) <= timeToMinutes(entry.startTime) ||
          timeToMinutes(other.startTime) >= timeToMinutes(entry.endTime),
      ),
    );
    if (lane) lane.push(entry);
    else lanes.push([entry]);
  }
  return lanes.length > 0 ? lanes : [[]];
}

export function MappingTableView({
  classrooms,
  onEntryClick,
  onEntrySelect,
  onEntryDelete,
  onFreeSlotClick,
  onLabSlotSelect,
  onFreeSlotMouseDown,
  onFreeSlotMouseEnter,
  selectedRange,
  selectedScheduleId,
  abbreviateDays = true,
  dayColumnWidth = 64,
  embedded = false,
  labTimeSlots = [],
  showOverlappingEntries = false,
  extraRows,
  onAddRow,
  onDeleteRow,
  onDeleteRowEntries,
  canEditRows,
}: MappingTableViewProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  useDragScroll(scrollRef);

  const [pendingRowDelete, setPendingRowDelete] = useState<{
    group: Classroom;
    day: string;
    rowCount: number;
    entries: Classroom["entries"];
  } | null>(null);

  const [selectedLane, setSelectedLane] = useState<{
    roomId: string;
    day: string;
    lane: number;
  } | null>(null);

  useEffect(() => {
    const element = scrollRef.current;
    if (!element) return;
    const containBoundaryScroll = (event: WheelEvent) => {
      const atTop = element.scrollTop <= 0;
      const atBottom =
        element.scrollTop + element.clientHeight >= element.scrollHeight - 1;
      if ((event.deltaY < 0 && atTop) || (event.deltaY > 0 && atBottom)) {
        event.preventDefault();
      }
    };
    element.addEventListener("wheel", containBoundaryScroll, {
      passive: false,
    });
    return () => element.removeEventListener("wheel", containBoundaryScroll);
  }, []);

  const slots = useMemo(() => buildTimeSlots(classrooms), [classrooms]);

  const activeLane =
    selectedLane &&
    selectedRange &&
    selectedLane.roomId === selectedRange.roomId &&
    selectedLane.day === selectedRange.day
      ? selectedLane.lane
      : null;

  const rememberLane = (
    handler: SlotHandler | undefined,
    lane: number,
  ): SlotHandler | undefined =>
    handler
      ? (group, day, slot, event) => {
          setSelectedLane({ roomId: group.id, day, lane });
          handler(group, day, slot, event);
        }
      : undefined;

  const laneCountFor = (group: Classroom, day: string, autoLanes: number) =>
    Math.max(autoLanes, 1 + (extraRows?.[rowKey(group.id, day)] ?? 0));

  const rowControlsActive = Boolean(canEditRows) && classrooms.some((group) => {
    if (!canEditRows?.(group)) return false;
    return DAYS.some((day) => {
      const dayEntries = group.entries.filter((entry) => entry.day === day);
      const autoLanes = showOverlappingEntries
        ? splitIntoOverlapLanes(dayEntries).length
        : 1;
      return laneCountFor(group, day, autoLanes) > autoLanes;
    });
  });
  const DELETE_COL_W = 44;

  return (
    <>
      <div
        ref={scrollRef}
        className={`relative z-0 overflow-auto overscroll-none bg-white dark:bg-white/5 ${embedded ? "rounded-none border-0" : "rounded-xl border border-slate-300 dark:border-white/10"}`}
        style={{
          maxHeight: "70vh",
          scrollbarWidth: "none",
          overflowAnchor: "none",
          overscrollBehavior: "none",
          scrollBehavior: "auto",
        }}
      >
        <table
          className="text-sm"
          style={{
            borderSpacing: 0,
            borderCollapse: "separate",
            tableLayout: "fixed",
            width:
              ROOM_COL_W +
              dayColumnWidth +
              slots.length * SLOT_COL_W +
              (rowControlsActive ? DELETE_COL_W : 0),
          }}
        >
          <colgroup>
            <col style={{ width: ROOM_COL_W }} />
            <col style={{ width: dayColumnWidth }} />
            {slots.map((_, idx) => (
              <col key={idx} style={{ width: SLOT_COL_W }} />
            ))}
            {rowControlsActive ? <col style={{ width: DELETE_COL_W }} /> : null}
          </colgroup>
          <thead data-drag-scroll-ignore className="cursor-default select-none">
            <tr>
              <th className={`sticky top-0 left-0 z-10 ${mappingTh}`}>Room</th>
              <th
                className={`${mappingTh} ${abbreviateDays ? "!text-center" : ""}`}
                style={{ left: ROOM_COL_W }}
              >
                Day
              </th>
              {slots.map((slot, idx) => (
                <th key={idx} className={mappingSlotTh}>
                  {slot.start}
                  <span className="mx-0.5 text-slate-300 dark:text-slate-600">
                    –
                  </span>
                  {slot.end}
                </th>
              ))}
              {rowControlsActive ? (
                <th className={mappingSlotTh} aria-label="Remove row" />
              ) : null}
            </tr>
          </thead>
          {classrooms.map((room, roomIdx) => (
            <tbody key={room.id}>
              {roomIdx > 0 && (
                <tr>
                  <td
                    colSpan={slots.length + 2 + (rowControlsActive ? 1 : 0)}
                    className="border-t-2 border-slate-200 dark:border-white/10"
                    aria-hidden="true"
                  />
                </tr>
              )}
              {DAYS.flatMap((day) => {
                const dayEntries = room.entries.filter((entry) => entry.day === day);
                const lanes = showOverlappingEntries
                  ? splitIntoOverlapLanes(dayEntries)
                  : [dayEntries];
                const total = laneCountFor(room, day, lanes.length);
                const padded = Array.from(
                  { length: total },
                  (_, index) => lanes[index] ?? [],
                );
                return padded.map((entries, laneIndex) => ({
                  day,
                  entries,
                  laneIndex,
                  addedFromLane: lanes.length,
                  dayRowSpan: total,
                }));
              }).map(({ day, entries, laneIndex, addedFromLane, dayRowSpan }, rowIndex, roomRows) => (
                <RoomDayRow
                  key={`${room.id}-${day}-${laneIndex}`}
                  room={room}
                  day={day}
                  slots={slots}
                  showRoomCell={rowIndex === 0}
                  roomRowSpan={roomRows.length}
                  rowControlsActive={rowControlsActive}
                  canEditRows={canEditRows?.(room) ?? false}
                  addedFromLane={addedFromLane}
                  dayRowCount={dayRowSpan}
                  canDeleteRowEntries={Boolean(onDeleteRowEntries)}
                  onAddRow={onAddRow}
                  onDeleteRow={
                    onDeleteRow
                      ? (group, dayOfWeek) =>
                          setPendingRowDelete({
                            group,
                            day: dayOfWeek,
                            rowCount: dayRowSpan,
                            entries,
                          })
                      : undefined
                  }
                  showDayCell={laneIndex === 0}
                  dayRowSpan={dayRowSpan}
                  entries={entries}
                  onEntryClick={onEntryClick}
                  onEntrySelect={onEntrySelect}
                  onEntryDelete={onEntryDelete}
                  labTimeSlots={labTimeSlots}
                  onFreeSlotClick={rememberLane(onFreeSlotClick, laneIndex)}
                  onLabSlotSelect={rememberLane(onLabSlotSelect, laneIndex)}
                  onFreeSlotMouseDown={rememberLane(onFreeSlotMouseDown, laneIndex)}
                  onFreeSlotMouseEnter={onFreeSlotMouseEnter}
                  laneIndex={laneIndex}
                  activeLane={activeLane}
                  selectedRange={selectedRange}
                  selectedScheduleId={selectedScheduleId}
                  abbreviateDays={abbreviateDays}
                />
              ))}
            </tbody>
          ))}
        </table>
      </div>
      <ConfirmDialog
        open={pendingRowDelete !== null}
        onClose={() => setPendingRowDelete(null)}
        title={
          (pendingRowDelete?.entries.length ?? 0) > 0
            ? "Remove this row and its meetings?"
            : "Remove a row?"
        }
        confirmLabel={
          (pendingRowDelete?.entries.length ?? 0) > 0
            ? `Remove row and ${pendingRowDelete?.entries.length} meeting${pendingRowDelete?.entries.length === 1 ? "" : "s"}`
            : "Remove row"
        }
        loadingLabel="Removing…"
        confirmVariant="danger"
        onConfirm={async () => {
          if (!pendingRowDelete) return;
          const { group, day, rowCount, entries: rowEntries } = pendingRowDelete;
          if (rowEntries.length > 0) {
            await onDeleteRowEntries?.(group, day, rowEntries);
          }
          onDeleteRow?.(group, day);
          setSelectedLane((current) =>
            current &&
            current.roomId === group.id &&
            current.day === day &&
            current.lane >= rowCount - 1
              ? null
              : current,
          );
        }}
      >
        <div className="flex flex-col gap-3">
          <p>
            <span className="font-semibold text-navy-800 dark:text-mist-100">
              {pendingRowDelete?.day}
            </span>{" "}
            under{" "}
            <span className="font-semibold text-navy-800 dark:text-mist-100">
              {pendingRowDelete?.group.name}
            </span>{" "}
            drops from{" "}
            <span className="font-semibold text-navy-800 dark:text-mist-100">
              {pendingRowDelete?.rowCount}
            </span>{" "}
            rows to{" "}
            <span className="font-semibold text-navy-800 dark:text-mist-100">
              {(pendingRowDelete?.rowCount ?? 1) - 1}
            </span>
            .
          </p>
          {(pendingRowDelete?.entries.length ?? 0) > 0 ? (
            <>
              <p>
                These{" "}
                <span className="font-semibold text-red-700 dark:text-red-300">
                  {pendingRowDelete?.entries.length} meeting
                  {pendingRowDelete?.entries.length === 1 ? "" : "s"}
                </span>{" "}
                go with it, permanently:
              </p>
              <ul className="flex flex-col gap-1 rounded-lg border border-red-200 bg-red-50/60 px-3 py-2 dark:border-red-400/25 dark:bg-red-400/10">
                {pendingRowDelete?.entries.map((entry, index) => (
                  <li
                    key={entry.scheduleId ?? index}
                    className="font-body text-xs text-slate-700 dark:text-slate-200"
                  >
                    <span className="font-semibold">{entry.subjectCode}</span>
                    {" · "}
                    {entry.section}
                    {" · "}
                    {entry.startTime}–{entry.endTime}
                  </li>
                ))}
              </ul>
            </>
          ) : (
            <p>
              Rows are a working view, and this one is empty — nothing
              scheduled is lost. Press + to lay one out again.
            </p>
          )}
        </div>
      </ConfirmDialog>
    </>
  );
}

function RoomDayRow({
  room,
  day,
  slots,
  showRoomCell,
  roomRowSpan,
  showDayCell,
  dayRowSpan,
  entries,
  onEntryClick,
  onEntrySelect,
  onEntryDelete,
  onFreeSlotClick,
  onLabSlotSelect,
  onFreeSlotMouseDown,
  onFreeSlotMouseEnter,
  selectedRange,
  selectedScheduleId,
  abbreviateDays,
  labTimeSlots = [],
  rowControlsActive,
  canEditRows,
  addedFromLane,
  dayRowCount,
  canDeleteRowEntries,
  laneIndex,
  activeLane,
  onAddRow,
  onDeleteRow,
}: {
  room: Classroom;
  day: DayOfWeek;
  slots: TimeSlot[];
  showRoomCell: boolean;
  roomRowSpan: number;
  showDayCell: boolean;
  dayRowSpan: number;
  entries?: Classroom["entries"];
  onEntryClick?: MappingTableViewProps["onEntryClick"];
  onEntrySelect?: MappingTableViewProps["onEntrySelect"];
  onEntryDelete?: MappingTableViewProps["onEntryDelete"];
  onFreeSlotClick?: MappingTableViewProps["onFreeSlotClick"];
  onLabSlotSelect?: MappingTableViewProps["onLabSlotSelect"];
  onFreeSlotMouseDown?: MappingTableViewProps["onFreeSlotMouseDown"];
  onFreeSlotMouseEnter?: MappingTableViewProps["onFreeSlotMouseEnter"];
  selectedRange?: MappingTableViewProps["selectedRange"];
  selectedScheduleId?: number | null;
  abbreviateDays: boolean;
  labTimeSlots?: { startTime: string; endTime: string }[];
  rowControlsActive?: boolean;
  canEditRows?: boolean;
  addedFromLane: number;
  dayRowCount: number;
  canDeleteRowEntries: boolean;
  laneIndex: number;
  activeLane: number | null;
  onAddRow?: MappingTableViewProps["onAddRow"];
  onDeleteRow?: MappingTableViewProps["onDeleteRow"];
}) {
  const ds = DAY_STYLES[day];
  const baseCells = buildDayCells(day, entries ?? room.entries, slots);
  type RenderCell =
    | Extract<DayCell, { kind: "class" }>
    | (Extract<DayCell, { kind: "empty" }> & {
        colspan?: number;
        assignLab?: boolean;
      });
  const cells: RenderCell[] = [];
  for (let index = 0; index < baseCells.length; index += 1) {
    const cell = baseCells[index];
    if (room.roomType === "Laboratory" && cell.kind === "empty") {
      const configured = labTimeSlots.find(
        (item) =>
          timeToMinutes(item.startTime) === timeToMinutes(cell.slot.start),
      );
      if (configured) {
        const span = slots.filter(
          (slot) =>
            timeToMinutes(slot.start) >= timeToMinutes(configured.startTime) &&
            timeToMinutes(slot.end) <= timeToMinutes(configured.endTime),
        ).length;
        const group = baseCells.slice(index, index + span);
        if (span > 0 && group.every((item) => item.kind === "empty")) {
          cells.push({
            ...cell,
            colspan: span,
            assignLab: true,
          });
          index += span - 1;
          continue;
        }
      }
    }
    cells.push(cell);
  }

  return (
    <tr className="transition-colors hover:bg-slate-50 dark:hover:bg-white/5">
      {showRoomCell && (
        <td
          data-drag-scroll-ignore
          rowSpan={roomRowSpan}
          className="sticky left-0 z-[5] border-r-2 border-b border-slate-200 bg-white px-3 py-2 align-middle text-center dark:border-white/10 dark:bg-slate-900"
        >
          <span className="block font-display text-base tracking-tight text-slate-800 dark:text-mist-100">
            {room.name}
          </span>
          <span className="mt-1 inline-flex items-center gap-1 rounded-md bg-slate-100 px-2 py-0.5 font-body text-[0.65rem] text-slate-500 dark:bg-white/10 dark:text-slate-400">
            <UserSmallIcon />
            {room.entries.length} class{room.entries.length !== 1 ? "es" : ""}
          </span>
          {room.note ? (
            <span className="mt-1 block font-body text-[0.6rem] leading-tight text-slate-500 dark:text-slate-400">
              {room.note}
            </span>
          ) : null}
        </td>
      )}
      {showDayCell ? (
        <td
          data-drag-scroll-ignore
          rowSpan={dayRowSpan}
          className={`sticky z-[5] border-r-2 border-b border-slate-200 bg-white px-3 py-2 align-middle font-body text-xs font-bold uppercase tracking-widest dark:border-white/10 dark:bg-slate-900 ${abbreviateDays ? "text-center" : ""} ${ds.color}`}
          style={{ left: ROOM_COL_W }}
        >
          <span className="flex flex-col items-center gap-1">
            <span aria-label={day}>{abbreviateDays ? day.slice(0, 3) : day}</span>
            {canEditRows && onAddRow ? (
              <button
                type="button"
                onClick={() => onAddRow(room, day)}
                title={`Add a row to ${day}`}
                aria-label={`Add a row to ${day}`}
                className="flex h-5 w-5 shrink-0 cursor-pointer items-center justify-center rounded-md border border-slate-300 bg-white p-0 text-slate-500 transition-colors hover:border-gold-400 hover:text-navy-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-400 dark:border-white/15 dark:bg-white/5 dark:text-slate-300 dark:hover:text-white [&_svg]:h-3 [&_svg]:w-3"
              >
                <PlusIcon />
              </button>
            ) : null}
          </span>
        </td>
      ) : null}
      {cells.map((cell, idx) => {
        if (cell.kind === "class") {
          const s = entryTypeStyle(cell.entry);
          const showEntryActions = Boolean(
            cell.entry.scheduleId && (onEntryClick || onEntryDelete),
          );
          const entryLocked = cell.entry.isEditable === false;
          const isSelectedEntry =
            cell.entry.scheduleId != null &&
            cell.entry.scheduleId === selectedScheduleId;
          return (
            <td
              data-drag-scroll-surface
              key={idx}
              colSpan={cell.colspan}
              className={`relative border-r border-b border-l-[3px] border-slate-200 p-0 align-top dark:border-white/10 ${s.card} ${s.border}`}
            >
              <button
                type="button"
                data-schedule-id={cell.entry.scheduleId}
                disabled={!onEntrySelect}
                aria-pressed={isSelectedEntry}
                className={`h-full min-h-20 w-full p-2 text-left transition-colors ${showEntryActions ? "pr-16" : ""}`}
                onClick={(event) => onEntrySelect?.(cell.entry, event)}
              >
                <span className="flex flex-wrap items-center gap-x-1.5 gap-y-1">
                  <span
                    className={`font-body text-[0.78rem] font-bold leading-tight ${s.code}`}
                  >
                    {cell.entry.subjectCode}
                    <span className="font-medium text-slate-600 dark:text-slate-300">
                      {" "}
                      — {cell.entry.descriptiveTitle}
                    </span>
                  </span>
                  {cell.entry.isDraft ? (
                    <span className="rounded border border-slate-300 bg-slate-50 px-1 py-0.5 font-body text-[0.55rem] font-bold uppercase leading-none tracking-wide text-slate-600 dark:border-white/15 dark:bg-white/5 dark:text-slate-300">
                      Draft
                    </span>
                  ) : null}
                  {cell.entry.classMode ? (
                    <ClassModeTag mode={cell.entry.classMode} />
                  ) : null}
                  {cell.entry.sessionMode ? (
                    <SessionTag mode={cell.entry.sessionMode} />
                  ) : null}
                  {cell.entry.isConflict ? (
                    <span className="rounded-md border border-red-300 bg-red-50 px-1 py-0.5 font-body text-[0.55rem] font-bold uppercase leading-none tracking-wide text-red-700 dark:border-red-400/30 dark:bg-red-400/10 dark:text-red-300">
                      Conflict
                    </span>
                  ) : null}
                </span>
                <span className="mt-1 block font-body text-[0.78rem] font-medium leading-snug text-slate-500 dark:text-slate-400">
                  {cell.entry.instructor}
                </span>
                <span className="mt-0.5 flex flex-wrap items-baseline gap-x-1.5 font-body text-[0.78rem] font-semibold leading-snug text-slate-400 dark:text-slate-500">
                  <span>{cell.entry.section}</span>
                  <RoomOccupancy
                    studentCount={cell.entry.studentCount}
                    roomCapacity={cell.entry.roomCapacity}
                    compact
                    sizeClassName="text-[0.78rem]"
                  />
                </span>
                {cell.entry.department ? (
                  <span className="mt-0.5 block font-body text-[0.61rem] font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                    {cell.entry.department}
                  </span>
                ) : null}
                {cell.hiddenCount > 0 && (
                  <span className="mt-0.5 block font-body text-[0.65rem] font-semibold text-slate-400 dark:text-slate-500">
                    +{cell.hiddenCount} more
                  </span>
                )}
              </button>
              {showEntryActions ? (
                <span className="absolute right-1.5 top-1.5 z-[2] flex gap-1">
                  <button
                    type="button"
                    disabled={entryLocked || !onEntryClick}
                    aria-label={entryLocked ? "Edit locked for this schedule" : "Edit schedule details"}
                    className="relative grid size-6 place-items-center rounded-md bg-white/80 text-blue-700 shadow-sm hover:bg-blue-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-400 disabled:cursor-not-allowed disabled:text-slate-400 dark:bg-surface-raised/80 dark:text-blue-300 dark:disabled:text-slate-500"
                    onClick={(event) => {
                      event.stopPropagation();
                      onEntryClick?.(
                        cell.entry,
                        event.currentTarget.getBoundingClientRect(),
                      );
                    }}
                  >
                    <EditIcon />
                    {entryLocked ? (
                      <span className="pointer-events-none absolute inset-0 grid place-items-center rounded-md bg-white/65 text-slate-600 dark:bg-surface-raised/70 dark:text-slate-300">
                        <LockIcon size={11} />
                      </span>
                    ) : null}
                  </button>
                  <button
                    type="button"
                    disabled={entryLocked || !onEntryDelete}
                    aria-label={entryLocked ? "Delete locked for this schedule" : "Delete schedule"}
                    className="relative grid size-6 place-items-center rounded-md bg-white/80 text-red-600 shadow-sm hover:bg-red-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-400 disabled:cursor-not-allowed disabled:text-slate-400 dark:bg-surface-raised/80 dark:text-red-300 dark:disabled:text-slate-500"
                    onClick={(event) => {
                      event.stopPropagation();
                      onEntryDelete?.(cell.entry);
                    }}
                  >
                    <TrashIcon />
                    {entryLocked ? (
                      <span className="pointer-events-none absolute inset-0 grid place-items-center rounded-md bg-white/65 text-slate-600 dark:bg-surface-raised/70 dark:text-slate-300">
                        <LockIcon size={11} />
                      </span>
                    ) : null}
                  </button>
                </span>
              ) : null}
              {isSelectedEntry ? (
                <span
                  className={`pointer-events-none absolute inset-0 z-[3] ring-2 ring-inset ${cell.entry.isConflict
                    ? "ring-red-500 shadow-[inset_0_0_0_4px_rgba(250,204,21,0.78)]"
                    : "ring-gold-400"}`}
                />
              ) : null}
              {cell.entry.isConflict && !isSelectedEntry ? (
                <span className="pointer-events-none absolute inset-0 z-[3] ring-2 ring-inset ring-red-500" />
              ) : null}
            </td>
          );
        }
        const isSelected =
          selectedRange?.roomId === room.id &&
          selectedRange.day === day &&
          (activeLane === null || activeLane === laneIndex) &&
          timeToMinutes(cell.slot.start) >=
            timeToMinutes(selectedRange.startTime) &&
          timeToMinutes(cell.slot.end) <= timeToMinutes(selectedRange.endTime);
        return (
          <td
            data-drag-scroll-surface
            key={idx}
            colSpan={"colspan" in cell ? cell.colspan : undefined}
            className={`relative border-r border-b border-slate-200 p-0 text-center font-body text-[0.72rem] italic text-slate-300 transition-colors dark:border-white/10 dark:text-slate-600 ${isSelected ? "bg-amber-100 dark:bg-gold-400/20" : "hover:bg-sky-50 dark:hover:bg-sky-400/5"}`}
          >
            {cell.assignLab ? (
              <div
                className={`relative flex min-h-20 items-center justify-center gap-1.5 font-semibold not-italic text-blue-700 transition-colors dark:text-blue-300 ${isSelected ? "text-amber-800 dark:text-gold-300" : ""}`}
              >
                <button
                  type="button"
                  disabled={!onLabSlotSelect}
                  aria-label="Select laboratory timetable"
                  aria-pressed={isSelected}
                  className="absolute inset-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-gold-400 disabled:opacity-50"
                  onClick={(event) =>
                    onLabSlotSelect?.(room, day, cell.slot, event)
                  }
                />
                <button
                  type="button"
                  disabled={!onFreeSlotClick}
                  aria-label="Assign schedule"
                  aria-pressed={isSelected}
                  className="relative z-[1] grid size-7 place-items-center rounded-md hover:bg-sky-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-400 disabled:opacity-50 dark:hover:bg-sky-400/10"
                  onClick={(event) => {
                    event.stopPropagation();
                    onFreeSlotClick?.(room, day, cell.slot, event);
                  }}
                >
                  <EditIcon />
                </button>
                <span className="pointer-events-none relative z-[1]">
                  Assign schedule
                </span>
              </div>
            ) : (
              <button
                type="button"
                disabled={!onFreeSlotClick}
                aria-pressed={isSelected}
                className={`h-full min-h-20 w-full transition-colors focus:outline-none ${isSelected ? "not-italic text-amber-800 dark:text-gold-300" : ""}`}
                onMouseDown={(event) =>
                  onFreeSlotMouseDown?.(room, day, cell.slot, event)
                }
                onMouseEnter={(event) =>
                  onFreeSlotMouseEnter?.(room, day, cell.slot, event)
                }
                onClick={(event) =>
                  onFreeSlotClick?.(room, day, cell.slot, event)
                }
              >
                Free
              </button>
            )}
            {isSelected ? (
              <span className="pointer-events-none absolute inset-0 z-[3] ring-2 ring-inset ring-gold-400" />
            ) : null}
          </td>
        );
      })}
      {rowControlsActive ? (
        <td data-drag-scroll-ignore className="border-b border-slate-200 px-1 text-center align-middle dark:border-white/10">
          {canEditRows &&
          onDeleteRow &&
          dayRowCount > addedFromLane &&
          ((entries ?? []).length === 0 ||
            (canDeleteRowEntries &&
              (entries ?? []).every((entry) => entry.isEditable !== false))) ? (
            <button
              type="button"
              onClick={() => onDeleteRow(room, day)}
              title={`Remove a row from ${day}`}
              aria-label={`Remove a row from ${day}`}
              className="mx-auto flex h-5 w-5 cursor-pointer items-center justify-center rounded-md border border-transparent font-body text-sm leading-none text-slate-400 transition-colors hover:border-red-300 hover:bg-red-50 hover:text-red-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-400 dark:text-slate-500 dark:hover:border-red-400/30 dark:hover:bg-red-400/10 dark:hover:text-red-300"
            >
              ×
            </button>
          ) : null}
        </td>
      ) : null}
    </tr>
  );
}
