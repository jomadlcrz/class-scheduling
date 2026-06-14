import type { Schedule } from "../types/schedule";
import { delay, schedules } from "./mock-data";

export type ConflictType = "faculty" | "room" | "section";

export type Conflict = {
  id: string;
  type: ConflictType;
  scheduleA: Schedule;
  scheduleB: Schedule;
  label: string;
  description: string;
};

function overlaps(startA: string, endA: string, startB: string, endB: string): boolean {
  return startA < endB && startB < endA;
}

function detect(all: Schedule[]): Conflict[] {
  const conflicts: Conflict[] = [];
  let counter = 0;

  for (let i = 0; i < all.length; i++) {
    for (let j = i + 1; j < all.length; j++) {
      const a = all[i];
      const b = all[j];

      if (a.schoolYear !== b.schoolYear || a.semester !== b.semester || a.day !== b.day) continue;
      if (!overlaps(a.startTime, a.endTime, b.startTime, b.endTime)) continue;

      counter += 1;
      const id = `conflict-${counter}`;

      if (a.facultyId === b.facultyId) {
        conflicts.push({
          id,
          type: "faculty",
          scheduleA: a,
          scheduleB: b,
          label: a.facultyName,
          description: `${a.facultyName} is assigned to both ${a.subjectCode} and ${b.subjectCode} on ${a.day} at overlapping times.`,
        });
      } else if (a.roomId === b.roomId) {
        conflicts.push({
          id,
          type: "room",
          scheduleA: a,
          scheduleB: b,
          label: `${a.buildingCode} — ${a.roomName}`,
          description: `${a.roomName} is booked for both ${a.subjectCode} and ${b.subjectCode} on ${a.day} at overlapping times.`,
        });
      } else if (a.setId === b.setId) {
        conflicts.push({
          id,
          type: "section",
          scheduleA: a,
          scheduleB: b,
          label: `${a.program} ${a.yearLevel}-${a.setCode}`,
          description: `Section ${a.setCode} has overlapping classes: ${a.subjectCode} and ${b.subjectCode} on ${a.day}.`,
        });
      }
    }
  }

  return conflicts;
}

async function detectAll(): Promise<Conflict[]> {
  await delay(400);
  return detect([...schedules]);
}

export const conflictService = { detectAll };
