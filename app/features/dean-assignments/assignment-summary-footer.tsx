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
    <div className="sticky bottom-0 z-10 mt-6 flex flex-col gap-3 rounded-xl border border-slate-200 bg-white/95 px-4 py-3 shadow-sm backdrop-blur dark:border-white/10 dark:bg-surface/95 sm:gap-4 sm:px-6 sm:py-3.5 md:flex-row md:items-center md:justify-between">
      <div className="grid grid-cols-2 gap-x-4 gap-y-2 font-body text-xs sm:grid-cols-3 sm:gap-x-6 md:flex md:flex-wrap md:items-center md:gap-6 md:text-sm">
        <div className="flex items-center gap-2">
          <span className="text-slate-400 dark:text-slate-500">
            <UserIcon />
          </span>
          <span className="text-slate-500 dark:text-slate-400">Instructors</span>
          <span className="font-bold text-navy-900 dark:text-white">{totalInstructors}</span>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-slate-400 dark:text-slate-500">
            <LayersIcon />
          </span>
          <span className="text-slate-500 dark:text-slate-400">Programs</span>
          <span className="font-bold text-navy-900 dark:text-white">{totalPrograms}</span>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-slate-400 dark:text-slate-500">
            <BookOpenIcon />
          </span>
          <span className="text-slate-500 dark:text-slate-400">Subjects</span>
          <span className="font-bold text-navy-900 dark:text-white">{totalSubjectsAssigned}</span>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-slate-400 dark:text-slate-500">
            <ClockIcon size={16} />
          </span>
          <span className="text-slate-500 dark:text-slate-400">Hours</span>
          <span className="font-bold text-navy-900 dark:text-white">{totalWeeklyHours}</span>
        </div>

        <div className="col-span-2 flex items-center gap-1.5 font-medium sm:col-span-3 md:col-auto">
          <span className="text-slate-500 dark:text-slate-400">Status:</span>
          {exceedingInstructorsCount > 0 ? (
            <span className="inline-flex items-center gap-1 font-semibold text-amber-600 dark:text-amber-400">
              <AlertTriangleIcon />
              <span>{exceedingInstructorsCount} exceeds load</span>
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 font-semibold text-emerald-600 dark:text-emerald-400">
              <CheckIcon size={15} />
              <span>Valid</span>
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
