import { useMemo, useRef } from "react";
import { useDragScroll } from "~/hooks/use-drag-scroll";
import { StatusBadge } from "./class-card";
import {
  DAYS, DAY_STYLES, ROOM_COL_W, DAY_COL_W, SLOT_COL_W, TYPE_STYLES, buildDayCells, buildTimeSlots,
  type Classroom, type DayOfWeek, type TimeSlot,
} from "./mapping-model";

type MappingTableViewProps = {
  classrooms: Classroom[];
};

export function MappingTableView({ classrooms }: MappingTableViewProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  useDragScroll(scrollRef);

  // One shared header for every room, so columns come from all entries.
  const slots = useMemo(() => buildTimeSlots(classrooms), [classrooms]);

  return (
    <div
      ref={scrollRef}
      className="overflow-auto rounded-xl border border-slate-300 bg-white dark:border-white/10 dark:bg-white/5"
      style={{ maxHeight: "70vh", cursor: "grab", scrollbarWidth: "none" }}
    >
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
          {slots.map((_, idx) => (
            <col key={idx} style={{ width: SLOT_COL_W }} />
          ))}
        </colgroup>
        <thead>
          <tr>
            <th className="sticky top-0 left-0 z-30 border-r-2 border-b-2 border-slate-300 bg-slate-50 px-3 py-2 text-left font-body text-[0.65rem] font-bold uppercase tracking-wider text-slate-500 dark:border-white/10 dark:bg-navy-900 dark:text-slate-400">
              Room
            </th>
            <th className="sticky top-0 z-30 border-r-2 border-b-2 border-slate-300 bg-slate-50 px-3 py-2 text-left font-body text-[0.65rem] font-bold uppercase tracking-wider text-slate-500 dark:border-white/10 dark:bg-navy-900 dark:text-slate-400"
              style={{ left: ROOM_COL_W }}>
              Day
            </th>
            {slots.map((slot, idx) => (
              <th key={idx} className="sticky top-0 z-20 border-r border-b-2 border-slate-300 bg-slate-50 px-3 py-2 text-left font-body text-[0.65rem] font-bold uppercase tracking-wider text-slate-500 dark:border-white/10 dark:bg-navy-900 dark:text-slate-400">
                {slot.start}
                <span className="mx-0.5 text-slate-300 dark:text-slate-600">–</span>
                {slot.end}
              </th>
            ))}
          </tr>
        </thead>
        {classrooms.map((room, roomIdx) => (
          <tbody key={room.id}>
            {roomIdx > 0 && (
              <tr>
                <td colSpan={slots.length + 2} className="border-t-2 border-slate-200 dark:border-white/10" aria-hidden="true" />
              </tr>
            )}
            {DAYS.map((day, dayIdx) => (
              <RoomDayRow key={`${room.id}-${day}`} room={room} day={day} slots={slots} showRoomCell={dayIdx === 0} />
            ))}
          </tbody>
        ))}
      </table>
    </div>
  );
}

function RoomDayRow({ room, day, slots, showRoomCell }: {
  room: Classroom;
  day: DayOfWeek;
  slots: TimeSlot[];
  showRoomCell: boolean;
}) {
  const ds = DAY_STYLES[day];
  const cells = buildDayCells(day, room.entries, slots);

  return (
    <tr className="transition-colors hover:bg-slate-50 dark:hover:bg-white/5">
      {showRoomCell && (
        <td rowSpan={DAYS.length} className="sticky left-0 z-10 border-r-2 border-b border-slate-200 bg-white px-3 py-2 align-middle text-center dark:border-white/10 dark:bg-slate-900">
          <span className="block font-display text-base tracking-tight text-slate-800 dark:text-white">
            {room.name}
          </span>
          <span className="mt-1 inline-block">
            <StatusBadge status={room.status} />
          </span>
        </td>
      )}
      <td className={`sticky z-10 border-r-2 border-b border-slate-200 bg-white px-3 py-2 align-middle font-body text-xs font-bold uppercase tracking-widest dark:border-white/10 dark:bg-slate-900 ${ds.color}`}
        style={{ left: ROOM_COL_W }}>
        {day}
      </td>
      {cells.map((cell, idx) => {
        if (cell.kind === "class") {
          const s = TYPE_STYLES[cell.entry.type];
          return (
            <td key={idx} colSpan={cell.colspan} className={`border-r border-b border-l-[3px] border-slate-200 p-2 align-top dark:border-white/10 ${s.card} ${s.border}`}>
              <span className={`block font-body text-xs font-bold leading-tight ${s.code}`}>
                {cell.entry.subjectCode}
              </span>
              <span className="mt-0.5 block font-body text-[0.7rem] leading-tight text-slate-500 dark:text-slate-400">
                {cell.entry.instructor}
              </span>
              {cell.hiddenCount > 0 && (
                <span className="mt-0.5 block font-body text-[0.65rem] font-semibold text-slate-400 dark:text-slate-500">
                  +{cell.hiddenCount} more
                </span>
              )}
            </td>
          );
        }
        return (
          <td key={idx} className="border-r border-b border-slate-200 p-2 text-center font-body text-[0.72rem] italic text-slate-300 dark:border-white/10 dark:text-slate-600">
            Free
          </td>
        );
      })}
    </tr>
  );
}
