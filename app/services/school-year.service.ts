import { ApiError, apiGet, apiMessage, apiPost } from "~/lib/api";

type SchoolYearEntry = {
  id: number;
  school_year: string;
};

export type SchoolYearOption = {
  id: number;
  schoolYear: string;
};

let cachedSchoolYears: SchoolYearOption[] | null = null;
let cachePromise: Promise<SchoolYearOption[]> | null = null;

/** GET /school-years — 404 → empty. Result is cached after the first fetch. */
async function list(): Promise<SchoolYearOption[]> {
  if (cachedSchoolYears) return cachedSchoolYears;
  if (cachePromise) return cachePromise;

  cachePromise = (async () => {
    let data: SchoolYearEntry[];
    try {
      data = await apiGet<SchoolYearEntry[]>("/school-years");
    } catch (err) {
      if (err instanceof ApiError && err.status === 404) {
        cachedSchoolYears = [];
        return cachedSchoolYears;
      }
      throw err;
    }
    cachedSchoolYears = data
      .map((s) => ({ id: s.id, schoolYear: s.school_year }))
      .sort((a, b) => b.schoolYear.localeCompare(a.schoolYear));
    return cachedSchoolYears;
  })();

  return cachePromise;
}

/** POST /school-years — invalidates the list cache so the next list() refetches. Returns the backend message. */
async function create(schoolYear: string): Promise<string> {
  const data = await apiPost<{ message?: string }>("/school-years", { schoolYear });
  cachedSchoolYears = null;
  cachePromise = null;
  return apiMessage(data);
}

export const schoolYearService = { list, create };
