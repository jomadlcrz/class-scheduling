import { ApiError, apiDelete, apiGet, apiMessage, apiPost, apiPut } from "~/lib/api";
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
    departmentAbbrev: p.department?.department_abbrev ?? "",
    abbrev: p.program_abbrev,
    name: p.program_name,
    type: p.program_type,
    lengthYears: p.program_length,
  }));
}

/** POST /programs — bulk endpoint; a single create sends a one-item list. Returns the backend message. */
async function create(input: CreateProgramInput): Promise<string> {
  const data = await apiPost<{ message?: string }>("/programs", {
    programs: [
      {
        departmentName: input.departmentName,
        programAbbrev: input.abbrev,
        programName: input.name,
        programType: input.type,
        programLength: input.lengthYears,
      },
    ],
  });
  return apiMessage(data);
}

/** PUT /programs/:id — the department link is not updatable. Returns the backend message. */
async function update(id: number, input: UpdateProgramInput): Promise<string> {
  const data = await apiPut<{ message?: string }>(`/programs/${id}`, {
    ...(input.abbrev !== undefined && { programAbbrev: input.abbrev }),
    ...(input.name !== undefined && { programName: input.name }),
    ...(input.type !== undefined && { programType: input.type }),
    ...(input.lengthYears !== undefined && { programLength: input.lengthYears }),
  });
  return apiMessage(data);
}

/** DELETE /programs/:id — returns the backend message. */
async function remove(id: number): Promise<string> {
  const data = await apiDelete<{ message?: string }>(`/programs/${id}`);
  return apiMessage(data);
}

export const programService = { list, create, update, remove };
