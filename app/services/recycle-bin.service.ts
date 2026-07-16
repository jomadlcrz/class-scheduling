import { ApiError, apiGet, apiMessage, apiPatch } from "~/lib/api";

/** Soft-deleted curriculum subjects (registrar_admin module). */

type RecycleBinResponse = {
  program: string;
  subject_id: number;
  subject_code: string;
  desc_title: string;
  units: number;
  subject_type: string;
  prerequisites: { required: string }[];
}[];

export type DeletedSubject = {
  program: string;
  subjectId: number;
  subjectCode: string;
  descTitle: string;
  units: number;
  subjectType: string;
  prerequisites: string[];
};

/** GET /recycle_bin — subjects with is_active = false. 404 → empty. */
async function list(): Promise<DeletedSubject[]> {
  let data: RecycleBinResponse;
  try {
    data = await apiGet<RecycleBinResponse>("/recycle_bin");
  } catch (err) {
    if (err instanceof ApiError && err.status === 404) return [];
    throw err;
  }
  return data.map((d) => ({
    program: d.program,
    subjectId: d.subject_id,
    subjectCode: d.subject_code,
    descTitle: d.desc_title,
    units: d.units,
    subjectType: d.subject_type,
    prerequisites: d.prerequisites.map((p) => p.required),
  }));
}

/** PATCH /recycle_bin?subject_id=<id> — restores a subject. Returns the backend message. */
async function restore(subjectId: number): Promise<string> {
  const data = await apiPatch<{ message?: string }>(`/recycle_bin?subject_id=${subjectId}`);
  return apiMessage(data);
}

export const recycleBinService = { list, restore };
