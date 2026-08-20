import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { toast } from "sonner";
import { RoleGuard } from "~/auth/role-guard";
import { EmptyState } from "~/components/feedback/empty-state";
import { Breadcrumb } from "~/components/ui/breadcrumb";
import { ConfirmDialog } from "~/components/ui/modal";
import { Spinner } from "~/components/ui/spinner";
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
  const [prerequisitesLoading, setPrerequisitesLoading] = useState(true);
  const [prerequisitesError, setPrerequisitesError] = useState<string | null>(null);
  const [isDirty, setIsDirty] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const { blocker, reloadPromptOpen, setReloadPromptOpen, confirmReload } =
    useUnsavedChangesGuard(isDirty, !isSaving);

  useEffect(() => {
    let cancelled = false;
    Promise.all([programService.list(), enumService.getOptions()])
      .then(([programOptions, options]) => {
        if (cancelled) return;
        setPrograms(programOptions);
        setRoomTypes(options.roomType);
      })
      .catch((error) => {
        if (!cancelled) setPrerequisitesError(error instanceof Error ? error.message : "Unable to load form details.");
      })
      .finally(() => {
        if (!cancelled) setPrerequisitesLoading(false);
      });
    return () => { cancelled = true; };
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
    <div className="mx-auto w-full max-w-7xl px-4 py-8">
      <Breadcrumb
        items={[
          { label: "Facilities", href: "/facilities" },
          { label: "New Facility" },
        ]}
        className="mb-4"
      />

      <PageHeader title="New Facility" />

      <div className="mt-6">
        {prerequisitesLoading ? (
          <div role="status" aria-label="Loading form details" className="flex min-h-64 items-center justify-center text-navy-700 dark:text-slate-200">
            <Spinner size={24} />
          </div>
        ) : prerequisitesError ? (
          <EmptyState title="Unable to load form details">
            {prerequisitesError}
          </EmptyState>
        ) : roomTypes.length === 0 ? (
          <EmptyState title="No room types available">
            Configure a room type before creating a facility.
          </EmptyState>
        ) : (
          <CreateBuildingWorkspace
            roomTypes={roomTypes}
            programs={programs}
            onSubmit={handleCreate}
            onDirtyChange={setIsDirty}
          />
        )}
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
