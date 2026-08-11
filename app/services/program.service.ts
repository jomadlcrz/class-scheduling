import { ApiError, apiGet, apiMessage, apiPatch, apiPut } from "~/lib/api";
import type { Program, ProgramDeletePreview, UpdateProgramInput } from "~/types/program";

/** Programs CRUD against the curriculums module (registrar_admin). */

type ProgramApiRow = {
  program_id: number;
  program_abbrev: string;
  program_name: string;
  program_type: string;
  program_length: number;
  program_description?: string | null;
  department?: { department_abbrev: string | null };
};

type ProgramsResponse = { programs: ProgramApiRow[] };

type DepartmentProgramsResponse = {
  department_id: number;
  department_abbrev: string;
  department_name: string;
  programs: ProgramApiRow[];
};

function mapPrograms(
  data: ProgramsResponse | DepartmentProgramsResponse,
  departmentAbbrev?: string,
): Program[] {
  return data.programs.map((p) => ({
    id: p.program_id,
    departmentAbbrev: p.department?.department_abbrev ?? departmentAbbrev ?? "",
    abbrev: p.program_abbrev,
    name: p.program_name,
    type: p.program_type,
    lengthYears: p.program_length,
    description: p.program_description,
  }));
}

/** GET /programs — the backend answers an empty table with 404. */
async function list(departmentId?: number): Promise<Program[]> {
  let data: ProgramsResponse | DepartmentProgramsResponse;
  try {
    const query = departmentId == null ? "" : `?departmentId=${departmentId}`;
    data = await apiGet<ProgramsResponse | DepartmentProgramsResponse>(`/programs${query}`);
  } catch (err) {
    if (err instanceof ApiError && err.status === 404) return [];
    throw err;
  }
  return mapPrograms(data, "department_abbrev" in data ? data.department_abbrev : undefined);
}

/**
 * There's no standalone "create program" endpoint — POST /programs requires a
 * full curriculum (at least one year level, semester, and subject) in the same
 * request. See subjectService.createCurriculum, used by the Curriculum Builder's
 * "+ New Program" flow, for program creation.
 */

/** PUT /programs/:id — abbrev, name, type, length, and department are updatable. Returns the backend message. */
async function update(id: number, input: UpdateProgramInput): Promise<string> {
  const data = await apiPut<{ message?: string }>(`/programs/${id}`, {
    ...(input.abbrev !== undefined && { programAbbrev: input.abbrev }),
    ...(input.name !== undefined && { programName: input.name }),
    ...(input.type !== undefined && { programType: input.type }),
    ...(input.lengthYears !== undefined && { programLength: input.lengthYears }),
    ...(input.departmentName !== undefined && { departmentName: input.departmentName }),
  });
  return apiMessage(data);
}

/**
 * DELETE /programs/:id — cascades through the program's curriculum, sets and
 * schedules only after the caller echoes the program's abbreviation. Returns
 * the backend message (the response also carries the same breakdown the
 * preview endpoint returns).
 */
async function remove(id: number, confirmCode: string): Promise<string> {
  const data = await apiPatch<{ message?: string }>(`/programs/${id}/archive`, { confirm: confirmCode });
  return apiMessage(data);
}

/** GET /programs/:id/delete-preview — read-only breakdown of what the delete would affect. */
async function getDeletePreview(id: number): Promise<ProgramDeletePreview> {
  const data = await apiGet<{
    program: ProgramDeletePreview["program"];
    willArchive: ProgramDeletePreview["will_delete"];
  }>(`/programs/${id}/archive-preview`);
  return { program: data.program, will_delete: data.willArchive };
}

/** GET /programs/:id — one program metadata. */
async function get(id: number): Promise<Program> {
  const p = await apiGet<ProgramApiRow & { department?: { department_abbrev: string | null } }>(`/programs/${id}`);
  return {
    id: p.program_id,
    departmentAbbrev: p.department?.department_abbrev ?? "",
    abbrev: p.program_abbrev,
    name: p.program_name,
    type: p.program_type,
    lengthYears: p.program_length,
    description: p.program_description,
  };
}

/** GET /programs/:id/curriculum — program curriculum tree (year → semester → subjects). */
async function getCurriculum(programId: number): Promise<unknown> {
  return apiGet(`/programs/${programId}/curriculum`);
}

export const programService = { list, get, getCurriculum, update, remove, getDeletePreview };
