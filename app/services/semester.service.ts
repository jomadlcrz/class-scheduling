import { ApiError, apiGet, apiMessage, apiPost, apiPut } from "~/lib/api";
import type { CreateSemesterInput, Semester, SemesterWritePayload } from "~/types/semester";

type SemesterResponse = {
  id?: number;
  semester?: string;
  semester_name?: string;
  semester_number: number;
  display_name?: string;
  description?: string | null;
  status?: string;
  can_edit?: boolean;
};

let cachedSemesters: Semester[] | null = null;
let cachePromise: Promise<Semester[]> | null = null;
/** GET /semesters list omits id — resolved via GET /semesters/:id probes. */
const semesterRowIdByNumber = new Map<number, number>();

function invalidateCache() {
  cachedSemesters = null;
  cachePromise = null;
  semesterRowIdByNumber.clear();
}

function mapSemester(s: SemesterResponse): Semester {
  const semesterName = s.semester_name ?? s.semester ?? s.display_name ?? `Semester ${s.semester_number}`;
  const id = s.id ?? semesterRowIdByNumber.get(s.semester_number) ?? 0;
  return {
    id,
    semester: semesterName,
    semesterNumber: s.semester_number,
    displayName: s.display_name ?? semesterName,
    description: s.description ?? null,
    status: s.status ?? "Active",
    canEdit: (s.can_edit ?? true) && id > 0,
  };
}

/**
 * The list endpoint returns semester_number + semester_name only. Resolve database
 * ids by probing GET /semesters/:id until each semester_number is matched.
 */
async function resolveSemesterRowIds(numbers: number[]): Promise<void> {
  const needed = new Set(numbers.filter((n) => !semesterRowIdByNumber.has(n)));
  if (needed.size === 0) return;

  for (let id = 1; id <= 20; id++) {
    try {
      const row = await apiGet<{ semester_number: number }>(`/semesters/${id}`);
      semesterRowIdByNumber.set(row.semester_number, id);
      needed.delete(row.semester_number);
      if (needed.size === 0) return;
    } catch (err) {
      if (err instanceof ApiError && err.status === 404) continue;
      throw err;
    }
  }

  if (needed.size > 0) {
    throw new Error(
      `Could not resolve semester id for semester number${needed.size > 1 ? "s" : ""} ${[...needed].join(", ")}.`,
    );
  }
}

async function resolveSemesterRowId(semesterNumber: number): Promise<number> {
  const cached = semesterRowIdByNumber.get(semesterNumber);
  if (cached != null) return cached;
  await resolveSemesterRowIds([semesterNumber]);
  const id = semesterRowIdByNumber.get(semesterNumber);
  if (id == null) {
    throw new Error(`Could not resolve semester id for semester number ${semesterNumber}.`);
  }
  return id;
}

/** Build POST/PUT body exactly as backend SemesterSchema expects. */
function toWritePayload(input: CreateSemesterInput): SemesterWritePayload {
  return {
    semester: input.semester,
    semesterNumber: input.semesterNumber,
    semesterName: input.semesterName,
  };
}

/** GET /semesters — 404 → empty. Result is cached after the first fetch. */
async function list(): Promise<Semester[]> {
  if (cachedSemesters) return cachedSemesters;
  if (cachePromise) return cachePromise;

  cachePromise = (async () => {
    let data: SemesterResponse[];
    try {
      data = await apiGet<SemesterResponse[]>("/semesters");
    } catch (err) {
      if (err instanceof ApiError && err.status === 404) {
        cachedSemesters = [];
        return cachedSemesters;
      }
      cachePromise = null;
      throw err;
    }
    if (data.length > 0) {
      await resolveSemesterRowIds(data.map((row) => row.semester_number));
    }
    cachedSemesters = data.map(mapSemester);
    return cachedSemesters;
  })();

  return cachePromise;
}

/** POST /semesters — 409 when the semester already exists. Invalidates the list cache. */
async function create(input: CreateSemesterInput): Promise<string> {
  const data = await apiPost<{ message?: string; semester?: SemesterResponse & { id?: number } }>(
    "/semesters",
    toWritePayload(input),
  );
  if (data.semester?.id != null) {
    semesterRowIdByNumber.set(data.semester.semester_number ?? input.semesterNumber, data.semester.id);
  }
  invalidateCache();
  return apiMessage(data);
}

/** PUT /semesters/:id */
async function update(id: number, input: CreateSemesterInput): Promise<string> {
  const resolvedId = id > 0 ? id : await resolveSemesterRowId(input.semesterNumber);
  const data = await apiPut<{ message?: string }>(`/semesters/${resolvedId}`, toWritePayload(input));
  invalidateCache();
  return apiMessage(data);
}

/** GET /semesters/:id */
async function get(id: number): Promise<Semester> {
  const s = await apiGet<SemesterResponse>(`/semesters/${id}`);
  semesterRowIdByNumber.set(s.semester_number, id);
  return mapSemester({ ...s, id });
}

export const semesterService = { list, create, update, get };
