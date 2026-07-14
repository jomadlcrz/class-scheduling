import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "~/components/ui/table";
import { SubjectTypeText } from "~/features/subjects/subject-type-badge";
import type { CurriculumGroup } from "~/types/curriculum";

type CurriculumSubjectsProps = {
  group: CurriculumGroup;
};

export function CurriculumSubjects({ group }: CurriculumSubjectsProps) {
  if (group.subjects.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-slate-300 py-6 text-center font-body text-sm text-slate-400 dark:border-white/15 dark:text-slate-500">
        No subjects assigned.
      </div>
    );
  }

  return (
    <Table>
      <TableHead>
        <TableHeader>Subject Code</TableHeader>
        <TableHeader>Descriptive Title</TableHeader>
        <TableHeader className="text-center">Units</TableHeader>
        <TableHeader className="text-center">Pre-Requisite</TableHeader>
      </TableHead>
      <TableBody>
        {group.subjects.map((subject) => (
          <TableRow key={subject.id}>
            <TableCell>
              <span className="font-medium text-navy-700 dark:text-white">{subject.code}</span>
              <div className="mt-0.5">
                <SubjectTypeText type={subject.subjectType} />
              </div>
            </TableCell>
            <TableCell>{subject.title}</TableCell>
            <TableCell className="text-center tabular-nums">{subject.units}</TableCell>
            <TableCell className="text-center text-slate-400 dark:text-slate-500">
              {subject.prerequisites.length > 0 ? subject.prerequisites.join(", ") : "—"}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
      <tfoot>
        <tr className="border-t-2 border-slate-300 dark:border-white/10">
          <td colSpan={2} className="px-4 py-2.5 font-semibold text-slate-500 dark:text-slate-400">
            Total Units
          </td>
          <td className="px-4 py-2.5 text-center font-semibold tabular-nums text-navy-700 dark:text-white">
            {group.totalUnits}
          </td>
          <td />
        </tr>
      </tfoot>
    </Table>
  );
}
