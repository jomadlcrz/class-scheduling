/**
 * Registrar's Schedule Adjustment Board.
 *
 * Registrar-only, matching every other surface that writes timetable content:
 * the Dean reviews programs, the Registrar arranges them.
 */
import { RoleGuard } from "~/auth/role-guard";
import { AdjustmentBoardPage } from "~/features/schedules/adjustment-board-page";

export function meta() {
  return [
    { title: "Schedule Adjustment Board — GWC Class Scheduling" },
    {
      name: "description",
      content:
        "Move any generated class by hand and place the subjects generation could not fit, on one room/day/time map of the whole term.",
    },
  ];
}

export default function ScheduleAdjustmentBoardRoute() {
  return (
    <RoleGuard allow={["registrar", "admin"]}>
      <AdjustmentBoardPage />
    </RoleGuard>
  );
}
