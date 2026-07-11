import { useEffect, useState } from "react";
import { RoleGuard } from "~/auth/role-guard";
import { EmptyState } from "~/components/ui/empty-state";
import { Spinner } from "~/components/ui/spinner";
import { PermissionMatrix } from "~/features/roles/permission-matrix";
import { RoleTable } from "~/features/roles/role-table";
import { PageHeader } from "~/layouts/page-header";
import { roleService } from "~/services/role.service";
import type { RoleSummary } from "~/types/role";

export function meta() {
  return [
    { title: "Roles — GWC Class Scheduling" },
    {
      name: "description",
      content: "System roles and permissions for GWC Class Scheduling.",
    },
  ];
}

export default function Roles() {
  return (
    <RoleGuard allow={["admin"]}>
      <RolesPage />
    </RoleGuard>
  );
}

function RolesPage() {
  const [roles, setRoles] = useState<RoleSummary[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    roleService
      .list()
      .then(setRoles)
      .catch((err) =>
        setError(err instanceof Error ? err.message : "Something went wrong. Please try again."),
      );
  }, []);

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <PageHeader
        title="Roles"
        description="System roles and what each one can do."
      />

      {error ? (
        <EmptyState title="Couldn't load roles">{error}</EmptyState>
      ) : roles === null ? (
        <div
          role="status"
          aria-label="Loading roles"
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
          <RoleTable roles={roles} />
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
