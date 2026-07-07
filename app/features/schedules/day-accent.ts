import type { Day } from "~/types/schedule";

/**
 * Per-day accent classes shared by the grid and list schedule views.
 * Light-mode colors mirror the reference client (C:\Users\jomadlcrz\Desktop\client);
 * dark-mode variants use the nearest Tailwind palette shade.
 */
export const DAY_ACCENT: Record<
  Day,
  { borderL: string; cardBg: string; cellBg: string; text: string; topBorder: string }
> = {
  M:  {
    borderL: "border-l-[#0d4da1] dark:border-l-blue-400",
    cardBg: "bg-[#f5faff] dark:bg-blue-900/20",
    cellBg: "bg-[#e8f4ff] dark:bg-blue-900/20",
    text: "text-[#0d4da1] dark:text-blue-300",
    topBorder: "border-t-[#0d4da1] dark:border-t-blue-400",
  },
  T:  {
    borderL: "border-l-[#15803d] dark:border-l-green-400",
    cardBg: "bg-[#f5fff8] dark:bg-green-900/20",
    cellBg: "bg-[#e7faef] dark:bg-green-900/20",
    text: "text-[#15803d] dark:text-green-300",
    topBorder: "border-t-[#15803d] dark:border-t-green-400",
  },
  W:  {
    borderL: "border-l-[#b77913] dark:border-l-amber-400",
    cardBg: "bg-[#fffaf0] dark:bg-amber-900/20",
    cellBg: "bg-[#fff7e5] dark:bg-amber-900/20",
    text: "text-[#b77913] dark:text-amber-300",
    topBorder: "border-t-[#b77913] dark:border-t-amber-400",
  },
  Th: {
    borderL: "border-l-[#6d28d9] dark:border-l-violet-400",
    cardBg: "bg-[#faf8ff] dark:bg-violet-900/20",
    cellBg: "bg-[#f1edff] dark:bg-violet-900/20",
    text: "text-[#6d28d9] dark:text-violet-300",
    topBorder: "border-t-[#6d28d9] dark:border-t-violet-400",
  },
  F:  {
    borderL: "border-l-[#be123c] dark:border-l-rose-400",
    cardBg: "bg-[#fff7f9] dark:bg-rose-900/20",
    cellBg: "bg-[#ffe8ed] dark:bg-rose-900/20",
    text: "text-[#be123c] dark:text-rose-300",
    topBorder: "border-t-[#be123c] dark:border-t-rose-400",
  },
  S:  {
    borderL: "border-l-[#0d8fa6] dark:border-l-cyan-400",
    cardBg: "bg-[#f2fdff] dark:bg-cyan-900/20",
    cellBg: "bg-[#e5fbff] dark:bg-cyan-900/20",
    text: "text-[#0d8fa6] dark:text-cyan-300",
    topBorder: "border-t-[#0d8fa6] dark:border-t-cyan-400",
  },
};
