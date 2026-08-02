import { ApiError, apiDelete, apiGet, apiMessage, apiPatch, apiPost, apiPut } from "~/lib/api";

type SchoolYearEntry = {
  id: number;
  school_year: string;
  status?: string | null;
  is_current?: boolean;
  current_label?: string | null;
  created_at?: string | null;
};

export type SchoolYearOption = {
  id: number;
  schoolYear: string;
  status?: string | null;
  isCurrent?: boolean;
  createdAt?: string | null;
};

export type DeletedSchoolYear = SchoolYearOption & {
  deactivatedAt: string | null;
  createdAt?: string | null;
};

export type SchoolYearArchivePreview = {
  schoolYear: { id: number; schoolYear: string };
  archivable: boolean;
  blockers: {
    references: number;
    studentAcademics: number;
    regularSchedules: number;
    instructorTeachingTerms: number;
    items: { key: string; label: string; count: number }[];
  };
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
  };
}

function mapArchivePreview(data: {
  school_year: { id: number; school_year: string };
  archivable: boolean;
  blockers: SchoolYearArchivePreview["blockers"];
}): SchoolYearArchivePreview {
  return {
    schoolYear: { id: data.school_year.id, schoolYear: data.school_year.school_year },
    archivable: data.archivable,
    blockers: data.blockers,
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

/** PATCH /school-years/:id/archive — requires typing the exact school year name. */
async function archive(id: number, confirm: string): Promise<string> {
  const data = await apiPatch<{ message?: string }>(`/school-years/${id}/archive`, { confirm });
  invalidateCache();
  return apiMessage(data);
}

/** GET /school-years/:id/archive-preview — checks whether archival is safe. */
async function getArchivePreview(id: number): Promise<SchoolYearArchivePreview> {
  const data = await apiGet<{
    school_year: { id: number; school_year: string };
    archivable: boolean;
    blockers: SchoolYearArchivePreview["blockers"];
  }>(`/school-years/${id}/archive-preview`);
  return mapArchivePreview(data);
}

/** @deprecated Prefer archive — kept for legacy callers. */
async function remove(id: number): Promise<string> {
  const data = await apiDelete<{ message?: string }>(`/school-years/${id}`);
  invalidateCache();
  return apiMessage(data);
}

/** GET /school-years/recycle-bin — always fresh, not cached (matches recycle-bin.service.ts precedent). 404 → empty. */
async function listDeleted(): Promise<DeletedSchoolYear[]> {
  let data: (SchoolYearEntry & { created_at?: string | null; deactivated_at: string | null })[];
  try {
    data = await apiGet<(SchoolYearEntry & { created_at?: string | null; deactivated_at: string | null })[]>(
      "/school-years/recycle-bin",
    );
  } catch (err) {
    if (err instanceof ApiError && err.status === 404) return [];
    throw err;
  }
  return data.map((s) => ({
    ...mapSchoolYear(s),
    createdAt: s.created_at ?? null,
    deactivatedAt: s.deactivated_at,
  }));
}

/** PATCH /school-years/:id/restore */
async function restore(id: number): Promise<string> {
  const data = await apiPatch<{ message?: string }>(`/school-years/${id}/restore`);
  invalidateCache();
  return apiMessage(data);
}

/** GET /school-years/:id */
async function get(id: number): Promise<SchoolYearOption> {
  const s = await apiGet<SchoolYearEntry>(`/school-years/${id}`);
  return mapSchoolYear(s);
}

export const schoolYearService = { list, create, update, archive, getArchivePreview, remove, listDeleted, restore, get };
