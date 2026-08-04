import { ApiError, apiGet, apiMessage, apiPost, apiPut } from "~/lib/api";

type SchoolYearEntry = {
  id: number;
  school_year: string;
  status?: string | null;
  is_current?: boolean;
  current_label?: string | null;
  created_at?: string | null;
  registrar_completed?: boolean;
  registrar_completed_at?: string | null;
  completion_reason?: string | null;
};

export type SchoolYearOption = {
  id: number;
  schoolYear: string;
  status?: string | null;
  isCurrent?: boolean;
  createdAt?: string | null;
  registrarCompleted: boolean;
  registrarCompletedAt?: string | null;
  completionReason?: string | null;
};

let cachedSchoolYears: SchoolYearOption[] | null = null;
let cachePromise: Promise<SchoolYearOption[]> | null = null;

function invalidateCache() {
  cachedSchoolYears = null;
  cachePromise = null;
}

function mapSchoolYear(entry: SchoolYearEntry): SchoolYearOption {
  return {
    id: entry.id,
    schoolYear: entry.school_year,
    status: entry.status ?? null,
    isCurrent: entry.is_current ?? false,
    createdAt: entry.created_at ?? null,
    registrarCompleted: entry.registrar_completed ?? false,
    registrarCompletedAt: entry.registrar_completed_at ?? null,
    completionReason: entry.completion_reason ?? null,
  };
}

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
      cachePromise = null;
      throw err;
    }
    cachedSchoolYears = data.map(mapSchoolYear);
    return cachedSchoolYears;
  })();

  return cachePromise;
}

/** POST /school-years — invalidates the list cache so the next list() refetches. Returns the backend message. */
async function create(schoolYear: string): Promise<string> {
  const data = await apiPost<{ message?: string }>("/school-years", { schoolYear });
  invalidateCache();
  return apiMessage(data);
}

/** PUT /school-years/:id */
async function update(id: number, schoolYear: string): Promise<string> {
  const data = await apiPut<{ message?: string }>(`/school-years/${id}`, { schoolYear });
  invalidateCache();
  return apiMessage(data);
}

/** GET /school-years/:id */
async function get(id: number): Promise<SchoolYearOption> {
  const s = await apiGet<SchoolYearEntry>(`/school-years/${id}`);
  return mapSchoolYear(s);
}

/** GET /school-years/current — calendar-derived default school year. */
async function getCurrent(): Promise<SchoolYearOption & { existsForToday?: boolean; expectedSchoolYear?: string | null }> {
  const entry = await apiGet<SchoolYearEntry & { exists_for_today?: boolean; expected_school_year?: string | null }>("/school-years/current");
  return { ...mapSchoolYear(entry), existsForToday: entry.exists_for_today, expectedSchoolYear: entry.expected_school_year };
}

export const schoolYearService = { list, create, update, get, getCurrent, invalidateCache };
