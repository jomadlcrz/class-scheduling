import { RoleGuard } from "~/auth/role-guard";
import { DeanInstructorAvailabilityPage } from "~/features/dean-availability/instructor-availability-page";

export function meta() {
  return [
    { title: "Instructor Availability — GWC Class Scheduling" },
    {
      name: "description",
      content: "Review instructor availability declarations and configure scheduling constraint hours.",
    },
  ];
}

export default function DeanInstructorAvailabilityRoute() {
  return (
    <RoleGuard allow={["dean", "registrar"]}>
      <DeanInstructorAvailabilityPage />
    </RoleGuard>
  );
}
