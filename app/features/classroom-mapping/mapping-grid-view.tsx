import { useMemo, useRef } from "react";
import { Accordion, AccordionItem } from "~/components/ui/accordion";
import { UserSmallIcon } from "~/components/ui/icons";
import { useDragScroll } from "~/hooks/use-drag-scroll";
import { ClassCard, FreeCell } from "./class-card";
import {
  DAYS, DAY_STYLES, buildDayCells, buildTimeSlots,
  type Classroom, type TimeSlot,
} from "./mapping-model";

type MappingGridViewProps = {
  classrooms: Classroom[];
};

export function MappingGridView({ classrooms }: MappingGridViewProps) {
  // Shared across every room so all accordions line up on the same columns.
  const slots = useMemo(() => buildTimeSlots(classrooms), [classrooms]);
  return (
    <Accordion>
      {classrooms.map((room, roomIdx) => (
        <AccordionItem
          key={room.id}
          defaultOpen={roomIdx === 0}
          title={
            <span className="flex items-center gap-3">
              <span className="font-display text-lg tracking-tight text-slate-800 dark:text-white">
                {room.name}
              </span>
            </span>
          }
          adornment={
            <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-0.5 font-body text-xs text-slate-500 dark:bg-white/10 dark:text-slate-400">
              <UserSmallIcon />
              {room.entries.length} class{room.entries.length !== 1 ? "es" : ""}
            </span>
          }
        >
          <TimetableGrid room={room} slots={slots} />
        </AccordionItem>
      ))}
    </Accordion>
  );
}

function TimetableGrid({ room, slots }: { room: Classroom; slots: TimeSlot[] }) {
  const scrollRef = useRef<HTMLDivElement>(null);
  useDragScroll(scrollRef);

  const gridCols = `repeat(${slots.length}, minmax(170px, 1fr))`;

  return (
    <div
      ref={scrollRef}
      className="overflow-x-auto px-5 pb-3 pt-3 [&::-webkit-scrollbar]:hidden"
      style={{ cursor: "grab", scrollbarWidth: "none" }}
    >
      <div className="grid min-w-max" style={{ gridTemplateColumns: gridCols }}>
        {DAYS.map((day, di) => {
          const ds = DAY_STYLES[day];
          const cells = buildDayCells(day, room.entries, slots);
          return (
            <div key={day} style={{ display: "contents" }}>
              <div
                className={`col-span-full border-t-2 border-b px-3 py-1.5 first:border-t-0 ${ds.border} ${ds.color}`}
              >
                <span
                  className="font-body text-xs font-bold uppercase tracking-widest"
                  style={{ position: "sticky", left: "1rem" }}
                >
                  {day}
                </span>
              </div>
              {cells.map((cell, idx) => (
                <div
                  key={`${day}-cell-${idx}`}
                  style={{ gridColumn: `span ${cell.kind === "class" ? cell.colspan : 1}` }}
                  className="border-b border-r border-l border-slate-200 p-2 last:border-r-0 dark:border-white/8"
                >
                  {cell.kind === "class" ? (
                    <ClassCard entry={cell.entry} hiddenCount={cell.hiddenCount} />
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
