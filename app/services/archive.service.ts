import { ApiError, apiGet, apiMessage, apiPatch } from "~/lib/api";

/** Unified archive browser — GET/PATCH /archive/* */

export type ArchiveCategoryKey =
  | "buildings"
  | "rooms"
  | "departments"
  | "programs"
  | "sets"
  | "subjects"
  | "students"
  | "school_years"
  | "semesters"
  | "permissions";

export type ArchiveEntityType =
  | "building"
  | "room"
  | "department"
  | "program"
  | "set"
  | "subject"
  | "student"
  | "school_year"
  | "semester"
  | "permission";

export type ArchiveItem = {
  entityType: ArchiveEntityType;
  entityId: number;
  label: string;
  archivedAt: string | null;
  hasChildren: boolean;
  summary: Record<string, number | boolean> | null;
  extra: Record<string, unknown>;
};

type ArchiveCategory = {
  key: ArchiveCategoryKey;
  label: string;
  description: string;
  entityType: ArchiveEntityType;
  count: number;
  items: ArchiveItem[];
};

type ArchiveCategoryMeta = {
  key: ArchiveCategoryKey;
  label: string;
  description: string;
  entityType: ArchiveEntityType;
};

type RawArchiveItem = {
  entity_type: ArchiveEntityType;
  entity_id: number;
  label: string;
  archived_at: string | null;
  has_children: boolean;
  summary?: Record<string, number | boolean>;
  [key: string]: unknown;
};

function mapItem(raw: RawArchiveItem): ArchiveItem {
  const { entity_type, entity_id, label, archived_at, has_children, summary, ...rest } = raw;
  const known = new Set([
    "entity_type",
    "entity_id",
    "label",
    "archived_at",
    "has_children",
    "summary",
  ]);
  const extra: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(rest)) {
    if (!known.has(key)) extra[key] = value;
  }
  return {
    entityType: entity_type,
    entityId: entity_id,
    label,
    archivedAt: archived_at,
    hasChildren: has_children,
    summary: summary ?? null,
    extra,
  };
}

/** GET /archive/categories — navigation metadata only. */
async function listCategories(): Promise<ArchiveCategoryMeta[]> {
  const data = await apiGet<{ categories: ArchiveCategoryMeta[] }>("/archive/categories");
  return data.categories;
}

/** GET /archive/recycle-bin — legacy alias of the archive index. */
async function listRecycleBin(category?: ArchiveCategoryKey): Promise<ArchiveCategory[]> {
  const query = category ? `?category=${category}` : "";
  const data = await apiGet<{ categories: { key: ArchiveCategoryKey; label: string; description: string; entity_type: ArchiveEntityType; count: number; items: RawArchiveItem[] }[] }>(
    `/archive/recycle-bin${query}`,
  );
  return data.categories.map((cat) => ({
    key: cat.key,
    label: cat.label,
    description: cat.description,
    entityType: cat.entity_type,
    count: cat.count,
    items: cat.items.map(mapItem),
  }));
}

/** GET /archive — full index, optionally filtered by category. */
async function list(category?: ArchiveCategoryKey): Promise<ArchiveCategory[]> {
  const query = category ? `?category=${category}` : "";
  let data: { categories: { key: ArchiveCategoryKey; label: string; description: string; entity_type: ArchiveEntityType; count: number; items: RawArchiveItem[] }[] };
  try {
    data = await apiGet(`/archive${query}`);
  } catch (err) {
    if (err instanceof ApiError && err.status === 404) return [];
    throw err;
  }
  return data.categories.map((cat) => ({
    key: cat.key,
    label: cat.label,
    description: cat.description,
    entityType: cat.entity_type,
    count: cat.count,
    items: cat.items.map(mapItem),
  }));
}

/** GET /archive/:entity_type/:entity_id — expand one archived row. */
async function getDetail(entityType: ArchiveEntityType, entityId: number) {
  return apiGet<Record<string, unknown>>(`/archive/${entityType}/${entityId}`);
}

/** PATCH /archive/:entity_type/:entity_id/restore */
async function restore(entityType: ArchiveEntityType, entityId: number): Promise<string> {
  const data = await apiPatch<{ message?: string }>(`/archive/${entityType}/${entityId}/restore`);
  return apiMessage(data);
}

/** Convenience: items for one category tab. */
async function listCategoryItems(category: ArchiveCategoryKey): Promise<ArchiveItem[]> {
  const categories = await list(category);
  return categories[0]?.items ?? [];
}

export const archiveService = {
  listCategories,
  listRecycleBin,
  list,
  getDetail,
  restore,
  listCategoryItems,
};
