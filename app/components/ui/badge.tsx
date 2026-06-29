import type { ReactNode } from "react";

const tones = {
  navy: "border-blue-200 bg-[#dbeafe] text-[#1e40af] dark:border-navy-300/30 dark:bg-navy-300/10 dark:text-navy-300",
  gold: "border-amber-200 bg-[#fef3c7] text-[#92400e] dark:border-gold-400/30 dark:bg-gold-400/10 dark:text-gold-300",
  emerald:
    "border-green-200 bg-[#dcfce7] text-[#136f3b] dark:border-emerald-400/20 dark:bg-emerald-400/10 dark:text-emerald-300",
  red: "border-red-200 bg-[#fee2e2] text-[#9b1c1c] dark:border-red-400/20 dark:bg-red-400/10 dark:text-red-300",
  sky: "border-sky-200 bg-sky-50 text-sky-700 dark:border-sky-400/20 dark:bg-sky-400/10 dark:text-sky-300",
  slate:
    "border-[#d9e3ef] bg-[#f8fafc] text-[#52637a] dark:border-white/10 dark:bg-white/5 dark:text-slate-300",
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
