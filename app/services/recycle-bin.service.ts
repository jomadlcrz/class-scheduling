import { ApiError, apiGet, apiMessage, apiPatch } from "~/lib/api";

/** Soft-deleted curriculum subjects (registrar_admin/curriculums). */

type SubjectRecycleBinResponse = {
  subject_id: number;
  subject_code: string;
  desc_title: string;
  units: number;
  subject_type: string | null;
  deactivated_at: string | null;
  prerequisite_links: number;
}[];

export type DeletedSubject = {
  subjectId: number;
  subjectCode: string;
  descTitle: string;
  units: number;
  subjectType: string | null;
  deactivatedAt: string | null;
  prerequisiteLinks: number;
};

/** GET /subjects/recycle-bin — deactivated subjects, newest first. */
async function list(): Promise<DeletedSubject[]> {
  let data: SubjectRecycleBinResponse;
  try {
    data = await apiGet<SubjectRecycleBinResponse>("/subjects/recycle-bin");
  } catch (err) {
    if (err instanceof ApiError && err.status === 404) return [];
    throw err;
  }
  return data.map((row) => ({
    subjectId: row.subject_id,
    subjectCode: row.subject_code,
    descTitle: row.desc_title,
    units: row.units,
    subjectType: row.subject_type,
    deactivatedAt: row.deactivated_at,
    prerequisiteLinks: row.prerequisite_links,
  }));
}

/** PATCH /subjects/:id/restore */
async function restore(subjectId: number): Promise<string> {
  const data = await apiPatch<{ message?: string }>(`/subjects/${subjectId}/restore`);
  return apiMessage(data);
}

export const recycleBinService = { list, restore };
