export type SubjectType = "major_lab" | "major_no_lab" | "gen_ed";
export type ClassroomStatus = "available" | "full";
export type DayOfWeek = "Monday" | "Tuesday" | "Wednesday" | "Thursday" | "Friday" | "Saturday";

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
  | { kind: "class"; entry: ClassEntry; colspan: number }
  | { kind: "empty"; slot: TimeSlot };

export const DAYS: DayOfWeek[] = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

export const TIME_SLOTS: TimeSlot[] = [
  { start: "7:00 AM",  end: "8:30 AM"  },
  { start: "8:30 AM",  end: "10:00 AM" },
  { start: "10:00 AM", end: "11:30 AM" },
  { start: "11:30 AM", end: "1:00 PM"  },
  { start: "1:00 PM",  end: "2:30 PM"  },
  { start: "2:30 PM",  end: "4:00 PM"  },
  { start: "4:00 PM",  end: "5:30 PM"  },
  { start: "4:30 PM",  end: "6:00 PM"  },
];

export const DAY_STYLES: Record<DayOfWeek, { color: string; bg: string; border: string }> = {
  Monday:    { color: "text-red-600 dark:text-red-400",    bg: "bg-red-100 dark:bg-red-950/50",    border: "border-red-200 dark:border-red-900"    },
  Tuesday:   { color: "text-amber-700 dark:text-amber-400", bg: "bg-amber-100 dark:bg-amber-950/50", border: "border-amber-200 dark:border-amber-900" },
  Wednesday: { color: "text-red-600 dark:text-red-400",    bg: "bg-red-100 dark:bg-red-950/50",    border: "border-red-200 dark:border-red-900"    },
  Thursday:  { color: "text-amber-700 dark:text-amber-400", bg: "bg-amber-100 dark:bg-amber-950/50", border: "border-amber-200 dark:border-amber-900" },
  Friday:    { color: "text-red-600 dark:text-red-400",    bg: "bg-red-100 dark:bg-red-950/50",    border: "border-red-200 dark:border-red-900"    },
  Saturday:  { color: "text-pink-700 dark:text-pink-400",  bg: "bg-pink-100 dark:bg-pink-950/50",  border: "border-pink-200 dark:border-pink-900"  },
};

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

// ── Time helpers ──────────────────────────────────────────────────────────────

const TIME_CACHE = new Map<string, number>();

function timeToMinutes(time: string): number {
  const cached = TIME_CACHE.get(time);
  if (cached !== undefined) return cached;

  const match = time.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
  if (!match) return 0;

  let hours = Number.parseInt(match[1], 10);
  const minutes = Number.parseInt(match[2], 10);
  const meridiem = match[3].toUpperCase();

  if (meridiem === "PM" && hours !== 12) hours += 12;
  if (meridiem === "AM" && hours === 12) hours = 0;

  const result = hours * 60 + minutes;
  TIME_CACHE.set(time, result);
  return result;
}

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

  for (let i = 0; i < slots.length; i++) {
    const slotStart = timeToMinutes(slots[i].start);
    const slotEnd = timeToMinutes(slots[i].end);

    const entry = dayEntries.find((e) => {
      const eStart = timeToMinutes(e.startTime);
      const eEnd = timeToMinutes(e.endTime);
      return slotStart >= eStart && slotEnd <= eEnd;
    });

    if (!entry) {
      cells.push({ kind: "empty", slot: slots[i] });
      continue;
    }

    if (slotStart !== timeToMinutes(entry.startTime)) continue;

    const entryEnd = timeToMinutes(entry.endTime);
    let colspan = 1;
    for (let j = i + 1; j < slots.length; j++) {
      const nextStart = timeToMinutes(slots[j].start);
      const nextEnd = timeToMinutes(slots[j].end);
      if (!(nextStart >= timeToMinutes(entry.startTime) && nextEnd <= entryEnd)) break;
      colspan++;
    }

    cells.push({ kind: "class", entry, colspan });
  }

  return cells;
}

export function filterClassrooms(classrooms: Classroom[], query: string): Classroom[] {
  const q = query.trim().toLowerCase();
  if (!q) return classrooms;
  return classrooms.filter((room) => room.name.toLowerCase().includes(q));
}
