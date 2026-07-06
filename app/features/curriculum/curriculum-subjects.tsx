import { Badge } from "../../components/ui/badge";
import type { CurriculumGroup } from "../../types/curriculum";
import { SUBJECT_TYPE_LABELS } from "../../types/subject";

type CurriculumSubjectsProps = {
  group: CurriculumGroup;
};

export function CurriculumSubjects({ group }: CurriculumSubjectsProps) {
  if (group.subjects.length === 0) {
    return (
      <p className="py-4 text-center font-body text-sm text-slate-400 dark:text-slate-500">
        No subjects assigned.
      </p>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full font-body text-sm">
        <thead>
          <tr className="border-b border-slate-100 text-left dark:border-white/8">
            <th className="pb-2 pr-4 font-medium text-slate-500 dark:text-slate-400">Code</th>
            <th className="pb-2 pr-4 font-medium text-slate-500 dark:text-slate-400">Title</th>
            <th className="pb-2 pr-4 text-right font-medium text-slate-500 dark:text-slate-400">
              Units
            </th>
            <th className="pb-2 pr-4 text-right font-medium text-slate-500 dark:text-slate-400">
              Lec
            </th>
            <th className="pb-2 pr-4 text-right font-medium text-slate-500 dark:text-slate-400">
              Lab
            </th>
            <th className="pb-2 font-medium text-slate-500 dark:text-slate-400">Type</th>
          </tr>
        </thead>
        <tbody>
          {group.subjects.map((subject) => (
            <tr
              key={subject.id}
              className="border-b border-slate-50 last:border-0 dark:border-white/5"
            >
              <td className="py-2.5 pr-4 font-body text-xs font-medium text-navy-700 dark:text-slate-200">
                {subject.code}
              </td>
              <td className="py-2.5 pr-4 text-slate-700 dark:text-slate-300">{subject.title}</td>
              <td className="py-2.5 pr-4 text-right tabular-nums text-slate-700 dark:text-slate-300">
                {subject.units}
              </td>
              <td className="py-2.5 pr-4 text-right tabular-nums text-slate-500 dark:text-slate-400">
                {subject.lectureHours}
              </td>
              <td className="py-2.5 pr-4 text-right tabular-nums text-slate-500 dark:text-slate-400">
                {subject.labHours}
              </td>
              <td className="py-2.5">
                <Badge tone="slate">{SUBJECT_TYPE_LABELS[subject.subjectType]}</Badge>
              </td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr className="border-t border-slate-200 dark:border-white/10">
            <td colSpan={2} className="pt-2.5 font-medium text-slate-500 dark:text-slate-400">
              Total
            </td>
            <td className="pt-2.5 text-right font-semibold tabular-nums text-navy-700 dark:text-white">
              {group.totalUnits}
            </td>
            <td colSpan={3} />
          </tr>
        </tfoot>
      </table>
    </div>
  );
}
