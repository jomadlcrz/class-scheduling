import { CurriculumBuilder } from "~/features/subjects/curriculum-builder";
import type { NewProgramDraft } from "~/features/subjects/curriculum-builder-header";
import type { PendingEntry } from "~/features/subjects/curriculum-structure";
import type { PrerequisiteOption } from "~/features/subjects/prerequisite-picker";
import { ProgramWizardFooter } from "~/features/subjects/program-wizard-footer";
import type { Department } from "~/types/department";
import type { CreateSubjectInput } from "~/types/subject";

type ProgramWizardStep2CurriculumProps = {
  departments: Department[];
  newProgram: NewProgramDraft;
  onNewProgramChange: (patch: Partial<NewProgramDraft>) => void;
  pending: PendingEntry[];
  subjectTypes: string[];
  prerequisiteOptions: PrerequisiteOption[];
  collapsed: ReadonlySet<string>;
  onToggleSection: (key: string) => void;
  onUpdatePending: (tempId: string, patch: Partial<Omit<CreateSubjectInput, "program">>) => void;
  onAddPending: (yearLevel: number, semester: number) => void;
  onRemovePending: (tempId: string) => void;
  onDuplicatePending: (tempId: string) => void;
  pendingCount: number;
  canAdvance: boolean;
  onBack: () => void;
  onNext: () => void;
  onSaveDraft: () => void;
};

export function ProgramWizardStep2Curriculum({
  pendingCount,
  canAdvance,
  onBack,
  onNext,
  onSaveDraft,
  ...builderProps
}: ProgramWizardStep2CurriculumProps) {
  return (
    <div className="flex flex-col gap-5">
      <div>
        <h2 className="font-display text-lg tracking-wide text-navy-700 dark:text-mist-100">
          Curriculum Builder
        </h2>
        <p className="mt-1 font-body text-sm text-slate-500 dark:text-slate-400">
          Create a new program or build on an existing one — both start with at least one subject.
        </p>
      </div>

      <CurriculumBuilder
        {...builderProps}
        pendingCount={pendingCount}
        showHeader={false}
        showSaveActions={false}
      />

      <ProgramWizardFooter
        backLabel="Back to Program Information"
        onBack={onBack}
        onSaveDraft={onSaveDraft}
        primaryLabel="Next: Review & Save"
        onPrimary={onNext}
        primaryDisabled={!canAdvance}
      />
    </div>
  );
}
