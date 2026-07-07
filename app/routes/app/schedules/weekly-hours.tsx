import { RoleGuard } from "~/auth/role-guard";
import { EmptyState } from "~/components/ui/empty-state";
import { PageHeader } from "~/layouts/page-header";

export function meta() {
  return [
    { title: "Weekly Hours — GWC Class Scheduling" },
    { name: "description", content: "Weekly teaching hours for the current academic term." },
  ];
}

export default function WeeklyHoursRoute() {
  return (
    <RoleGuard allow={["admin", "registrar", "dean"]}>
      <div className="mx-auto max-w-6xl px-4 py-8">
      <PageHeader
        title="Weekly Hours"
        description="Weekly teaching hours for the current academic term."
      />
      <div className="mt-6">
        <EmptyState title="Coming soon">
          Weekly hours management isn’t available yet.
        </EmptyState>
      </div>
    </div>
    </RoleGuard>
  );
}
