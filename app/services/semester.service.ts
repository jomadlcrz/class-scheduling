import { ApiError, apiGet, apiPost } from "~/lib/api";
import type { CreateSemesterInput, Semester } from "~/types/semester";

type SemesterResponse = {
  id: number;
  semester: string;
  semester_number: number;
};

let cachedSemesters: Semester[] | null = null;
let cachePromise: Promise<Semester[]> | null = null;

/** GET /semesters — 404 → empty. Result is cached after the first fetch. */
async function list(): Promise<Semester[]> {
  if (cachedSemesters) return cachedSemesters;
  if (cachePromise) return cachePromise;

  cachePromise = (async () => {
    let data: SemesterResponse[];
    try {
      data = await apiGet<SemesterResponse[]>("/semesters");
    } catch (err) {
      if (err instanceof ApiError && err.status === 404) {
        cachedSemesters = [];
        return cachedSemesters;
      }
      throw err;
    }
    cachedSemesters = data.map((s) => ({
      id: s.id,
      semester: s.semester,
      semesterNumber: s.semester_number,
    }));
    return cachedSemesters;
  })();

  return cachePromise;
}

/** POST /semesters — 409 when the semester already exists. */
async function create(input: CreateSemesterInput): Promise<void> {
  await apiPost("/semesters", {
    semester: input.semester,
    semesterNumber: input.semesterNumber,
  });
}

export const semesterService = { list, create };
