import { apiGet } from "~/lib/api";
import { termScopeQuery } from "~/lib/term-scope";
import type { PreApprovalReview } from "~/types/pre-approval-review";

/** Conflicts, room availability and concerns for one program (1 endpoint).
 *
 *  Read-only and uncached on the server — it is read while a schedule is still
 *  being changed, so a stale answer would be worse than a slow one.
 */
export const preApprovalReviewService = {
  get(syId: number, semesterNumber: number, programId: number): Promise<PreApprovalReview> {
    return apiGet<PreApprovalReview>(
      `/scheduling/pre-approval-review${termScopeQuery(syId, semesterNumber, {
        program_id: programId,
      })}`,
    );
  },
};
