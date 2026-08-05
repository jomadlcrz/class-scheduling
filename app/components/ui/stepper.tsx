import { CheckIcon } from "~/components/ui/icons";

export type StepStatus = "completed" | "current" | "upcoming";

export type StepDefinition = {
  key: string;
  label: string;
};

type StepperProps = {
  steps: StepDefinition[];
  /** Zero-based index of the step currently shown. */
  currentIndex: number;
  /** Steps at or before this index are click-navigable; later steps are inert. */
  maxUnlockedIndex: number;
  onStepClick: (index: number) => void;
};

function statusFor(index: number, currentIndex: number): StepStatus {
  if (index < currentIndex) return "completed";
  if (index === currentIndex) return "current";
  return "upcoming";
}

function connectorTone(status: StepStatus): string {
  if (status === "completed") return "bg-emerald-400 dark:bg-emerald-500/70";
  if (status === "current") {
    return "bg-linear-to-r from-amber-400 to-slate-200 dark:from-gold-400/70 dark:to-white/10";
  }
  return "bg-slate-200 dark:bg-white/10";
}

function StepNode({ status, index }: { status: StepStatus; index: number }) {
  if (status === "completed") {
    return (
      <span
        className="relative z-10 grid size-9 place-items-center rounded-full bg-emerald-500 text-white shadow-sm ring-4 ring-white dark:ring-surface-raised"
        aria-hidden="true"
      >
        <CheckIcon size={16} strokeWidth={3} />
      </span>
    );
  }

  if (status === "current") {
    return (
      <span
        className="relative z-10 grid size-10 place-items-center rounded-full bg-amber-500 text-white shadow-md ring-4 ring-amber-100 dark:bg-gold-500 dark:ring-gold-400/20"
        aria-hidden="true"
      >
        <span className="absolute inset-0 animate-ping rounded-full bg-amber-400/30 dark:bg-gold-400/25" />
        <span className="relative font-body text-sm font-bold">{index + 1}</span>
      </span>
    );
  }

  return (
    <span
      className="relative z-10 grid size-9 place-items-center rounded-full border-2 border-slate-200 bg-white font-body text-xs font-semibold text-slate-400 dark:border-white/15 dark:bg-surface-raised dark:text-slate-500"
      aria-hidden="true"
    >
      {index + 1}
    </span>
  );
}

/**
 * Interactive step-gate control: click a node to jump to any unlocked step.
 * Full labeled row on tablet/desktop; a compact number-only bar on mobile so
 * it doesn't crowd a data-heavy step underneath.
 */
export function Stepper({ steps, currentIndex, maxUnlockedIndex, onStepClick }: StepperProps) {
  return (
    <nav aria-label="Wizard progress">
      <ol
        className="hidden sm:grid"
        style={{ gridTemplateColumns: `repeat(${steps.length}, minmax(0, 1fr))` }}
      >
        {steps.map((step, index) => {
          const status = statusFor(index, currentIndex);
          const isLast = index === steps.length - 1;
          const isClickable = index <= maxUnlockedIndex;

          return (
            <li key={step.key} className="relative flex min-w-0 flex-col items-center px-2 text-center">
              {!isLast && (
                <span
                  aria-hidden="true"
                  className={`absolute left-[calc(50%+1.25rem)] top-4.5 h-0.5 w-[calc(100%-2.5rem)] ${connectorTone(status)}`}
                />
              )}
              <button
                type="button"
                disabled={!isClickable}
                aria-current={status === "current" ? "step" : undefined}
                onClick={() => onStepClick(index)}
                className={`flex flex-col items-center gap-2 rounded-lg p-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-400 ${
                  isClickable ? "cursor-pointer" : "cursor-default"
                }`}
              >
                <StepNode status={status} index={index} />
                <span
                  className={`font-body text-sm font-medium ${
                    status === "upcoming"
                      ? "text-slate-400 dark:text-slate-500"
                      : "text-navy-700 dark:text-mist-100"
                  }`}
                >
                  {step.label}
                </span>
              </button>
            </li>
          );
        })}
      </ol>

      {/* Mobile: compact bar — nodes and connectors only, label for the current step. */}
      <div className="flex items-center gap-2 sm:hidden" aria-hidden="true">
        {steps.map((step, index) => {
          const status = statusFor(index, currentIndex);
          const isLast = index === steps.length - 1;
          return (
            <div key={step.key} className={`flex items-center gap-2 ${isLast ? "" : "flex-1"}`}>
              <StepNode status={status} index={index} />
              {!isLast && <span className={`h-0.5 flex-1 ${connectorTone(status)}`} />}
            </div>
          );
        })}
      </div>
      <p className="mt-2 text-center font-body text-sm font-medium text-navy-700 sm:hidden dark:text-mist-100">
        Step {currentIndex + 1} of {steps.length}: {steps[currentIndex]?.label}
      </p>
    </nav>
  );
}
