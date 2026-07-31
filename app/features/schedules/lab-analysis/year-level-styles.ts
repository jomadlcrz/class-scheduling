/** Ordinal year-level ramp (1 → 4, distinct hue per year) shared by the lab grid, tags, and legend. */
export const YEAR_LEVEL_STYLES: Record<number, { chip: string; dot: string }> = {
  1: { chip: "bg-blue-100 text-blue-900 dark:bg-blue-400/20 dark:text-blue-100", dot: "bg-blue-300 dark:bg-blue-400/70" },
  2: { chip: "bg-emerald-100 text-emerald-900 dark:bg-emerald-400/20 dark:text-emerald-100", dot: "bg-emerald-300 dark:bg-emerald-400/70" },
  3: { chip: "bg-amber-100 text-amber-900 dark:bg-amber-400/20 dark:text-amber-100", dot: "bg-amber-300 dark:bg-amber-400/70" },
  4: { chip: "bg-violet-100 text-violet-900 dark:bg-violet-400/20 dark:text-violet-100", dot: "bg-violet-300 dark:bg-violet-400/70" },
};

const FALLBACK = { chip: "bg-slate-200 text-slate-800 dark:bg-white/10 dark:text-slate-300", dot: "bg-slate-400" };

export function yearLevelStyle(yearLevel: number | null | undefined) {
  if (yearLevel == null) return FALLBACK;
  return YEAR_LEVEL_STYLES[yearLevel] ?? FALLBACK;
}
