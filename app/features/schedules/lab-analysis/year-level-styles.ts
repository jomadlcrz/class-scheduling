/** Ordinal year-level ramp (1 → 4, light → dark, one hue) shared by the lab grid, tags, and legend. */
export const YEAR_LEVEL_STYLES: Record<number, { chip: string; dot: string }> = {
  1: { chip: "bg-blue-100 text-blue-900 dark:bg-blue-400/20 dark:text-blue-100", dot: "bg-blue-300 dark:bg-blue-400/70" },
  2: { chip: "bg-blue-300 text-blue-950 dark:bg-blue-400/40 dark:text-blue-50", dot: "bg-blue-400 dark:bg-blue-400" },
  3: { chip: "bg-blue-500 text-white dark:bg-blue-500/80 dark:text-white", dot: "bg-blue-500" },
  4: { chip: "bg-blue-700 text-white dark:bg-blue-600 dark:text-white", dot: "bg-blue-700 dark:bg-blue-600" },
};

const FALLBACK = { chip: "bg-slate-200 text-slate-800 dark:bg-white/10 dark:text-slate-300", dot: "bg-slate-400" };

export function yearLevelStyle(yearLevel: number | null | undefined) {
  if (yearLevel == null) return FALLBACK;
  return YEAR_LEVEL_STYLES[yearLevel] ?? FALLBACK;
}
