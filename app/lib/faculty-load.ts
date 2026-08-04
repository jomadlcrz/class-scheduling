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
