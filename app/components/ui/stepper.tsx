import { motion, useReducedMotion } from "motion/react";
import { Link } from "react-router";
import { CheckIcon } from "~/components/ui/icons";

export type StepStatus = "completed" | "current" | "upcoming";

export type StepDefinition = {
  key: string;
  label: string;
  /** When set, the step label navigates here — shown even in readOnly rails. */
  href?: string;
};

export type StepperProps = {
  steps: StepDefinition[];
  /** Zero-based index of the step currently shown. */
  currentIndex: number;
  /** Steps at or before this index are click-navigable; later steps are inert. Defaults to currentIndex. */
  maxUnlockedIndex?: number;
  onStepClick?: (index: number) => void;
  /** If true, renders purely as a read-only progress indicator with no buttons or click interactions. */
  readOnly?: boolean;
  /**
   * Stepper layout variant:
   * - "horizontal": standard single horizontal row (default)
   * - "snake": multi-row zigzag stepper where rows alternate direction (01 → 02 → 03 / 06 ← 05 ← 04)
   */
  variant?: "horizontal" | "snake";
  /** Number of steps per row in snake layout. Defaults to 3. */
  columns?: number;
};

export type SnakeStepperProps = Omit<StepperProps, "variant">;

function statusFor(index: number, currentIndex: number): StepStatus {
  if (index < currentIndex) return "completed";
  if (index === currentIndex) return "current";
  return "upcoming";
}

function connectorTone(status: StepStatus): string {
  if (status === "completed") return "bg-navy-700 dark:bg-mist-100";
  return "bg-slate-200 dark:bg-white/10";
}

function stepNumber(index: number): string {
  return String(index + 1).padStart(2, "0");
}

function StepNode({
  status,
  index,
  size = "default",
}: {
  status: StepStatus;
  index: number;
  size?: "default" | "compact";
}) {
  const reduceMotion = useReducedMotion();
  const isCompact = size === "compact";
  const sizeClass = isCompact ? "size-8 text-xs" : "size-11 text-sm";
  const displayNum = isCompact ? stepNumber(index) : String(index + 1);

  if (status === "completed") {
    return (
      <span
        className={`relative z-10 grid shrink-0 place-items-center rounded-full bg-navy-700 text-mist-100 ${
          isCompact ? "shadow-xs" : "shadow-md shadow-navy-700/20"
        } transition-all duration-300 dark:bg-mist-100 dark:text-navy-900 dark:shadow-none ${sizeClass}`}
        aria-hidden="true"
      >
        <CheckIcon size={isCompact ? 13 : 16} strokeWidth={3} />
      </span>
    );
  }

  if (status === "current") {
    return (
      <span
        className={`relative z-10 grid shrink-0 place-items-center rounded-full bg-white text-navy-700 ${
          isCompact ? "ring-2 ring-gold-500/20 dark:ring-gold-400/20" : "ring-4 ring-gold-500/15 dark:ring-gold-400/15"
        } transition-all duration-300 dark:bg-white/5 dark:text-mist-100 ${sizeClass}`}
        aria-hidden="true"
      >
        <motion.span
          className="absolute inset-0 rounded-full border-2 border-dashed border-gold-500 dark:border-gold-400"
          animate={{ rotate: reduceMotion ? 0 : 360 }}
          transition={{ duration: 6, ease: "linear", repeat: reduceMotion ? 0 : Infinity }}
        />
        <motion.span
          className={`absolute ${isCompact ? "inset-0.5" : "inset-1"} rounded-full bg-gold-500/5 dark:bg-gold-400/5`}
          animate={{ opacity: reduceMotion ? 1 : [0.35, 1, 0.35] }}
          transition={{ duration: 2, ease: "easeInOut", repeat: reduceMotion ? 0 : Infinity }}
        />
        <span className="relative font-body font-semibold">{displayNum}</span>
      </span>
    );
  }

  return (
    <span
      className={`relative z-10 grid shrink-0 place-items-center rounded-full border ${
        isCompact
          ? "border-slate-300 bg-slate-100 text-slate-500"
          : "border-2 border-slate-200 bg-white text-slate-400"
      } font-body font-semibold transition-all duration-300 dark:border-white/15 dark:bg-surface-raised dark:text-slate-500 ${sizeClass}`}
      aria-hidden="true"
    >
      {displayNum}
    </span>
  );
}

/**
 * Snake Stepper (Multi-row Zigzag Stepper).
 * Features compact square box tiles with straight connectors and arrows:
 *   01 → 02 → 03
 *              ↓
 *   06 ← 05 ← 04
 */
export function SnakeStepper({
  steps,
  currentIndex,
  maxUnlockedIndex = currentIndex,
  onStepClick,
  readOnly = false,
  columns = 3,
}: SnakeStepperProps) {
  // Chunk steps into rows with alternating directions
  const rows: {
    rowIndex: number;
    isReversed: boolean;
    items: { step: StepDefinition; originalIndex: number }[];
  }[] = [];

  for (let i = 0; i < steps.length; i += columns) {
    const rIdx = Math.floor(i / columns);
    const isReversed = rIdx % 2 === 1;
    const chunk = steps.slice(i, i + columns).map((step, idx) => ({
      step,
      originalIndex: i + idx,
    }));
    rows.push({
      rowIndex: rIdx,
      isReversed,
      items: isReversed ? [...chunk].reverse() : chunk,
    });
  }

  return (
    <nav aria-label={readOnly ? "Workflow progress status" : "Wizard progress"} className="w-full px-0.5 py-1">
      {/* Desktop / Tablet: Multi-row Zigzag square box layout */}
      <div className="hidden flex-col gap-6 sm:flex">
        {rows.map((row, rIdx) => {
          const isLastRow = rIdx === rows.length - 1;

          return (
            <div
              key={rIdx}
              className="grid items-stretch relative gap-x-4 sm:gap-x-6"
              style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}
            >
              {row.items.map((item, itemColIdx) => {
                const status = statusFor(item.originalIndex, currentIndex);
                const href = item.step.href;
                const isClickable =
                  Boolean(href) || (!readOnly && Boolean(onStepClick) && item.originalIndex <= maxUnlockedIndex);

                // Determine if connector from this step to next step is completed:
                // In non-reversed row: last column is the turn point (Col = columns - 1)
                // In reversed row: first column is the turn point (Col = 0)
                const isStepAtEndOfRow = !row.isReversed
                  ? itemColIdx === columns - 1
                  : itemColIdx === 0;

                // Vertical turn connector to next row
                const hasVerticalTurn = !isLastRow && isStepAtEndOfRow;
                const turnCompleted = currentIndex > item.originalIndex;

                // Horizontal connector inside row:
                // In non-reversed row [01, 02, 03]: items 01 and 02 connect rightward to next box.
                // In reversed row [06, 05, 04]: items 04 and 05 connect leftward to preceding box; 06 DOES NOT!
                const showHorizontalLine = row.isReversed
                  ? itemColIdx > 0
                  : itemColIdx < row.items.length - 1;

                const horizontalCompleted = currentIndex > item.originalIndex;

                const content = (
                  <div
                    className={`relative flex flex-col items-center justify-center py-2.5 px-3 rounded-lg border text-center transition-all duration-300 w-full h-full min-h-18 sm:min-h-19.5 ${
                      status === "current"
                        ? "border-amber-400/90 bg-amber-50/60 shadow-2xs ring-1 ring-amber-300/50 dark:border-gold-400/50 dark:bg-gold-400/10 dark:ring-gold-400/20"
                        : status === "completed"
                          ? "border-slate-300 bg-white shadow-2xs dark:border-white/15 dark:bg-surface-raised"
                          : "border-slate-300 bg-slate-50/60 shadow-2xs dark:border-white/15 dark:bg-white/4"
                    }`}
                  >
                    <StepNode status={status} index={item.originalIndex} size="compact" />
                    <span
                      className={`mt-1.5 font-body text-xs font-semibold tracking-tight transition-all duration-300 leading-tight line-clamp-2 ${
                        status === "current"
                          ? "text-navy-900 dark:text-mist-100 font-bold"
                          : status === "completed"
                            ? "text-navy-800 dark:text-mist-100"
                            : "text-slate-600 dark:text-slate-400"
                      }`}
                    >
                      {item.step.label}
                    </span>
                  </div>
                );

                return (
                  <div
                    key={item.step.key}
                    className="relative flex items-center justify-center"
                  >
                    {href ? (
                      <Link
                        to={href}
                        className="w-full h-full cursor-pointer rounded-lg transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-400 text-left"
                      >
                        {content}
                      </Link>
                    ) : isClickable && onStepClick ? (
                      <button
                        type="button"
                        onClick={() => onStepClick(item.originalIndex)}
                        className="w-full h-full cursor-pointer rounded-lg transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-400 text-left"
                      >
                        {content}
                      </button>
                    ) : (
                      <div className="w-full h-full cursor-default select-none">
                        {content}
                      </div>
                    )}

                    {/* Directional Arrow between Square Boxes (Row forward or backward) */}
                    {showHorizontalLine && (
                      <div
                        aria-hidden="true"
                        className={`pointer-events-none absolute top-1/2 -translate-y-1/2 flex items-center justify-center z-10 ${
                          row.isReversed
                            ? "right-full w-4 sm:w-6"
                            : "left-full w-4 sm:w-6"
                        }`}
                      >
                        <svg
                          className={`size-4 sm:size-4.5 transition-colors duration-300 ${
                            horizontalCompleted
                              ? "text-navy-700 dark:text-mist-100"
                              : currentIndex === item.originalIndex
                                ? "text-amber-500 dark:text-gold-400"
                                : "text-slate-400 dark:text-slate-500"
                          }`}
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth={2.5}
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          {row.isReversed ? (
                            <>
                              <line x1="19" y1="12" x2="5" y2="12" />
                              <polyline points="12 19 5 12 12 5" />
                            </>
                          ) : (
                            <>
                              <line x1="5" y1="12" x2="19" y2="12" />
                              <polyline points="12 5 19 12 12 19" />
                            </>
                          )}
                        </svg>
                      </div>
                    )}

                    {/* Directional Arrow between Rows (Straight drop ↓ down to row below) */}
                    {hasVerticalTurn && (
                      <div
                        aria-hidden="true"
                        className="pointer-events-none absolute left-1/2 -translate-x-1/2 top-full h-6 flex items-center justify-center z-10"
                      >
                        <svg
                          className={`size-4 sm:size-4.5 transition-colors duration-300 ${
                            turnCompleted
                              ? "text-navy-700 dark:text-mist-100"
                              : currentIndex === item.originalIndex
                                ? "text-amber-500 dark:text-gold-400"
                                : "text-slate-400 dark:text-slate-500"
                          }`}
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth={2.5}
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <line x1="12" y1="5" x2="12" y2="19" />
                          <polyline points="19 12 12 19 5 12" />
                        </svg>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>

      {/* Mobile: compact bar — nodes and connectors only, label for the current step */}
      <div className="flex items-center gap-1.5 sm:hidden" aria-hidden="true">
        {steps.map((step, index) => {
          const status = statusFor(index, currentIndex);
          const isLast = index === steps.length - 1;
          return (
            <div key={step.key} className={`flex items-center gap-1.5 ${isLast ? "" : "flex-1"}`}>
              <StepNode status={status} index={index} size="compact" />
              {!isLast && <span className={`h-0.5 flex-1 ${connectorTone(status)}`} />}
            </div>
          );
        })}
      </div>
      <p className="mt-2 text-center font-body text-xs font-semibold text-navy-700 sm:hidden dark:text-mist-100">
        Step {stepNumber(currentIndex)} of {steps.length}: {steps[currentIndex]?.label}
      </p>
    </nav>
  );
}

/**
 * Standard horizontal stepper or multi-row snake stepper based on `variant`.
 */
export function Stepper({
  steps,
  currentIndex,
  maxUnlockedIndex = currentIndex,
  onStepClick,
  readOnly = false,
  variant = "horizontal",
  columns = 3,
}: StepperProps) {
  if (variant === "snake") {
    return (
      <SnakeStepper
        steps={steps}
        currentIndex={currentIndex}
        maxUnlockedIndex={maxUnlockedIndex}
        onStepClick={onStepClick}
        readOnly={readOnly}
        columns={columns}
      />
    );
  }

  return (
    <nav aria-label={readOnly ? "Workflow progress status" : "Wizard progress"} className="w-full px-1 py-2 sm:px-2">
      <ol className="hidden items-center sm:flex">
        {steps.map((step, index) => {
          const status = statusFor(index, currentIndex);
          const isLast = index === steps.length - 1;
          const href = step.href;
          const isClickable = Boolean(href) || (!readOnly && Boolean(onStepClick) && index <= maxUnlockedIndex);

          const content = (
            <>
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
            </>
          );

          return (
            <li
              key={step.key}
              aria-current={status === "current" ? "step" : undefined}
              className={`flex min-w-0 items-center ${isLast ? "" : "flex-1"}`}
            >
              {href ? (
                <Link
                  to={href}
                  className="flex shrink-0 cursor-pointer items-center gap-3 rounded-lg px-1 py-1 transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-400"
                >
                  {content}
                </Link>
              ) : isClickable && onStepClick ? (
                <button
                  type="button"
                  onClick={() => onStepClick(index)}
                  className="flex shrink-0 cursor-pointer items-center gap-3 rounded-lg px-1 py-1 transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-400"
                >
                  {content}
                </button>
              ) : (
                <div className="flex shrink-0 cursor-default select-none items-center gap-3 px-1 py-1">
                  {content}
                </div>
              )}
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
