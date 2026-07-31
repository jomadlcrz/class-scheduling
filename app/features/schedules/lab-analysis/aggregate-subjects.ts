import type { LabRoom } from "~/types/lab-analysis";

export type LabSubjectRow = {
  subjectId: number;
  subjectCode: string;
  descriptiveTitle: string;
  yearLevel: number | null;
  sessions: number;
  hours: number;
  sharePercent: number;
  sets: string[];
  rooms: string[];
};

/**
 * What is consuming the labs, across every room — the backend reports usage
 * per room (`byProgram`) but not per subject across rooms, so this rolls
 * every room's `byDay[].sessionList` up by subject on the client.
 */
export function aggregateLabSubjects(laboratories: LabRoom[]): LabSubjectRow[] {
  const bySubject = new Map<
    number,
    { subjectCode: string; descriptiveTitle: string; yearLevel: number | null; sessions: number; hours: number; sets: Set<string>; rooms: Set<string> }
  >();
  let totalHours = 0;

  for (const room of laboratories) {
    for (const day of room.byDay) {
      for (const session of day.sessionList) {
        if (session.subjectId == null) continue;
        totalHours += session.hours;

        const entry = bySubject.get(session.subjectId) ?? {
          subjectCode: session.subjectCode ?? "—",
          descriptiveTitle: session.descriptiveTitle ?? "",
          yearLevel: session.yearLevel,
          sessions: 0,
          hours: 0,
          sets: new Set<string>(),
          rooms: new Set<string>(),
        };
        entry.sessions += 1;
        entry.hours += session.hours;
        if (session.setCode) entry.sets.add(session.setCode);
        entry.rooms.add(room.roomName);
        bySubject.set(session.subjectId, entry);
      }
    }
  }

  const rows: LabSubjectRow[] = [...bySubject.entries()].map(([subjectId, entry]) => ({
    subjectId,
    subjectCode: entry.subjectCode,
    descriptiveTitle: entry.descriptiveTitle,
    yearLevel: entry.yearLevel,
    sessions: entry.sessions,
    hours: Math.round(entry.hours * 100) / 100,
    sharePercent: totalHours ? Math.round((entry.hours / totalHours) * 1000) / 10 : 0,
    sets: [...entry.sets].sort(),
    rooms: [...entry.rooms].sort(),
  }));

  rows.sort((a, b) => b.hours - a.hours || a.subjectCode.localeCompare(b.subjectCode));
  return rows;
}
