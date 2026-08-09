import type { ReactNode } from "react";

/** Card chrome shared by every sticky bottom action bar — pinned, bordered, rounded, elevated. */
const CHROME =
  "sticky bottom-0 z-10 mt-4 rounded-xl border border-slate-200 bg-white/95 px-4 py-4 shadow-sm backdrop-blur dark:border-white/10 dark:bg-surface/95";

/** Default inner layout: back/leading on one side, primary action on the other. */
const DEFAULT_LAYOUT = "flex flex-wrap items-center justify-between gap-3";

type StickyFooterProps = {
  children: ReactNode;
  /**
   * Replaces the default inner flex layout when a footer needs a different arrangement
   * (e.g. "flex justify-end gap-2"). Kept as a full replacement — not merged — so Tailwind
   * utilities never conflict without a class-merge helper.
   */
  layoutClassName?: string;
};

/**
 * Shared sticky bottom action bar: a contained, bordered, rounded card that stays pinned to
 * the bottom of a scrollable area. Used by wizards, account forms, bulk import, and summary footers.
 */
export function StickyFooter({ children, layoutClassName }: StickyFooterProps) {
  return <div className={`${CHROME} ${layoutClassName ?? DEFAULT_LAYOUT}`}>{children}</div>;
}
