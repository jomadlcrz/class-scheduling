import { useState } from "react";
import { useNavigate } from "react-router";
import { useAuth } from "~/auth/auth-provider";
import { RoleGuard } from "~/auth/role-guard";
import { EmptyState } from "~/components/feedback/empty-state";
import { Button } from "~/components/ui/button";
import { ConfirmDialog } from "~/components/ui/modal";
import { WizardSkeleton } from "~/components/ui/skeleton";
import { ProgramWizard } from "~/features/subjects/program-wizard";
import { useCachedData } from "~/hooks/use-cached-data";
import { useUnsavedChangesGuard } from "~/hooks/use-unsaved-changes-guard";
import { PageHeader } from "~/layouts/page-header";
import { departmentService } from "~/services/department.service";
import { enumService } from "~/services/enum.service";
import { schoolYearService, type SchoolYearOption } from "~/services/school-year.service";
import { subjectService } from "~/services/subject.service";
import type { Department } from "~/types/department";
import type { Subject } from "~/types/subject";

export function meta() {
  return [
    { title: "Create Curriculum — GWC Class Scheduling" },
    {
      name: "description",
      content: "Build a new program and its curriculum.",
    },
  ];
}

export default function ProgramsNew() {
  return (
    <RoleGuard allow={["admin", "registrar"]}>
      <ProgramsNewPage />
    </RoleGuard>
  );
}

function ProgramsNewPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const canManageAcademicTerm = user?.role === "admin" || user?.role === "registrar";
  const { data: allSubjects } = useCachedData("subjects", () => subjectService.list());
  const { data: departmentsData } = useCachedData("academic-departments", () =>
    departmentService.listAcademic(),
  );
  const departments = departmentsData ?? [];
  const { data: enumOptions } = useCachedData("enums", () => enumService.getOptions());
  const subjectTypes = enumOptions?.subjectType ?? [];
  const degreeTypes = enumOptions?.degreeType ?? [];
  const { data: schoolYears } = useCachedData("school-years", () => schoolYearService.list());
  const [isDirty, setIsDirty] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const { blocker, reloadPromptOpen, setReloadPromptOpen, confirmReload } =
    useUnsavedChangesGuard(isDirty, !isSaving);

  const isLoading = allSubjects === null || schoolYears === null;
  const noAcademicTerm = schoolYears !== null && schoolYears.length === 0;

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <PageHeader
        title="Create Curriculum"

      />

      {noAcademicTerm ? (
        <div className="mt-6">
          <EmptyState
            title="No school years yet"
            action={
              canManageAcademicTerm ? (
                <Button type="button" block={false} onClick={() => navigate("/academic-term")}>
                  Create academic term
                </Button>
              ) : undefined
            }
          >
            {canManageAcademicTerm
              ? "Create the first academic term before adding subjects to a curriculum."
              : "Ask an administrator or registrar to create the first academic term."}
          </EmptyState>
        </div>
      ) : isLoading ? (
        <div className="mt-6">
          <WizardSkeleton />
        </div>
      ) : (
        <div className="mt-6">
          <ProgramWizard
            departments={departments}
            subjectTypes={subjectTypes}
            degreeTypes={degreeTypes}
            allSubjects={allSubjects}
            isSaving={isSaving}
            onSavingChange={setIsSaving}
            onDirtyChange={setIsDirty}
            onCancel={() => navigate("/program-curricula")}
            onSaved={(abbrev) => navigate(`/program-curricula?program=${abbrev}`)}
          />
        </div>
      )}

      <ConfirmDialog
        open={blocker.state === "blocked"}
        onClose={() => blocker.reset?.()}
        title="Discard unsaved changes?"
        confirmLabel="Discard"
        loadingLabel="Discarding…"
        confirmVariant="danger"
        onConfirm={async () => blocker.proceed?.()}
      >
        You have unsaved program details or curriculum entries. Leaving this page will discard them.
      </ConfirmDialog>

      <ConfirmDialog
        open={reloadPromptOpen}
        onClose={() => setReloadPromptOpen(false)}
        title="Discard unsaved changes?"
        confirmLabel="Reload"
        loadingLabel="Reloading…"
        confirmVariant="danger"
        onConfirm={async () => confirmReload()}
      >
        You have unsaved program details or curriculum entries. Reloading will discard them.
      </ConfirmDialog>
    </div>
  );
}
