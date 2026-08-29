import { RoleGuard } from "~/auth/role-guard";
import { TermCalendarPage } from "~/features/schedules/term-calendar/term-calendar-page";

export function meta() {
  return [
    { title: "Scheduling Calendar — GWC Class Scheduling" },
    {
      name: "description",
      content:
        "Set the term's major-scheduling and suggestion deadlines and move the term through its phases.",
    },
  ];
}

export default function TermCalendarRoute() {
  return (
    <RoleGuard allow={["registrar", "admin"]}>
      <TermCalendarPage />
    </RoleGuard>
  );
}

