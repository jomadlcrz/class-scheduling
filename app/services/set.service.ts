import { ApiError, apiDelete, apiGet, apiPost, apiPut } from "~/lib/api";
import type { ClassSet, CreateSetInput } from "~/types/set";
import type { YearLevel } from "~/types/subject";

/** Class sets CRUD against the curriculums module (registrar_admin). */

type SetsResponse = {
  department_name: string;
  program_name: string;
  program_abbrev: string;
  sets: {
    set_id: number;
    set_name: string;
    set_code: string;
    year_level: number;
  }[];
}[];

/** GET /sets — sets come nested per program; flattened here. 404 → empty. */
async function list(): Promise<ClassSet[]> {
  let data: SetsResponse;
  try {
    data = await apiGet<SetsResponse>("/sets");
  } catch (err) {
    if (err instanceof ApiError && err.status === 404) return [];
    throw err;
  }
  return data.flatMap((p) =>
    p.sets.map((s) => ({
      id: s.set_id,
      program: p.program_abbrev,
      yearLevel: s.year_level as YearLevel,
      setCode: s.set_code,
    })),
  );
}

/**
 * POST /sets — bulk per program + year level. The form guarantees all inputs
 * share one program and year, so they collapse into a single request.
 */
async function create(inputs: CreateSetInput[]): Promise<void> {
  if (inputs.length === 0) return;
  await apiPost("/sets", {
    programAbbrev: inputs[0].program,
    yearLevel: inputs[0].yearLevel,
    sets: inputs.map((input) => ({ setCode: input.setCode })),
  });
}

/** PUT /sets/:id — only the set code is updatable. */
async function update(id: number, setCode: string): Promise<void> {
  await apiPut(`/sets/${id}`, { setCode });
}

/** DELETE /sets/:id */
async function remove(id: number): Promise<void> {
  await apiDelete(`/sets/${id}`);
}

export const setService = {
  list,
  create,
  update,
  remove,
};
