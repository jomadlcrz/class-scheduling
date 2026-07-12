import { ApiError, apiGet, apiPost } from "~/lib/api";
import type { CreateWeeklyHourAllocationInput, WeeklyHourAllocation } from "~/types/weekly-hour-allocation";

/** Weekly hour allocations per subject type (registrar schedules module). */

type AllocationResponse = {
  subject_type: string;
  lecture_hours: number | string;
  lab_hours: number | string;
  meetings: number;
  lab_time_slots: { id: number; start: string; end: string; is_active: boolean }[];
};

/** GET /schedule/subject-weekly-hour-allocations — 404 → empty. */
async function list(): Promise<WeeklyHourAllocation[]> {
  let data: AllocationResponse[];
  try {
    data = await apiGet<AllocationResponse[]>("/schedule/subject-weekly-hour-allocations");
  } catch (err) {
    if (err instanceof ApiError && err.status === 404) return [];
    throw err;
  }
  return data.map((a) => ({
    subjectType: a.subject_type,
    subjectTypeLabel: a.subject_type,
    lectureHours: Number(a.lecture_hours),
    labHours: Number(a.lab_hours),
    meetings: a.meetings,
    labTimeSlots: (a.lab_time_slots ?? []).map((s) => ({ start: s.start, end: s.end })),
  }));
}

/** POST /schedule/subject-weekly-hour-allocations — upserts per subject type. Returns the backend message. */
async function create(input: CreateWeeklyHourAllocationInput): Promise<string> {
  const data = await apiPost<{ message?: string }>("/schedule/subject-weekly-hour-allocations", {
    subjectType: input.subjectType,
    weeklyHours: input.lectureHours + input.labHours,
    lectureHours: input.lectureHours,
    labHours: input.labHours,
    meetings: input.meetings,
    ...(input.labTimeSlots && { labTimeSlots: input.labTimeSlots }),
  });
  return typeof data?.message === "string" && data.message.trim()
    ? data.message
    : "Weekly hour allocation saved.";
}

export const weeklyHourService = { list, create };
