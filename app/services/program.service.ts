import { ApiError, apiGet, apiMessage, apiPatch, apiPost, apiPut } from "~/lib/api";
import type {
  CreateProgramInput,
  Program,
  ProgramDeletePreview,
  UpdateProgramInput,
} from "~/types/program";

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
  return apiGet<ProgramDeletePreview>(`/programs/${id}/archive-preview`);
}

export type DeletedProgram = {
  id: number;
  abbrev: string;
  name: string;
  deactivatedAt: string | null;
  cascadeArchived?: { sets: number; subjects: number };
};

type ProgramRecycleBinResponse = {
  program_id: number;
  program_abbrev: string;
  program_name: string;
  deactivated_at: string | null;
  cascade_archived?: { sets: number; subjects: number };
}[];

/** GET /programs/recycle-bin — 404 → empty. */
async function listDeleted(): Promise<DeletedProgram[]> {
  let data: ProgramRecycleBinResponse;
  try {
    data = await apiGet<ProgramRecycleBinResponse>("/programs/recycle-bin");
  } catch (err) {
    if (err instanceof ApiError && err.status === 404) return [];
    throw err;
  }
  return data.map((p) => ({
    id: p.program_id,
    abbrev: p.program_abbrev,
    name: p.program_name,
    deactivatedAt: p.deactivated_at,
    cascadeArchived: p.cascade_archived,
  }));
}

/** PATCH /programs/:id/restore */
async function restore(id: number): Promise<string> {
  const data = await apiPatch<{ message?: string }>(`/programs/${id}/restore`);
  return apiMessage(data);
}

/** GET /programs/:id — no auth required server-side (backend inconsistency vs. the rest of this module), harmless either way. */
async function get(id: number): Promise<Program> {
  const p = await apiGet<{
    program_id: number;
    program_abbrev: string;
    program_name: string;
    program_type: string;
    program_length: number;
    department_id: number;
  }>(`/programs/${id}`);
  return {
    id: p.program_id,
    departmentAbbrev: "",
    abbrev: p.program_abbrev,
    name: p.program_name,
    type: p.program_type,
    lengthYears: p.program_length,
  };
}

export const programService = { list, create, update, remove, getDeletePreview, listDeleted, restore, get };
