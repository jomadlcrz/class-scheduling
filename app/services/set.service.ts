import { ApiError, apiGet, apiMessage, apiPatch, apiPost, apiPut } from "~/lib/api";
import { appendTermScopeParams } from "~/lib/term-scope";
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
async function list(filters?: {
  syId?: number;
  semesterNumber?: number;
  programId?: number;
}): Promise<ClassSet[]> {
  const params = new URLSearchParams();
  if (filters?.syId != null && filters.semesterNumber != null) {
    appendTermScopeParams(params, filters.syId, filters.semesterNumber);
  }
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
 * sy_id and semester_number are required.
 */
async function listUnscheduled(filters: {
  syId: number;
  semesterNumber: number;
  programId?: number;
  yearLevel?: number | string;
}): Promise<ClassSet[]> {
  const params = appendTermScopeParams(new URLSearchParams(), filters.syId, filters.semesterNumber);
  if (filters.programId) params.set("program_id", String(filters.programId));
  if (filters.yearLevel) params.set("year_level", String(filters.yearLevel));

  let data: SetsResponse;
  try {
    data = await apiGet<SetsResponse>(`/sets/unscheduled?${params}`);
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
  const grouped = new Map<number, CreateSetInput[]>();
  for (const input of inputs) {
    const yearInputs = grouped.get(input.yearLevel) ?? [];
    yearInputs.push(input);
    grouped.set(input.yearLevel, yearInputs);
  }
  const messages: string[] = [];
  for (const [yearLevel, yearInputs] of grouped) {
    const data = await apiPost<{ message?: string }>("/sets", {
      programAbbrev: inputs[0].program,
      yearLevel,
      sets: yearInputs.map((input) => ({ setCode: input.setCode })),
    });
    messages.push(apiMessage(data));
  }
  return messages.find(Boolean) ?? "";
}

/** PUT /sets/:id — only the set code is updatable. Returns the backend message. */
async function update(id: number, input: Pick<CreateSetInput, "setCode" | "yearLevel">): Promise<string> {
  const data = await apiPut<{ message?: string }>(`/sets/${id}`, { setCode: input.setCode, yearLevel: input.yearLevel });
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

/** GET /sets/:id/students — students enrolled in one set for a term. */
async function getStudents(setId: number, syId: number, semesterNumber: number): Promise<unknown> {
  const query = appendTermScopeParams(new URLSearchParams(), syId, semesterNumber);
  return apiGet(`/sets/${setId}/students?${query}`);
}

export const setService = {
  list,
  listUnscheduled,
  create,
  update,
  remove,
  getDeletePreview,
  getStudents,
};
