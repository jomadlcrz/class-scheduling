import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { toast } from "sonner";
import { RoleGuard } from "~/auth/role-guard";
import { Button } from "~/components/ui/button";
import { ArrowLeftIcon } from "~/components/ui/icons";
import { ConfirmDialog } from "~/components/ui/modal";
import { CreateBuildingWorkspace } from "~/features/facilities/create-building-workspace";
import { useUnsavedChangesGuard } from "~/hooks/use-unsaved-changes-guard";
import { PageHeader } from "~/layouts/page-header";
import { enumService } from "~/services/enum.service";
import { facilityService } from "~/services/facility.service";
import { programService } from "~/services/program.service";
import type { CreateFacilitiesInput } from "~/types/facility";
import type { Program } from "~/types/program";

export function meta() {
  return [
    { title: "New Facility — GWC Class Scheduling" },
    { name: "description", content: "Create a facility with its building and rooms in one submission." },
  ];
}

export default function CreateFacility() {
  return (
    <RoleGuard allow={["admin", "registrar"]}>
      <CreateFacilityPage />
    </RoleGuard>
  );
}

function CreateFacilityPage() {
  const navigate = useNavigate();
  const [programs, setPrograms] = useState<Program[]>([]);
  const [roomTypes, setRoomTypes] = useState<string[]>([]);
  const [isDirty, setIsDirty] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const { blocker, reloadPromptOpen, setReloadPromptOpen, confirmReload } =
    useUnsavedChangesGuard(isDirty, !isSaving);

  useEffect(() => {
    programService.list().then(setPrograms).catch(() => setPrograms([]));
    enumService
      .getOptions()
      .then((options) => setRoomTypes(options.roomType))
      .catch(() => {});
  }, []);

  async function handleCreate(input: CreateFacilitiesInput) {
    setIsSaving(true);
    try {
      const { message } = await facilityService.create(input);
      if (message) toast.success(message);
      navigate("/facilities");
    } catch (error) {
      setIsSaving(false);
      throw error;
    }
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <PageHeader
        title="New Facility"
        description="Create a facility with its building and rooms in one submission."
        actions={
          <Button type="button" variant="outline" block={false} onClick={() => navigate("/facilities")}>
            <ArrowLeftIcon />
            Back
          </Button>
        }
      />

      <div className="mt-6">
        <CreateBuildingWorkspace
          roomTypes={roomTypes}
          programs={programs}
          onSubmit={handleCreate}
          onCancel={() => navigate("/facilities")}
          onDirtyChange={setIsDirty}
        />
      </div>

      <ConfirmDialog
        open={blocker.state === "blocked"}
        onClose={() => blocker.reset?.()}
        title="Discard unsaved facility?"
        confirmLabel="Discard"
        loadingLabel="Discarding…"
        confirmVariant="danger"
        onConfirm={async () => blocker.proceed?.()}
      >
        You have unsaved facility details. Leaving this page will discard them.
      </ConfirmDialog>

      <ConfirmDialog
        open={reloadPromptOpen}
        onClose={() => setReloadPromptOpen(false)}
        title="Discard unsaved facility?"
        confirmLabel="Reload"
        loadingLabel="Reloading…"
        confirmVariant="danger"
        onConfirm={async () => confirmReload()}
      >
        You have unsaved facility details. Reloading will discard them.
      </ConfirmDialog>
    </div>
  );
}
