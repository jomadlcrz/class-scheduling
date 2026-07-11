import { ApiError, apiGet, apiPost } from "~/lib/api";
import type { CreateSemesterInput, Semester } from "~/types/semester";

type SemesterResponse = {
  id: number;
  semester: string;
  semester_number: number;
};

/** GET /semesters — 404 → empty. */
async function list(): Promise<Semester[]> {
  let data: SemesterResponse[];
  try {
    data = await apiGet<SemesterResponse[]>("/semesters");
  } catch (err) {
    if (err instanceof ApiError && err.status === 404) return [];
    throw err;
  }
  return data.map((s) => ({
    id: s.id,
    semester: s.semester,
    semesterNumber: s.semester_number,
  }));
}

/** POST /semesters — 409 when the semester already exists. */
async function create(input: CreateSemesterInput): Promise<void> {
  await apiPost("/semesters", {
    semester: input.semester,
    semesterNumber: input.semesterNumber,
  });
}

export const semesterService = { list, create };
