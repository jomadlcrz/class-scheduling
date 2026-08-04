import { ApiError, apiGet, apiMessage, apiPatch, apiPost, apiPut } from "~/lib/api";
import type { CreateSemesterInput, Semester } from "~/types/semester";

type SemesterResponse = {
  id: number;
  semester: string;
  semester_number: number;
  display_name?: string;
  description?: string | null;
  status?: string;
  can_edit?: boolean;
};

type DeletedSemester = Semester & { deactivatedAt: string | null };

export type SemesterArchivePreview = {
  semester: { id: number; semester: string };
  archivable: boolean;
  blockers: {
    references: number;
    studentAcademics: number;
    instructorTeachingTerms: number;
    items: { key: string; label: string; count: number }[];
  };
  willArchive: Record<string, never>;
};

let cachedSemesters: Semester[] | null = null;
let cachePromise: Promise<Semester[]> | null = null;

function invalidateCache() {
  cachedSemesters = null;
  cachePromise = null;
}

function mapSemester(s: SemesterResponse): Semester {
  return {
    id: s.id,
    semester: s.semester,
    semesterNumber: s.semester_number,
    displayName: s.display_name ?? s.semester,
    description: s.description ?? null,
    status: s.status ?? "Active",
    canEdit: s.can_edit ?? true,
  };
}

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
      cachePromise = null;
      throw err;
    }
    cachedSemesters = data.map(mapSemester);
    return cachedSemesters;
  })();

  return cachePromise;
}

/** POST /semesters — 409 when the semester already exists. Invalidates the list cache. */
async function create(input: CreateSemesterInput): Promise<string> {
  const data = await apiPost<{ message?: string }>("/semesters", {
    semester: input.semester,
    semesterNumber: input.semesterNumber,
  });
  invalidateCache();
  return apiMessage(data);
}

/** PUT /semesters/:id */
async function update(id: number, input: CreateSemesterInput): Promise<string> {
  const data = await apiPut<{ message?: string }>(`/semesters/${id}`, {
    semester: input.semester,
    semesterNumber: input.semesterNumber,
  });
  invalidateCache();
  return apiMessage(data);
}

/** DELETE /semesters/:id — soft-delete; 409 if still referenced by academic records/teaching terms. */
async function remove(id: number, confirm: string): Promise<string> {
  const data = await apiPatch<{ message?: string }>(`/semesters/${id}/archive`, { confirm });
  invalidateCache();
  return apiMessage(data);
}

/** GET /semesters/:id/archive-preview — checks whether archival is safe. */
async function getArchivePreview(id: number): Promise<SemesterArchivePreview> {
  return apiGet<SemesterArchivePreview>(`/semesters/${id}/archive-preview`);
}

/** GET /semesters/recycle-bin — always fresh, not cached. 404 → empty. */
async function listDeleted(): Promise<DeletedSemester[]> {
  let data: (SemesterResponse & { deactivated_at: string | null })[];
  try {
    data = await apiGet<(SemesterResponse & { deactivated_at: string | null })[]>("/semesters/recycle-bin");
  } catch (err) {
    if (err instanceof ApiError && err.status === 404) return [];
    throw err;
  }
  return data.map((s) => ({
    ...mapSemester(s),
    deactivatedAt: s.deactivated_at,
  }));
}

/** PATCH /semesters/:id/restore */
async function restore(id: number): Promise<string> {
  const data = await apiPatch<{ message?: string }>(`/semesters/${id}/restore`);
  invalidateCache();
  return apiMessage(data);
}

/** GET /semesters/:id */
async function get(id: number): Promise<Semester> {
  const s = await apiGet<SemesterResponse>(`/semesters/${id}`);
  return mapSemester(s);
}

export const semesterService = { list, create, update, remove, getArchivePreview, listDeleted, restore, get };
