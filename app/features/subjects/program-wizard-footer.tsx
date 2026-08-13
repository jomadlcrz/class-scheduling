import type { ReactNode } from "react";
import { Button } from "~/components/ui/button";
import { WizardFooter } from "~/components/ui/wizard";

type ProgramWizardFooterProps = {
  backLabel: string;
  onBack: () => void;
  primaryLabel: string;
  onPrimary: () => void;
  primaryDisabled?: boolean;
  isSaving?: boolean;
  /** Extra content next to the back button, e.g. a live total-units readout. */
  leadingContent?: ReactNode;
};

/** Sticky bottom action bar shared by every wizard step: back on one side, the step's primary action on the other. */
export function ProgramWizardFooter({
  backLabel,
  onBack,
  primaryLabel,
  onPrimary,
  primaryDisabled,
  isSaving,
  leadingContent,
}: ProgramWizardFooterProps) {
  return (
    <WizardFooter>
      <div className="flex flex-wrap items-center gap-3">
        <Button type="button" variant="outline" block={false} onClick={onBack}>
          {backLabel}
        </Button>
        {leadingContent}
      </div>
      <Button
        type="button"
        block={false}
        disabled={primaryDisabled}
        isLoading={isSaving}
        loadingLabel="Saving…"
        onClick={onPrimary}
      >
        {primaryLabel}
      </Button>
    </WizardFooter>
  );
}
