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
  onRemoveProgram: () => void;
  onRemoveSubject: (subjectCode: string) => void;
};

export function ProgramTablePanel({
  program,
  onAssignSubject,
  onRemoveProgram,
  onRemoveSubject,
}: ProgramTablePanelProps) {
  const [collapsed, setCollapsed] = useState(false);
  const totalHours = program.subjects.reduce((sum, s) => sum + s.weeklyHours, 0);

  return (
    <div className="overflow-hidden rounded-xl border border-slate-200/90 bg-white shadow-2xs dark:border-white/10 dark:bg-white/5">
      {/* Program Header */}
      <div className="flex flex-col gap-2 bg-slate-50/80 px-4 py-3 dark:bg-white/5 sm:flex-row sm:items-center sm:justify-between">
        <div
          onClick={() => setCollapsed(!collapsed)}
          className="flex cursor-pointer items-center gap-2"
        >
          <span className="text-slate-400">
            {collapsed ? <ChevronRightIcon /> : <ChevronDownIcon />}
          </span>
          <h4 className="font-body text-xs font-bold text-navy-900 dark:text-white sm:text-sm">
            {program.programAbbrev} - {program.programName}
          </h4>
        </div>

        <div className="flex items-center gap-3">
          <span className="font-body text-xs font-semibold text-slate-600 dark:text-slate-300">
            Program Total: <span className="font-bold text-navy-800 dark:text-white">{totalHours} hrs</span>
          </span>

          <Button type="button" variant="outline" block={false} onClick={onAssignSubject}>
            <PlusIcon />
            Assign Existing Subject
          </Button>

          <button
            type="button"
            onClick={onRemoveProgram}
            className="grid size-7 place-items-center rounded text-slate-400 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/40 dark:hover:text-red-400"
            title="Remove program"
          >
            <TrashIcon />
          </button>
        </div>
      </div>

      {/* Subjects Table */}
      {!collapsed && (
        <div className="overflow-x-auto">
          <table className="w-full text-left font-body text-xs sm:text-sm">
            <thead className="border-b border-slate-100 bg-white font-semibold text-slate-500 dark:border-white/10 dark:bg-white/5 dark:text-slate-400">
              <tr>
                <th className="px-4 py-2.5">Subject Code</th>
                <th className="px-4 py-2.5">Descriptive Title</th>
                <th className="px-3 py-2.5 text-center">Units</th>
                <th className="px-3 py-2.5 text-center">Lecture Hours</th>
                <th className="px-3 py-2.5 text-center">Laboratory Hours</th>
                <th className="px-3 py-2.5 text-center">Weekly Hours</th>
                <th className="px-4 py-2.5 text-right">Remove</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-white/10">
              {program.subjects.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-6 text-center text-xs text-slate-400">
                    No subjects assigned to this program yet. Click &quot;Assign Existing Subject&quot; above.
                  </td>
                </tr>
              ) : (
                program.subjects.map((subj) => (
                  <tr key={subj.subjectCode} className="hover:bg-slate-50/50 dark:hover:bg-white/5">
                    <td className="px-4 py-2.5 font-semibold text-navy-900 dark:text-white">
                      {subj.subjectCode}
                    </td>
                    <td className="px-4 py-2.5 text-slate-600 dark:text-slate-300">
                      {subj.descriptiveTitle}
                    </td>
                    <td className="px-3 py-2.5 text-center font-medium">{subj.units}</td>
                    <td className="px-3 py-2.5 text-center text-slate-600 dark:text-slate-300">
                      {subj.lecHours}
                    </td>
                    <td className="px-3 py-2.5 text-center text-slate-600 dark:text-slate-300">
                      {subj.labHours}
                    </td>
                    <td className="px-3 py-2.5 text-center font-semibold text-navy-800 dark:text-white">
                      {subj.weeklyHours}
                    </td>
                    <td className="px-4 py-2.5 text-right">
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
