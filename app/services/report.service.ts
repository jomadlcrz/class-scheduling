import type { ScheduleSemester } from "~/types/schedule";
import { delay, schedules, students } from "~/services/mock-data";

export type FacultyLoadRow = {
  facultyId: string;
  facultyName: string;
  subjectCount: number;
  totalHours: number;
  subjects: string[];
};

export type RoomUtilizationRow = {
  roomId: string;
  roomName: string;
  buildingCode: string;
  scheduledCount: number;
  totalHours: number;
};

export type ScheduleSummary = {
  totalSchedules: number;
  byProgram: Record<string, number>;
  byDay: Record<string, number>;
};

export type EnrollmentStats = {
  total: number;
  enrolled: number;
  byProgram: Record<string, number>;
  byYearLevel: Record<number, number>;
};

function parseHours(start: string, end: string): number {
  const toMinutes = (t: string) => {
    const [h, m] = t.split(":").map(Number);
    return h * 60 + m;
  };
  return (toMinutes(end) - toMinutes(start)) / 60;
}

async function getFacultyLoad(
  schoolYear: string,
  semester: ScheduleSemester,
): Promise<FacultyLoadRow[]> {
  await delay(400);

  const filtered = schedules.filter(
    (s) => s.schoolYear === schoolYear && s.semester === semester,
  );

  const map = new Map<string, FacultyLoadRow>();
  for (const s of filtered) {
    if (!map.has(s.facultyId)) {
      map.set(s.facultyId, {
        facultyId: s.facultyId,
        facultyName: s.facultyName,
        subjectCount: 0,
        totalHours: 0,
        subjects: [],
      });
    }
    const row = map.get(s.facultyId)!;
    row.subjectCount += 1;
    row.totalHours += parseHours(s.startTime, s.endTime);
    if (!row.subjects.includes(s.subjectCode)) row.subjects.push(s.subjectCode);
  }

  return Array.from(map.values()).sort((a, b) => b.totalHours - a.totalHours);
}

async function getRoomUtilization(
  schoolYear: string,
  semester: ScheduleSemester,
): Promise<RoomUtilizationRow[]> {
  await delay(400);

  const filtered = schedules.filter(
    (s) => s.schoolYear === schoolYear && s.semester === semester,
  );

  const map = new Map<string, RoomUtilizationRow>();
  for (const s of filtered) {
    if (!map.has(s.roomId)) {
      map.set(s.roomId, {
        roomId: s.roomId,
        roomName: s.roomName,
        buildingCode: s.buildingCode,
        scheduledCount: 0,
        totalHours: 0,
      });
    }
    const row = map.get(s.roomId)!;
    row.scheduledCount += 1;
    row.totalHours += parseHours(s.startTime, s.endTime);
  }

  return Array.from(map.values()).sort((a, b) => b.totalHours - a.totalHours);
}

async function getScheduleSummary(
  schoolYear: string,
  semester: ScheduleSemester,
): Promise<ScheduleSummary> {
  await delay(300);

  const filtered = schedules.filter(
    (s) => s.schoolYear === schoolYear && s.semester === semester,
  );

  const byProgram: Record<string, number> = {};
  const byDay: Record<string, number> = {};

  for (const s of filtered) {
    byProgram[s.program] = (byProgram[s.program] ?? 0) + 1;
    byDay[s.day] = (byDay[s.day] ?? 0) + 1;
  }

  return { totalSchedules: filtered.length, byProgram, byDay };
}

async function getEnrollmentStats(): Promise<EnrollmentStats> {
  await delay(300);
  const byProgram: Record<string, number> = {};
  const byYearLevel: Record<number, number> = {};

  for (const s of students) {
    byProgram[s.program] = (byProgram[s.program] ?? 0) + 1;
    byYearLevel[s.yearLevel] = (byYearLevel[s.yearLevel] ?? 0) + 1;
  }

  return {
    total: students.length,
    enrolled: students.filter((s) => s.status === "enrolled").length,
    byProgram,
    byYearLevel,
  };
}

export const reportService = {
  getFacultyLoad,
  getRoomUtilization,
  getScheduleSummary,
  getEnrollmentStats,
};
