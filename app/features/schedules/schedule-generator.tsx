import { useCallback, useState } from "react";
import { Alert, AlertDescription } from "~/components/ui/alert";
import { AlertTriangleIcon, EditIcon } from "~/components/ui/icons";
import { scheduleService, type ScheduleSuggestion, type SlotDraft } from "~/services/schedule.service";
import type { ScheduleSemester } from "~/types/schedule";
import type { YearLevel } from "~/types/subject";

const SUBJECT_CODE_RE = /\b([A-Z]{2,8}\d{1,4})\b/g;

function highlightSubjectCode(text: string) {
  const parts = text.split(SUBJECT_CODE_RE);
  return parts.map((part, i) =>
    i % 2 === 1 ? <strong key={i} className="font-semibold">{part}</strong> : part
  );
}

export function AutoGenerateIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
    </svg>
  );
}

/** Subject-placement failures from the last auto-generate run. Render only when non-empty. */
export function GenerationConflictsAlert({
  conflicts,
  suggestions,
  onEditConflict,
  onApplySuggestion,
  onConfirmMove,
}: {
  conflicts: string[];
  suggestions?: ScheduleSuggestion[];
  onEditConflict?: (conflict: string) => void;
  onApplySuggestion?: (suggestion: ScheduleSuggestion) => void;
  onConfirmMove?: (suggestion: ScheduleSuggestion) => void;
}) {
  const overrideSuggestions = (suggestions ?? []).filter((s) => s.type === "subject_hour_override");
  const moveSuggestions = (suggestions ?? []).filter((s) => s.type === "move_existing_session");
  return (
    <Alert variant="warning">
      <AlertTriangleIcon />
      <AlertDescription>
        {conflicts.length > 0 && (
          <ul className="list-disc space-y-1 pl-4">
            {conflicts.map((c, i) => (
              <li key={i}>
                {highlightSubjectCode(c)}
                {onEditConflict && /\bmoving\b.*\bfrom\b.*\b\d{1,2}:\d{2}\s*(?:AM|PM)\b.*\bto\b.*\b\d{1,2}:\d{2}\s*(?:AM|PM)\b.*\(/i.test(c) && (
                  <>
                    {" "}
                    <button
                      type="button"
                      onClick={() => onEditConflict(c)}
                      className="inline-flex items-center gap-0.5 rounded border border-amber-300 bg-amber-100 px-1.5 py-0 font-body text-[0.6rem] font-semibold text-amber-800 align-baseline transition-colors duration-150 hover:bg-amber-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-400 dark:border-gold-400/30 dark:bg-gold-400/15 dark:text-gold-300 dark:hover:bg-gold-400/25"
                    >
                      <EditIcon />
                      Edit
                    </button>
                  </>
                )}
              </li>
            ))}
          </ul>
        )}

        {moveSuggestions.length > 0 && (
          <div className={`${conflicts.length > 0 ? "mt-3" : ""} flex flex-col gap-2`}>
            {moveSuggestions.map((s, i) => (
              <MoveSuggestionCard key={i} suggestion={s} onConfirm={onConfirmMove} />
            ))}
          </div>
        )}

        {overrideSuggestions.length > 0 && (
          <div className={`${conflicts.length > 0 || moveSuggestions.length > 0 ? "mt-3" : ""} flex flex-col gap-2`}>
            {overrideSuggestions.map((s, i) => (
              <SuggestionCard key={i} suggestion={s} onApply={onApplySuggestion} />
            ))}
          </div>
        )}
      </AlertDescription>
    </Alert>
  );
}

function MoveSuggestionCard({
  suggestion,
  onConfirm,
}: {
  suggestion: ScheduleSuggestion;
  onConfirm?: (suggestion: ScheduleSuggestion) => void;
}) {
  const from = suggestion.from ?? ({} as { day: string; start: string; end: string; room: string });
  const to = suggestion.to ?? ({} as { day: string; start: string; end: string; room: string; room_id: number });
  const enables = suggestion;

  return (
    <div className="rounded-lg border border-amber-200 bg-amber-50/80 p-3 dark:border-gold-400/25 dark:bg-gold-400/5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="font-body text-sm font-semibold text-navy-700 dark:text-mist-100">
            {suggestion.subjectCode}
            {suggestion.setName && (
              <span className="ml-1.5 inline-block rounded-full border border-blue-200 bg-blue-100 px-1.5 py-0 font-body text-[0.65rem] font-medium text-blue-700 dark:border-navy-300/30 dark:bg-navy-300/10 dark:text-navy-300">
                {suggestion.setName}
              </span>
            )}
          </p>
          <p className="mt-0.5 font-body text-xs text-slate-500 dark:text-slate-400">
            Move {String(from.day)} {String(from.start)}–{String(from.end)} ({String(from.room)}) → {String(to.day)} {String(to.start)}–{String(to.end)} ({String(to.room)})
          </p>
          {enables.enables && (
            <p className="mt-0.5 font-body text-[0.7rem] text-slate-400 dark:text-slate-500">
              Enables {enables.enables.subject_code} at {enables.enables.at}
            </p>
          )}
          {suggestion.reason && (
            <p className="mt-1 font-body text-[0.7rem] text-slate-400 italic dark:text-slate-500">
              Why: {suggestion.reason}
            </p>
          )}
        </div>
        {onConfirm && suggestion.apply && (
          <button
            type="button"
            onClick={() => onConfirm(suggestion)}
            className="shrink-0 rounded-lg border border-emerald-300 bg-emerald-100 px-2.5 py-1 font-body text-[0.7rem] font-semibold text-emerald-800 transition-colors duration-150 hover:bg-emerald-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-400 dark:border-emerald-400/30 dark:bg-emerald-400/10 dark:text-emerald-300 dark:hover:bg-emerald-400/20"
          >
            Apply &amp; regenerate
          </button>
        )}
      </div>
    </div>
  );
}

function SuggestionCard({
  suggestion,
  onApply,
}: {
  suggestion: ScheduleSuggestion;
  onApply?: (suggestion: ScheduleSuggestion) => void;
}) {
  const body = (suggestion.apply?.body ?? {}) as Record<string, unknown>;
  const lec = typeof body.lectureHours === "number" ? body.lectureHours : suggestion.lectureHours ?? 0;
  const lab = typeof body.labHours === "number" ? body.labHours : suggestion.labHours ?? 0;
  const mtgs = typeof body.meetings === "number" ? body.meetings : suggestion.meetings ?? 1;
  const total = lec + lab;

  const durationEach = mtgs > 0 ? total / mtgs : total;
  const fmt = (n: number) => (Number.isInteger(n) ? `${n}.0` : String(Math.round(n * 100) / 100));

  // Distinguish re-split (same total hours, different meeting count) from hours cut.
  const isResplit = suggestion.reason?.startsWith("Same ") ?? false;

  return (
    <div className={`rounded-lg border p-3 ${
      isResplit
        ? "border-emerald-200 bg-emerald-50/80 dark:border-emerald-400/25 dark:bg-emerald-400/5"
        : "border-amber-200 bg-amber-50/80 dark:border-gold-400/25 dark:bg-gold-400/5"
    }`}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="font-body text-sm font-semibold text-navy-700 dark:text-mist-100">
            {suggestion.subjectCode}
            {suggestion.setName && (
              <span className="ml-1.5 inline-block rounded-full border border-blue-200 bg-blue-100 px-1.5 py-0 font-body text-[0.65rem] font-medium text-blue-700 dark:border-navy-300/30 dark:bg-navy-300/10 dark:text-navy-300">
                {suggestion.setName}
              </span>
            )}
          </p>
          <p className="mt-0.5 font-body text-xs text-slate-500 dark:text-slate-400">
            <span>Suggested: {fmt(mtgs)} meetings × {fmt(durationEach)}h = {fmt(total)}h/week</span>
            {(lec > 0 || lab > 0) && (
              <>
                <span className="mx-1">·</span>
                <span>lecture {fmt(lec)}h · lab {fmt(lab)}h</span>
              </>
            )}
          </p>
          {suggestion.reason && (
            <p className="mt-1 font-body text-[0.7rem] text-slate-400 italic dark:text-slate-500">
              Why: {suggestion.reason}
            </p>
          )}
        </div>
        {onApply && suggestion.apply && (
          <button
            type="button"
            onClick={() => onApply(suggestion)}
            className={`shrink-0 rounded-lg border px-2.5 py-1 font-body text-[0.7rem] font-semibold transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-400 ${
              isResplit
                ? "border-emerald-300 bg-emerald-100 text-emerald-800 hover:bg-emerald-200 dark:border-emerald-400/30 dark:bg-emerald-400/10 dark:text-emerald-300 dark:hover:bg-emerald-400/20"
                : "border-amber-300 bg-amber-100 text-amber-800 hover:bg-amber-200 dark:border-gold-400/30 dark:bg-gold-400/10 dark:text-gold-300 dark:hover:bg-gold-400/20"
            }`}
          >
            Apply &amp; regenerate
          </button>
        )}
      </div>
    </div>
  );
}

type AutoGenerateParams = {
  schoolYear: string;
  semester: ScheduleSemester;
  semesterLabel: string;
  yearLevel: YearLevel;
  yearLevelLabel: string;
  programId: number;
  setId: number;
};

/**
 * Drives the "auto-generate a schedule" proposal flow: calls the backend algorithm
 * and tracks in-flight/result state. Callers own the generated slots (assigning temp
 * ids, etc.) — this hook only returns the raw proposal.
 */
export function useAutoGenerate() {
  const [isGenerating, setIsGenerating] = useState(false);
  const [hasGenerated, setHasGenerated] = useState(false);
  const [conflicts, setConflicts] = useState<string[]>([]);
  const [suggestions, setSuggestions] = useState<ScheduleSuggestion[]>([]);

  const generate = useCallback(async (params: AutoGenerateParams): Promise<SlotDraft[]> => {
    setIsGenerating(true);
    setConflicts([]);
    setSuggestions([]);
    try {
      const result = await scheduleService.autoGenerate(params);
      setConflicts(result.conflicts);
      setSuggestions(result.suggestions);
      setHasGenerated(true);
      return result.slots;
    } finally {
      setIsGenerating(false);
    }
  }, []);

  const reset = useCallback(() => {
    setHasGenerated(false);
    setConflicts([]);
    setSuggestions([]);
  }, []);

  return { isGenerating, hasGenerated, conflicts, suggestions, generate, reset };
}
