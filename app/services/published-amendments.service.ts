import { apiGet, apiPatch, apiPost } from "~/lib/api";
import { normalizeSubjectWideResult } from "~/features/schedules/subject-wide-staffing";
import { termScopeQuery } from "~/lib/term-scope";
import type {
  AmendableMeeting,
  ClassModeChangeInput,
  ClassModeChangeResult,
  InstructorChangeResult,
  InstructorHoldings,
  VacancyResult,
} from "~/types/published-amendments";

/**
 * Changing who teaches a published class, and how it is delivered.
 *
 * Separate from schedule.service's updateRegular on purpose: that one goes
 * through the general editor, which a published release refuses outright, and
 * whose `instructorId` cannot express "nobody" — an absent id and an explicit
 * null arrive identical there. These endpoints exist because neither was
 * reachable.
 */

/** What one instructor is still on the timetable for. Omit the term to get every one. */
async function getHoldings(
  instructorProfileId: number,
  term?: { syId: number; semesterNumber: number },
): Promise<InstructorHoldings> {
  const query = term ? termScopeQuery(term.syId, term.semesterNumber) : "";
  return apiGet<InstructorHoldings>(
    `/instructors/${instructorProfileId}/schedule-holdings${query}`,
  );
}

/**
 * Take one instructor off every meeting they hold in a term, in one act.
 *
 * One call because a resignation is one event: vacating meeting by meeting
 * leaves a half-staffed timetable between requests, and there is no moment
 * where half of someone's classes still having a teacher is intended.
 */
async function vacateTerm(
  instructorProfileId: number,
  input: { syId: number; semesterNumber: number; reason: string },
): Promise<VacancyResult & { message: string }> {
  return apiPost<VacancyResult & { message: string }>(
    `/registrar/instructors/${instructorProfileId}/schedule-vacancies`,
    input,
  );
}

/**
 * Set the instructor for this meeting's whole SUBJECT in this section.
 * `instructorId: null` clears every meeting of it to TBA.
 *
 * The id names the meeting that was clicked; the change is subject-wide, and
 * all or nothing — a clash or a cap on any one of the subject's meetings
 * leaves all of them as they were. The response's `updatedSchedules` carries
 * every meeting of the subject, which is what a caller should repaint from.
 */
async function setInstructor(
  scheduleId: number,
  input: { instructorId: number | null; reason: string },
): Promise<InstructorChangeResult & { message: string }> {
  const data = await apiPatch<
    Omit<InstructorChangeResult, "updatedCount" | "updatedSchedules">
    & Partial<Pick<InstructorChangeResult, "updatedCount" | "updatedSchedules">>
    & { message: string }
  >(`/registrar/regular-schedules/${scheduleId}/instructor`, input);
  // Normalized, not trusted: a backend that predates subject-wide staffing
  // sends neither field, and the doc comment above tells callers to repaint
  // from updatedSchedules. Typed as present but arriving undefined is a
  // TypeError on .map with nothing to warn about it at compile time.
  const { updatedCount, updatedSchedules } =
    normalizeSubjectWideResult<AmendableMeeting>(data, data.message);
  return { ...data, updatedCount, updatedSchedules };
}

/**
 * Move one meeting online or back on campus.
 *
 * `roomId` is forwarded only when the caller actually set it — the key's
 * absence is meaningful to the backend ("decide from the mode") and is not the
 * same request as sending null.
 */
async function setClassMode(
  scheduleId: number,
  input: ClassModeChangeInput,
): Promise<ClassModeChangeResult & { message: string }> {
  const body: Record<string, unknown> = {
    classMode: input.classMode,
    reason: input.reason,
  };
  if ("roomId" in input) body.roomId = input.roomId;
  return apiPatch<ClassModeChangeResult & { message: string }>(
    `/registrar/regular-schedules/${scheduleId}/class-mode`,
    body,
  );
}

export const publishedAmendmentsService = {
  getHoldings,
  vacateTerm,
  setInstructor,
  setClassMode,
};
