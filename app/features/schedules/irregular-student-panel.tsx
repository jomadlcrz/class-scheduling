import { UserIcon } from "~/components/ui/icons";
import type { IrregularStudent } from "~/services/irregular-class.service";

type IrregularStudentPanelProps = {
  student: IrregularStudent | null;
};

export function IrregularStudentPanel({ student }: IrregularStudentPanelProps) {
  const subjects = student?.subjectsEnrolled ?? [];

  return (
    <div className="flex flex-col gap-4">
      <h3 className="font-display text-sm tracking-wide text-navy-700 dark:text-mist-100">
        Selected Student
      </h3>

      <div className="flex items-center gap-3 rounded-xl border border-slate-300 bg-white p-4 dark:border-white/10 dark:bg-white/5">
        <span className="grid size-10 shrink-0 place-items-center rounded-full bg-slate-100 text-slate-400 dark:bg-white/10 dark:text-slate-500">
          <UserIcon />
        </span>
        {student ? (
          <div className="flex flex-col">
            <span className="font-body text-sm font-semibold text-navy-800 dark:text-mist-100">
              {student.studentName}
            </span>
            <span className="font-body text-xs text-slate-500 dark:text-slate-400">
              {student.studentId ? `${student.studentId} · ` : ""}
              {student.programTaken || "—"}
            </span>
          </div>
        ) : (
          <p className="font-body text-sm text-slate-400 dark:text-slate-500">No student selected.</p>
        )}
      </div>

      <section className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <h4 className="font-body text-sm font-semibold text-navy-700 dark:text-mist-100">
            Enrolled Subjects
          </h4>
          {subjects.length > 0 && (
            <span className="font-body text-xs text-slate-500 dark:text-slate-400">
              {subjects.length} subject{subjects.length !== 1 ? "s" : ""}
            </span>
          )}
        </div>
        {!student ? (
          <p className="px-1 py-4 font-body text-sm text-slate-400 dark:text-slate-500">
            Select a student to view subjects.
          </p>
        ) : subjects.length === 0 ? (
          <p className="px-1 py-4 font-body text-sm text-slate-400 dark:text-slate-500">
            No enrolled subjects found for this student.
          </p>
        ) : (
          <ul className="scrollbar-none flex max-h-105 flex-col gap-1.5 overflow-y-auto">
            {subjects.map((s) => (
              <li
                key={s.subjectId}
                className="flex items-center justify-between gap-3 rounded-lg border border-slate-200 bg-white px-3 py-2 dark:border-white/10 dark:bg-white/5"
              >
                <div className="flex flex-col">
                  <span className="font-body text-sm font-medium text-navy-800 dark:text-mist-100">
                    {s.subjectCode}
                  </span>
                  <span className="font-body text-xs text-slate-500 dark:text-slate-400">
                    {s.descTitle}
                  </span>
                </div>
                <span className="font-body text-xs text-slate-500 dark:text-slate-400">{s.units}</span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
