import { EmptyState } from "../../components/ui/empty-state";
import { Spinner } from "../../components/ui/spinner";
import type { Schedule } from "../../types/schedule";
import { ScheduleGrid } from "./schedule-grid";
import { ScheduleTable } from "./schedule-table";
import { ScheduleViewToggle, type ScheduleViewMode } from "./schedule-view-toggle";

type ScheduleViewerProps = {
  schedules: Schedule[];
  isLoading: boolean;
  viewMode: ScheduleViewMode;
  onViewModeChange: (mode: ScheduleViewMode) => void;
  emptyTitle?: string;
  emptyMessage?: string;
};

/** Read-only grid/list schedule view with a toggle — used by the faculty and student pages. */
export function ScheduleViewer({
  schedules,
  isLoading,
  viewMode,
  onViewModeChange,
  emptyTitle = "No classes scheduled",
  emptyMessage = "There are no classes for the selected term.",
}: ScheduleViewerProps) {
  return (
    <>
      <div className="mt-4 flex justify-end">
        <ScheduleViewToggle value={viewMode} onChange={onViewModeChange} />
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
        ) : viewMode === "grid" ? (
          <ScheduleGrid schedules={schedules} />
        ) : (
          <ScheduleTable schedules={schedules} />
        )}
      </div>
    </>
  );
}
