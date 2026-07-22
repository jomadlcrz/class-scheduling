import { ApiError, apiDelete, apiGet, apiMessage, apiPatch, apiPost, apiPut } from "~/lib/api";
import type { ClassSet, CreateSetInput } from "~/types/set";
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

/** DELETE /sets/:id — returns the backend message. */
async function remove(id: number): Promise<string> {
  const data = await apiDelete<{ message?: string }>(`/sets/${id}`);
  return apiMessage(data);
}

export type DeletedSet = {
  id: number;
  setCode: string;
  deactivatedAt: string | null;
};

type SetRecycleBinResponse = {
  set_id: number;
  set_code: string;
  deactivated_at: string | null;
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
  return data.map((s) => ({ id: s.set_id, setCode: s.set_code, deactivatedAt: s.deactivated_at }));
}

/** PATCH /sets/:id/restore */
async function restore(id: number): Promise<string> {
  const data = await apiPatch<{ message?: string }>(`/sets/${id}/restore`);
  return apiMessage(data);
}

/** GET /sets/:id */
async function get(id: number): Promise<{ id: number; programId: number; yearLevel: YearLevel; setCode: string; setName: string }> {
  const s = await apiGet<{ set_id: number; program_id: number; year_level: number; set_code: string; set_name: string }>(
    `/sets/${id}`,
  );
  return {
    id: s.set_id,
    programId: s.program_id,
    yearLevel: s.year_level as YearLevel,
    setCode: s.set_code,
    setName: s.set_name,
  };
}

export const setService = {
  list,
  create,
  update,
  remove,
  listDeleted,
  restore,
  get,
};
