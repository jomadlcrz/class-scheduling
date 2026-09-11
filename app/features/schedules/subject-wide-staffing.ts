/**
 * Reading a subject-wide staffing response.
 *
 * Staffing a TBA subject, and reassigning a published one, both name ONE
 * meeting in the request and change every meeting of that meeting's subject in
 * that section. One subject of one section is taught by one person, so a
 * per-meeting change could only reach that state by passing through a real
 * instructor beside a TBA sibling, or two real instructors — and the college
 * recognises neither.
 *
 * What the browser has to get right is the consequence: the siblings on screen
 * changed too. These are the two decisions that follow, pulled out of the
 * components so they can be tested without one.
 */

/**
 * The shape both endpoints answer with. Older builds send neither field.
 *
 * Unconstrained in `T`: the two endpoints spell a meeting differently — the
 * Major workspace's `MajorSchedule` carries `id`, the published-amendment
 * `AmendableMeeting` carries `scheduleId` — and filling in absent fields never
 * looks inside a meeting. Only `staffedMeetingIds` needs an id, and it asks
 * for one where it is actually read.
 */
export type SubjectWideResult<T> = {
  message?: string;
  updatedCount?: number;
  updatedSchedules?: T[];
};

export type NormalizedSubjectWideResult<T> = {
  message: string;
  updatedCount: number;
  updatedSchedules: T[];
};

/**
 * Fill in what an older backend does not send.
 *
 * `updatedCount: 0` and an empty list are honest about not knowing rather than
 * guessing 1 — the caller's fallback is to refetch, which is right whatever the
 * subject's real size turns out to be. Claiming one meeting changed would be a
 * statement, and a wrong one for every subject that meets twice.
 */
export function normalizeSubjectWideResult<T>(
  payload: SubjectWideResult<T> | null | undefined,
  message: string,
): NormalizedSubjectWideResult<T> {
  return {
    message,
    updatedCount: payload?.updatedCount ?? 0,
    updatedSchedules: payload?.updatedSchedules ?? [],
  };
}

/**
 * Which meetings this staffing touched — every sibling, not the clicked card.
 *
 * The anchor is the fallback and never an addition: when the response names
 * the group, that IS the group, and adding the anchor to it would be adding an
 * id the server did not report. When it names nothing (an older backend), the
 * anchor is the only thing known to have changed, and a refetch settles the
 * rest.
 */
export function staffedMeetingIds<T extends { id: number }>(
  anchorId: number,
  updatedSchedules: readonly T[],
): number[] {
  if (updatedSchedules.length === 0) return [anchorId];
  return updatedSchedules.map((meeting) => meeting.id);
}
