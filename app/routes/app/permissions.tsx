import { useEffect, useState } from "react";
import { RoleGuard } from "~/auth/role-guard";
import { EmptyState } from "~/components/feedback/empty-state";
import { Spinner } from "~/components/ui/spinner";
import { PermissionMatrix } from "~/features/permissions/permission-matrix";
import { PermissionTable } from "~/features/permissions/permission-table";
import { PageHeader } from "~/layouts/page-header";
import { permissionService } from "~/services/permission.service";
import type { PermissionSummary } from "~/types/permission";

export function meta() {
  return [
    { title: "Permissions — GWC Class Scheduling" },
    {
      name: "description",
      content: "System roles and permissions for GWC Class Scheduling.",
    },
  ];
}

export default function Permissions() {
  return (
    <RoleGuard allow={["admin"]}>
      <PermissionsPage />
    </RoleGuard>
  );
}

function PermissionsPage() {
  const [roles, setRoles] = useState<PermissionSummary[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    permissionService
      .list()
      .then(setRoles)
      .catch((err) =>
        setError(err instanceof Error ? err.message : "Something went wrong. Please try again."),
      );
  }, []);

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <PageHeader
        title="Permissions"
        description="System roles and what each one can do."
      />

      {error ? (
        <EmptyState title="Couldn't load permissions">{error}</EmptyState>
      ) : roles === null ? (
        <div
          role="status"
          aria-label="Loading permissions"
          className="grid place-items-center py-12 text-navy-700 dark:text-slate-200"
        >
          <Spinner />
        </div>
      ) : roles.length === 0 ? (
        <EmptyState title="No roles yet">
          No roles exist in the system yet.
        </EmptyState>
      ) : (
        <div className="mt-6 flex flex-col gap-6">
          <PermissionTable roles={roles} />
          <section>
            <h2 className="mb-3 font-display text-2xl tracking-wide text-navy-700 dark:text-white">
              Permission Matrix
            </h2>
            <PermissionMatrix roles={roles} />
          </section>
        </div>
      )}
    </div>
  );
}
