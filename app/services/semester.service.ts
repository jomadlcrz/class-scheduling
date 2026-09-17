import { ApiError, apiGet, apiMessage, apiPost, apiPut } from "~/lib/api";
import type { CreateSemesterInput, Semester, SemesterWritePayload } from "~/types/semester";

type SemesterResponse = {
  id?: number;
  semester?: string;
  semester_name?: string;
  semester_number: number;
  display_name?: string;
  status?: string;
  can_edit?: boolean;
};

let cachedSemesters: Semester[] | null = null;
let cachePromise: Promise<Semester[]> | null = null;
/** Cache database ids indexed by semester number. */
const semesterRowIdByNumber = new Map<number, number>();

function invalidateCache() {
  cachedSemesters = null;
  cachePromise = null;
  semesterRowIdByNumber.clear();
}

function mapSemester(s: SemesterResponse): Semester {
  const semesterName = s.semester_name ?? s.semester ?? s.display_name ?? `Semester ${s.semester_number}`;
  const id = s.id ?? semesterRowIdByNumber.get(s.semester_number) ?? s.semester_number;
  if (id > 0) {
    semesterRowIdByNumber.set(s.semester_number, id);
  }
  return {
    id,
    semester: semesterName,
    semesterNumber: s.semester_number,
    displayName: s.display_name ?? semesterName,
    status: s.status ?? "Active",
    canEdit: (s.can_edit ?? true) && id > 0,
  };
}

async function resolveSemesterRowId(semesterNumber: number): Promise<number> {
  const cached = semesterRowIdByNumber.get(semesterNumber);
  if (cached != null) return cached;
  await list();
  return semesterRowIdByNumber.get(semesterNumber) ?? semesterNumber;
}

/** Build POST/PUT body exactly as backend SemesterSchema expects. */
function toWritePayload(input: CreateSemesterInput): SemesterWritePayload {
  return {
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
