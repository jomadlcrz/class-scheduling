import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router";
import { toast } from "sonner";
import { useAuth } from "~/auth/auth-provider";
import { RoleGuard } from "~/auth/role-guard";
import { EmptyState } from "~/components/feedback/empty-state";
import { FormError } from "~/components/forms/form-error";
import { Button } from "~/components/ui/button";
import { ConfirmDialog } from "~/components/ui/modal";
import { Spinner } from "~/components/ui/spinner";
import { CurriculumBuilder } from "~/features/subjects/curriculum-builder";
import { emptyNewProgramDraft, type NewProgramDraft } from "~/features/subjects/curriculum-builder-header";
import type { PendingEntry } from "~/features/subjects/curriculum-structure";
import { useUnsavedChangesGuard } from "~/hooks/use-unsaved-changes-guard";
import { PageHeader } from "~/layouts/page-header";
import { programSchema } from "~/schemas/program.schema";
import { departmentService } from "~/services/department.service";
import { enumService } from "~/services/enum.service";
import { schoolYearService, type SchoolYearOption } from "~/services/school-year.service";
import { subjectService } from "~/services/subject.service";
import type { Department } from "~/types/department";
import { PROGRAM_TYPE_YEARS } from "~/types/program";
import type { CreateSubjectInput, Subject } from "~/types/subject";

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
  const [newProgram, setNewProgram] = useState<NewProgramDraft>(emptyNewProgramDraft([]));
  const [pending, setPending] = useState<PendingEntry[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [collapsed, setCollapsed] = useState<ReadonlySet<string>>(new Set());
  const tempIdCounter = useRef(0);

  useEffect(() => {
    Promise.all([subjectService.list(), departmentService.listAcademic()])
      .then(([s, d]) => {
        setAllSubjects(s);
        setDepartments(d);
        setNewProgram((current) => (current.departmentName ? current : emptyNewProgramDraft(d)));
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

  const isDirty = pending.length > 0;
  const { blocker, reloadPromptOpen, setReloadPromptOpen, confirmReload } =
    useUnsavedChangesGuard(isDirty, !isSaving);

  const prerequisiteOptions = useMemo(
    () => [
      ...(allSubjects ?? []).map((s) => ({ id: s.code, code: s.code, title: s.title })),
      ...pending.map((p) => ({ id: p.code || p.tempId, code: p.code, title: p.title })),
    ],
    [allSubjects, pending],
  );

  function handleNewProgramChange(patch: Partial<NewProgramDraft>) {
    setNewProgram((current) => ({ ...current, ...patch }));
  }

  function handleAddPending(yearLevel: number, semester: number) {
    tempIdCounter.current += 1;
    const tempId = `tmp-${tempIdCounter.current}`;
    setPending((current) => [
      ...current,
      {
        tempId,
        program: "",
        yearLevel,
        semester,
        code: "",
        title: "",
        units: 0,
        subjectType: "",
        prerequisites: [],
      },
    ]);
    const semesterKey = `y${yearLevel}s${semester}`;
    setCollapsed((current) => {
      const next = new Set(current);
      next.delete(semesterKey);
      return next;
    });
  }

  function handleUpdatePending(
    tempId: string,
    patch: Partial<Omit<CreateSubjectInput, "program">>,
  ) {
    setPending((current) =>
      current.map((entry) => (entry.tempId === tempId ? { ...entry, ...patch } : entry)),
    );
  }

  function handleDuplicatePending(tempId: string) {
    const source = pending.find((entry) => entry.tempId === tempId);
    if (!source) return;
    tempIdCounter.current += 1;
    setPending((current) => [
      ...current,
      {
        ...source,
        tempId: `tmp-${tempIdCounter.current}`,
        code: source.code ? `${source.code}-copy` : "",
      },
    ]);
  }

  function handleRemovePending(tempId: string) {
    setPending((current) => {
      const removed = current.find((p) => p.tempId === tempId);
      return current
        .filter((p) => p.tempId !== tempId)
        .map((p) => ({
          ...p,
          prerequisites: p.prerequisites.filter((code) => code !== removed?.code),
        }));
    });
  }

  function validatePending(): string | null {
    for (const entry of pending) {
      if (!entry.code.trim()) return "Every new subject needs a subject code.";
      if (!entry.title.trim()) return "Every new subject needs a descriptive title.";
      if (!Number.isFinite(entry.units) || entry.units < 1) {
        return `${entry.code || "A subject"} must have at least 1 unit.`;
      }
      if (!entry.subjectType) {
        return `${entry.code || "A subject"} needs a subject type.`;
      }
    }

    const seen = new Set<string>();
    for (const entry of pending) {
      const key = entry.code.trim().toLowerCase();
      if (seen.has(key)) {
        return `Duplicate subject code ${entry.code} in the pending list.`;
      }
      seen.add(key);
    }

    return null;
  }

  async function handleSave() {
    if (pending.length === 0) return;

    const result = programSchema.safeParse({
      departmentName: newProgram.departmentName,
      abbrev: newProgram.abbrev.trim().toUpperCase(),
      name: newProgram.name.trim(),
      type: newProgram.type,
      lengthYears: PROGRAM_TYPE_YEARS[newProgram.type] ?? 4,
    });
    if (!result.success) {
      setSaveError(result.error.issues[0].message);
      return;
    }
    const departmentId = departments.find((d) => d.name === newProgram.departmentName)?.id;
    if (!departmentId) {
      setSaveError("Select a department.");
      return;
    }

    const validationError = validatePending();
    if (validationError) {
      setSaveError(validationError);
      return;
    }

    const entries = pending.map(({ tempId: _tempId, program: _program, ...entry }) => ({
      ...entry,
      code: entry.code.trim(),
      title: entry.title.trim(),
    }));

    setSaveError(null);
    setIsSaving(true);
    try {
      const message = await subjectService.createCurriculum(
        {
          departmentId,
          abbrev: result.data.abbrev,
          name: result.data.name,
          type: result.data.type,
          lengthYears: result.data.lengthYears,
        },
        entries,
      );
      if (message) toast.success(message);
      navigate(`/program-curricula?program=${result.data.abbrev}`);
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : "");
      setIsSaving(false);
    }
  }

  const isLoading = allSubjects === null || schoolYears === null;
  const noAcademicTerm = schoolYears !== null && schoolYears.length === 0;

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <PageHeader
        title="Curriculum Builder"
        description="Describe the program, then build its curriculum below — it saves together with its first subjects."
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
        <div className="mt-6 flex flex-col gap-5">
          <FormError message={saveError} />
          <CurriculumBuilder
            departments={departments}
            newProgram={newProgram}
            onNewProgramChange={handleNewProgramChange}
            pending={pending}
            subjectTypes={subjectTypes}
            prerequisiteOptions={prerequisiteOptions}
            collapsed={collapsed}
            onToggleSection={(key) =>
              setCollapsed((current) => {
                const next = new Set(current);
                if (next.has(key)) next.delete(key);
                else next.add(key);
                return next;
              })
            }
            onUpdatePending={handleUpdatePending}
            onAddPending={handleAddPending}
            onRemovePending={handleRemovePending}
            onDuplicatePending={handleDuplicatePending}
            isSaving={isSaving}
            pendingCount={pending.length}
            onSave={handleSave}
            onCancel={() => navigate("/program-curricula")}
          />
        </div>
      )}

      <ConfirmDialog
        open={blocker.state === "blocked"}
        onClose={() => blocker.reset?.()}
        title="Discard unsaved subjects?"
        confirmLabel="Discard"
        loadingLabel="Discarding…"
        confirmVariant="danger"
        onConfirm={async () => blocker.proceed?.()}
      >
        You have unsaved curriculum entries. Leaving this page will discard them.
      </ConfirmDialog>

      <ConfirmDialog
        open={reloadPromptOpen}
        onClose={() => setReloadPromptOpen(false)}
        title="Discard unsaved subjects?"
        confirmLabel="Reload"
        loadingLabel="Reloading…"
        confirmVariant="danger"
        onConfirm={async () => confirmReload()}
      >
        You have unsaved curriculum entries. Reloading will discard them.
      </ConfirmDialog>
    </div>
  );
}
