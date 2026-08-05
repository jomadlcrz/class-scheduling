import type { CreateSubjectInput } from "~/types/subject";

export type PendingEntry = CreateSubjectInput & { tempId: string };

export type PendingSemesterGroup = {
  semester: number;
  subjects: PendingEntry[];
  totalUnits: number;
};

export type PendingYearGroup = {
  yearLevel: number;
  semesters: PendingSemesterGroup[];
  totalUnits: number;
};

/**
 * Groups pending draft subjects by year level and semester for display —
 * mirrors the yearLevels[].semesters[] nesting subjectService.createCurriculum
 * builds for the POST /programs payload, so the Review step's totals can't drift
 * from what actually gets saved.
 */
export function groupPendingByYearAndSemester(pending: PendingEntry[]): PendingYearGroup[] {
  const years = new Map<number, Map<number, PendingEntry[]>>();
  for (const entry of pending) {
    const semesters = years.get(entry.yearLevel) ?? new Map<number, PendingEntry[]>();
    years.set(entry.yearLevel, semesters);
    const subjects = semesters.get(entry.semester) ?? [];
    semesters.set(entry.semester, subjects);
    subjects.push(entry);
  }

  return [...years.entries()]
    .sort(([a], [b]) => a - b)
    .map(([yearLevel, semesters]) => {
      const semesterGroups = [...semesters.entries()]
        .sort(([a], [b]) => a - b)
        .map(([semester, subjects]) => ({
          semester,
          subjects,
          totalUnits: subjects.reduce((sum, s) => sum + (Number.isFinite(s.units) ? s.units : 0), 0),
        }));
      return {
        yearLevel,
        semesters: semesterGroups,
        totalUnits: semesterGroups.reduce((sum, s) => sum + s.totalUnits, 0),
      };
    });
}
