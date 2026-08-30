import { memo, useMemo } from "react";
import { Badge } from "~/components/ui/badge";
import { EditIcon, LockIcon, TrashIcon } from "~/components/ui/icons";
import {
  DAY_COL_W,
  DAY_STYLES,
  SLOT_COL_W,
  SUBJECT_TYPES,
  TYPE_STYLES,
  type SubjectType,
} from "~/features/classroom-mapping/mapping-model";
import {
  PROPOSAL_DAY_ROWS,
  SLOT_STARTS,
  TIMETABLE_END_TIME,
  isMeetingChanged,
  type ProposalMeeting,
} from "~/features/schedules/instructor-proposal-model";
import {
  useTimetableSlotSelection,
} from "~/features/schedules/use-timetable-slot-selection";
import { useDays } from "~/hooks/use-days";
import { formatTime12h, timeToMinutes } from "~/lib/time";
import { DAYS, type Day } from "~/types/schedule";

export type ProposalGridSlot = {
  start: string;
  end: string;
  label: string;
};

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

const headerCell = `sticky top-0 z-10 will-change-transform [transform:translateZ(0)] border-r-2 border-b-2 border-slate-300 bg-slate-50 px-3 py-2 text-left font-display text-xs tracking-wide text-slate-600 dark:border-white/10 dark:bg-white/5 dark:text-slate-300`;
const slotHeaderCell = `sticky top-0 z-[5] whitespace-nowrap text-center align-middle will-change-transform [transform:translateZ(0)] border-r border-b-2 border-slate-300 bg-slate-50 px-3 py-2 font-display text-xs tracking-wide text-slate-600 dark:border-white/10 dark:bg-white/5 dark:text-slate-300`;

function buildProposalSlots(entries: { startTime: string; endTime: string }[]): ProposalGridSlot[] {
  const boundaries = new Set<number>([
    ...SLOT_STARTS.map(timeToMinutes),
    timeToMinutes(TIMETABLE_END_TIME),
  ]);
  for (const entry of entries) {
    const start = timeToMinutes(entry.startTime);
    const end = timeToMinutes(entry.endTime);
    if (end <= start) continue;
    boundaries.add(start);
    boundaries.add(end);
  }

  const sorted = [...boundaries].sort((a, b) => a - b);
  const slots: ProposalGridSlot[] = [];
  for (let i = 0; i < sorted.length - 1; i++) {
    const startM = sorted[i];
    const endM = sorted[i + 1];
    const startH = Math.floor(startM / 60);
    const startMin = startM % 60;
    const endH = Math.floor(endM / 60);
    const endMin = endM % 60;
    const start = `${String(startH).padStart(2, "0")}:${String(startMin).padStart(2, "0")}`;
    const end = `${String(endH).padStart(2, "0")}:${String(endMin).padStart(2, "0")}`;
    slots.push({
      start,
      end,
      label: `${formatTime12h(start)}–${formatTime12h(end)}`,
    });
  }
  return slots;
}

export type InstructorProposalGridProps = {
  meetings: ProposalMeeting[];
  originalMeetings: ProposalMeeting[];
  otherMeetings: ProposalMeeting[];
  onCommitSlot: (slot: { dayOfWeek: string; startTime: string; endTime: string }) => void;
  onEditMeeting: (meeting: ProposalMeeting) => void;
  onRemoveMeeting: (meeting: ProposalMeeting) => void;
};

export const InstructorProposalGrid = memo(function InstructorProposalGrid({
  meetings,
  originalMeetings,
  otherMeetings,
  onCommitSlot,
  onEditMeeting,
  onRemoveMeeting,
}: InstructorProposalGridProps) {
  const allEntries = useMemo(
    () => [...meetings, ...otherMeetings].filter((m) => m.placed),
    [meetings, otherMeetings],
  );

  const slots = useMemo(() => buildProposalSlots(allEntries), [allEntries]);

  const {
    selection,
    startSelection,
    hoverSlot,
  } = useTimetableSlotSelection(slots, onCommitSlot);

  const { days: backendDays } = useDays();
  const dayRows = useMemo(() => {
    if (backendDays && backendDays.length > 0) {
      return backendDays.map((d) => ({
        day: (DAYS[d.id] ?? "M") as Day,
        label: d.name,
      }));
    }
    return PROPOSAL_DAY_ROWS;
  }, [backendDays]);

  const originalByScheduleId = useMemo(
    () => new Map(originalMeetings.map((m) => [m.scheduleId, m])),
    [originalMeetings],
  );

  return (
    <div className="overflow-x-auto rounded-xl border border-slate-300 bg-white shadow-xs dark:border-white/10 dark:bg-white/2">
      <table className="w-full border-collapse font-body text-xs select-none">
        <thead>
          <tr>
            <th style={{ width: DAY_COL_W }} className={headerCell}>
              Day
            </th>
            {slots.map((s, idx) => (
              <th
                key={idx}
                style={{ width: SLOT_COL_W }}
                className={slotHeaderCell}
              >
                {s.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-200 dark:divide-white/10">
          {dayRows.map(({ day, label }) => {
            const dayMeetings = allEntries.filter(
              (m) => m.dayOfWeek.trim().toLowerCase() === label.toLowerCase(),
            );
            const dayStyle = DAY_STYLES[day];

            let nextAvailableSlotIdx = 0;

            return (
              <tr key={day} className="h-20">
                <th
                  style={{ width: DAY_COL_W }}
                  className={`border-r-2 border-slate-300 p-3 text-left font-display text-xs tracking-wide text-navy-800 dark:border-white/10 dark:text-mist-100 ${dayStyle?.bg ?? "bg-slate-50 dark:bg-white/5"}`}
                >
                  <div>{label}</div>
                  <div className="font-body text-[10px] text-slate-400 dark:text-slate-500">
                    {dayMeetings.length} {dayMeetings.length === 1 ? "class" : "classes"}
                  </div>
                </th>

                {slots.map((slot, slotIdx) => {
                  if (slotIdx < nextAvailableSlotIdx) {
                    return null;
                  }

                  const startM = timeToMinutes(slot.start);
                  const endM = timeToMinutes(slot.end);

                  const occupyingMeeting = dayMeetings.find((m) => {
                    const mStart = timeToMinutes(m.startTime);
                    const mEnd = timeToMinutes(m.endTime);
                    return startM >= mStart && endM <= mEnd;
                  });

                  if (occupyingMeeting) {
                    const mStart = timeToMinutes(occupyingMeeting.startTime);
                    const mEnd = timeToMinutes(occupyingMeeting.endTime);

                    let span = 0;
                    for (let i = slotIdx; i < slots.length; i++) {
                      const sS = timeToMinutes(slots[i].start);
                      const sE = timeToMinutes(slots[i].end);
                      if (sS >= mStart && sE <= mEnd) {
                        span++;
                      } else {
                        break;
                      }
                    }

                    nextAvailableSlotIdx = slotIdx + Math.max(1, span);

                    const isEditable = meetings.some((m) => m.scheduleId === occupyingMeeting.scheduleId);
                    const orig = originalByScheduleId.get(occupyingMeeting.scheduleId);
                    const changed = orig ? isMeetingChanged(orig, occupyingMeeting) : false;
                    const style = subjectTypeStyle(occupyingMeeting);

                    return (
                      <td
                        key={slotIdx}
                        colSpan={Math.max(1, span)}
                        className="relative border-r border-slate-200 p-1 align-top dark:border-white/10"
                      >
                        <div
                          className={`h-full min-h-16 rounded-lg border-l-4 p-2 transition-all shadow-xs ${style.border} ${style.card} ${
                            changed
                              ? "ring-2 ring-gold-400 dark:ring-gold-400"
                              : ""
                          }`}
                        >
                          <div className="flex items-start justify-between gap-1">
                            <span className="font-body text-xs font-bold text-navy-900 dark:text-mist-100">
                              {occupyingMeeting.subjectCode}
                            </span>
                            <div className="flex items-center gap-1">
                              {occupyingMeeting.isProtected && (
                                <span className="text-slate-400">
                                  <LockIcon size={12} />
                                </span>
                              )}
                              {isEditable && (
                                <div className="flex items-center gap-0.5">
                                  <button
                                    type="button"
                                    onClick={() => onEditMeeting(occupyingMeeting)}
                                    className="cursor-pointer rounded-sm p-0.5 text-slate-500 hover:bg-slate-200 hover:text-navy-900 dark:hover:bg-white/10 dark:hover:text-white"
                                    title="Edit slot"
                                  >
                                    <EditIcon size={12} />
                                  </button>
                                  {occupyingMeeting.movable && (
                                    <button
                                      type="button"
                                      onClick={() => onRemoveMeeting(occupyingMeeting)}
                                      className="cursor-pointer rounded-sm p-0.5 text-slate-500 hover:bg-red-100 hover:text-red-600 dark:hover:bg-red-400/10 dark:hover:text-red-400"
                                      title="Unplace slot"
                                    >
                                      <TrashIcon size={12} />
                                    </button>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>

                          <p className="line-clamp-1 font-body text-[11px] text-slate-600 dark:text-slate-300">
                            {occupyingMeeting.subjectTitle}
                          </p>

                          <div className="mt-1 flex flex-wrap items-center gap-1">
                            <span className="font-body text-[10px] text-navy-700 dark:text-gold-300">
                              {formatTime12h(occupyingMeeting.startTime)}–{formatTime12h(occupyingMeeting.endTime)}
                            </span>
                            <span className="font-body text-[10px] text-slate-500 dark:text-slate-400">
                              · {occupyingMeeting.roomName ?? "No room"}
                            </span>
                          </div>

                          <div className="mt-1 flex flex-wrap gap-1">
                            <Badge tone="sky">{occupyingMeeting.setLabel}</Badge>
                            {occupyingMeeting.sessionMode && (
                              <Badge tone={occupyingMeeting.sessionMode === "LAB" ? "navy" : "slate"}>
                                {occupyingMeeting.sessionMode}
                              </Badge>
                            )}
                          </div>
                        </div>
                      </td>
                    );
                  }

                  const isSlotInSelection =
                    selection &&
                    selection.dayOfWeek.trim().toLowerCase() === label.toLowerCase() &&
                    timeToMinutes(slot.start) >= timeToMinutes(selection.startTime) &&
                    timeToMinutes(slot.end) <= timeToMinutes(selection.endTime);

                  return (
                    <td
                      key={slotIdx}
                      onMouseDown={() => startSelection(label, slotIdx)}
                      onMouseEnter={() => hoverSlot(label, slotIdx)}
                      className={`cursor-crosshair border-r border-slate-200 transition-colors dark:border-white/10 ${
                        isSlotInSelection
                          ? "bg-gold-200/60 dark:bg-gold-400/20"
                          : "hover:bg-slate-100 dark:hover:bg-white/5"
                      }`}
                    >
                      <div className="h-full min-h-16 w-full" />
                    </td>
                  );
                })}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
});
