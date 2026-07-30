import type { DepartmentSubjectProgram, ProgramLoadInput } from "~/types/faculty-load";

export type SubjectChoice = {
  /** `"PROGRAM CODE"`, e.g. "BSIT IT101" — unique even when a subject is shared across programs. */
  key: string;
  programId: number;
  programAbbrev: string;
  curriculumDetailId: number;
  subjectId: number;
  subjectCode: string;
  descriptiveTitle: string;
  units: number;
};

export function facultyKey(firstName: string, lastName: string): string {
  return `${firstName}|${lastName}`;
}

/**
 * Matches the backend's "Last, First M." formatting for GET /deans/faculty-loading's
 * instructor_name field, so existing loads can be looked up by the selected faculty.
 */
export function formatInstructorName(person: {
  firstName: string;
  lastName: string;
  midName?: string | null;
}): string {
  const midInitial = person.midName ? ` ${person.midName.charAt(0)}.` : "";
  return `${person.lastName}, ${person.firstName}${midInitial}`;
}

/** Flattens the department curriculum tree into a deduped, pickable subject list.
 *  Pass `semesterCategory` (1 or 2) to only include subjects from that semester. */
export function flattenDepartmentSubjects(
  programs: DepartmentSubjectProgram[],
  semesterCategory?: number,
): SubjectChoice[] {
  const seen = new Set<string>();
  const result: SubjectChoice[] = [];
  for (const program of programs) {
    if (!program.programAbbrev || !program.programId) continue;
    for (const year of program.curriculumDetails) {
      for (const sem of year.semesterDetails) {
        if (semesterCategory != null && sem.semester !== semesterCategory) continue;
        for (const subject of sem.subjects) {
          const key = `${program.programAbbrev} ${subject.subjectCode}`;
          if (seen.has(key)) continue;
          seen.add(key);
          result.push({
            key,
            programId: program.programId,
            programAbbrev: program.programAbbrev,
            curriculumDetailId: subject.curriculumDetailId,
            subjectId: subject.subjectId,
            subjectCode: subject.subjectCode,
            descriptiveTitle: subject.descriptiveTitle,
            units: subject.units,
          });
        }
      }
    }
  }
  return result;
}

/** Regroups a flat list of picked subjects back into the backend's programs[] shape. */
export function groupSubjectsByProgram(subjects: SubjectChoice[]): ProgramLoadInput[] {
  const byProgram = new Map<number, ProgramLoadInput>();
  for (const s of subjects) {
    let entry = byProgram.get(s.programId);
    if (!entry) {
      entry = { programId: s.programId, subjects: [] };
      byProgram.set(s.programId, entry);
    }
    entry.subjects.push({ subjectId: s.subjectId });
  }
  return [...byProgram.values()];
}
