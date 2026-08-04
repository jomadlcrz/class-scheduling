import { ApiError, apiGet, apiMessage, apiPatch, apiPost, apiPut } from "~/lib/api";
import type { ClassSet, CreateSetInput, SetDeletePreview } from "~/types/set";
import type { YearLevel } from "~/types/subject";

/** Class sets CRUD against the curriculums module (registrar_admin). */

type SetsResponse = {
  department_name: string;
  program_name: string;
  sets: {
    set_id: number;
    set_code: string;
    set_name: string;
  }[];
}[];

/** GET /sets — sets come nested per program; flattened here. 404 → empty. */
async function list(filters?: { syId?: number; semId?: number; programId?: number }): Promise<ClassSet[]> {
  const params = new URLSearchParams();
  if (filters?.syId) params.set("sy_id", String(filters.syId));
  if (filters?.semId) params.set("sem_id", String(filters.semId));
  if (filters?.programId) params.set("program_id", String(filters.programId));
  const qs = params.toString();

  let data: SetsResponse;
  try {
    data = await apiGet<SetsResponse>(`/sets${qs ? `?${qs}` : ""}`);
  } catch (err) {
    if (err instanceof ApiError && err.status === 404) return [];
    throw err;
  }
  return data.flatMap((p) =>
    p.sets.map((s) => {
      // set_name is "{PROGRAM}-{year}{SET}", e.g. "BSIT-1A" — the response
      // carries no separate program_abbrev/year_level fields.
      const [programAbbrev = "", yearAndSet = ""] = s.set_name?.split("-") ?? [];
      return {
        id: s.set_id,
        program: programAbbrev,
        yearLevel: parseInt(yearAndSet, 10) as YearLevel,
        setCode: s.set_code,
      };
    }),
  );
}

/**
 * GET /sets/unscheduled — returns sets that have no schedule yet for the given term.
 * sy_id and sem_id are required.
 */
async function listUnscheduled(filters: { syId: number; semId: number; programId?: number; yearLevel?: number | string }): Promise<ClassSet[]> {
  const params = new URLSearchParams({ sy_id: String(filters.syId), sem_id: String(filters.semId) });
  if (filters.programId) params.set("program_id", String(filters.programId));
  if (filters.yearLevel) params.set("year_level", String(filters.yearLevel));
  const qs = params.toString();

  let data: SetsResponse;
  try {
    data = await apiGet<SetsResponse>(`/sets/unscheduled?${qs}`);
  } catch (err) {
    if (err instanceof ApiError && err.status === 404) return [];
    throw err;
  }
  return data.flatMap((p) =>
    p.sets.map((s) => {
      const [programAbbrev = "", yearAndSet = ""] = s.set_name?.split("-") ?? [];
      return {
        id: s.set_id,
        program: programAbbrev,
        yearLevel: parseInt(yearAndSet, 10) as YearLevel,
        setCode: s.set_code,
      };
    }),
  );
}

/**
 * POST /sets — bulk per program + year level. The form guarantees all inputs
 * share one program and year, so they collapse into a single request.
 * Returns the backend message.
 */
async function create(inputs: CreateSetInput[]): Promise<string> {
  if (inputs.length === 0) return "";
  const data = await apiPost<{ message?: string }>("/sets", {
    programAbbrev: inputs[0].program,
    yearLevel: inputs[0].yearLevel,
    sets: inputs.map((input) => ({ setCode: input.setCode })),
  });
  return apiMessage(data);
}

/** PUT /sets/:id — only the set code is updatable. Returns the backend message. */
async function update(id: number, setCode: string): Promise<string> {
  const data = await apiPut<{ message?: string }>(`/sets/${id}`, { setCode });
  return apiMessage(data);
}

/**
 * DELETE /sets/:id — cascades through every regular schedule this set ever had
 * (any school year/semester) only after the caller echoes the set's own code.
 * Returns the backend message (the response also carries the same breakdown
 * the preview endpoint returns).
 */
async function remove(id: number, confirmCode: string): Promise<string> {
  const data = await apiPatch<{ message?: string }>(`/sets/${id}/archive`, { confirm: confirmCode });
  return apiMessage(data);
}

/** GET /sets/:id/delete-preview — read-only breakdown of what the delete would affect. */
async function getDeletePreview(id: number): Promise<SetDeletePreview> {
  const data = await apiGet<{
    set: SetDeletePreview["set"];
    willArchive: SetDeletePreview["will_delete"];
  }>(`/sets/${id}/archive-preview`);
  return { set: data.set, will_delete: data.willArchive };
}

type DeletedSet = {
  id: number;
  setCode: string;
  setName: string;
  deactivatedAt: string | null;
  studentsAffected: number;
};

type SetRecycleBinResponse = {
  set_id: number;
  set_code: string;
  set_name: string;
  deactivated_at: string | null;
  students_affected: number;
}[];

/** GET /sets/recycle-bin — 404 → empty. */
async function listDeleted(): Promise<DeletedSet[]> {
  let data: SetRecycleBinResponse;
  try {
    data = await apiGet<SetRecycleBinResponse>("/sets/recycle-bin");
  } catch (err) {
    if (err instanceof ApiError && err.status === 404) return [];
    throw err;
  }
  return data.map((s) => ({
    id: s.set_id,
    setCode: s.set_code,
    setName: s.set_name,
    deactivatedAt: s.deactivated_at,
    studentsAffected: s.students_affected,
  }));
}

/** PATCH /sets/:id/restore */
async function restore(id: number): Promise<string> {
  const data = await apiPatch<{ message?: string }>(`/sets/${id}/restore`);
  return apiMessage(data);
}

export const setService = {
  list,
  listUnscheduled,
  create,
  update,
  remove,
  getDeletePreview,
  listDeleted,
  restore,
};
