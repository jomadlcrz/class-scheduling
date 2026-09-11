import { apiGet } from "~/lib/api";
import { termScopeQuery } from "~/lib/term-scope";
import type {
  MajorSchedulingAvailability,
  MajorSchedulingAvailabilityQuery,
} from "~/types/major-scheduling-availability";

/**
 * Which rooms and instructors are actually free for the Dean's own term.
 *
 * Read-only, and deliberately not cached anywhere: a build in progress changes
 * this with every save, and a stale answer is a double-booking.
 *
 * Sending `dayOfWeek`/`startTime`/`endTime` asks the slot question too — the
 * backend 400s on a half-specified slot, so all three go or none do. Pass
 * `excludeScheduleId` whenever the drawer is open over a meeting being MOVED,
 * or that meeting reports its own hour as taken.
 */
async function get(
  query: MajorSchedulingAvailabilityQuery,
): Promise<MajorSchedulingAvailability> {
  const {
    syId,
    semesterNumber,
    workspace = "dean",
    departmentId,
    dayOfWeek,
    startTime,
    endTime,
    programId,
    subjectId,
    curriculumDetailId,
    excludeScheduleId,
    majorOnly,
  } = query;

  // A slot is all three or nothing. Dropping a partial one here keeps a
  // half-filled editor from turning into a 400 the Dean has to read.
  const slotIsComplete = Boolean(dayOfWeek && startTime && endTime);

  // Two endpoints, one shape. They differ only in the conflict scope behind
  // them — see the workspace type — so the drawer never has to know which it
  // is reading, only which to ask.
  const base =
    workspace === "registrar"
      ? "/registrar/major-scheduling/availability"
      : "/deans/major-scheduling/availability";

  return apiGet<MajorSchedulingAvailability>(
    `${base}${termScopeQuery(syId, semesterNumber, {
      department_id: departmentId,
      program_id: programId,
      subject_id: subjectId,
      curriculum_detail_id: curriculumDetailId,
      exclude_schedule_id: excludeScheduleId,
      // Only ever sent as a positive. Omitting it is the default reading, so
      // there is nothing to say when it is off.
      ...(majorOnly ? { major_only: "true" } : {}),
      ...(slotIsComplete
        ? { day_of_week: dayOfWeek, start_time: startTime, end_time: endTime }
        : {}),
    })}`,
  );
}

export const majorSchedulingAvailabilityService = { get };
