import { useState } from "react";

import { Button } from "~/components/ui/button";
import { ChevronDownIcon, ChevronRightIcon, LockIcon, PlusIcon, TrashIcon } from "~/components/ui/icons";
import { SubjectTypeBadge } from "~/features/subjects/subject-type-badge";

type ProgramData = {
  id: string;
  programAbbrev: string;
  programName: string;
  subjects: {
    subjectCode: string;
    descriptiveTitle: string;
    units: number;
    lecHours: number;
    labHours: number;
    weeklyHours: number;
  }[];
};

type ProgramTablePanelProps = {
  program: ProgramData;
  onAssignSubject: () => void;
  onRemoveSubject: (subjectCode: string) => void;
  onRemoveProgram?: () => void;
  /** Whether the current role may remove this subject (by type). When it returns
   * false the remove control is locked so the subject can never be dropped. */
  canRemoveSubject?: (subjectCode: string) => boolean;
  /** The subject's type (for the Type column). */
  getSubjectType?: (subjectCode: string) => string | undefined;
};

export function ProgramTablePanel({
  program,
  onAssignSubject,
  onRemoveSubject,
  onRemoveProgram,
  canRemoveSubject,
  getSubjectType,
}: ProgramTablePanelProps) {
  const [collapsed, setCollapsed] = useState(false);
  const totalHours = program.subjects.reduce((sum, s) => sum + s.weeklyHours, 0);

  return (
    <div className="overflow-hidden rounded-xl border border-slate-200/90 bg-white shadow-2xs dark:border-white/10 dark:bg-white/5">
      {/* Program Header */}
      <div
        onClick={() => setCollapsed(!collapsed)}
        className="flex cursor-pointer select-none flex-col gap-2 bg-slate-50/80 px-3 py-2.5 dark:bg-white/5 sm:flex-row sm:items-center sm:justify-between sm:px-4 sm:py-3"
      >
        <div className="flex items-center gap-2">
          <span className="text-slate-400">
            {collapsed ? <ChevronRightIcon /> : <ChevronDownIcon />}
          </span>
          <h4 className="font-body text-xs font-bold text-navy-700 dark:text-mist-100 sm:text-sm">
            {program.programAbbrev} - {program.programName}
          </h4>
        </div>

        <div className="flex flex-wrap items-center gap-2 sm:gap-3" onClick={(e) => e.stopPropagation()}>
          <span className="font-body text-xs font-semibold text-slate-600 dark:text-slate-300">
            Total: <span className="font-bold text-navy-800 dark:text-mist-100">{totalHours} units</span>
          </span>

          <Button type="button" variant="outline" block={false} onClick={onAssignSubject}>
            <PlusIcon />
            <span className="hidden sm:inline">Assign subject</span>
            <span className="sm:hidden">Add</span>
          </Button>

          {onRemoveProgram && (
            <button
              type="button"
              onClick={onRemoveProgram}
              className="inline-grid size-7 place-items-center rounded text-red-500 hover:bg-red-50 dark:hover:bg-red-950/40"
              title="Remove program"
            >
              <TrashIcon />
            </button>
          )}
        </div>
      </div>

      {/* Subjects Table */}
      {!collapsed && (
        <div className="overflow-x-auto">
          <table className="w-full min-w-150 text-left font-body text-xs sm:text-sm">
            <thead className="border-b border-slate-100 bg-white font-semibold text-slate-500 dark:border-white/10 dark:bg-white/5 dark:text-slate-400">
              <tr>
                <th className="px-3 py-2 sm:px-4 sm:py-2.5">Code</th>
                <th className="px-3 py-2 sm:px-4 sm:py-2.5">Descriptive title</th>
                <th className="px-3 py-2 text-left sm:px-4 sm:py-2.5">Type</th>
                <th className="px-2 py-2 text-center sm:px-3 sm:py-2.5">Units</th>
                <th className="px-2 py-2 text-center sm:px-3 sm:py-2.5">Lec</th>
                <th className="px-2 py-2 text-center sm:px-3 sm:py-2.5">Lab</th>
                <th className="px-2 py-2 text-center sm:px-3 sm:py-2.5">Wkly</th>
                <th className="px-3 py-2 text-right sm:px-4 sm:py-2.5">Remove</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-white/10">
              {program.subjects.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-3 py-5 text-center text-xs text-slate-400 sm:px-4 sm:py-6">
                    No subjects assigned to this program yet. Click &quot;Assign subject&quot; above.
                  </td>
                </tr>
              ) : (
                program.subjects.map((subj) => (
                  <tr key={subj.subjectCode} className="[&>td]:align-top hover:bg-slate-50/50 dark:hover:bg-white/5">
                    <td className="px-3 py-2 font-semibold text-navy-800 dark:text-mist-100 sm:px-4 sm:py-2.5">
                      {subj.subjectCode}
                    </td>
                    <td className="whitespace-normal wrap-break-word px-3 py-2 text-slate-600 dark:text-slate-300 sm:px-4 sm:py-2.5">
                      {subj.descriptiveTitle}
                    </td>
                    <td className="px-3 py-2 sm:px-4 sm:py-2.5">
                      {getSubjectType?.(subj.subjectCode) ? (
                        <SubjectTypeBadge type={getSubjectType(subj.subjectCode)!} />
                      ) : (
                        <span className="text-slate-400">—</span>
                      )}
                    </td>
                    <td className="px-2 py-2 text-center font-medium sm:px-3 sm:py-2.5">{subj.units}</td>
                    <td className="px-2 py-2 text-center text-slate-600 dark:text-slate-300 sm:px-3 sm:py-2.5">
                      {subj.lecHours}
                    </td>
                    <td className="px-2 py-2 text-center text-slate-600 dark:text-slate-300 sm:px-3 sm:py-2.5">
                      {subj.labHours}
                    </td>
                    <td className="px-2 py-2 text-center font-semibold text-navy-800 dark:text-mist-100 sm:px-3 sm:py-2.5">
                      {subj.weeklyHours}
                    </td>
                    <td className="px-3 py-2 text-right sm:px-4 sm:py-2.5">
                      {!canRemoveSubject || canRemoveSubject(subj.subjectCode) ? (
                        <button
                          type="button"
                          onClick={() => onRemoveSubject(subj.subjectCode)}
                          className="inline-grid size-7 place-items-center rounded text-red-500 hover:bg-red-50 dark:hover:bg-red-950/40"
                        >
                          <TrashIcon />
                        </button>
                      ) : (
                        <span
                          className="inline-grid size-7 place-items-center text-slate-300 dark:text-slate-600"
                          title="Only the other role can remove this subject type."
                          aria-label="Locked — cannot be removed by your role"
                        >
                          <LockIcon size={14} />
                        </span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
