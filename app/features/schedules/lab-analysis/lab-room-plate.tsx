import { AccordionItem } from "~/components/ui/accordion";
import { Badge } from "~/components/ui/badge";
import { Tooltip } from "~/components/ui/tooltip";
import type { LabRoom, LabSession } from "~/types/lab-analysis";
import { yearLevelStyle } from "./year-level-styles";

function programSetLabel(
  programAbbrev: string | null,
  yearLevel: number | null,
  setCode: string | null,
): string | null {
  const parts = [programAbbrev, [yearLevel, setCode].filter((v) => v != null).join("")].filter(Boolean);
  return parts.length > 0 ? parts.join("-") : null;
}

function sessionTooltip(session: LabSession): string {
  const parts = [
    session.subjectCode,
    programSetLabel(session.programAbbrev, session.yearLevel, session.setCode),
    session.instructor,
    session.mode,
  ].filter(Boolean);
  return parts.join(" · ");
}

function SlotCell({ occupiedBy }: { occupiedBy: LabSession[] }) {
  if (occupiedBy.length === 0) {
    return (
      <div className="grid h-14 place-items-center rounded-lg border border-dashed border-slate-300 font-body text-xs uppercase tracking-wide text-slate-400 dark:border-white/15 dark:text-slate-500">
        Free
      </div>
    );
  }

  const [primary, ...rest] = occupiedBy;
  const style = yearLevelStyle(primary.yearLevel);

  return (
    <Tooltip label={sessionTooltip(primary)} wrap>
      <div className={`flex h-14 flex-col justify-center gap-0.5 rounded-lg px-2 py-1 ${style.chip}`}>
        <span className="truncate font-body text-xs font-semibold">{primary.subjectCode ?? "—"}</span>
        <span className="truncate font-body text-[11px] opacity-85">
          {programSetLabel(primary.programAbbrev, primary.yearLevel, primary.setCode)}
          {rest.length > 0 ? ` +${rest.length}` : ""}
        </span>
      </div>
    </Tooltip>
  );
}

export function LabRoomPlate({ room, defaultOpen }: { room: LabRoom; defaultOpen?: boolean }) {
  const { usage } = room;

  return (
    <AccordionItem
      defaultOpen={defaultOpen}
      title={
        <span className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
          <span className="font-display text-lg tracking-tight text-slate-800 dark:text-mist-100">
            {room.roomName}
          </span>
          <span className="font-body text-xs text-slate-500 dark:text-slate-400">
            {[room.building, room.floorLevel != null ? `Floor ${room.floorLevel}` : null]
              .filter(Boolean)
              .join(" · ")}
            {room.roomCapacity ? ` · Capacity ${room.roomCapacity}` : ""}
          </span>
        </span>
      }
      adornment={
        <span className="flex items-center gap-2">
          {room.conflicts.length > 0 && (
            <Badge tone="red">{room.conflicts.length} conflict{room.conflicts.length === 1 ? "" : "s"}</Badge>
          )}
          <Badge tone={usage.slotsFree === 0 ? "red" : "emerald"}>
            {usage.slotsUsed}/{usage.slotCapacity} slots
          </Badge>
        </span>
      }
    >
      <div className="flex flex-col gap-4 p-5">
        <div className="flex flex-wrap items-center gap-2">
          <Badge tone={room.access.isRestricted ? "gold" : "slate"}>
            {room.access.isRestricted
              ? `Restricted: ${room.access.programs.map((p) => p.programAbbrev).join(", ")}`
              : "General-purpose"}
          </Badge>
          <span className="font-body text-xs text-slate-500 dark:text-slate-400">{room.access.note}</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[560px] border-separate border-spacing-1">
            <thead>
              <tr>
                <th className="w-20 text-left font-body text-[11px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                  Day
                </th>
                {room.byDay[0]?.slots.map((slot) => (
                  <th
                    key={slot.slot}
                    className="text-left font-body text-[11px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500"
                  >
                    {slot.slot}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {room.byDay.map((day) => (
                <tr key={day.day}>
                  <td className="font-body text-xs font-medium text-slate-500 dark:text-slate-400">
                    {day.day.slice(0, 3)}
                  </td>
                  {day.slots.map((slot, index) => (
                    <td key={`${day.day}-${index}`}>
                      <SlotCell occupiedBy={slot.occupiedBy} />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {room.byProgram.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {room.byProgram.map((p) => (
              <span
                key={`${p.programId}-${p.programAbbrev}`}
                className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 font-body text-xs text-slate-600 dark:border-white/10 dark:bg-white/5 dark:text-slate-300"
              >
                <span className="font-semibold text-navy-700 dark:text-mist-100">{p.programAbbrev ?? "—"}</span>
                {p.bookedHours}h · {p.sharePercent}%
              </span>
            ))}
          </div>
        )}

        {room.conflicts.length > 0 && (
          <ul className="flex flex-col gap-1">
            {room.conflicts.map((c, i) => (
              <li key={i} className="font-body text-xs text-red-600 dark:text-red-400">
                {c.day} {c.overlap} — {c.detail}
              </li>
            ))}
          </ul>
        )}

        {room.unslottedSessions.length > 0 && (
          <p className="font-body text-xs text-amber-600 dark:text-gold-300">
            {room.unslottedSessions.length} session(s) occupy this room off the configured lab windows.
          </p>
        )}
      </div>
    </AccordionItem>
  );
}
