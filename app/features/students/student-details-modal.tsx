import { useEffect, useState } from "react";
import { Card } from "~/components/ui/card";
import { Label } from "~/components/ui/label";
import { SectionHeading } from "~/components/ui/section-heading";
import { Spinner } from "~/components/ui/spinner";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "~/components/ui/table";
import { useYearLevels } from "~/hooks/use-year-levels";
import { studentService } from "~/services/student.service";
import type {
  StudentAcademicRecord,
  StudentAccountRow,
  StudentProfileDetail,
} from "~/types/student";

type StudentDetailsModalProps = {
  student: StudentAccountRow;
};

export function StudentDetailsModal({
  student,
}: StudentDetailsModalProps) {
  const { yearLevelLabel } = useYearLevels();
  // Fetched fresh via GET /students/{id}/enrollments rather than reused from the
  // bulk list, so a just-completed enrollment shows up without a full page reload.
  const [academics, setAcademics] = useState<StudentAcademicRecord[] | null>(null);
  const [profile, setProfile] = useState<StudentProfileDetail | null>(null);
  const [loading, setLoading] = useState(true);

  function refreshEnrollments() {
    return studentService
      .getEnrollments(student.studentProfileId)
      .then(setAcademics)
      .catch(() => setAcademics(student.academics));
  }

  function refreshProfile() {
    return studentService
      .getProfile(student.studentProfileId)
      .then(setProfile)
      .catch(() => setProfile(null));
  }

  useEffect(() => {
    setAcademics(null);
    setProfile(null);
    setLoading(true);
    void Promise.all([refreshEnrollments(), refreshProfile()]).finally(() => setLoading(false));
  }, [student.studentProfileId]);

  const displayName = profile
    ? [profile.firstName, profile.midName, profile.lastName, profile.suffix].filter(Boolean).join(" ")
    : student.studentName || [student.firstName, student.midName, student.lastName].filter(Boolean).join(" ");

  const records = academics ?? [];

  if (loading) {
    return (
      <div role="status" aria-label="Loading student details" className="grid place-items-center py-10">
        <Spinner />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <section>
        <SectionHeading>Personal Information</SectionHeading>
        <Card className="mt-2 p-4">
          <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Student ID" value={profile?.studentId || student.studentId || "No ID"} />
            <Field label="Name" value={displayName} />
            <Field label="Email" value={profile?.email ?? student.email ?? "—"} />
            <Field label="Mobile" value={profile?.mobile ?? student.mobile ?? "—"} />
            {profile && <Field label="Account status" value={profile.accountStatus} />}
          </dl>
        </Card>
      </section>

      <section>
        <SectionHeading>Academic Records</SectionHeading>
        <Card className="mt-2 p-4">
          {records.length === 0 ? (
            <p className="text-sm text-slate-500 dark:text-slate-400">
              No academic records found.
            </p>
          ) : (
            <div className="flex flex-col gap-3">
              {records.map((a, i) => (
                <div
                  key={a.studentAcademicId}
                  className={i > 0 ? "border-t border-slate-200 pt-3 dark:border-white/10" : ""}
                >
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                    <Field label="Program" value={a.program} />
                    <Field label="Year level" value={yearLevelLabel(a.yearLevel)} />
                    <Field label="Set" value={a.set ?? "—"} />
                    <Field label="Academic status" value={a.enrolledStatus} />
                    {a.enrollmentState && <Field label="Enrollment state" value={a.enrollmentState} />}
                    <Field label="Student type" value={a.studentType ?? "—"} />
                    <Field label="School year" value={a.schoolYear ?? "—"} />
                    <Field label="Semester" value={a.semester ?? "—"} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </section>

      {records.length > 0 && (
        <section>
          <div className="flex items-center justify-between">
            <SectionHeading>Enrolled Subjects</SectionHeading>
            <span className="font-body text-sm text-slate-400 dark:text-slate-500">
              {records.reduce((sum, a) => sum + a.enrolledSubjects.reduce((s, es) => s + es.units, 0), 0)} units
            </span>
          </div>
          <div className="mt-2">
            {records.some((a) => a.enrolledSubjects.length > 0) ? (
              <Table>
                <TableHead>
                  <TableHeader>Code</TableHeader>
                  <TableHeader>Descriptive title</TableHeader>
                  <TableHeader className="text-center">Units</TableHeader>
                </TableHead>
                <TableBody>
                  {records.flatMap((a) =>
                    a.enrolledSubjects.map((es) => (
                      <TableRow key={`${a.studentAcademicId}-${es.subjectId}`}>
                        <TableCell className="text-slate-600 dark:text-slate-300">
                          {es.subjectCode}
                        </TableCell>
                        <TableCell>{es.descriptiveTitle}</TableCell>
                        <TableCell className="text-center">{es.units}</TableCell>
                      </TableRow>
                    )),
                  )}
                </TableBody>
              </Table>
            ) : (
              <p className="text-sm text-slate-500 dark:text-slate-400">
                No enrolled subjects found.
              </p>
            )}
          </div>
        </section>
      )}
    </div>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  const href =
    label === "Email" && value !== "—" ? `mailto:${value}`
    : label === "Mobile" && value !== "—" ? `tel:${value}`
    : null;
  return (
    <div>
      <dt>
        <Label>{label}</Label>
      </dt>
      <dd className="mt-1.5 font-body text-sm text-slate-500 dark:text-slate-400">
        {href ? <a href={href} className="hover:underline">{value}</a> : value}
      </dd>
    </div>
  );
}
