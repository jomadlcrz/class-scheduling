import { useEffect, useState } from "react";
import { toast } from "sonner";
import { RoleGuard } from "~/auth/role-guard";
import { EmptyState } from "~/components/feedback/empty-state";
import { Button } from "~/components/ui/button";
import { PlusIcon } from "~/components/ui/icons";
import { ConfirmDialog, Modal } from "~/components/ui/modal";
import { Spinner } from "~/components/ui/spinner";
import { AddPermissionForm } from "~/features/permissions/add-permission-form";
import { AddRoleForm } from "~/features/permissions/add-role-form";
import { PermissionCatalogTable } from "~/features/permissions/permission-catalog-table";
import { PermissionEditForm } from "~/features/permissions/permission-edit-form";
import { PermissionMatrix } from "~/features/permissions/permission-matrix";
import { PermissionTable } from "~/features/permissions/permission-table";
import { RolePermissionsForm } from "~/features/permissions/role-permissions-form";
import { PageHeader } from "~/layouts/page-header";
import { permissionService } from "~/services/permission.service";
import type { PermissionSummary, RolePermission } from "~/types/permission";

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
  const [catalog, setCatalog] = useState<RolePermission[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [addRoleOpen, setAddRoleOpen] = useState(false);
  const [addPermissionOpen, setAddPermissionOpen] = useState(false);
  const [assignTarget, setAssignTarget] = useState<PermissionSummary | null>(null);
  const [editTarget, setEditTarget] = useState<PermissionSummary | null>(null);
  const [revokeTarget, setRevokeTarget] = useState<{ roleId: number; permissionId: number } | null>(
    null,
  );
  const [editPermissionTarget, setEditPermissionTarget] = useState<RolePermission | null>(null);
  const [deletePermissionTarget, setDeletePermissionTarget] = useState<RolePermission | null>(null);

  function refresh() {
    permissionService
      .list()
      .then(setRoles)
      .catch((err) =>
        setError(err instanceof Error ? err.message : "Something went wrong. Please try again."),
      );
    permissionService.listCatalog().then(setCatalog).catch(() => setCatalog([]));
  }

  useEffect(refresh, []);

  const revokeTargetRole = roles?.find((r) => r.id === revokeTarget?.roleId);
  const revokeTargetPermission = catalog.find((p) => p.id === revokeTarget?.permissionId);

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <PageHeader
        title="Permissions"
        description="System roles and what each one can do."
        actions={
          <div className="flex gap-2">
            <Button type="button" variant="outline" block={false} onClick={() => setAddPermissionOpen(true)}>
              <PlusIcon />
              Add Permission
            </Button>
            <Button type="button" block={false} onClick={() => setAddRoleOpen(true)}>
              <PlusIcon />
              Add Role
            </Button>
          </div>
        }
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
          <PermissionTable roles={roles} onEdit={setEditTarget} onAssign={setAssignTarget} />
          <section>
            <h2 className="mb-3 font-display text-2xl tracking-wide text-navy-700 dark:text-mist-100">
              Permission Matrix
            </h2>
            <PermissionMatrix
              roles={roles}
              catalog={catalog}
              onRevoke={(roleId, permissionId) => setRevokeTarget({ roleId, permissionId })}
            />
          </section>

          <section>
            <h2 className="mb-3 font-display text-2xl tracking-wide text-navy-700 dark:text-mist-100">
              Permission Catalog
            </h2>
            <PermissionCatalogTable
              catalog={catalog}
              onEdit={setEditPermissionTarget}
              onDelete={setDeletePermissionTarget}
            />
          </section>
        </div>
      )}

      <Modal open={addRoleOpen} onClose={() => setAddRoleOpen(false)} title="Add Role">
        <AddRoleForm
          onCreated={(message) => {
            if (message) toast.success(message);
            refresh();
            setAddRoleOpen(false);
          }}
          onCancel={() => setAddRoleOpen(false)}
        />
      </Modal>

      <Modal open={addPermissionOpen} onClose={() => setAddPermissionOpen(false)} title="Add Permission">
        <AddPermissionForm
          onCreated={(message) => {
            if (message) toast.success(message);
            refresh();
            setAddPermissionOpen(false);
          }}
          onCancel={() => setAddPermissionOpen(false)}
        />
      </Modal>

      <Modal
        open={assignTarget !== null}
        onClose={() => setAssignTarget(null)}
        title={assignTarget ? `Assign Permissions — ${assignTarget.name}` : "Assign Permissions"}
      >
        {assignTarget && (
          <RolePermissionsForm
            role={assignTarget}
            catalog={catalog}
            onSaved={(message) => {
              if (message) toast.success(message);
              refresh();
              setAssignTarget(null);
            }}
            onCancel={() => setAssignTarget(null)}
          />
        )}
      </Modal>

      <Modal
        open={editTarget !== null}
        onClose={() => setEditTarget(null)}
        title={editTarget ? `Update Permissions — ${editTarget.name}` : "Update Permissions"}
      >
        {editTarget && (
          <RolePermissionsForm
            role={editTarget}
            catalog={catalog}
            onSaved={(message) => {
              if (message) toast.success(message);
              refresh();
              setEditTarget(null);
            }}
            onCancel={() => setEditTarget(null)}
          />
        )}
      </Modal>

      <ConfirmDialog
        open={revokeTarget !== null}
        onClose={() => setRevokeTarget(null)}
        title="Revoke Permission"
        confirmLabel="Revoke"
        loadingLabel="Revoking…"
        confirmVariant="danger"
        onConfirm={async () => {
          if (!revokeTarget) return;
          const message = await permissionService.revoke(revokeTarget.roleId, revokeTarget.permissionId);
          if (message) toast.success(message);
          refresh();
          setRevokeTarget(null);
        }}
      >
        Remove “{revokeTargetPermission?.description || revokeTargetPermission?.slug}” from{" "}
        {revokeTargetRole?.name}?
      </ConfirmDialog>

      <Modal
        open={editPermissionTarget !== null}
        onClose={() => setEditPermissionTarget(null)}
        title="Edit Permission"
      >
        {editPermissionTarget && (
          <PermissionEditForm
            permission={editPermissionTarget}
            onSaved={(message) => {
              if (message) toast.success(message);
              refresh();
              setEditPermissionTarget(null);
            }}
            onCancel={() => setEditPermissionTarget(null)}
          />
        )}
      </Modal>

      <ConfirmDialog
        open={deletePermissionTarget !== null}
        onClose={() => setDeletePermissionTarget(null)}
        title="Delete permission"
        confirmLabel="Delete"
        loadingLabel="Deleting…"
        confirmVariant="danger"
        onConfirm={async () => {
          if (!deletePermissionTarget) return;
          const message = await permissionService.remove(deletePermissionTarget.id);
          if (message) toast.success(message);
          refresh();
          setDeletePermissionTarget(null);
        }}
      >
        <span className="font-medium text-navy-700 dark:text-mist-100">{deletePermissionTarget?.slug}</span> will be
        removed.
      </ConfirmDialog>
    </div>
  );
}
