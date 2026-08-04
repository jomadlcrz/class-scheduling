/** Query params the backend term_scope helpers expect on GET requests. */
export function termScopeQuery(
  syId: number,
  semesterNumber: number,
  extra?: Record<string, string | number | undefined | null>,
): string {
  const params = new URLSearchParams({
    sy_id: String(syId),
    semester_number: String(semesterNumber),
  });
  if (extra) {
    for (const [key, value] of Object.entries(extra)) {
      if (value != null && value !== "") params.set(key, String(value));
    }
  }
  return `?${params.toString()}`;
}

export function appendTermScopeParams(
  params: URLSearchParams,
  syId: number,
  semesterNumber: number,
): URLSearchParams {
  params.set("sy_id", String(syId));
  params.set("semester_number", String(semesterNumber));
  return params;
}
