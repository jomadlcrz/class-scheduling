import { CurriculumBuilderHeader, type NewProgramDraft } from "~/features/subjects/curriculum-builder-header";
import { ProgramWizardFooter } from "~/features/subjects/program-wizard-footer";
import type { Department } from "~/types/department";

type ProgramWizardStep1InfoProps = {
  departments: Department[];
  degreeTypes: string[];
  newProgram: NewProgramDraft;
  onNewProgramChange: (patch: Partial<NewProgramDraft>) => void;
  canAdvance: boolean;
  onNext: () => void;
  onSaveDraft: () => void;
  onCancel: () => void;
};

export function ProgramWizardStep1Info({
  departments,
  degreeTypes,
  newProgram,
  onNewProgramChange,
  canAdvance,
  onNext,
  onSaveDraft,
  onCancel,
}: ProgramWizardStep1InfoProps) {
  return (
    <div className="flex flex-col gap-5">
      <CurriculumBuilderHeader
        departments={departments}
        degreeTypes={degreeTypes}
        newProgram={newProgram}
        onNewProgramChange={onNewProgramChange}
      />

      <p className="font-body text-xs text-slate-400 dark:text-slate-500">
        Total units aren't entered here — they're calculated automatically from the subjects you add in
        the next step.
      </p>

      <ProgramWizardFooter
        backLabel="Cancel"
        onBack={onCancel}
        onSaveDraft={onSaveDraft}
        primaryLabel="Next: Curriculum Builder"
        onPrimary={onNext}
        primaryDisabled={!canAdvance}
      />
    </div>
  );
}
