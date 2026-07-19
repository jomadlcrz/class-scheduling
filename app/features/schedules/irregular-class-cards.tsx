import { Card } from "~/components/ui/card";
import { SubjectBadgeList } from "~/features/schedules/irregular-student-badges";
import type { IrregularStudent } from "~/services/irregular-class.service";

type IrregularClassCardsProps = {
  students: IrregularStudent[];
};

export function IrregularClassCards({ students }: IrregularClassCardsProps) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {students.map((student) => (
        <Card key={student.studentId} className="flex flex-col gap-2 p-4">
          <div className="flex items-center justify-between gap-2">
            <span className="font-medium text-navy-700 dark:text-mist-100">{student.studentName}</span>
            <span className="whitespace-nowrap font-body text-xs text-slate-500 dark:text-slate-400">
              {student.studentId}
            </span>
          </div>
          <span className="text-sm text-slate-600 dark:text-slate-300">{student.programTaken}</span>
          <SubjectBadgeList subjects={student.subjectsEnrolled} />
        </Card>
      ))}
    </div>
  );
}
