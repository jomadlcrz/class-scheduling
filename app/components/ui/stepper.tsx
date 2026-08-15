import { motion, useReducedMotion } from "motion/react";
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
  if (status === "completed") return "bg-navy-700 dark:bg-mist-100";
  return "bg-slate-200 dark:bg-white/10";
}

function StepNode({ status, index }: { status: StepStatus; index: number }) {
  const reduceMotion = useReducedMotion();

  if (status === "completed") {
    return (
      <span
        className="relative z-10 grid size-11 shrink-0 place-items-center rounded-full bg-navy-700 text-mist-100 shadow-md shadow-navy-700/20 transition-all duration-300 dark:bg-mist-100 dark:text-navy-900 dark:shadow-none"
        aria-hidden="true"
      >
        <CheckIcon size={16} strokeWidth={3} />
      </span>
    );
  }

  if (status === "current") {
    return (
      <span
        className="relative z-10 grid size-11 shrink-0 place-items-center rounded-full bg-white text-navy-700 ring-4 ring-gold-500/15 transition-all duration-300 dark:bg-white/5 dark:text-mist-100 dark:ring-gold-400/15"
        aria-hidden="true"
      >
        <motion.span
          className="absolute inset-0 rounded-full border-2 border-dashed border-gold-500 dark:border-gold-400"
          animate={{ rotate: reduceMotion ? 0 : 360 }}
          transition={{ duration: 6, ease: "linear", repeat: reduceMotion ? 0 : Infinity }}
        />
        <motion.span
          className="absolute inset-1 rounded-full bg-gold-500/5 dark:bg-gold-400/5"
          animate={{ opacity: reduceMotion ? 1 : [0.35, 1, 0.35] }}
          transition={{ duration: 2, ease: "easeInOut", repeat: reduceMotion ? 0 : Infinity }}
        />
        <span className="relative font-body text-sm font-semibold">{index + 1}</span>
      </span>
    );
  }

  return (
    <span
      className="relative z-10 grid size-11 shrink-0 place-items-center rounded-full border-2 border-slate-200 bg-white font-body text-sm font-semibold text-slate-400 transition-all duration-300 dark:border-white/15 dark:bg-surface-raised dark:text-slate-500"
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
    <nav aria-label="Wizard progress" className="w-full px-1 py-2 sm:px-2">
      <ol className="hidden items-center sm:flex">
        {steps.map((step, index) => {
          const status = statusFor(index, currentIndex);
          const isLast = index === steps.length - 1;
          const isClickable = index <= maxUnlockedIndex;

          return (
            <li key={step.key} className={`flex min-w-0 items-center ${isLast ? "" : "flex-1"}`}>
              <button
                type="button"
                disabled={!isClickable}
                aria-current={status === "current" ? "step" : undefined}
                onClick={() => onStepClick(index)}
                className={`flex shrink-0 items-center gap-3 rounded-lg px-1 py-1 transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-400 ${
                  isClickable ? "cursor-pointer" : "cursor-default"
                }`}
              >
                <StepNode status={status} index={index} />
                <span
                  className={`whitespace-nowrap font-body text-sm font-semibold tracking-tight transition-all duration-300 ${
                    status === "current"
                      ? "rounded-full bg-navy-800/10 px-3 py-1.5 text-navy-700 dark:bg-mist-100/10 dark:text-mist-100"
                      : status === "upcoming"
                        ? "text-slate-400 dark:text-slate-500"
                        : "text-navy-700 dark:text-mist-100"
                  }`}
                >
                  {step.label}
                </span>
              </button>
              {!isLast && (
                <span
                  aria-hidden="true"
                  className={`mx-4 h-0.5 min-w-8 flex-1 rounded-full transition-colors duration-500 ${connectorTone(status)}`}
                />
              )}
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
      <p className="mt-2 text-center font-body text-sm font-semibold text-navy-700 sm:hidden dark:text-mist-100">
        Step {currentIndex + 1} of {steps.length}: {steps[currentIndex]?.label}
      </p>
    </nav>
  );
}
