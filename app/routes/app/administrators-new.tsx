import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { toast } from "sonner";
import { RoleGuard } from "~/auth/role-guard";
import { SuccessDone } from "~/components/feedback/success-done";
import { Card } from "~/components/ui/card";
import { ConfirmDialog } from "~/components/ui/modal";
import { AdministratorAccountForm } from "~/features/administrators/administrator-account-form";
import { useUnsavedChangesGuard } from "~/hooks/use-unsaved-changes-guard";
import { PageHeader } from "~/layouts/page-header";
import { administratorService } from "~/services/administrator.service";
import { departmentService } from "~/services/department.service";
import { enumService, type EnumOptions } from "~/services/enum.service";
import { permissionService } from "~/services/permission.service";
import type { CreateAdministratorAccountInput } from "~/types/administrator";
import type { DepartmentOption } from "~/types/department";
import type { PermissionSummary } from "~/types/permission";

export function meta() {
  return [
    { title: "New Administrator — GWC Class Scheduling" },
    { name: "description", content: "Create a new administrator account." },
  ];
}

export default function AdministratorsNewRoute() {
  return (
    <RoleGuard allow={["admin"]}>
      <AdministratorsNewPage />
    </RoleGuard>
  );
}

function AdministratorsNewPage() {
  const navigate = useNavigate();
  const [departments, setDepartments] = useState<DepartmentOption[]>([]);
  const [enumOptions, setEnumOptions] = useState<EnumOptions | null>(null);
  const [rolePermissions, setRolePermissions] = useState<PermissionSummary[]>([]);
  const [isDirty, setIsDirty] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [createdEmail, setCreatedEmail] = useState<string | null>(null);
  const { blocker, reloadPromptOpen, setReloadPromptOpen, confirmReload } =
    useUnsavedChangesGuard(isDirty, !isSaving);

  useEffect(() => {
    departmentService
      .list()
      .then((items) =>
        setDepartments(
          items.map((item) => ({ id: item.id, abbrev: item.abbrev, name: item.name })),
        ),
      )
      .catch(() => setDepartments([]));
    enumService.getOptions().then(setEnumOptions).catch(() => setEnumOptions(null));
    permissionService.list().then(setRolePermissions).catch(() => setRolePermissions([]));
  }, []);

  async function handleCreate(input: CreateAdministratorAccountInput) {
    setIsSaving(true);
    try {
      const message = await administratorService.create(input);
      if (message) toast.success(message);
      setIsDirty(false);
      setCreatedEmail(input.email);
    } catch (error) {
      setIsSaving(false);
      throw error;
    }
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <PageHeader
        title="New Administrator"

      />

      <div className="mt-6">
        {createdEmail ? (
          <Card className="p-6">
            <SuccessDone
              title="Administrator registered"
              onDone={() => navigate("/administrators")}
            >
              Login credentials with a temporary password will be emailed to {createdEmail}.
            </SuccessDone>
          </Card>
        ) : (
          <AdministratorAccountForm
            departments={departments}
            genders={enumOptions?.gender ?? []}
            civilStatuses={enumOptions?.civilStatus ?? []}
            rolePermissions={rolePermissions}
            onSubmit={handleCreate}
            onCancel={() => navigate("/administrators")}
            onDirtyChange={setIsDirty}
          />
        )}
      </div>

      <ConfirmDialog
        open={blocker.state === "blocked"}
        onClose={() => blocker.reset?.()}
        title="Discard unsaved administrator?"
        confirmLabel="Discard"
        loadingLabel="Discarding…"
        confirmVariant="danger"
        onConfirm={async () => blocker.proceed?.()}
      >
        You have unsaved administrator details. Leaving this page will discard them.
      </ConfirmDialog>

      <ConfirmDialog
        open={reloadPromptOpen}
        onClose={() => setReloadPromptOpen(false)}
        title="Discard unsaved administrator?"
        confirmLabel="Reload"
        loadingLabel="Reloading…"
        confirmVariant="danger"
        onConfirm={async () => confirmReload()}
      >
        You have unsaved administrator details. Reloading will discard them.
      </ConfirmDialog>
    </div>
  );
}
