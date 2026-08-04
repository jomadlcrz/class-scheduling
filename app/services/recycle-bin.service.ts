import { ApiError, apiGet, apiMessage, apiPatch } from "~/lib/api";

/** Legacy curriculum recycle bin — GET/PATCH /recycle_bin (prefer archive.service for new UI). */

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

function mapRows(data: SubjectRecycleBinResponse): DeletedSubject[] {
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

/** GET /recycle_bin — legacy alias for deactivated subjects. */
async function list(): Promise<DeletedSubject[]> {
  let data: SubjectRecycleBinResponse;
  try {
    data = await apiGet<SubjectRecycleBinResponse>("/recycle_bin");
  } catch (err) {
    if (err instanceof ApiError && err.status === 404) return [];
    throw err;
  }
  return mapRows(data);
}

/** PATCH /recycle_bin?subject_id= — legacy restore alias. */
async function restore(subjectId: number): Promise<string> {
  const data = await apiPatch<{ message?: string }>(`/recycle_bin?subject_id=${subjectId}`);
  return apiMessage(data);
}

export const recycleBinService = { list, restore };
