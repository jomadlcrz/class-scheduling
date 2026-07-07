import { RoleGuard } from "~/auth/role-guard";
import { EmptyState } from "~/components/ui/empty-state";
import { PageHeader } from "~/layouts/page-header";

export function meta() {
  return [
    { title: "Irregular Class — GWC Class Scheduling" },
    { name: "description", content: "Manage irregular class schedules for the current academic term." },
  ];
}

export default function IrregularClassRoute() {
  return (
    <RoleGuard allow={["admin", "registrar", "dean"]}>
      <PageHeader
        title="Irregular Class"
        description="Irregular class schedules for the current academic term."
      />
      <div className="mt-6">
        <EmptyState title="Coming soon">
          Irregular class scheduling isn’t available yet.
        </EmptyState>
      </div>
    </RoleGuard>
  );
}
