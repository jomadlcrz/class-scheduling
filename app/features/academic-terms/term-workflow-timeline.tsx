import type { ReactNode } from "react";
import { BookOpenIcon, CalendarIcon, CheckIcon, LockIcon } from "~/components/ui/icons";
import type { TermWorkflowNextAction, TermWorkflowSemester, TermWorkflowStep } from "~/types/term-closure";

type TermWorkflowTimelineProps = {
  steps: TermWorkflowStep[];
  semesters: TermWorkflowSemester[];
  nextAction: TermWorkflowNextAction;
  schoolYearLabel: string;
  onPostSemester: (semesterNumber: number) => void;
  onReopenSemester: (semesterNumber: number) => void;
  onCloseSchoolYear: () => void;
};

function stepIcon(key: string): ReactNode {
  if (key === "close_school_year") return <CalendarIcon />;
  if (key === "work_second_semester") return <BookOpenIcon />;
  return <LockIcon size={16} />;
}

function stepStatusLabel(status: TermWorkflowStep["status"]): string {
  if (status === "completed") return "Done";
  if (status === "current") return "In progress";
  return "Upcoming";
}

function connectorTone(leftStatus: TermWorkflowStep["status"]): string {
  if (leftStatus === "completed") {
    return "bg-emerald-400 dark:bg-emerald-500/70";
  }
  if (leftStatus === "current") {
    return "bg-gradient-to-r from-amber-400 to-slate-200 dark:from-gold-400/70 dark:to-white/10";
  }
  return "bg-slate-200 dark:bg-white/10";
}

function StepNode({ step, index }: { step: TermWorkflowStep; index: number }) {
  const { status } = step;

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
        <span className="relative">{stepIcon(step.key)}</span>
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

function StepAction({
  step,
  semester,
  onPostSemester,
  onReopenSemester,
  onCloseSchoolYear,
}: {
  step: TermWorkflowStep;
  semester: TermWorkflowSemester | undefined;
  onPostSemester: (semesterNumber: number) => void;
  onReopenSemester: (semesterNumber: number) => void;
  onCloseSchoolYear: () => void;
}) {
  if (step.status !== "current") return null;

  if (step.key === "close_school_year") {
    return (
      <button
        type="button"
        onClick={onCloseSchoolYear}
        className="mt-2 rounded-md border border-amber-200 bg-amber-50 px-2.5 py-1 font-body text-xs font-medium text-amber-800 transition-colors hover:bg-amber-100 dark:border-gold-400/30 dark:bg-gold-400/10 dark:text-gold-200 dark:hover:bg-gold-400/15"
      >
        Close year
      </button>
    );
  }

  if (!semester) return null;

  return (
    <div className="mt-2 flex flex-wrap justify-center gap-1.5">
      {semester.actions.canClose && (
        <button
          type="button"
          onClick={() => onPostSemester(semester.semesterNumber)}
          className="rounded-md border border-amber-200 bg-amber-50 px-2.5 py-1 font-body text-xs font-medium text-amber-800 transition-colors hover:bg-amber-100 dark:border-gold-400/30 dark:bg-gold-400/10 dark:text-gold-200 dark:hover:bg-gold-400/15"
        >
          Post
        </button>
      )}
      {semester.actions.canReopen && (
        <button
          type="button"
          onClick={() => onReopenSemester(semester.semesterNumber)}
          className="rounded-md border border-slate-200 px-2.5 py-1 font-body text-xs font-medium text-slate-700 transition-colors hover:bg-slate-50 dark:border-white/15 dark:text-slate-200 dark:hover:bg-white/10"
        >
          Reopen
        </button>
      )}
    </div>
  );
}

function semesterForStep(step: TermWorkflowStep, semesters: TermWorkflowSemester[]) {
  if (step.semesterNumber == null) return undefined;
  return semesters.find((row) => row.semesterNumber === step.semesterNumber);
}

/** Horizontal timeline on desktop, vertical on mobile — registrar academic-year workflow. */
export function TermWorkflowTimeline({
  steps,
  semesters,
  nextAction,
  schoolYearLabel,
  onPostSemester,
  onReopenSemester,
  onCloseSchoolYear,
}: TermWorkflowTimelineProps) {
  const completedCount = steps.filter((step) => step.status === "completed").length;
  const currentStep = steps.find((step) => step.status === "current");

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="font-body text-xs font-medium uppercase tracking-wider text-slate-400 dark:text-slate-500">
          S.Y. {schoolYearLabel}
        </p>
        <p className="font-body text-xs text-slate-500 dark:text-slate-400">
          {completedCount} of {steps.length} steps complete
        </p>
      </div>

      {/* Desktop: horizontal stepper */}
      <ol className="hidden md:grid md:grid-cols-4 md:gap-0" aria-label="Academic year workflow">
        {steps.map((step, index) => {
          const semester = semesterForStep(step, semesters);
          const isLast = index === steps.length - 1;

          return (
            <li key={step.key} className="relative flex min-w-0 flex-col items-center px-2 text-center">
              {!isLast && (
                <span
                  className={`absolute left-[calc(50%+1.25rem)] top-[1.125rem] h-0.5 w-[calc(100%-2.5rem)] ${connectorTone(step.status)}`}
                  aria-hidden="true"
                />
              )}

              <StepNode step={step} index={index} />

              <div className="mt-3 w-full min-w-0">
                <p className="truncate font-body text-sm font-medium text-navy-700 dark:text-mist-100">
                  {step.label}
                </p>
                <p
                  className={`mt-0.5 font-body text-xs ${
                    step.status === "current"
                      ? "text-amber-700 dark:text-gold-300"
                      : "text-slate-500 dark:text-slate-400"
                  }`}
                >
                  {stepStatusLabel(step.status)}
                </p>
                {step.status === "current" && (
                  <p className="mt-1 line-clamp-2 font-body text-xs leading-snug text-slate-500 dark:text-slate-400">
                    {step.description}
                  </p>
                )}
                <StepAction
                  step={step}
                  semester={semester}
                  onPostSemester={onPostSemester}
                  onReopenSemester={onReopenSemester}
                  onCloseSchoolYear={onCloseSchoolYear}
                />
              </div>
            </li>
          );
        })}
      </ol>

      {/* Mobile: vertical timeline */}
      <ol className="relative space-y-0 md:hidden" aria-label="Academic year workflow">
        {steps.map((step, index) => {
          const semester = semesterForStep(step, semesters);
          const isLast = index === steps.length - 1;

          return (
            <li key={step.key} className="relative flex gap-4 pb-6 last:pb-0">
              {!isLast && (
                <span
                  className={`absolute left-[1.125rem] top-10 bottom-0 w-0.5 -translate-x-1/2 ${
                    step.status === "completed"
                      ? "bg-emerald-400 dark:bg-emerald-500/70"
                      : "bg-slate-200 dark:bg-white/10"
                  }`}
                  aria-hidden="true"
                />
              )}

              <div className="shrink-0 pt-0.5">
                <StepNode step={step} index={index} />
              </div>

              <div className="min-w-0 flex-1 pt-1">
                <p className="font-body text-sm font-medium text-navy-700 dark:text-mist-100">{step.label}</p>
                <p
                  className={`mt-0.5 font-body text-xs ${
                    step.status === "current"
                      ? "font-medium text-amber-700 dark:text-gold-300"
                      : "text-slate-500 dark:text-slate-400"
                  }`}
                >
                  {stepStatusLabel(step.status)}
                </p>
                <p className="mt-1 font-body text-xs leading-relaxed text-slate-500 dark:text-slate-400">
                  {step.description}
                </p>
                <StepAction
                  step={step}
                  semester={semester}
                  onPostSemester={onPostSemester}
                  onReopenSemester={onReopenSemester}
                  onCloseSchoolYear={onCloseSchoolYear}
                />
              </div>
            </li>
          );
        })}
      </ol>

      {currentStep && nextAction.key !== "done" && (
        <div className="rounded-lg border border-amber-200/80 bg-gradient-to-r from-amber-50/80 to-white px-4 py-3 dark:border-gold-400/20 dark:from-gold-400/10 dark:to-transparent">
          <p className="font-body text-xs font-semibold uppercase tracking-wider text-amber-700 dark:text-gold-300">
            Next up
          </p>
          <p className="mt-1 font-body text-sm text-navy-700 dark:text-mist-100">{nextAction.label}</p>
          <p className="mt-0.5 font-body text-xs text-slate-600 dark:text-slate-300">{nextAction.description}</p>
        </div>
      )}

      {nextAction.key === "done" && (
        <div className="rounded-lg border border-emerald-200/80 bg-emerald-50/60 px-4 py-3 dark:border-emerald-400/20 dark:bg-emerald-400/10">
          <p className="font-body text-sm font-medium text-emerald-800 dark:text-emerald-300">
            School year complete
          </p>
          <p className="mt-0.5 font-body text-xs text-emerald-700/80 dark:text-emerald-300/80">
            Both semesters were posted and this school year is closed.
          </p>
        </div>
      )}
    </div>
  );
}
