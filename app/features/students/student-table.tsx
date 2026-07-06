import { Badge } from "../../components/ui/badge";
import type { BadgeTone } from "../../components/ui/badge";
import { EditIcon, TrashIcon } from "../../components/ui/icons";
import type { Student } from "../../types/student";
import { STUDENT_STATUS_LABELS } from "../../types/student";
import { YEAR_LEVEL_LABELS } from "../../types/subject";

type StudentTableProps = {
  students: Student[];
  onEdit: (student: Student) => void;
  onDelete: (student: Student) => void;
};

const STATUS_TONES: Record<Student["status"], BadgeTone> = {
  enrolled: "emerald",
  inactive: "slate",
  graduated: "navy",
};

export function StudentTable({ students, onEdit, onDelete }: StudentTableProps) {
  return (
    <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white dark:border-white/10 dark:bg-white/3">
      <table className="w-full font-body text-sm">
        <thead>
          <tr className="border-b border-slate-100 dark:border-white/8">
            <th className="px-5 py-3 text-left font-medium text-slate-400 dark:text-slate-500">Student No.</th>
            <th className="px-5 py-3 text-left font-medium text-slate-400 dark:text-slate-500">Name</th>
            <th className="px-5 py-3 text-left font-medium text-slate-400 dark:text-slate-500">Email</th>
            <th className="px-5 py-3 text-left font-medium text-slate-400 dark:text-slate-500">Program</th>
            <th className="px-5 py-3 text-left font-medium text-slate-400 dark:text-slate-500">Year / Section</th>
            <th className="px-5 py-3 text-left font-medium text-slate-400 dark:text-slate-500">Status</th>
            <th className="px-5 py-3" />
          </tr>
        </thead>
        <tbody>
          {students.map((s) => (
            <tr key={s.id} className="border-b border-slate-50 last:border-0 dark:border-white/5">
              <td className="px-5 py-3 font-body text-xs font-medium text-navy-700 dark:text-slate-200">
                {s.studentNumber}
              </td>
              <td className="px-5 py-3 font-medium text-navy-700 dark:text-slate-200">
                {s.lastName}, {s.firstName}
              </td>
              <td className="px-5 py-3 text-slate-500 dark:text-slate-400">{s.email}</td>
              <td className="px-5 py-3 text-slate-600 dark:text-slate-300">{s.program}</td>
              <td className="px-5 py-3 text-slate-500 dark:text-slate-400">
                {YEAR_LEVEL_LABELS[s.yearLevel]} — {s.setCode}
              </td>
              <td className="px-5 py-3">
                <Badge tone={STATUS_TONES[s.status]}>{STUDENT_STATUS_LABELS[s.status]}</Badge>
              </td>
              <td className="px-5 py-3">
                <div className="flex items-center justify-end gap-1">
                  <button
                    type="button"
                    onClick={() => onEdit(s)}
                    aria-label={`Edit ${s.firstName} ${s.lastName}`}
                    className="grid size-8 cursor-pointer place-items-center rounded-lg text-slate-400 transition-colors hover:bg-slate-100 hover:text-navy-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-400 dark:hover:bg-white/10 dark:hover:text-white"
                  >
                    <EditIcon />
                  </button>
                  <button
                    type="button"
                    onClick={() => onDelete(s)}
                    aria-label={`Delete ${s.firstName} ${s.lastName}`}
                    className="grid size-8 cursor-pointer place-items-center rounded-lg text-slate-400 transition-colors hover:bg-red-50 hover:text-red-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-400 dark:hover:bg-red-500/10 dark:hover:text-red-400"
                  >
                    <TrashIcon />
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
