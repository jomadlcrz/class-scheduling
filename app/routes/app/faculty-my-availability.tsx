import { RoleGuard } from "~/auth/role-guard";
import { MyAvailabilityPage } from "~/features/faculty/my-availability-page";

export function meta() {
  return [
    { title: "My Availability — GWC Class Scheduling" },
    {
      name: "description",
      content: "Submit your teaching availability hours for review by the academic dean.",
    },
  ];
}

export default function FacultyMyAvailabilityRoute() {
  return (
    <RoleGuard allow={["faculty"]}>
      <MyAvailabilityPage />
    </RoleGuard>
  );
}
