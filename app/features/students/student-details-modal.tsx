import { Label } from "~/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "~/components/ui/table";
import { useYearLevels } from "~/hooks/use-year-levels";
import type { StudentAccountRow } from "~/types/student";

type StudentDetailsModalProps = {
  student: StudentAccountRow;
};

export function StudentDetailsModal({ student }: StudentDetailsModalProps) {
  const { yearLevelLabel } = useYearLevels();

  return (
    <div className="flex flex-col gap-6">
      <section>
        <h3 className="border-b border-slate-200 pb-2 font-display text-base tracking-wide text-navy-700 dark:border-white/10 dark:text-mist-100">
          Personal Information
        </h3>
        <dl className="mt-3 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Student ID" value={student.studentId} />
          <Field label="Name" value={`${student.lastName}, ${student.firstName}${student.midName ? ` ${student.midName}` : ""}`} />
          <Field label="Email" value={student.email ?? "—"} />
          <Field label="Mobile" value={student.mobile ?? "—"} />
        </dl>
      </section>

      <section>
        <h3 className="border-b border-slate-200 pb-2 font-display text-base tracking-wide text-navy-700 dark:border-white/10 dark:text-mist-100">
          Academic Records
        </h3>
        {student.academics.length === 0 ? (
          <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
            No academic records found.
          </p>
        ) : (
          <div className="mt-3 flex flex-col gap-3">
            {student.academics.map((a) => (
              <div
                key={a.studentAcademicId}
                className="rounded-lg border border-slate-200 p-3 dark:border-white/10"
              >
                <dl className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                  <Field label="Program" value={a.program} />
                  <Field label="Year Level" value={yearLevelLabel(a.yearLevel)} />
                  <Field label="Set" value={a.set ?? "—"} />
                  <Field label="Enrolled Status" value={a.enrolledStatus} />
                  <Field label="Student Type" value={a.studentType} />
                  <Field label="School Year" value={a.schoolYear ?? "—"} />
                  <Field label="Semester" value={a.semester ?? "—"} />
                </dl>
              </div>
            ))}
          </div>
        )}
      </section>

      <section>
        <h3 className="border-b border-slate-200 pb-2 font-display text-base tracking-wide text-navy-700 dark:border-white/10 dark:text-mist-100">
          Enrolled Subjects
        </h3>
        {student.enrolledSubjects.length === 0 ? (
          <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
            No enrolled subjects found.
          </p>
        ) : (
          <div className="mt-3">
            <Table>
              <TableHead>
                <TableHeader>Code</TableHeader>
                <TableHeader>Descriptive Title</TableHeader>
                <TableHeader className="text-center">Units</TableHeader>
              </TableHead>
              <TableBody>
                {student.enrolledSubjects.map((es) => (
                  <TableRow key={es.subjectId}>
                    <TableCell className="text-slate-600 dark:text-slate-300">
                      {es.subjectCode}
                    </TableCell>
                    <TableCell>{es.descriptiveTitle}</TableCell>
                    <TableCell className="text-center">{es.units}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </section>
    </div>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt>
        <Label>{label}</Label>
      </dt>
      <dd className="mt-1.5 font-body text-sm text-gray-900 dark:text-mist-100">{value}</dd>
    </div>
  );
}
