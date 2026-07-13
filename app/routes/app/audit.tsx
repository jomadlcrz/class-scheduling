import { PageHeader } from "~/layouts/page-header";

export function meta() {
  return [
    { title: "Audit Log — GWC Class Scheduling" },
  ];
}

export default function AuditLog() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <PageHeader
        title="Audit Log"
        description="Track system activity and user actions."
      />
    </div>
  );
}
