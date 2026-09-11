import type { ClassEntry } from "./mapping-model";

/**
 * LEC or LAB on a mapping card — which half of the subject a meeting is.
 *
 * Its own component because the grid card and the table cell both carry it,
 * and a badge that says which half of a subject a meeting is must not say it
 * two different ways on one screen.
 */
export function SessionTag({
  mode,
}: {
  mode: NonNullable<ClassEntry["sessionMode"]>;
}) {
  return (
    <span
      className={`rounded-md border px-1 py-0.5 font-body text-[0.55rem] font-bold uppercase leading-none tracking-wide ${
        mode === "LAB"
          ? "border-blue-300 bg-blue-50 text-blue-700 dark:border-blue-400/30 dark:bg-blue-400/10 dark:text-blue-300"
          : "border-slate-300 bg-white/70 text-slate-600 dark:border-white/15 dark:bg-white/5 dark:text-slate-300"
      }`}
    >
      {mode}
    </span>
  );
}

/** How a class is delivered, short enough for a timetable cell. */
const CLASS_MODE_SHORT: Record<string, string> = {
  F2F: "F2F",
  Synchronous: "SYNC",
  Asynchronous: "ASYNC",
  Blended: "BLEND",
};

/**
 * The delivery mode on a mapping card.
 *
 * Drawn for every mode, not only the unusual ones: a card in a room row is
 * F2F or Blended and nothing else on the card distinguishes them, so a tag
 * that appeared only sometimes would leave the reader to guess which case
 * the silence meant.
 */
export function ClassModeTag({ mode }: { mode: string }) {
  const label = CLASS_MODE_SHORT[mode] ?? mode.toUpperCase();
  return (
    <span
      className={`rounded-md border px-1 py-0.5 font-body text-[0.55rem] font-bold uppercase leading-none tracking-wide ${
        mode === "F2F"
          ? "border-sky-300 bg-sky-50 text-sky-700 dark:border-sky-400/30 dark:bg-sky-400/10 dark:text-sky-300"
          : "border-violet-300 bg-violet-50 text-violet-700 dark:border-violet-400/30 dark:bg-violet-400/10 dark:text-violet-300"
      }`}
    >
      {label}
    </span>
  );
}
