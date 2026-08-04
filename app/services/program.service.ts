import { ApiError, apiGet, apiMessage, apiPatch, apiPost, apiPut } from "~/lib/api";
import { archiveService } from "~/services/archive.service";
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
  const data = await apiGet<{
    program: ProgramDeletePreview["program"];
    willArchive: ProgramDeletePreview["will_delete"];
  }>(`/programs/${id}/archive-preview`);
  return { program: data.program, will_delete: data.willArchive };
}

type DeletedProgram = {
  id: number;
  abbrev: string;
  name: string;
  deactivatedAt: string | null;
  cascadeArchived?: { sets: number; subjects: number };
};

/** GET /archive?category=programs. */
async function listDeleted(): Promise<DeletedProgram[]> {
  const items = await archiveService.listCategoryItems("programs");
  return items.map((item) => ({
    id: item.entityId,
    abbrev: String(item.extra.program_abbrev ?? ""),
    name: String(item.extra.program_name ?? item.label),
    deactivatedAt: item.archivedAt,
    cascadeArchived: item.summary
      ? {
          sets: Number(item.summary.sets ?? 0),
          subjects: Number(item.summary.subjects ?? 0),
        }
      : undefined,
  }));
}

/** PATCH /archive/program/:id/restore */
async function restore(id: number): Promise<string> {
  return archiveService.restore("program", id);
}

/** GET /programs/:id — includes department_id for curriculum append flows. */
async function get(id: number): Promise<Program & { departmentId: number }> {
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
    departmentId: p.department_id,
  };
}

export const programService = { list, create, update, remove, getDeletePreview, listDeleted, restore, get };
