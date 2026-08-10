import { useParams } from "react-router";
import { RoleGuard } from "~/auth/role-guard";
import { DepartmentDetailPage } from "~/features/departments/department-detail-page";

export function meta() {
  return [{ title: "Department — GWC Class Scheduling" }];
}

export default function DepartmentDetailRoute() {
  const { departmentId } = useParams();
  const id = Number(departmentId);

  return (
    <RoleGuard allow={["admin", "registrar"]}>
      <DepartmentDetailPage departmentId={id} />
    </RoleGuard>
  );
}
