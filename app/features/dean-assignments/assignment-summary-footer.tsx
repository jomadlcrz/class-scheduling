import { Button } from "~/components/ui/button";
import {
  AlertTriangleIcon,
  BookOpenIcon,
  CheckIcon,
  ClockIcon,
  LayersIcon,
  SendIcon,
  UserIcon,
} from "~/components/ui/icons";

type AssignmentSummaryFooterProps = {
  totalInstructors: number;
  totalPrograms: number;
  totalSubjectsAssigned: number;
  totalWeeklyHours: number;
  exceedingInstructorsCount: number;
  loading?: boolean;
  onSubmit: () => void;
};

export function AssignmentSummaryFooter({
  totalInstructors,
  totalPrograms,
  totalSubjectsAssigned,
  totalWeeklyHours,
  exceedingInstructorsCount,
  loading,
  onSubmit,
}: AssignmentSummaryFooterProps) {
  return (
    <div className="sticky bottom-0 z-10 mt-6 flex flex-col gap-4 rounded-xl border border-slate-200 bg-white/95 px-6 py-3.5 shadow-sm backdrop-blur dark:border-white/10 dark:bg-surface/95 md:flex-row md:items-center md:justify-between">
      <div className="flex flex-wrap items-center gap-6 font-body text-xs sm:text-sm">
        <div className="flex items-center gap-2">
          <span className="text-slate-400 dark:text-slate-500">
            <UserIcon />
          </span>
          <span className="text-slate-500 dark:text-slate-400">Total Instructors</span>
          <span className="font-bold text-navy-900 dark:text-white">{totalInstructors}</span>
        </div>

        <div className="h-4 w-px bg-slate-200 dark:bg-white/10" aria-hidden="true" />

        <div className="flex items-center gap-2">
          <span className="text-slate-400 dark:text-slate-500">
            <LayersIcon />
          </span>
          <span className="text-slate-500 dark:text-slate-400">Total Programs</span>
          <span className="font-bold text-navy-900 dark:text-white">{totalPrograms}</span>
        </div>

        <div className="h-4 w-px bg-slate-200 dark:bg-white/10" aria-hidden="true" />

        <div className="flex items-center gap-2">
          <span className="text-slate-400 dark:text-slate-500">
            <BookOpenIcon />
          </span>
          <span className="text-slate-500 dark:text-slate-400">Total Subjects Assigned</span>
          <span className="font-bold text-navy-900 dark:text-white">{totalSubjectsAssigned}</span>
        </div>

        <div className="h-4 w-px bg-slate-200 dark:bg-white/10" aria-hidden="true" />

        <div className="flex items-center gap-2">
          <span className="text-slate-400 dark:text-slate-500">
            <ClockIcon size={16} />
          </span>
          <span className="text-slate-500 dark:text-slate-400">Total Weekly Hours</span>
          <span className="font-bold text-navy-900 dark:text-white">{totalWeeklyHours} hrs</span>
        </div>

        <div className="h-4 w-px bg-slate-200 dark:bg-white/10" aria-hidden="true" />

        <div className="flex items-center gap-1.5 font-medium">
          <span className="text-slate-500 dark:text-slate-400">Validation Status</span>
          {exceedingInstructorsCount > 0 ? (
            <span className="inline-flex items-center gap-1 font-semibold text-amber-600 dark:text-amber-400">
              <AlertTriangleIcon />
              <span>{exceedingInstructorsCount} instructor exceeds max load &gt;</span>
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 font-semibold text-emerald-600 dark:text-emerald-400">
              <CheckIcon size={15} />
              <span>All loads valid</span>
            </span>
          )}
        </div>
      </div>

      <Button type="button" variant="primary" block={false} isLoading={loading} loadingLabel="Creating…" onClick={onSubmit}>
        <SendIcon size={15} />
        <span className="whitespace-nowrap">Create Assignments</span>
      </Button>
    </div>
  );
}
