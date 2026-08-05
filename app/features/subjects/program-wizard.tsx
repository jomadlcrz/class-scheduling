import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { FormError } from "~/components/forms/form-error";
import { Alert, AlertAction, AlertDescription, AlertTitle } from "~/components/ui/alert";
import { Button } from "~/components/ui/button";
import { Stepper, type StepDefinition } from "~/components/ui/stepper";
import {
  emptyNewProgramDraft,
  type NewProgramDraft,
} from "~/features/subjects/curriculum-builder-header";
import type { PendingEntry } from "~/features/subjects/curriculum-structure";
import { ProgramWizardReview } from "~/features/subjects/program-wizard-review";
import { ProgramWizardStep1Info } from "~/features/subjects/program-wizard-step1-info";
import { ProgramWizardStep2Curriculum } from "~/features/subjects/program-wizard-step2-curriculum";
import { loadJson, removeJson, saveJson } from "~/lib/storage";
import { programSchema } from "~/schemas/program.schema";
import { subjectService } from "~/services/subject.service";
import type { Department } from "~/types/department";
import type { CreateSubjectInput, Subject } from "~/types/subject";

// Bump this whenever NewProgramDraft's shape changes, so drafts saved under
// an older shape are simply ignored instead of resurrecting with missing fields.
const DRAFT_KEY = "program-wizard-draft-v3";

const STEPS: StepDefinition[] = [
  { key: "info", label: "Program Information" },
  { key: "curriculum", label: "Curriculum Builder" },
  { key: "review", label: "Review & Save" },
];

type DraftShape = {
  newProgram: NewProgramDraft;
  pending: PendingEntry[];
  currentIndex: number;
};

type ProgramWizardProps = {
  departments: Department[];
  subjectTypes: string[];
  degreeTypes: string[];
  allSubjects: Subject[];
  isSaving: boolean;
  onSavingChange: (saving: boolean) => void;
  onDirtyChange: (dirty: boolean) => void;
  onCancel: () => void;
  onSaved: (abbrev: string) => void;
};

export function ProgramWizard({
  departments,
  subjectTypes,
  degreeTypes,
  allSubjects,
  isSaving,
  onSavingChange,
  onDirtyChange,
  onCancel,
  onSaved,
}: ProgramWizardProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [newProgram, setNewProgram] = useState<NewProgramDraft>(emptyNewProgramDraft([]));
  const [pending, setPending] = useState<PendingEntry[]>([]);
  const [collapsed, setCollapsed] = useState<ReadonlySet<string>>(new Set());
  const [saveError, setSaveError] = useState<string | null>(null);
  const [draftBanner, setDraftBanner] = useState<DraftShape | null>(null);
  const tempIdCounter = useRef(0);
  const hasCheckedDraft = useRef(false);

  // Seed the department/type defaults once each arrives, without clobbering user input.
  // Seeded independently since departments and degree types load via separate requests
  // that can resolve in either order.
  useEffect(() => {
    setNewProgram((current) => ({
      ...current,
      departmentName: current.departmentName || (departments[0]?.name ?? ""),
      type: current.type || (degreeTypes[0] ?? ""),
    }));
  }, [departments, degreeTypes]);

  // Offer to resume a locally-saved draft — once, on first mount.
  useEffect(() => {
    if (hasCheckedDraft.current) return;
    hasCheckedDraft.current = true;
    const draft = loadJson<DraftShape>(DRAFT_KEY);
    if (draft && (draft.pending.length > 0 || draft.newProgram.name.trim() !== "")) {
      setDraftBanner(draft);
    }
  }, []);

  const prerequisiteOptions = useMemo(
    () => [
      ...allSubjects.map((s) => ({ id: s.code, code: s.code, title: s.title })),
      ...pending.map((p) => ({ id: p.code || p.tempId, code: p.code, title: p.title })),
    ],
    [allSubjects, pending],
  );

  const isDirty =
    pending.length > 0 || newProgram.name.trim() !== "" || newProgram.abbrev.trim() !== "";

  useEffect(() => {
    onDirtyChange(isDirty);
  }, [isDirty, onDirtyChange]);

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

  const step1Valid =
    newProgram.departmentName.trim() !== "" &&
    newProgram.abbrev.trim() !== "" &&
    newProgram.name.trim() !== "" &&
    newProgram.type.trim() !== "" &&
    Number.isInteger(newProgram.lengthYears) &&
    newProgram.lengthYears >= 1;
  const step2Valid = pending.length > 0 && validatePending() === null;
  const maxUnlockedIndex = step1Valid ? (step2Valid ? 2 : 1) : 0;

  function goToStep(index: number) {
    if (index > maxUnlockedIndex) return;
    setSaveError(null);
    setCurrentIndex(index);
  }

  function handleSaveDraft() {
    saveJson(DRAFT_KEY, { newProgram, pending, currentIndex } satisfies DraftShape);
    toast.success("Draft saved on this device.");
  }

  function resumeDraft() {
    if (!draftBanner) return;
    setNewProgram(draftBanner.newProgram);
    setPending(draftBanner.pending);
    setCurrentIndex(draftBanner.currentIndex);
    setDraftBanner(null);
  }

  function dismissDraft() {
    removeJson(DRAFT_KEY);
    setDraftBanner(null);
  }

  async function handleSave() {
    const result = programSchema.safeParse({
      departmentName: newProgram.departmentName,
      abbrev: newProgram.abbrev.trim().toUpperCase(),
      name: newProgram.name.trim(),
      type: newProgram.type,
      lengthYears: newProgram.lengthYears,
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
    onSavingChange(true);
    try {
      const message = await subjectService.createCurriculum(
        {
          departmentId,
          abbrev: result.data.abbrev,
          name: result.data.name,
          type: result.data.type,
          lengthYears: result.data.lengthYears,
          description: newProgram.description.trim(),
        },
        entries,
      );
      if (message) toast.success(message);
      removeJson(DRAFT_KEY);
      onSaved(result.data.abbrev);
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : "");
      onSavingChange(false);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      {draftBanner && (
        <Alert>
          <AlertTitle>Resume your saved draft?</AlertTitle>
          <AlertDescription>
            You have an unfinished program draft saved on this device from a previous visit.
          </AlertDescription>
          <AlertAction>
            <div className="flex gap-2">
              <Button type="button" variant="outline" block={false} onClick={dismissDraft}>
                Discard
              </Button>
              <Button type="button" block={false} onClick={resumeDraft}>
                Resume Draft
              </Button>
            </div>
          </AlertAction>
        </Alert>
      )}

      <Stepper
        steps={STEPS}
        currentIndex={currentIndex}
        maxUnlockedIndex={maxUnlockedIndex}
        onStepClick={goToStep}
      />

      <FormError message={saveError} />

      {currentIndex === 0 && (
        <ProgramWizardStep1Info
          departments={departments}
          degreeTypes={degreeTypes}
          newProgram={newProgram}
          onNewProgramChange={handleNewProgramChange}
          canAdvance={step1Valid}
          onNext={() => goToStep(1)}
          onSaveDraft={handleSaveDraft}
          onCancel={onCancel}
        />
      )}

      {currentIndex === 1 && (
        <ProgramWizardStep2Curriculum
          departments={departments}
          degreeTypes={degreeTypes}
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
          pendingCount={pending.length}
          canAdvance={step2Valid}
          onBack={() => goToStep(0)}
          onNext={() => goToStep(2)}
          onSaveDraft={handleSaveDraft}
        />
      )}

      {currentIndex === 2 && (
        <ProgramWizardReview
          newProgram={newProgram}
          pending={pending}
          isSaving={isSaving}
          canSave={step1Valid && step2Valid}
          onBack={() => goToStep(1)}
          onSaveDraft={handleSaveDraft}
          onSave={handleSave}
        />
      )}
    </div>
  );
}
