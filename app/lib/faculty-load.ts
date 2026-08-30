/** Backend SubjectTypeName values that count as a MAJOR subject — mirrored from the
 *  backend (MAJOR_TYPES in authority_workflow.py / deans/services.py). Everything
 *  else is a MINOR subject. Keep in sync with the backend's canonical set. */
export const MAJOR_SUBJECT_TYPES: ReadonlySet<string> = new Set([
  "Major with Lab",
  "Major without Lab",
]);

/** True when a subject's backend subject-type value is a major subject. */
export function isMajorSubject(subjectType: string | null | undefined): boolean {
  return !!subjectType && MAJOR_SUBJECT_TYPES.has(subjectType);
}

export function facultyKey(firstName: string, lastName: string): string {
  return `${firstName}|${lastName}`;
}

/**
 * Matches the backend's "Last, First M." formatting for GET /deans/faculty-loading's
 * instructor_name field, so existing loads can be looked up by the selected faculty.
 */
export function formatInstructorName(person: {
  firstName: string;
  lastName: string;
  midName?: string | null;
}): string {
  const midInitial = person.midName ? ` ${person.midName.charAt(0)}.` : "";
  return `${person.lastName}, ${person.firstName}${midInitial}`;
}
