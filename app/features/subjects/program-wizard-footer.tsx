import type { ReactNode } from "react";
import { Button } from "~/components/ui/button";

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
    <div className="sticky bottom-0 z-10 -mx-4 flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 bg-white/95 px-4 py-4 backdrop-blur dark:border-white/10 dark:bg-surface/95">
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
    </div>
  );
}
