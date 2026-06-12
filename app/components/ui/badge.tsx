import type { ReactNode } from "react";

const tones = {
  navy: "border-navy-300/40 bg-navy-500/10 text-navy-600 dark:border-navy-300/30 dark:bg-navy-300/10 dark:text-navy-300",
  gold: "border-gold-400/40 bg-gold-400/10 text-gold-600 dark:border-gold-400/30 dark:bg-gold-400/10 dark:text-gold-300",
  emerald:
    "border-emerald-200 bg-emerald-50 text-emerald-600 dark:border-emerald-400/20 dark:bg-emerald-400/10 dark:text-emerald-300",
  red: "border-red-200 bg-red-50 text-red-600 dark:border-red-400/20 dark:bg-red-400/10 dark:text-red-300",
  sky: "border-sky-200 bg-sky-50 text-sky-600 dark:border-sky-400/20 dark:bg-sky-400/10 dark:text-sky-300",
  slate:
    "border-slate-200 bg-slate-100 text-slate-600 dark:border-white/10 dark:bg-white/5 dark:text-slate-300",
} as const;

export type BadgeTone = keyof typeof tones;

export function Badge({ tone = "slate", children }: { tone?: BadgeTone; children: ReactNode }) {
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2 py-0.5 font-sans text-xs font-medium ${tones[tone]}`}
    >
      {children}
    </span>
  );
}
