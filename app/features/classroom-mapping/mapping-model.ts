import { SCHEDULE_DAY_NAMES, SCHEDULE_DAY_COLORS, getScheduleDayKey, type ScheduleDay } from "~/lib/schedule-days";
import { timeToMinutes } from "~/lib/time";

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
  | { kind: "class"; entry: ClassEntry; colspan: number }
  | { kind: "empty"; slot: TimeSlot };

export const DAYS: DayOfWeek[] = [...SCHEDULE_DAY_NAMES];

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
