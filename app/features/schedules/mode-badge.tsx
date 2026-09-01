import { type BadgeTone } from "~/components/ui/badge";

const MODE_TONE: Record<string, BadgeTone> = {
  F2F: "sky",
  Synchronous: "emerald",
  Asynchronous: "violet",
  Blended: "gold",
  Online: "emerald",
  Modular: "violet",
  LAB: "violet",
};

const tones = {
  navy: "border-blue-200 bg-blue-100 text-blue-800 dark:border-navy-300/30 dark:bg-navy-300/10 dark:text-navy-300",
  gold: "border-amber-200 bg-amber-100 text-amber-800 dark:border-gold-400/30 dark:bg-gold-400/10 dark:text-gold-300",
  emerald: "border-green-200 bg-green-100 text-green-800 dark:border-emerald-400/20 dark:bg-emerald-400/10 dark:text-emerald-300",
  red: "border-red-200 bg-red-100 text-red-800 dark:border-red-400/20 dark:bg-red-400/10 dark:text-red-300",
  sky: "border-sky-200 bg-sky-50 text-sky-700 dark:border-sky-400/20 dark:bg-sky-400/10 dark:text-sky-300",
  blue: "border-blue-200 bg-blue-100 text-blue-800 dark:border-blue-400/20 dark:bg-blue-400/10 dark:text-blue-300",
  green: "border-green-200 bg-green-100 text-green-800 dark:border-green-400/20 dark:bg-green-400/10 dark:text-green-300",
  pink: "border-pink-200 bg-pink-100 text-pink-800 dark:border-pink-400/20 dark:bg-pink-400/10 dark:text-pink-300",
  slate: "border-slate-300 bg-slate-50 text-slate-500 dark:border-white/10 dark:bg-white/5 dark:text-slate-300",
  violet: "border-violet-200 bg-violet-100 text-violet-800 dark:border-violet-400/20 dark:bg-violet-400/10 dark:text-violet-300",
} as const;

/** Colored pill for a class delivery mode. */
export function ModeBadge({ mode }: { mode: string }) {
  const tone = MODE_TONE[mode] ?? "slate";
  return (
    <span className={`inline-flex items-center rounded-full border px-2 py-0.5 font-body text-xs font-medium ${tones[tone]}`}>
      {mode}
    </span>
  );
}

/** Compact mode/session badges stacked vertically. */
export function ModeSessionBadges({ mode, sessionMode }: { mode: string; sessionMode?: string | null }) {
  const modeTone = MODE_TONE[mode] ?? "slate";
  const sessionTone = sessionMode ? (MODE_TONE[sessionMode] ?? "slate") : null;
  
  return (
    <div className="flex flex-col items-center gap-0.5">
      <span className={`inline-flex items-center rounded-full border px-1.5 py-0.5 font-body text-[0.65rem] font-medium leading-none ${tones[modeTone]}`}>
        {mode}
      </span>
      {sessionMode && sessionTone && (
        <span className={`inline-flex items-center rounded-full border px-1.5 py-0.5 font-body text-[0.65rem] font-medium leading-none ${tones[sessionTone]}`}>
          {sessionMode}
        </span>
      )}
    </div>
  );
}
