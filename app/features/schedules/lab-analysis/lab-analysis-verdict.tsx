import { AlertTriangleIcon, CheckIcon } from "~/components/ui/icons";
import type { LabAnalysisTotals } from "~/types/lab-analysis";

/**
 * The one-sentence read of the board: is there still a free lab window this
 * term, or is every one of them taken. Slot capacity is the real constraint
 * (see LabAnalysisKpis) so this reads slotsFree, not the softer hour figure.
 */
export function LabAnalysisVerdict({ totals }: { totals: LabAnalysisTotals }) {
  const noFreeSlots = totals.slotsFree === 0;
  const hasConflicts = totals.conflicts > 0;
  const bad = noFreeSlots || hasConflicts;

  const title = noFreeSlots
    ? "No laboratory window is free"
    : `${totals.slotsFree} of ${totals.slotCapacity} lab windows are still free`;

  const body = noFreeSlots
    ? `Every one of the ${totals.slotCapacity} configured lab windows across ${totals.laboratories} laboratory room(s) is already taken. A new Major with Lab cannot be placed until something is moved or removed.`
    : `${totals.laboratoriesWithFreeSlots} of ${totals.laboratories} laboratory room(s) still has at least one open window this term.`;

  return (
    <div
      role="status"
      className="flex items-start gap-3.5 rounded-xl border border-slate-300 bg-white p-4 dark:border-white/10 dark:bg-white/5"
    >
      <span
        aria-hidden="true"
        className={`grid size-9 shrink-0 place-items-center rounded-full ${
          bad
            ? "bg-red-50 text-red-600 dark:bg-red-400/10 dark:text-red-400"
            : "bg-emerald-50 text-emerald-700 dark:bg-emerald-400/10 dark:text-emerald-400"
        }`}
      >
        {bad ? <AlertTriangleIcon /> : <CheckIcon />}
      </span>
      <div className="min-w-0">
        <p className="font-display text-base tracking-wide text-navy-700 dark:text-mist-100">{title}</p>
        <p className="mt-1 font-body text-sm text-slate-600 dark:text-slate-300">{body}</p>
        {(hasConflicts || totals.unslottedSessions > 0) && (
          <div className="mt-2 flex flex-wrap gap-2">
            {hasConflicts && (
              <span className="inline-flex items-center gap-1 rounded-full border border-red-200 bg-red-50 px-2 py-0.5 font-body text-xs text-red-700 dark:border-red-400/20 dark:bg-red-400/10 dark:text-red-300">
                {totals.conflicts} room conflict{totals.conflicts === 1 ? "" : "s"}
              </span>
            )}
            {totals.unslottedSessions > 0 && (
              <span className="inline-flex items-center gap-1 rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 font-body text-xs text-amber-700 dark:border-gold-400/20 dark:bg-gold-400/10 dark:text-gold-300">
                {totals.unslottedSessions} off-grid session{totals.unslottedSessions === 1 ? "" : "s"}
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
