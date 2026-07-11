import { ApiError, apiDelete, apiGet, apiPost, apiPut } from "~/lib/api";
import type { CreateProgramInput, Program, UpdateProgramInput } from "~/types/program";

/** Programs CRUD against the curriculums module (registrar_admin). */

type ProgramsResponse = {
  programs: {
    program_id: number;
    program_abbrev: string;
    program_name: string;
    program_type: string;
    program_length: number;
    department: { department_abbrev: string | null };
  }[];
};

/** GET /programs — the backend answers an empty table with 404. */
async function list(): Promise<Program[]> {
  let data: ProgramsResponse;
  try {
    data = await apiGet<ProgramsResponse>("/programs");
  } catch (err) {
    if (err instanceof ApiError && err.status === 404) return [];
    throw err;
  }
  return data.programs.map((p) => ({
    id: p.program_id,
    departmentCode: p.department?.department_abbrev ?? "",
    code: p.program_abbrev,
    name: p.program_name,
    type: p.program_type,
    lengthYears: p.program_length,
  }));
}

/** POST /programs — bulk endpoint; a single create sends a one-item list. */
async function create(input: CreateProgramInput): Promise<void> {
  await apiPost("/programs", {
    programs: [
      {
        departmentName: input.departmentName,
        programAbbrev: input.code,
        programName: input.name,
        programType: input.type,
        programLength: input.lengthYears,
      },
    ],
  });
}

/** PUT /programs/:id — the department link is not updatable. */
async function update(id: number, input: UpdateProgramInput): Promise<void> {
  await apiPut(`/programs/${id}`, {
    ...(input.code !== undefined && { programAbbrev: input.code }),
    ...(input.name !== undefined && { programName: input.name }),
    ...(input.type !== undefined && { programType: input.type }),
    ...(input.lengthYears !== undefined && { programLength: input.lengthYears }),
  });
}

/** DELETE /programs/:id */
async function remove(id: number): Promise<void> {
  await apiDelete(`/programs/${id}`);
}

export const programService = { list, create, update, remove };
