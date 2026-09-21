import { apiGet } from "~/lib/api";
import { termScopeQuery } from "~/lib/term-scope";
import type { RoomTransitionReport } from "~/types/room-transition";

/** Rushed room changes in a term's saved schedule (1 endpoint).
 *
 *  Read-only and uncached on the server — it is read while a schedule is still
 *  being changed, so a stale answer would be worse than a slow one.
 */
export const roomTransitionService = {
  /** `programId` narrows the SECTION findings. Instructor findings always
   *  cover the whole term: someone teaching across programs makes the same
   *  walk whichever program you are looking at, and narrowing would hide
   *  exactly what no single Dean can otherwise see. */
  get(
    syId: number,
    semesterNumber: number,
    options?: { programId?: number; setId?: number },
  ): Promise<RoomTransitionReport> {
    return apiGet<RoomTransitionReport>(
      `/scheduling/room-transitions${termScopeQuery(syId, semesterNumber, {
        program_id: options?.programId,
        set_id: options?.setId,
      })}`,
    );
  },
};
