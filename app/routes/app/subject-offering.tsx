import { RoleGuard } from "~/auth/role-guard";
import { RegistrarSubjectOffering } from "~/features/subject-assignments/registrar-subject-offering";
import { SubjectAssignmentView } from "~/features/subject-assignments/subject-assignment-view";
import { useAuth } from "~/hooks/use-auth";

export function meta() {
  return [
    { title: "Subject Offering — GWC Class Scheduling" },
    {
      name: "description",
      content: "Review subject offerings and manage instructor assignments for an academic term.",
    },
  ];
}

export default function SubjectOfferingRoute() {
  const { user } = useAuth();
  const isRegistrar = user?.role === "registrar";

  return (
    <RoleGuard allow={["dean", "registrar"]}>
      {isRegistrar ? <RegistrarSubjectOffering /> : <SubjectAssignmentView />}
    </RoleGuard>
  );
}