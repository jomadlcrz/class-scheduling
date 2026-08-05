import { CurriculumBuilder } from "~/features/subjects/curriculum-builder";
import type { NewProgramDraft } from "~/features/subjects/curriculum-builder-header";
import type { PendingEntry } from "~/features/subjects/curriculum-structure";
import type { PrerequisiteOption } from "~/features/subjects/prerequisite-picker";
import { ProgramSummaryStrip } from "~/features/subjects/program-summary-strip";
import { ProgramWizardFooter } from "~/features/subjects/program-wizard-footer";
import type { Department } from "~/types/department";
import type { CreateSubjectInput } from "~/types/subject";

type ProgramWizardStep2CurriculumProps = {
  departments: Department[];
  degreeTypes: string[];
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
};

export function ProgramWizardStep2Curriculum({
  pendingCount,
  canAdvance,
  onBack,
  onNext,
  newProgram,
  ...builderProps
}: ProgramWizardStep2CurriculumProps) {
  return (
    <div className="flex flex-col gap-5">
      <ProgramSummaryStrip newProgram={newProgram} />

      <CurriculumBuilder
        newProgram={newProgram}
        {...builderProps}
        pendingCount={pendingCount}
        showHeader={false}
        showSaveActions={false}
      />

      <ProgramWizardFooter
        backLabel="Back to Program Information"
        onBack={onBack}
        primaryLabel="Next: Review & Save"
        onPrimary={onNext}
        primaryDisabled={!canAdvance}
      />
    </div>
  );
}
