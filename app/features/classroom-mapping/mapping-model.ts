import { SCHEDULE_DAY_NAMES, SCHEDULE_DAY_COLORS, getScheduleDayKey, type ScheduleDay } from "~/lib/schedule-days";
import { formatTime12h, timeToMinutes } from "~/lib/time";

export type SubjectType = "major_lab" | "major_no_lab" | "gen_ed";
export type ClassroomStatus = "available" | "full";
export type DayOfWeek = (typeof SCHEDULE_DAY_NAMES)[number];

export interface ClassEntry {
  day: DayOfWeek;
  startTime: string;
  endTime: string;
  subjectCode: string;
  descriptiveTitle: string;
  instructor: string;
  section: string;
  type: SubjectType;
}

export interface Classroom {
  id: string;
  name: string;
  buildingId: string;
  status: ClassroomStatus;
  entries: ClassEntry[];
}

export interface TimeSlot {
  start: string;
  end: string;
}

export type DayCell =
  | { kind: "class"; entry: ClassEntry; colspan: number; hiddenCount: number }
  | { kind: "empty"; slot: TimeSlot };

export const DAYS: DayOfWeek[] = [...SCHEDULE_DAY_NAMES];

/** Baseline column boundaries (minutes): 7:00 AM – 6:00 PM, 90-min steps (final step is 30 min to land on 6:00 PM). */
const BASELINE_BOUNDARIES = [420, 510, 600, 690, 780, 870, 960, 1050, 1080];

function minutesToLabel(minutes: number): string {
  const hh = String(Math.floor(minutes / 60)).padStart(2, "0");
  const mm = String(minutes % 60).padStart(2, "0");
  return formatTime12h(`${hh}:${mm}`);
}

/**
 * Column boundaries come from the data: every class start/end becomes a slot
 * boundary (merged with the baseline grid), so every class aligns exactly to
 * a contiguous run of slots.
 */
export function buildTimeSlots(classrooms: Classroom[]): TimeSlot[] {
  const boundaries = new Set<number>(BASELINE_BOUNDARIES);
  for (const room of classrooms) {
    for (const entry of room.entries) {
      const start = timeToMinutes(entry.startTime);
      const end = timeToMinutes(entry.endTime);
      if (end <= start) continue;
      boundaries.add(start);
      boundaries.add(end);
    }
  }
  const sorted = [...boundaries].sort((a, b) => a - b);
  const slots: TimeSlot[] = [];
  for (let i = 0; i < sorted.length - 1; i++) {
    slots.push({ start: minutesToLabel(sorted[i]), end: minutesToLabel(sorted[i + 1]) });
  }
  return slots;
}

export const DAY_STYLES: Record<DayOfWeek, { color: string; bg: string; border: string }> = Object.fromEntries(
  SCHEDULE_DAY_NAMES.map((name) => {
    const key = getScheduleDayKey(name)!;
    const colors = SCHEDULE_DAY_COLORS[key];
    return [name, {
      color: colors.text + " dark:" + colors.text.replace("text-", "text-").replace("-600", "-400"),
      bg: colors.bg + " dark:" + colors.bg.replace("bg-", "bg-").replace("-100", "-950/50"),
      border: colors.border.replace("border-l-", "border-") + " dark:" + colors.border.replace("border-l-", "border-").replace("-500", "-900"),
    }];
  }),
) as Record<DayOfWeek, { color: string; bg: string; border: string }>;

function dayOfWeekToScheduleDay(day: DayOfWeek): ScheduleDay | null {
  return getScheduleDayKey(day);
}

export const TYPE_STYLES: Record<SubjectType, { card: string; border: string; code: string; tableCode: string; dot: string }> = {
  major_lab:    { card: "bg-blue-100 dark:bg-blue-950/60",    border: "border-l-blue-500",    code: "text-blue-800 dark:text-blue-300",    tableCode: "text-blue-600 dark:text-blue-400",    dot: "bg-blue-500"    },
  major_no_lab: { card: "bg-green-100 dark:bg-green-950/60",  border: "border-l-green-500",   code: "text-green-800 dark:text-green-300",  tableCode: "text-green-600 dark:text-green-400",  dot: "bg-green-500"   },
  gen_ed:       { card: "bg-violet-100 dark:bg-violet-950/60", border: "border-l-violet-600", code: "text-violet-800 dark:text-violet-300", tableCode: "text-violet-600 dark:text-violet-400", dot: "bg-violet-600"  },
};

export const TYPE_LABELS: Record<SubjectType, string> = {
  major_lab: "Major (Lab)",
  major_no_lab: "Major (w/o Lab)",
  gen_ed: "GenEd",
};

export const ROOM_COL_W = 110;
export const DAY_COL_W = 100;
export const SLOT_COL_W = 150;

// ── Day cell builder ─────────────────────────────────────────────────────────

export function buildDayCells(
  day: string,
  entries: ClassEntry[],
  slots: TimeSlot[],
): DayCell[] {
  const dayEntries = entries
    .filter((e) => e.day === day)
    .sort((a, b) => timeToMinutes(a.startTime) - timeToMinutes(b.startTime));

  const cells: DayCell[] = [];

  // Every row must cover exactly slots.length columns, so the index advances
  // by the number of columns each cell spans.
  let i = 0;
  while (i < slots.length) {
    const slotStart = timeToMinutes(slots[i].start);

    const entry = dayEntries.find(
      (e) => timeToMinutes(e.startTime) === slotStart && timeToMinutes(e.endTime) > slotStart,
    );

    if (!entry) {
      cells.push({ kind: "empty", slot: slots[i] });
      i += 1;
      continue;
    }

    const entryEnd = timeToMinutes(entry.endTime);
    let colspan = 0;
    while (i + colspan < slots.length && timeToMinutes(slots[i + colspan].end) <= entryEnd) {
      colspan++;
    }
    if (colspan === 0) colspan = 1;

    // Overlapping classes in the same room/day can't share a cell; the first
    // by start time renders and the rest are surfaced as a count.
    const hiddenCount = dayEntries.filter(
      (other) =>
        other !== entry &&
        timeToMinutes(other.startTime) >= slotStart &&
        timeToMinutes(other.startTime) < entryEnd,
    ).length;

    cells.push({ kind: "class", entry, colspan, hiddenCount });
    i += colspan;
  }

  return cells;
}

export function filterClassrooms(classrooms: Classroom[], query: string): Classroom[] {
  const q = query.trim().toLowerCase();
  if (!q) return classrooms;
  return classrooms.filter((room) => room.name.toLowerCase().includes(q));
}
