import { ApiError, apiGet } from "~/lib/api";
import { termScopeQuery } from "~/lib/term-scope";
import type { AdjustmentBoard } from "~/types/schedule-adjustment";

/**
 * Schedule Adjustment Board — the Registrar's manual repair surface.
 *
 * Read-only on purpose. Moving a meeting goes through
 * `scheduleService.reschedule` (PATCH .../placement) and placing a missing one
 * through `scheduleService.createRegular`, so this service has no write of its
 * own: both of those already run the full placement validation, and a second
 * write path here would be a second set of rules to keep in step.
 */

const EMPTY_BOARD: AdjustmentBoard = {
  term: { syId: 0, semesterNumber: 0 },
  meetings: [],
  sets: [],
  rooms: [],
  labTimeSlots: [],
};

/**
 * GET /schedule-adjustment-board — one term's whole timetable plus its gaps.
 *
 * 404 means the term holds no active sections at all, which is an empty board
 * rather than a failure — the same way the other scheduling reads treat it.
 */
async function getBoard(params: {
  syId: number;
  semesterNumber: number;
  departmentId?: number | null;
  programId?: number | null;
  buildingId?: number | null;
  roomId?: number | null;
}): Promise<AdjustmentBoard> {
  const query = termScopeQuery(params.syId, params.semesterNumber, {
    departmentId: params.departmentId ?? undefined,
    programId: params.programId ?? undefined,
    buildingId: params.buildingId ?? undefined,
    roomId: params.roomId ?? undefined,
  });
  try {
    const data = await apiGet<AdjustmentBoard>(`/schedule-adjustment-board${query}`);
    return {
      term: data.term ?? { syId: params.syId, semesterNumber: params.semesterNumber },
      meetings: data.meetings ?? [],
      sets: data.sets ?? [],
      rooms: data.rooms ?? [],
      labTimeSlots: data.labTimeSlots ?? [],
    };
  } catch (err) {
    if (err instanceof ApiError && err.status === 404) return { ...EMPTY_BOARD, term: params };
    throw err;
  }
}

export const scheduleAdjustmentService = { getBoard };
