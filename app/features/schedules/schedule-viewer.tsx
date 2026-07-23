import type { ReactNode } from "react";
import { EmptyState } from "~/components/feedback/empty-state";
import { Spinner } from "~/components/ui/spinner";
import type { Schedule } from "~/types/schedule";
import { ScheduleGrid } from "~/features/schedules/schedule-grid";
import { ScheduleTable } from "~/features/schedules/schedule-table";
import { ScheduleViewToggle, type ScheduleViewMode } from "~/features/schedules/schedule-view-toggle";

type ScheduleViewerProps = {
  schedules: Schedule[];
  isLoading: boolean;
  viewMode: ScheduleViewMode;
  onViewModeChange: (mode: ScheduleViewMode) => void;
  emptyTitle?: string;
  emptyMessage?: string;
  /** Optional heading left of the view toggle, e.g. "Class Schedule — 1st Semester". */
  title?: ReactNode;
  /** Optional controls (e.g. a print button) rendered left of the view toggle. */
  actions?: ReactNode;
  /** Show the Set (Section) column in table/grid views. */
  showSet?: boolean;
};

/** Read-only grid/list schedule view with a toggle — used by the faculty and student pages. */
export function ScheduleViewer({
  schedules,
  isLoading,
  viewMode,
  onViewModeChange,
  emptyTitle = "No classes scheduled",
  emptyMessage = "There are no classes for the selected term.",
  title,
  actions,
  showSet,
}: ScheduleViewerProps) {
  return (
    <>
      <div className={`mt-4 flex flex-wrap items-center gap-3 ${title ? "justify-between" : "justify-end"}`}>
        {title && (
          <h2 className="font-display text-base tracking-wide text-navy-700 dark:text-mist-100">{title}</h2>
        )}
        <div className="flex items-center gap-2">
          {actions}
          {/* Grid view doesn't fit small screens — mobile always uses ScheduleTable's stacked card list below. */}
          <div className="hidden sm:block">
            <ScheduleViewToggle value={viewMode} onChange={onViewModeChange} />
          </div>
        </div>
      </div>

      <div className="mt-4">
        {isLoading ? (
          <div
            role="status"
            aria-label="Loading schedule"
            className="grid place-items-center py-12 text-navy-700 dark:text-slate-200"
          >
            <Spinner />
          </div>
        ) : schedules.length === 0 ? (
          <EmptyState title={emptyTitle}>{emptyMessage}</EmptyState>
        ) : (
          <>
            <div className="sm:hidden">
              <ScheduleTable schedules={schedules} showSet={showSet} />
            </div>
            <div className="hidden sm:block">
              {viewMode === "grid" ? (
                <ScheduleGrid schedules={schedules} showSet={showSet} />
              ) : (
                <ScheduleTable schedules={schedules} showSet={showSet} />
              )}
            </div>
          </>
        )}
      </div>
    </>
  );
}
