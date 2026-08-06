import { motion } from "motion/react";
import { useCallback, useState } from "react";
import { Alert, AlertDescription } from "~/components/ui/alert";
import { Button } from "~/components/ui/button";
import { AlertIcon, AlertTriangleIcon, EditIcon } from "~/components/ui/icons";
import {
  scheduleService,
  type AutoGenerateResolution,
  type ScheduleSuggestion,
  type SlotDraft,
} from "~/services/schedule.service";
import { formatDecimalHour } from "~/lib/time";
import type { ScheduleSemester } from "~/types/schedule";
import type { YearLevel } from "~/types/subject";

// Matches app/components/ui/alert.tsx's own transition, so the multi-alert group
// this component now renders fades in/out the same way a single Alert used to —
// AnimatePresence in the caller only animates its own direct child (this component's
// root), not the Alerts nested a level deeper inside it.
const EASE_OUT = [0.22, 1, 0.36, 1] as const;

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function highlightSubjectCodes(text: string, subjectCodes: string[]) {
  const codes = [...new Set(subjectCodes.filter(Boolean))].sort((a, b) => b.length - a.length);
  if (codes.length === 0) return text;

  const codeSet = new Set(codes);
  const parts = text.split(new RegExp(`(${codes.map(escapeRegExp).join("|")})`, "g"));
  return parts.map((part, i) =>
    codeSet.has(part) ? <strong key={i} className="font-semibold">{part}</strong> : part
  );
}

export function AutoGenerateIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
    </svg>
  );
}

/**
 * A repack_instructor suggestion with no moves is `merge_places_at`: valid slots
 * already exist for this subject and nothing else needs to move. Resolve applies
 * zero moves and returns the same incomplete preview every time, so this strategy
 * gets its own client-side "Use suggested slots" card instead of the Resolve button.
 *
 * `confirm_daily_hour_increase` also has moves: [] + a populated placesAt, but must
 * NOT be treated as mergeable — merging client-side would show the subject as placed
 * when the backend hasn't actually committed it yet (it's still gated on a daily-cap
 * confirm + regenerate). Check that strategy first and exclude it explicitly.
 */
function isMergePlacesAt(suggestion: ScheduleSuggestion) {
  return (
    suggestion.type === "repack_instructor" &&
    suggestion.strategy !== "confirm_daily_hour_increase" &&
    (suggestion.strategy === "merge_places_at" ||
      ((suggestion.moves?.length ?? 0) === 0 && (suggestion.placesAt?.length ?? 0) > 0))
  );
}

/**
 * Daily-hour-cap block: validated last resort found a legal slot but placing it
 * would exceed the instructor's weekday cap (weekly cap still OK, times within the
 * school day). Requires an explicit confirm + regenerate — never merged client-side.
 */
function isConfirmDailyHourIncrease(suggestion: ScheduleSuggestion) {
  return suggestion.type === "repack_instructor" && suggestion.strategy === "confirm_daily_hour_increase";
}

type ConflictSeverity = "error" | "warning" | "info";

/**
 * Classifies one `conflicts[]` line so the banner matches what actually happened —
 * backend contract from docs/frontend-api/06-schedules-validated-last-resort.md:
 *   - "Could not fit …"      → error: the subject is genuinely missing from the grid.
 *   - "validated last resort" → info: subject IS placed; review is optional.
 *   - back-to-back / SAME day → warning: placed, but a soft preference was relaxed.
 * `suggestions[]` are only ever emitted alongside "Could not fit" lines, so action
 * cards and the Resolve button stay scoped to the error group.
 */
function classifyConflict(message: string): ConflictSeverity {
  if (message.startsWith("Could not fit")) return "error";
  if (message.includes("validated last resort")) return "info";
  if (message.includes("back-to-back") || message.includes("SAME day")) return "warning";
  return "info";
}

function ConflictList({
  conflicts,
  subjectCodes,
  onEditConflict,
}: {
  conflicts: string[];
  subjectCodes: string[];
  onEditConflict?: (conflict: string) => void;
}) {
  return (
    <ul className="list-disc space-y-1 pl-4">
      {conflicts.map((c, i) => (
        <li key={i}>
          {highlightSubjectCodes(c, subjectCodes)}
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
  );
}

/** Subject-placement failures from the last auto-generate run. Render only when non-empty. */
export function GenerationConflictsAlert({
  conflicts,
  subjectCodes,
  suggestions,
  onEditConflict,
  onApplySuggestion,
  onConfirmMove,
  onUseSuggestedSlots,
  onConfirmDailyHourIncrease,
  onResolve,
}: {
  conflicts: string[];
  subjectCodes: string[];
  suggestions?: ScheduleSuggestion[];
  onEditConflict?: (conflict: string) => void;
  onApplySuggestion?: (suggestion: ScheduleSuggestion) => void;
  onConfirmMove?: (suggestion: ScheduleSuggestion) => void;
  onUseSuggestedSlots?: (suggestion: ScheduleSuggestion) => void;
  onConfirmDailyHourIncrease?: (suggestion: ScheduleSuggestion) => void;
  onResolve?: () => void;
}) {
  const overrideSuggestions = (suggestions ?? []).filter((s) => s.type === "subject_hour_override");
  const moveSuggestions = (suggestions ?? []).filter((s) => s.type === "move_existing_session");
  const confirmDailySuggestions = (suggestions ?? []).filter(isConfirmDailyHourIncrease);
  const mergeSuggestions = (suggestions ?? []).filter(isMergePlacesAt);
  const repackSuggestions = (suggestions ?? []).filter(
    (s) => s.type === "repack_instructor" && !isMergePlacesAt(s) && !isConfirmDailyHourIncrease(s),
  );
  // merge_places_at never goes through Resolve — moves is empty, so a Resolve pass
  // applies nothing and returns the same incomplete preview every time.
  const hasAutoResolvableSuggestion = [...moveSuggestions, ...repackSuggestions].some(
    (suggestion) => suggestion.apply && (suggestion.displaces?.length ?? 0) === 0,
  );

  const errorConflicts = conflicts.filter((c) => classifyConflict(c) === "error");
  const warningConflicts = conflicts.filter((c) => classifyConflict(c) === "warning");
  const infoConflicts = conflicts.filter((c) => classifyConflict(c) === "info");
  const hasActions =
    moveSuggestions.length > 0 ||
    confirmDailySuggestions.length > 0 ||
    mergeSuggestions.length > 0 ||
    repackSuggestions.length > 0 ||
    overrideSuggestions.length > 0 ||
    (hasAutoResolvableSuggestion && Boolean(onResolve));

  return (
    <motion.div
      initial={{ opacity: 0, y: -8, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -8, scale: 0.98 }}
      transition={{ duration: 0.25, ease: EASE_OUT }}
      className="flex flex-col gap-3"
    >
      {errorConflicts.length > 0 && (
        <Alert variant="destructive">
          <AlertIcon />
          <AlertDescription>
            <ConflictList conflicts={errorConflicts} subjectCodes={subjectCodes} onEditConflict={onEditConflict} />

            {moveSuggestions.length > 0 && (
              <div className="mt-3 flex flex-col gap-2">
                {moveSuggestions.map((s, i) => (
                  <MoveSuggestionCard key={i} suggestion={s} onConfirm={onConfirmMove} />
                ))}
              </div>
            )}

            {confirmDailySuggestions.length > 0 && (
              <div className="mt-3 flex flex-col gap-2">
                {confirmDailySuggestions.map((s, i) => (
                  <ConfirmDailyHourIncreaseCard key={i} suggestion={s} onConfirm={onConfirmDailyHourIncrease} />
                ))}
              </div>
            )}

            {mergeSuggestions.length > 0 && (
              <div className="mt-3 flex flex-col gap-2">
                {mergeSuggestions.map((s, i) => (
                  <MergePlacesAtCard key={i} suggestion={s} onUse={onUseSuggestedSlots} />
                ))}
              </div>
            )}

            {repackSuggestions.length > 0 && (
              <div className="mt-3 flex flex-col gap-2">
                {repackSuggestions.map((s, i) => (
                  <RepackSuggestionCard key={i} suggestion={s} onConfirm={onConfirmMove} />
                ))}
              </div>
            )}

            {overrideSuggestions.length > 0 && (
              <div className="mt-3 flex flex-col gap-2">
                {overrideSuggestions.map((s, i) => (
                  <SuggestionCard key={i} suggestion={s} onApply={onApplySuggestion} />
                ))}
              </div>
            )}

            {hasAutoResolvableSuggestion && onResolve && (
              <div className="mt-3">
                <Button type="button" variant="outline" block={false} onClick={onResolve}>
                  Resolve conflicts
                </Button>
              </div>
            )}
          </AlertDescription>
        </Alert>
      )}

      {warningConflicts.length > 0 && (
        <Alert variant="warning">
          <AlertTriangleIcon />
          <AlertDescription>
            <ConflictList conflicts={warningConflicts} subjectCodes={subjectCodes} />
          </AlertDescription>
        </Alert>
      )}

      {infoConflicts.length > 0 && (
        <Alert variant="info">
          <AlertDescription>
            <ConflictList conflicts={infoConflicts} subjectCodes={subjectCodes} />
          </AlertDescription>
        </Alert>
      )}

      {/* Backend contract ties every suggestion to a "Could not fit" line, so this
          should be unreachable — kept as a safety net rather than silently dropping
          actionable suggestions if that contract ever changes. */}
      {errorConflicts.length === 0 && hasActions && (
        <Alert variant="warning">
          <AlertTriangleIcon />
          <AlertDescription>
            {moveSuggestions.length > 0 && (
              <div className="flex flex-col gap-2">
                {moveSuggestions.map((s, i) => (
                  <MoveSuggestionCard key={i} suggestion={s} onConfirm={onConfirmMove} />
                ))}
              </div>
            )}
            {confirmDailySuggestions.length > 0 && (
              <div className={`${moveSuggestions.length > 0 ? "mt-3" : ""} flex flex-col gap-2`}>
                {confirmDailySuggestions.map((s, i) => (
                  <ConfirmDailyHourIncreaseCard key={i} suggestion={s} onConfirm={onConfirmDailyHourIncrease} />
                ))}
              </div>
            )}
            {mergeSuggestions.length > 0 && (
              <div
                className={`${moveSuggestions.length > 0 || confirmDailySuggestions.length > 0 ? "mt-3" : ""} flex flex-col gap-2`}
              >
                {mergeSuggestions.map((s, i) => (
                  <MergePlacesAtCard key={i} suggestion={s} onUse={onUseSuggestedSlots} />
                ))}
              </div>
            )}
            {repackSuggestions.length > 0 && (
              <div
                className={`${moveSuggestions.length > 0 || confirmDailySuggestions.length > 0 || mergeSuggestions.length > 0 ? "mt-3" : ""} flex flex-col gap-2`}
              >
                {repackSuggestions.map((s, i) => (
                  <RepackSuggestionCard key={i} suggestion={s} onConfirm={onConfirmMove} />
                ))}
              </div>
            )}
            {overrideSuggestions.length > 0 && (
              <div
                className={`${moveSuggestions.length > 0 || confirmDailySuggestions.length > 0 || mergeSuggestions.length > 0 || repackSuggestions.length > 0 ? "mt-3" : ""} flex flex-col gap-2`}
              >
                {overrideSuggestions.map((s, i) => (
                  <SuggestionCard key={i} suggestion={s} onApply={onApplySuggestion} />
                ))}
              </div>
            )}
            {hasAutoResolvableSuggestion && onResolve && (
              <div className="mt-3">
                <Button type="button" variant="outline" block={false} onClick={onResolve}>
                  Resolve conflicts
                </Button>
              </div>
            )}
          </AlertDescription>
        </Alert>
      )}
    </motion.div>
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

/**
 * `merge_places_at`: valid slots for this subject already exist and no other
 * saved session needs to move. Applying is client-side only (merge into the
 * preview, then Save) — there is nothing for Resolve to do.
 */
function MergePlacesAtCard({
  suggestion,
  onUse,
}: {
  suggestion: ScheduleSuggestion;
  onUse?: (suggestion: ScheduleSuggestion) => void;
}) {
  const [applied, setApplied] = useState(false);
  const placesAt = suggestion.placesAt ?? [];

  return (
    <div className="rounded-lg border border-emerald-200 bg-emerald-50/80 p-3 dark:border-emerald-400/25 dark:bg-emerald-400/5">
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
            Could not be auto-combined with the rest of this set, but these slots are valid:
          </p>
          <div className="mt-1.5 flex flex-col gap-0.5">
            {placesAt.map((p, i) => (
              <p key={i} className="font-body text-xs text-slate-600 dark:text-slate-300">
                {p.day} {p.start}–{p.end} · {p.room}
                {suggestion.instructorName && <> ({suggestion.instructorName})</>}
              </p>
            ))}
          </div>
          <p className="mt-1 font-body text-[0.7rem] text-slate-400 dark:text-slate-500">
            No other sets need to move.
          </p>
          {suggestion.reason && (
            <p className="mt-1 font-body text-[0.7rem] text-slate-400 italic dark:text-slate-500">
              Why: {suggestion.reason}
            </p>
          )}
        </div>
        {placesAt.length > 0 &&
          (applied ? (
            <span className="shrink-0 font-body text-[0.7rem] font-semibold text-emerald-700 dark:text-emerald-300">
              Added to preview
            </span>
          ) : (
            onUse && (
              <button
                type="button"
                onClick={() => {
                  onUse(suggestion);
                  setApplied(true);
                }}
                className="shrink-0 rounded-lg border border-emerald-300 bg-emerald-100 px-2.5 py-1 font-body text-[0.7rem] font-semibold text-emerald-800 transition-colors duration-150 hover:bg-emerald-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-400 dark:border-emerald-400/30 dark:bg-emerald-400/10 dark:text-emerald-300 dark:hover:bg-emerald-400/20"
              >
                Use suggested slots
              </button>
            )
          ))}
      </div>
    </div>
  );
}

/**
 * `confirm_daily_hour_increase`: a legal slot exists but placing it would exceed the
 * instructor's weekday cap (weekly cap OK, times within the school day). The subject
 * is NOT yet in the preview — confirming POSTs generate again with `confirmedDailyHourIncreases`,
 * which is the only thing that actually commits the slots server-side.
 */
function ConfirmDailyHourIncreaseCard({
  suggestion,
  onConfirm,
}: {
  suggestion: ScheduleSuggestion;
  onConfirm?: (suggestion: ScheduleSuggestion) => void;
}) {
  const [confirmed, setConfirmed] = useState(false);
  const increases = suggestion.dailyLimitIncreases ?? [];

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
            A legal slot exists, but it would go over {suggestion.instructorName ?? "the instructor"}'s daily hour limit:
          </p>
          <div className="mt-1.5 flex flex-col gap-0.5">
            {increases.map((inc, i) => (
              <p key={i} className="font-body text-xs text-slate-600 dark:text-slate-300">
                {inc.day}: {inc.fromHours}h → {inc.toHours}h ({inc.schoolDayWindow})
              </p>
            ))}
          </div>
          {suggestion.reason && (
            <p className="mt-1 font-body text-[0.7rem] text-slate-400 italic dark:text-slate-500">
              Why: {suggestion.reason}
            </p>
          )}
        </div>
        {confirmed ? (
          <span className="shrink-0 font-body text-[0.7rem] font-semibold text-emerald-700 dark:text-emerald-300">
            Confirmed — regenerating…
          </span>
        ) : (
          onConfirm && (
            <button
              type="button"
              onClick={() => {
                onConfirm(suggestion);
                setConfirmed(true);
              }}
              className="shrink-0 rounded-lg border border-amber-300 bg-amber-100 px-2.5 py-1 font-body text-[0.7rem] font-semibold text-amber-800 transition-colors duration-150 hover:bg-amber-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-400 dark:border-gold-400/30 dark:bg-gold-400/10 dark:text-gold-300 dark:hover:bg-gold-400/20"
            >
              {suggestion.buttonLabel ?? "Confirm & regenerate"}
            </button>
          )
        )}
      </div>
    </div>
  );
}

function RepackSuggestionCard({
  suggestion,
  onConfirm,
}: {
  suggestion: ScheduleSuggestion;
  onConfirm?: (suggestion: ScheduleSuggestion) => void;
}) {
  const moves = suggestion.moves ?? [];
  const displaces = suggestion.displaces ?? [];
  const hasTradeOff = displaces.length > 0;

  return (
    <div
      className={`rounded-lg border p-3 ${
        hasTradeOff
          ? "border-red-200 bg-red-50/80 dark:border-red-400/25 dark:bg-red-400/5"
          : "border-emerald-200 bg-emerald-50/80 dark:border-emerald-400/25 dark:bg-emerald-400/5"
      }`}
    >
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
            Rearrange {moves.length} of {suggestion.instructorName}'s existing session(s) to fit this in — same
            instructor, same weekly hours, only times and rooms change.
          </p>
          {hasTradeOff && (
            <p className="mt-1 font-body text-[0.7rem] font-semibold text-red-700 dark:text-red-300">
              Trade-off: {displaces.length} already-saved session(s) become unplaced (
              {displaces.map((d) => `${d.subjectCode} ${d.day} ${formatDecimalHour(d.start)}`).join(", ")}) — net{" "}
              {suggestion.netGain != null && suggestion.netGain >= 0 ? "+" : ""}
              {suggestion.netGain} placed session(s).
            </p>
          )}
          {suggestion.reason && (
            <p className="mt-1 font-body text-[0.7rem] text-slate-400 italic dark:text-slate-500">
              Why: {suggestion.reason}
            </p>
          )}
        </div>
        {onConfirm && suggestion.apply?.moves && (
          <button
            type="button"
            onClick={() => onConfirm(suggestion)}
            className={`shrink-0 rounded-lg border px-2.5 py-1 font-body text-[0.7rem] font-semibold transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-400 ${
              hasTradeOff
                ? "border-red-300 bg-red-100 text-red-800 hover:bg-red-200 dark:border-red-400/30 dark:bg-red-400/10 dark:text-red-300 dark:hover:bg-red-400/20"
                : "border-emerald-300 bg-emerald-100 text-emerald-800 hover:bg-emerald-200 dark:border-emerald-400/30 dark:bg-emerald-400/10 dark:text-emerald-300 dark:hover:bg-emerald-400/20"
            }`}
          >
            Review &amp; apply
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
  /** Keys accepted from confirm_daily_hour_increase suggestions so far this session. */
  confirmedDailyHourIncreases?: string[];
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
  const [resolution, setResolution] = useState<AutoGenerateResolution | null>(null);

  const generate = useCallback(async (
    params: AutoGenerateParams,
    strategy: "default" | "greedy" | "resolve" = "default",
  ): Promise<SlotDraft[]> => {
    setIsGenerating(true);
    setConflicts([]);
    setSuggestions([]);
    setResolution(null);
    try {
      const result = await scheduleService.autoGenerate({ ...params, strategy });
      setConflicts(result.conflicts);
      setSuggestions(result.suggestions);
      setResolution(result.resolution);
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
    setResolution(null);
  }, []);

  return { isGenerating, hasGenerated, conflicts, suggestions, resolution, generate, reset };
}
