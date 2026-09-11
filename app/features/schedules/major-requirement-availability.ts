import type { MajorRequirement } from "~/types/schedule-authority";

/**
 * Two questions Major Scheduling Control kept confusing, kept apart here.
 *
 *   1. Did the requirements REQUEST answer?      -> loading state
 *   2. May the Registrar CHANGE what it answered? -> per-requirement state
 *
 * They used to be one. The backend's read endpoint went through the mutation
 * authority gate, so an already-published submission answered 409; the page
 * could only read that as "the request failed" and showed the red
 * "Requirements unavailable" banner with a Retry that could never succeed,
 * because a publication lock is a deterministic answer, not an outage.
 *
 * The read now succeeds and says so per requirement (`programPublished`,
 * `adjustmentBlockedReason`, `canCreateAdjustment: false`). So:
 *
 *   - the red banner is for (1) ONLY — a real request/network/server failure,
 *     the only case where retrying can change the answer;
 *   - publication is (2): ordinary, informational, already-answered data.
 *
 * Every rule here reads the backend's verdict. None of it recomputes
 * satisfaction or eligibility — that is the server's to decide (see
 * `MajorRequirementService`), and a second opinion in the browser is how the
 * two start disagreeing.
 */

/** The backend's stable reason constant. Keyed off, never the message text. */
export const PROGRAM_ALREADY_PUBLISHED = "program_already_published";

/** What one submission's requirements request produced. */
export type RequirementLoad<T = MajorRequirement[]> =
  | { ok: true; requirements: T }
  | { ok: false; message: string };

/** The identity a failed load is reported under. */
export type RequirementLoadFailure = {
  id: number;
  departmentAbbrev: string;
  departmentName: string;
  message: string;
};

/** Only the fields these rules read — so callers can pass a full
 *  `MajorRequirement` or a narrow fixture. */
type PublicationFields = Pick<
  MajorRequirement,
  "programPublished" | "canCreateAdjustment" | "isSatisfied"
> & { adjustmentBlockedReason?: string | null };

/**
 * Live to students, so read-only here.
 *
 * `adjustmentBlockedReason` is checked as well as the boolean because the
 * reason is the stable contract; a response that carries the reason but is
 * missing the flag still means published.
 */
export function isPublishedRequirement(requirement: PublicationFields): boolean {
  return (
    requirement.programPublished === true
    || requirement.adjustmentBlockedReason === PROGRAM_ALREADY_PUBLISHED
  );
}

/**
 * Whether the Registrar may create an adjustment for this requirement.
 *
 * The backend already forces `canCreateAdjustment` false for a published
 * program; publication is re-checked here so a stale cached payload, or a
 * response predating the fix, cannot re-offer a button that only 409s.
 */
export function canAdjustRequirement(requirement: PublicationFields): boolean {
  return requirement.canCreateAdjustment === true && !isPublishedRequirement(requirement);
}

/**
 * Requirements that are actually the Registrar's to fix on this page.
 *
 * Unsatisfied AND not published. A published requirement can be unsatisfied
 * and is still not pending work here: correcting it belongs to the published
 * amendment workflow, so counting it would report work this page cannot do.
 *
 * Deliberately NOT filtered by `canCreateAdjustment`. A requirement that is
 * unsatisfied but needs an existing meeting corrected first (an overscheduled
 * subject, a remainder under the one-hour floor) is still the Registrar's
 * problem and must keep showing up — it just cannot be repaired by ADDING a
 * meeting, which is what `canAdjustRequirement` answers.
 */
export function pendingRegistrarRequirements<T extends PublicationFields>(
  requirements: T[],
): T[] {
  return requirements.filter(
    (requirement) => !requirement.isSatisfied && !isPublishedRequirement(requirement),
  );
}

/** Requirements shown as "Already published" — informational, not a warning. */
export function publishedReadOnlyRequirements<T extends PublicationFields>(
  requirements: T[],
): T[] {
  return requirements.filter(isPublishedRequirement);
}

/**
 * Requirements the adjustment picker may offer for one placement.
 *
 * `selected` is the meeting being edited, whose own (set, subject) stays
 * offered so the editor can re-show what it is editing. Published
 * requirements are excluded from BOTH paths: a published meeting is not
 * editable either, and offering its identity would only produce a 409 on save.
 */
export function adjustmentPickerRequirements<
  T extends PublicationFields & {
    setId: number;
    subjectId: number;
    missingSessionModes: string[];
  },
>(
  requirements: T[],
  options: {
    sessionMode: string;
    selected?: { setId: number; subjectId: number } | null;
  },
): T[] {
  const { sessionMode, selected } = options;
  return requirements.filter((requirement) => {
    if (isPublishedRequirement(requirement)) return false;
    if (
      selected
      && requirement.setId === selected.setId
      && requirement.subjectId === selected.subjectId
    ) {
      return true;
    }
    return (
      canAdjustRequirement(requirement)
      && requirement.missingSessionModes.includes(sessionMode as any)
    );
  });
}

/**
 * The submissions whose requirements are genuinely UNKNOWN.
 *
 * This is the red banner's only input, and the only thing Retry is offered
 * for. An `ok` load is never a failure however locked its contents are — that
 * is the confusion this whole module exists to end.
 */
export function requirementLoadFailures(
  loads: {
    id: number;
    departmentAbbrev: string;
    departmentName: string;
    load: RequirementLoad;
  }[],
): RequirementLoadFailure[] {
  return loads.flatMap(({ id, departmentAbbrev, departmentName, load }) =>
    load.ok
      ? []
      : [{ id, departmentAbbrev, departmentName, message: load.message }],
  );
}

/** Retry can only help where the request itself failed. */
export function shouldOfferRetry(failures: RequirementLoadFailure[]): boolean {
  return failures.length > 0;
}
