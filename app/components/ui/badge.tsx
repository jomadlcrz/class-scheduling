import type { ReactNode } from "react";

const tones = {
  navy: "border-blue-200 bg-blue-100 text-blue-800 dark:border-navy-300/30 dark:bg-navy-300/10 dark:text-navy-300",
  gold: "border-amber-200 bg-amber-100 text-amber-800 dark:border-gold-400/30 dark:bg-gold-400/10 dark:text-gold-300",
  emerald:
    "border-green-200 bg-green-100 text-green-800 dark:border-emerald-400/20 dark:bg-emerald-400/10 dark:text-emerald-300",
  red: "border-red-200 bg-red-100 text-red-800 dark:border-red-400/20 dark:bg-red-400/10 dark:text-red-300",
  sky: "border-sky-200 bg-sky-50 text-sky-700 dark:border-sky-400/20 dark:bg-sky-400/10 dark:text-sky-300",
  slate:
    "border-slate-300 bg-slate-50 text-slate-500 dark:border-white/10 dark:bg-white/5 dark:text-slate-300",
} as const;

export type BadgeTone = keyof typeof tones;

export function Badge({ tone = "slate", children }: { tone?: BadgeTone; children: ReactNode }) {
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2 py-0.5 font-body text-xs font-medium ${tones[tone]}`}
    >
      {children}
    </span>
  );
}
