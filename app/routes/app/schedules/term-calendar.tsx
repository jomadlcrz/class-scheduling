import { RoleGuard } from "~/auth/role-guard";
import { TermCalendarPage } from "~/features/schedules/term-calendar/term-calendar-page";

export function meta() {
  return [
    { title: "Scheduling Calendar — GWC Class Scheduling" },
    {
      name: "description",
      content: "Term-batch scheduling lifecycle, deadlines, readiness, and suggestion resolution across all departments.",
    },
  ];
}

export default function TermCalendarRoute() {
  return (
    <RoleGuard allow={["registrar"]}>
      <TermCalendarPage />
    </RoleGuard>
  );
}
