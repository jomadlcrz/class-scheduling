import { apiGet, apiPut } from "~/lib/api";
import { termScopeQuery } from "~/lib/term-scope";
import type {
  AvailabilityDeclaration,
  AvailabilityDeclarationInput,
  AvailabilityWindow,
} from "~/types/instructor-availability";

/** The instructor's own availability declaration — self-scoped. */

type RawWindow = { day_of_week?: string; start_time?: string; end_time?: string };

type RawDeclaration = {
  sy_id?: number;
  school_year?: string;
  semester_number?: number;
  declared?: boolean;
  note?: string | null;
  submitted_at?: string | null;
  updated_at?: string | null;
  windows?: RawWindow[];
};

function mapDeclaration(raw: RawDeclaration): AvailabilityDeclaration {
  return {
    syId: raw.sy_id ?? 0,
    schoolYear: raw.school_year ?? "",
    semesterNumber: raw.semester_number ?? 0,
    declared: raw.declared === true,
    note: raw.note ?? null,
    submittedAt: raw.submitted_at ?? null,
    updatedAt: raw.updated_at ?? null,
    windows: (raw.windows ?? []).map((w) => ({
      dayOfWeek: w.day_of_week ?? "",
      startTime: w.start_time ?? "",
      endTime: w.end_time ?? "",
    })),
  };
}

function toRawWindows(windows: AvailabilityWindow[]): RawWindow[] {
  return windows.map((w) => ({
    day_of_week: w.dayOfWeek,
    start_time: w.startTime,
    end_time: w.endTime,
  }));
}

/** GET /instructor/availability — mine for one term; never 404s when unset. */
async function get(syId: number, semesterNumber: number): Promise<AvailabilityDeclaration> {
  return mapDeclaration(
    await apiGet<RawDeclaration>(`/instructor/availability${termScopeQuery(syId, semesterNumber)}`),
  );
}

/**
 * PUT /instructor/availability — replaces the whole declaration.
 * The server merges overlapping spans on a day and returns what it stored.
 */
async function save(
  syId: number,
  semesterNumber: number,
  input: AvailabilityDeclarationInput,
): Promise<AvailabilityDeclaration> {
  return mapDeclaration(
    await apiPut<RawDeclaration>(`/instructor/availability${termScopeQuery(syId, semesterNumber)}`, {
      note: input.note,
      windows: toRawWindows(input.windows),
    }),
  );
}

export const instructorAvailabilityService = { get, save };
