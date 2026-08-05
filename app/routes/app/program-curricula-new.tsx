import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { useAuth } from "~/auth/auth-provider";
import { RoleGuard } from "~/auth/role-guard";
import { EmptyState } from "~/components/feedback/empty-state";
import { Button } from "~/components/ui/button";
import { ConfirmDialog } from "~/components/ui/modal";
import { Spinner } from "~/components/ui/spinner";
import { ProgramWizard } from "~/features/subjects/program-wizard";
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
    { title: "New Program — GWC Class Scheduling" },
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
  const [allSubjects, setAllSubjects] = useState<Subject[] | null>(null);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [subjectTypes, setSubjectTypes] = useState<string[]>([]);
  const [schoolYears, setSchoolYears] = useState<SchoolYearOption[] | null>(null);
  const [isDirty, setIsDirty] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    Promise.all([subjectService.list(), departmentService.listAcademic()])
      .then(([s, d]) => {
        setAllSubjects(s);
        setDepartments(d);
      })
      .catch(() => {
        setAllSubjects([]);
        setDepartments([]);
      });
    enumService
      .getOptions()
      .then((options) => setSubjectTypes(options.subjectType))
      .catch(() => {});
    schoolYearService.list().then(setSchoolYears).catch(() => setSchoolYears([]));
  }, []);

  const { blocker, reloadPromptOpen, setReloadPromptOpen, confirmReload } =
    useUnsavedChangesGuard(isDirty, !isSaving);

  const isLoading = allSubjects === null || schoolYears === null;
  const noAcademicTerm = schoolYears !== null && schoolYears.length === 0;

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <PageHeader
        title="Create Program"
        description="Describe the program, build its curriculum, then review everything before saving."
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
        <div
          role="status"
          aria-label="Loading curriculum"
          className="mt-6 grid place-items-center py-12 text-navy-700 dark:text-slate-200"
        >
          <Spinner />
        </div>
      ) : (
        <div className="mt-6">
          <ProgramWizard
            departments={departments}
            subjectTypes={subjectTypes}
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
