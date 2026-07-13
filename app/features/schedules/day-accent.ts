import type { Day } from "~/types/schedule";

/**
 * Per-day accent classes shared by the grid and list schedule views.
 * Colors match the classroom-mapping palette from lib/schedule-days.ts.
 */
export const DAY_ACCENT: Record<
  Day,
  { borderL: string; cardBg: string; cellBg: string; text: string; topBorder: string }
> = {
  M:  {
    borderL: "border-l-red-500 dark:border-l-red-900",
    cardBg: "bg-red-100 dark:bg-red-950/50",
    cellBg: "bg-red-100 dark:bg-red-950/50",
    text: "text-red-600 dark:text-red-400",
    topBorder: "border-t-red-500 dark:border-t-red-900",
  },
  T:  {
    borderL: "border-l-amber-500 dark:border-l-amber-900",
    cardBg: "bg-amber-100 dark:bg-amber-950/50",
    cellBg: "bg-amber-100 dark:bg-amber-950/50",
    text: "text-amber-600 dark:text-amber-400",
    topBorder: "border-t-amber-500 dark:border-t-amber-900",
  },
  W:  {
    borderL: "border-l-red-500 dark:border-l-red-900",
    cardBg: "bg-red-100 dark:bg-red-950/50",
    cellBg: "bg-red-100 dark:bg-red-950/50",
    text: "text-red-600 dark:text-red-400",
    topBorder: "border-t-red-500 dark:border-t-red-900",
  },
  Th: {
    borderL: "border-l-amber-500 dark:border-l-amber-900",
    cardBg: "bg-amber-100 dark:bg-amber-950/50",
    cellBg: "bg-amber-100 dark:bg-amber-950/50",
    text: "text-amber-600 dark:text-amber-400",
    topBorder: "border-t-amber-500 dark:border-t-amber-900",
  },
  F:  {
    borderL: "border-l-red-500 dark:border-l-red-900",
    cardBg: "bg-red-100 dark:bg-red-950/50",
    cellBg: "bg-red-100 dark:bg-red-950/50",
    text: "text-red-600 dark:text-red-400",
    topBorder: "border-t-red-500 dark:border-t-red-900",
  },
  S:  {
    borderL: "border-l-pink-500 dark:border-l-pink-900",
    cardBg: "bg-pink-100 dark:bg-pink-950/50",
    cellBg: "bg-pink-100 dark:bg-pink-950/50",
    text: "text-pink-700 dark:text-pink-400",
    topBorder: "border-t-pink-500 dark:border-t-pink-900",
  },
};
