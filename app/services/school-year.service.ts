import { ApiError, apiGet } from "~/lib/api";

type SchoolYearEntry = {
  id: number;
  school_year: string;
};

/** GET /school-years — 404 → empty. */
async function list(): Promise<string[]> {
  let data: SchoolYearEntry[];
  try {
    data = await apiGet<SchoolYearEntry[]>("/school-years");
  } catch (err) {
    if (err instanceof ApiError && err.status === 404) return [];
    throw err;
  }
  return data.map((s) => s.school_year).sort((a, b) => b.localeCompare(a));
}

export const schoolYearService = { list };
