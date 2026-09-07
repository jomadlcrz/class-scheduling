import type { ReactNode } from "react";

export interface SectionHeaderProps {
  title: string;
  badge?: ReactNode;
  action?: ReactNode;
  className?: string;
}

/**
 * Standard section header used across mobile student views and content sections.
 * Mirrors the SectionHeader layout in class-scheduling-mobile.
 */
export function SectionHeader({
  title,
  badge,
  action,
  className = "",
}: SectionHeaderProps) {
  return (
    <div className={`flex items-center justify-between px-1 mb-2.5 ${className}`}>
      <h3 className="font-heading text-sm font-bold tracking-tight text-navy-700 dark:text-mist-100">
        {title}
      </h3>
      {(badge || action) && (
        <div className="flex items-center gap-2">
          {badge && (
            <span className="font-heading text-xs font-bold text-slate-500 dark:text-slate-400">
              {badge}
            </span>
          )}
          {action}
        </div>
      )}
    </div>
  );
}
