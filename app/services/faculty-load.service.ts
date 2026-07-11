import { apiPost } from "~/lib/api";

/**
 * Faculty loading service (deans module). The backend matches faculty by
 * first/last name and resolves subjects per program abbreviation.
 */

export type SubjectLoadInput = {
  subjectCode: string;
  descriptiveTitle: string;
};

export type ProgramLoadInput = {
  programAbbrev: string;
  subjects: SubjectLoadInput[];
};

export type FacultyLoadInput = {
  firstName: string;
  lastName: string;
  maxDailyHours: number;
  maxWeeklyHours: number;
  programs: ProgramLoadInput[];
};

/** POST /deans/create-faculty-loads — bulk save for one semester + school year. */
async function createBulk(
  semId: number,
  syId: number,
  facultyLoads: FacultyLoadInput[],
): Promise<void> {
  await apiPost(`/deans/create-faculty-loads?sem_id=${semId}&sy_id=${syId}`, {
    facultyLoads,
  });
}

export const facultyLoadService = { createBulk };
