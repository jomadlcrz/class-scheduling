import { useRef } from "react";
import { Card } from "~/components/ui/card";
import { ChevronRightIcon, LayoutIcon, UserSmallIcon } from "~/components/ui/icons";
import { useDragScroll } from "~/hooks/use-drag-scroll";
import { ClassCard, FreeCell, StatusBadge } from "./class-card";
import {
  DAYS, DAY_STYLES, TIME_SLOTS, buildDayCells,
  type Classroom,
} from "./mapping-model";

type MappingGridViewProps = {
  classrooms: Classroom[];
  openRooms: Set<string>;
  onToggle: (id: string) => void;
};

export function MappingGridView({ classrooms, openRooms, onToggle }: MappingGridViewProps) {
  return (
    <div className="mt-3 flex flex-col gap-3">
      {classrooms.map((room) => (
        <RoomAccordion
          key={room.id}
          room={room}
          isOpen={openRooms.has(room.id)}
          onToggle={() => onToggle(room.id)}
        />
      ))}
    </div>
  );
}

function RoomAccordion({
  room,
  isOpen,
  onToggle,
}: {
  room: Classroom;
  isOpen: boolean;
  onToggle: () => void;
}) {
  const classCount = room.entries.length;

  return (
    <Card className="overflow-hidden dark:bg-slate-900/60">
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={isOpen}
        className="flex w-full cursor-pointer items-center gap-3 px-5 py-4 text-left transition-colors hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-blue-500 dark:hover:bg-white/5"
      >
        <span className="flex items-center gap-1 text-slate-400 dark:text-slate-500">
          <LayoutIcon />
        </span>
        <span className="font-display text-lg tracking-tight text-slate-800 dark:text-white">
          {room.name}
        </span>
        <StatusBadge status={room.status} />
        <span className="ml-1 inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-0.5 font-body text-xs text-slate-500 dark:bg-white/10 dark:text-slate-400">
          <UserSmallIcon />
          {classCount} class{classCount !== 1 ? "es" : ""}
        </span>
        <span
          aria-hidden="true"
          className={`ml-auto text-slate-400 transition-transform duration-200 dark:text-slate-500 ${isOpen ? "rotate-90" : ""}`}
        >
          <ChevronRightIcon />
        </span>
      </button>
      {isOpen && (
        <div className="border-t border-slate-300 dark:border-white/10">
          <TimetableGrid room={room} />
        </div>
      )}
    </Card>
  );
}

function TimetableGrid({ room }: { room: Classroom }) {
  const scrollRef = useRef<HTMLDivElement>(null);
  useDragScroll(scrollRef);

  const gridCols = `repeat(${TIME_SLOTS.length}, minmax(170px, 1fr))`;

  return (
    <div
      ref={scrollRef}
      className="overflow-x-auto pb-2"
      style={{ cursor: "grab", scrollbarWidth: "none" }}
    >
      <div className="grid min-w-max" style={{ gridTemplateColumns: gridCols }}>
        {DAYS.map((day, di) => {
          const ds = DAY_STYLES[day];
          const cells = buildDayCells(day, room.entries, TIME_SLOTS);
          return (
            <div key={day} style={{ display: "contents" }}>
              <div
                className={`py-1.5 ${di > 0 ? "border-t border-slate-100 dark:border-white/10" : ""}`}
                style={{ gridColumn: `1 / ${TIME_SLOTS.length + 1}` }}
              >
                <span
                  className={`inline-block rounded px-2.5 py-0.5 font-body text-[0.68rem] font-bold uppercase tracking-widest ${ds.color} ${ds.bg}`}
                  style={{ position: "sticky", left: "1rem" }}
                >
                  {day}
                </span>
              </div>
              {cells.map((cell, idx) => (
                <div
                  key={`${day}-cell-${idx}`}
                  style={{ gridColumn: `span ${cell.kind === "class" ? cell.colspan : 1}` }}
                  className={`border-t border-slate-200 p-1.5 dark:border-white/8 ${idx > 0 ? "border-l border-slate-200 dark:border-white/8" : "border-l-0"}`}
                >
                  {cell.kind === "class" ? (
                    <ClassCard entry={cell.entry} />
                  ) : (
                    <FreeCell slot={cell.slot} />
                  )}
                </div>
              ))}
            </div>
          );
        })}
      </div>
    </div>
  );
}
