import { createContext, useContext, type ReactNode } from "react";
import { Stepper, type StepDefinition } from "~/components/ui/stepper";
import { StickyFooter } from "~/components/ui/sticky-footer";

const WizardContext = createContext(false);

type WizardProps = {
  steps: StepDefinition[];
  currentIndex: number;
  maxUnlockedIndex: number;
  onStepClick: (index: number) => void;
  children: ReactNode;
};

/** Full multi-step form shell with connected progress, content, and an integrated action footer. */
export function Wizard({
  steps,
  currentIndex,
  maxUnlockedIndex,
  onStepClick,
  children,
}: WizardProps) {
  return (
    <WizardContext.Provider value>
      <section className="overflow-hidden rounded-xl border border-slate-300 bg-white dark:border-white/10 dark:bg-white/5">
        <div className="border-b border-slate-200 px-5 py-4 sm:px-6 dark:border-white/10">
          <Stepper
            steps={steps}
            currentIndex={currentIndex}
            maxUnlockedIndex={maxUnlockedIndex}
            onStepClick={onStepClick}
          />
        </div>
        <div className="p-5 [&_[data-ui=card]]:!rounded-none [&_[data-ui=card]]:!border-0 [&_[data-ui=card]]:!bg-transparent [&_[data-ui=card]]:!shadow-none sm:p-6">
          {children}
        </div>
      </section>
    </WizardContext.Provider>
  );
}

/** Uses the shell footer inside a Wizard and the legacy sticky card elsewhere. */
export function WizardFooter({ children }: { children: ReactNode }) {
  const isInsideWizard = useContext(WizardContext);

  if (!isInsideWizard) return <StickyFooter>{children}</StickyFooter>;

  return (
    <div className="-mx-5 -mb-5 mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 bg-slate-50/80 px-5 py-4 sm:-mx-6 sm:-mb-6 sm:px-6 dark:border-white/10 dark:bg-white/3">
      {children}
    </div>
  );
}
