import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { toast } from "sonner";
import { RoleGuard } from "~/auth/role-guard";
import { SuccessDone } from "~/components/feedback/success-done";
import { Card } from "~/components/ui/card";
import { ConfirmDialog } from "~/components/ui/modal";
import { FacultyAccountForm } from "~/features/faculty/faculty-account-form";
import { useUnsavedChangesGuard } from "~/hooks/use-unsaved-changes-guard";
import { PageHeader } from "~/layouts/page-header";
import { enumService, type EnumOptions } from "~/services/enum.service";
import { facultyService } from "~/services/faculty.service";
import { permissionService } from "~/services/permission.service";
import type { DepartmentOption } from "~/types/department";
import type { CreateFacultyAccountInput } from "~/types/faculty";
import type { PermissionSummary } from "~/types/permission";

export function meta() {
  return [
    { title: "New Faculty — GWC Class Scheduling" },
    { name: "description", content: "Create a new instructor or dean account." },
  ];
}

export default function FacultyNewRoute() {
  return (
    <RoleGuard allow={["admin", "registrar", "dean"]}>
      <FacultyNewPage />
    </RoleGuard>
  );
}

function FacultyNewPage() {
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
    facultyService.listDepartmentOptions().then(setDepartments).catch(() => setDepartments([]));
    enumService.getOptions().then(setEnumOptions).catch(() => setEnumOptions(null));
    permissionService.list().then(setRolePermissions).catch(() => setRolePermissions([]));
  }, []);

  async function handleCreate(input: CreateFacultyAccountInput) {
    setIsSaving(true);
    try {
      const message = await facultyService.create(input);
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
        title="New Faculty"
        description="Create an instructor or dean account and assign its department."
      />

      <div className="mt-6">
        {createdEmail ? (
          <Card className="p-6">
            <SuccessDone title="Faculty registered" onDone={() => navigate("/faculty")}>
              Login credentials with a temporary password were emailed to {createdEmail}.
            </SuccessDone>
          </Card>
        ) : (
          <FacultyAccountForm
            departments={departments}
            genders={enumOptions?.gender ?? []}
            civilStatuses={enumOptions?.civilStatus ?? []}
            rolePermissions={rolePermissions}
            onSubmit={handleCreate}
            onCancel={() => navigate("/faculty")}
            onDirtyChange={setIsDirty}
          />
        )}
      </div>

      <ConfirmDialog
        open={blocker.state === "blocked"}
        onClose={() => blocker.reset?.()}
        title="Discard unsaved faculty member?"
        confirmLabel="Discard"
        loadingLabel="Discarding…"
        confirmVariant="danger"
        onConfirm={async () => blocker.proceed?.()}
      >
        You have unsaved faculty details. Leaving this page will discard them.
      </ConfirmDialog>

      <ConfirmDialog
        open={reloadPromptOpen}
        onClose={() => setReloadPromptOpen(false)}
        title="Discard unsaved faculty member?"
        confirmLabel="Reload"
        loadingLabel="Reloading…"
        confirmVariant="danger"
        onConfirm={async () => confirmReload()}
      >
        You have unsaved faculty details. Reloading will discard them.
      </ConfirmDialog>
    </div>
  );
}
