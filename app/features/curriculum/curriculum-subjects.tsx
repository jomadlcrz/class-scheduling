import type { CurriculumGroup } from "~/types/curriculum";

type CurriculumSubjectsProps = {
  group: CurriculumGroup;
  codeById: Map<string, string>;
};

export function CurriculumSubjects({ group, codeById }: CurriculumSubjectsProps) {
  if (group.subjects.length === 0) {
    return (
      <p className="py-3 text-center font-body text-xs text-slate-400 dark:text-slate-500">
        No subjects assigned.
      </p>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full font-body text-xs">
        <thead>
          <tr className="border-b border-slate-200 text-left dark:border-white/10">
            <th className="px-3 py-1.5 font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Subject Code
            </th>
            <th className="px-3 py-1.5 font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Descriptive Title
            </th>
            <th className="px-3 py-1.5 font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Pre-Requisite
            </th>
          </tr>
        </thead>
        <tbody>
          {group.subjects.map((subject) => (
            <tr
              key={subject.id}
              className="border-b border-slate-100 last:border-0 dark:border-white/5"
            >
              <td className="px-3 py-1.5 font-medium text-navy-700 dark:text-slate-200">
                {subject.code}
              </td>
              <td className="px-3 py-1.5 text-slate-700 dark:text-slate-300">
                {subject.title}
              </td>
              <td className="px-3 py-1.5 text-slate-400 dark:text-slate-500">
                {subject.prerequisiteIds.length > 0
                  ? subject.prerequisiteIds.map((id) => codeById.get(id)).filter(Boolean).join(", ")
                  : "—"}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
