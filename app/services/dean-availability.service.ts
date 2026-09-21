import { apiDelete, apiGet, apiPost, apiPut } from "~/lib/api";
import { termScopeQuery } from "~/lib/term-scope";
import type {
  AvailabilityConfigurationInput,
  AvailabilityReviewState,
  AvailabilityWindow,
  DepartmentAvailability,
  InstructorAvailabilityRow,
  SavedConfiguration,
  ReopenedAvailabilityResponse,
  AvailabilityWidenRequest,
  WidenRequestInput,
  WidenRequestList,
  WidenRequestStatus,
} from "~/types/dean-instructor-availability";

/**
 * The dean's instructor-availability review and configuration.
 * Department scope is enforced by the backend off the caller's token.
 * Registrars see college-wide read access.
 */

type RawWindow = { day_of_week?: string; start_time?: string; end_time?: string };

function mapWindows(raw: RawWindow[] | undefined): AvailabilityWindow[] {
  return (raw ?? []).map((w) => ({
    dayOfWeek: w.day_of_week ?? "",
    startTime: w.start_time ?? "",
    endTime: w.end_time ?? "",
  }));
}

function toRawWindows(windows: AvailabilityWindow[]): RawWindow[] {
  return windows.map((w) => ({
    day_of_week: w.dayOfWeek,
    start_time: w.startTime,
    end_time: w.endTime,
  }));
}

type RawRow = {
  instructor_profile_id?: number;
  name?: string;
  employee_id?: string | null;
  department_id?: number | null;
  department_abbrev?: string | null;
  employment_status?: string | null;
  academic_rank?: string | null;
  review_state?: string;
  review_state_label?: string;
  can_reopen?: boolean;
  declaration?: {
    declared?: boolean;
    note?: string | null;
    submitted_at?: string | null;
    updated_at?: string | null;
    reopened_at?: string | null;
    reopen_note?: string | null;
    windows?: RawWindow[];
    hours?: number | null;
  };
  configuration?: {
    configured?: boolean;
    note?: string | null;
    configured_by?: string | null;
    updated_at?: string | null;
    windows?: RawWindow[];
    hours?: number | null;
  };
  load?: {
    assigned_subjects?: number;
    assigned_weekly_hours?: number;
    available_weekly_hours?: number | null;
    shortfall_hours?: number | null;
  };
};

function mapRow(raw: RawRow): InstructorAvailabilityRow {
  return {
    instructorProfileId: raw.instructor_profile_id ?? 0,
    name: raw.name ?? "",
    employeeId: raw.employee_id ?? null,
    departmentId: raw.department_id ?? null,
    departmentAbbrev: raw.department_abbrev ?? null,
    employmentStatus: raw.employment_status ?? null,
    academicRank: raw.academic_rank ?? null,
    reviewState: (raw.review_state ?? "no_declaration") as AvailabilityReviewState,
    reviewStateLabel: raw.review_state_label ?? "",
    canReopen: raw.can_reopen === true,
    declaration: {
      declared: raw.declaration?.declared === true,
      note: raw.declaration?.note ?? null,
      submittedAt: raw.declaration?.submitted_at ?? null,
      updatedAt: raw.declaration?.updated_at ?? null,
      reopenedAt: raw.declaration?.reopened_at ?? null,
      reopenNote: raw.declaration?.reopen_note ?? null,
      windows: mapWindows(raw.declaration?.windows),
      hours: raw.declaration?.hours ?? null,
    },
    configuration: {
      configured: raw.configuration?.configured === true,
      note: raw.configuration?.note ?? null,
      configuredBy: raw.configuration?.configured_by ?? null,
      updatedAt: raw.configuration?.updated_at ?? null,
      windows: mapWindows(raw.configuration?.windows),
      hours: raw.configuration?.hours ?? null,
    },
    load: {
      assignedSubjects: raw.load?.assigned_subjects ?? 0,
      assignedWeeklyHours: raw.load?.assigned_weekly_hours ?? 0,
      // Null is meaningful here: unconstrained, not zero hours available.
      availableWeeklyHours: raw.load?.available_weekly_hours ?? null,
      shortfallHours: raw.load?.shortfall_hours ?? null,
    },
  };
}

/** GET /deans/instructor-availability */
async function list(
  syId: number,
  semesterNumber: number,
  options?: { search?: string; state?: string; departmentId?: number | null },
): Promise<DepartmentAvailability> {
  const raw = await apiGet<Record<string, any>>(
    `/deans/instructor-availability${termScopeQuery(syId, semesterNumber, {
      search: options?.search,
      state: options?.state,
      department_id: options?.departmentId,
    })}`,
  );
  return {
    syId: raw.sy_id ?? syId,
    schoolYear: raw.school_year ?? "",
    semesterNumber: raw.semester_number ?? semesterNumber,
    collegeWide: raw.college_wide === true,
    department: {
      id: raw.department?.id ?? null,
      name: raw.department?.name ?? null,
      abbrev: raw.department?.abbrev ?? null,
    },
    reviewStates: raw.review_states ?? {},
    summary: {
      instructors: raw.summary?.instructors ?? 0,
      declared: raw.summary?.declared ?? 0,
      notDeclared: raw.summary?.not_declared ?? 0,
      configured: raw.summary?.configured ?? 0,
      awaitingReview: raw.summary?.awaiting_review ?? 0,
      awaitingResubmission: raw.summary?.awaiting_resubmission ?? 0,
      unconstrained: raw.summary?.unconstrained ?? 0,
      withShortfall: raw.summary?.with_shortfall ?? 0,
    },
    instructors: (raw.instructors ?? []).map(mapRow),
  };
}

/** PUT /deans/instructor-availability/{id} — record the constraint. */
async function configure(
  instructorProfileId: number,
  syId: number,
  semesterNumber: number,
  input: AvailabilityConfigurationInput,
): Promise<SavedConfiguration> {
  const raw = await apiPut<Record<string, any>>(
    `/deans/instructor-availability/${instructorProfileId}${termScopeQuery(
      syId,
      semesterNumber,
    )}`,
    { note: input.note, windows: toRawWindows(input.windows) },
  );
  return {
    instructorProfileId: raw.instructor_profile_id ?? instructorProfileId,
    configured: raw.configured === true,
    note: raw.note ?? null,
    updatedAt: raw.updated_at ?? "",
    windows: mapWindows(raw.windows),
    hours: raw.hours ?? 0,
    matchesDeclaration: raw.matches_declaration === true,
    reviewState: (raw.review_state ?? "configured") as AvailabilityReviewState,
  };
}

/** DELETE /deans/instructor-availability/{id} — lift restriction completely. */
async function clear(
  instructorProfileId: number,
  syId: number,
  semesterNumber: number,
): Promise<void> {
  await apiDelete(
    `/deans/instructor-availability/${instructorProfileId}${termScopeQuery(
      syId,
      semesterNumber,
    )}`,
  );
}

function mapWidenRequest(raw: Record<string, any>): AvailabilityWidenRequest {
  return {
    id: raw.id ?? 0,
    instructorProfileId: raw.instructor_profile_id ?? 0,
    instructorName: raw.instructor_name ?? null,
    departmentId: raw.department_id ?? null,
    subjectCode: raw.subject_code ?? null,
    reason: raw.reason ?? "",
    status: (raw.status ?? "pending") as WidenRequestStatus,
    requestedBy: raw.requested_by ?? null,
    createdAt: raw.created_at ?? "",
    decisionMessage: raw.decision_message ?? null,
    decidedBy: raw.decided_by ?? null,
    decidedAt: raw.decided_at ?? null,
    windows: mapWindows(raw.windows),
  };
}

/** POST .../{id}/widen-requests — Registrar asks Dean to open hours. */
async function requestWiden(
  instructorProfileId: number,
  syId: number,
  semesterNumber: number,
  input: WidenRequestInput,
): Promise<AvailabilityWidenRequest> {
  return mapWidenRequest(
    await apiPost<Record<string, any>>(
      `/deans/instructor-availability/${instructorProfileId}/widen-requests${termScopeQuery(
        syId,
        semesterNumber,
      )}`,
      {
        reason: input.reason,
        subject_code: input.subjectCode,
        windows: toRawWindows(input.windows),
      },
    ),
  );
}

/** GET .../widen-requests — list pending or decided widen requests. */
async function listWidenRequests(
  syId: number,
  semesterNumber: number,
  status?: WidenRequestStatus,
): Promise<WidenRequestList> {
  const raw = await apiGet<Record<string, any>>(
    `/deans/instructor-availability/widen-requests${termScopeQuery(syId, semesterNumber, {
      status,
    })}`,
  );
  return {
    syId: raw.sy_id ?? syId,
    semesterNumber: raw.semester_number ?? semesterNumber,
    pending: raw.pending ?? 0,
    requests: (raw.requests ?? []).map(mapWidenRequest),
  };
}

/** POST .../widen-requests/{id}/decisions — Dean approves or rejects. */
async function decideWidenRequest(
  requestId: number,
  decision: "approved" | "rejected",
  decisionMessage?: string,
): Promise<AvailabilityWidenRequest> {
  return mapWidenRequest(
    await apiPost<Record<string, any>>(
      `/deans/instructor-availability/widen-requests/${requestId}/decisions`,
      { decision, decision_message: decisionMessage ?? null },
    ),
  );
}

/**
 * POST /deans/instructor-availability/{id}/reopenings
 * Let this instructor send their availability one more time.
 */
async function reopenDeclaration(
  instructorProfileId: number,
  syId: number,
  semesterNumber: number,
  note?: string | null,
): Promise<ReopenedAvailabilityResponse> {
  const raw = await apiPost<Record<string, any>>(
    `/deans/instructor-availability/${instructorProfileId}/reopenings${termScopeQuery(syId, semesterNumber)}`,
    { note: note ?? null },
  );
  return {
    instructorProfileId: raw.instructor_profile_id,
    syId: raw.sy_id,
    schoolYear: raw.school_year,
    semesterNumber: raw.semester_number,
    alreadyOpen: raw.already_open === true,
    reopenedAt: raw.reopened_at,
    reopenNote: raw.reopen_note ?? null,
    reviewState: raw.review_state as AvailabilityReviewState,
  };
}

export const deanAvailabilityService = {
  list,
  configure,
  clear,
  reopenDeclaration,
  requestWiden,
  listWidenRequests,
  decideWidenRequest,
};
