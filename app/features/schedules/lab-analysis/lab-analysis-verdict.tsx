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
      className={`flex items-start gap-3 rounded-xl border-l-4 bg-white p-4 shadow-sm dark:bg-white/5 ${
        bad
          ? "border-l-red-500 border-y border-r border-red-200 dark:border-y-red-400/20 dark:border-r-red-400/20"
          : "border-l-green-500 border-y border-r border-green-200 dark:border-y-emerald-400/20 dark:border-r-emerald-400/20"
      }`}
    >
      <span
        aria-hidden="true"
        className={`mt-0.5 shrink-0 ${bad ? "text-red-600 dark:text-red-400" : "text-green-700 dark:text-emerald-400"}`}
      >
        {bad ? <AlertTriangleIcon /> : <CheckIcon />}
      </span>
      <div>
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
