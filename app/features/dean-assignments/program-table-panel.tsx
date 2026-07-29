import { useState } from "react";
import { Button } from "~/components/ui/button";
import { ChevronDownIcon, ChevronRightIcon, PlusIcon, TrashIcon } from "~/components/ui/icons";

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
};

export function ProgramTablePanel({
  program,
  onAssignSubject,
  onRemoveSubject,
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
          <h4 className="font-body text-xs font-bold text-navy-900 dark:text-white sm:text-sm">
            {program.programAbbrev} - {program.programName}
          </h4>
        </div>

        <div className="flex flex-wrap items-center gap-2 sm:gap-3" onClick={(e) => e.stopPropagation()}>
          <span className="font-body text-xs font-semibold text-slate-600 dark:text-slate-300">
            Total: <span className="font-bold text-navy-800 dark:text-white">{totalHours} units</span>
          </span>

          <Button type="button" variant="outline" block={false} onClick={onAssignSubject}>
            <PlusIcon />
            <span className="hidden sm:inline">Assign Subject</span>
            <span className="sm:hidden">Add</span>
          </Button>
        </div>
      </div>

      {/* Subjects Table */}
      {!collapsed && (
        <div className="overflow-x-auto">
          <table className="w-full min-w-150 text-left font-body text-xs sm:text-sm">
            <thead className="border-b border-slate-100 bg-white font-semibold text-slate-500 dark:border-white/10 dark:bg-white/5 dark:text-slate-400">
              <tr>
                <th className="px-3 py-2 sm:px-4 sm:py-2.5">Code</th>
                <th className="px-3 py-2 sm:px-4 sm:py-2.5">Descriptive Title</th>
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
                  <td colSpan={7} className="px-3 py-5 text-center text-xs text-slate-400 sm:px-4 sm:py-6">
                    No subjects assigned to this program yet. Click &quot;Assign Subject&quot; above.
                  </td>
                </tr>
              ) : (
                program.subjects.map((subj) => (
                  <tr key={subj.subjectCode} className="hover:bg-slate-50/50 dark:hover:bg-white/5">
                    <td className="px-3 py-2 font-semibold text-navy-900 dark:text-white sm:px-4 sm:py-2.5">
                      {subj.subjectCode}
                    </td>
                    <td className="max-w-50 truncate px-3 py-2 text-slate-600 dark:text-slate-300 sm:max-w-none sm:px-4 sm:py-2.5">
                      {subj.descriptiveTitle}
                    </td>
                    <td className="px-2 py-2 text-center font-medium sm:px-3 sm:py-2.5">{subj.units}</td>
                    <td className="px-2 py-2 text-center text-slate-600 dark:text-slate-300 sm:px-3 sm:py-2.5">
                      {subj.lecHours}
                    </td>
                    <td className="px-2 py-2 text-center text-slate-600 dark:text-slate-300 sm:px-3 sm:py-2.5">
                      {subj.labHours}
                    </td>
                    <td className="px-2 py-2 text-center font-semibold text-navy-800 dark:text-white sm:px-3 sm:py-2.5">
                      {subj.weeklyHours}
                    </td>
                    <td className="px-3 py-2 text-right sm:px-4 sm:py-2.5">
                      <button
                        type="button"
                        onClick={() => onRemoveSubject(subj.subjectCode)}
                        className="inline-grid size-7 place-items-center rounded text-red-500 hover:bg-red-50 dark:hover:bg-red-950/40"
                      >
                        <TrashIcon />
                      </button>
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
