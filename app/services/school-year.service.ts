import { ApiError, apiGet } from "~/lib/api";

type SchoolYearEntry = {
  id: number;
  school_year: string;
};

export type SchoolYearOption = {
  id: number;
  schoolYear: string;
};

/** GET /school-years — 404 → empty. */
async function list(): Promise<SchoolYearOption[]> {
  let data: SchoolYearEntry[];
  try {
    data = await apiGet<SchoolYearEntry[]>("/school-years");
  } catch (err) {
    if (err instanceof ApiError && err.status === 404) return [];
    throw err;
  }
  return data
    .map((s) => ({ id: s.id, schoolYear: s.school_year }))
    .sort((a, b) => b.schoolYear.localeCompare(a.schoolYear));
}

export const schoolYearService = { list };
