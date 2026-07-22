import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Card } from "~/components/ui/card";
import { EditIcon, TrashIcon } from "~/components/ui/icons";
import { Label } from "~/components/ui/label";
import { ConfirmDialog, Modal } from "~/components/ui/modal";
import { SectionHeading } from "~/components/ui/section-heading";
import { Spinner } from "~/components/ui/spinner";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "~/components/ui/table";
import { EnrollmentEditForm } from "~/features/students/enrollment-edit-form";
import { useYearLevels } from "~/hooks/use-year-levels";
import { studentService } from "~/services/student.service";
import type { ClassSet } from "~/types/set";
import type { StudentAcademicRecord, StudentAccountRow } from "~/types/student";

type StudentDetailsModalProps = {
  student: StudentAccountRow;
  sets: ClassSet[];
  academicStatuses: string[];
};

export function StudentDetailsModal({ student, sets, academicStatuses }: StudentDetailsModalProps) {
  const { yearLevelLabel } = useYearLevels();
  // Fetched fresh via GET /students/{id}/enrollments rather than reused from the
  // bulk list, so a just-completed enrollment shows up without a full page reload.
  const [academics, setAcademics] = useState<StudentAcademicRecord[] | null>(null);
  const [editTarget, setEditTarget] = useState<StudentAcademicRecord | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<StudentAcademicRecord | null>(null);

  function refreshEnrollments() {
    studentService
      .getEnrollments(student.studentProfileId)
      .then(setAcademics)
      .catch(() => setAcademics(student.academics));
  }

  useEffect(() => {
    setAcademics(null);
    refreshEnrollments();
  }, [student.studentProfileId]);

  return (
    <div className="flex flex-col gap-6">
      <section>
        <SectionHeading>Personal Information</SectionHeading>
        <Card className="mt-2 p-4">
          <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Student ID" value={student.studentId || "—"} />
            <Field label="Name" value={`${student.lastName}, ${student.firstName}${student.midName ? ` ${student.midName}` : ""}`} />
            <Field label="Email" value={student.email ?? "—"} />
            <Field label="Mobile" value={student.mobile ?? "—"} />
          </dl>
        </Card>
      </section>

      <section>
        <SectionHeading>Academic Records</SectionHeading>
        <Card className="mt-2 p-4">
          {academics === null ? (
            <div role="status" aria-label="Loading academic records" className="grid place-items-center py-6">
              <Spinner />
            </div>
          ) : academics.length === 0 ? (
            <p className="text-sm text-slate-500 dark:text-slate-400">
              No academic records found.
            </p>
          ) : (
            <div className="flex flex-col gap-3">
              {academics.map((a, i) => (
                <div
                  key={a.studentAcademicId}
                  className={i > 0 ? "border-t border-slate-200 pt-3 dark:border-white/10" : ""}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                      <Field label="Program" value={a.program} />
                      <Field label="Year Level" value={yearLevelLabel(a.yearLevel)} />
                      <Field label="Set" value={a.set ?? "—"} />
                      <Field label="Enrolled Status" value={a.enrolledStatus} />
                      <Field label="Student Type" value={a.studentType} />
                      <Field label="School Year" value={a.schoolYear ?? "—"} />
                      <Field label="Semester" value={a.semester ?? "—"} />
                    </div>
                    <div className="flex shrink-0 gap-1">
                      <button
                        type="button"
                        onClick={() => setEditTarget(a)}
                        aria-label={`Edit enrollment for ${a.schoolYear ?? ""} ${a.semester ?? ""}`}
                        title="Edit enrollment"
                        className="grid size-8 cursor-pointer place-items-center rounded-lg text-slate-400 transition-colors duration-150 hover:bg-slate-200/60 hover:text-navy-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-400 dark:text-slate-500 dark:hover:bg-white/10 dark:hover:text-white"
                      >
                        <EditIcon />
                      </button>
                      <button
                        type="button"
                        onClick={() => setDeleteTarget(a)}
                        aria-label={`Remove enrollment for ${a.schoolYear ?? ""} ${a.semester ?? ""}`}
                        title="Remove enrollment"
                        className="grid size-8 cursor-pointer place-items-center rounded-lg text-slate-400 transition-colors duration-150 hover:bg-slate-200/60 hover:text-navy-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-400 dark:text-slate-500 dark:hover:bg-white/10 dark:hover:text-white"
                      >
                        <TrashIcon />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>

        {academics && academics.length > 0 && (
          <div className="mt-3">
            <Label>Enrolled Subjects</Label>
            {academics.some((a) => a.enrolledSubjects.length > 0) ? (
              <div className="mt-1.5">
                <Table>
                <TableHead>
                  <TableHeader>Code</TableHeader>
                  <TableHeader>Descriptive Title</TableHeader>
                  <TableHeader className="text-center">Units</TableHeader>
                </TableHead>
                <TableBody>
                  {academics.flatMap((a) =>
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
              </div>
            ) : (
              <p className="mt-1.5 text-sm text-slate-500 dark:text-slate-400">
                No enrolled subjects found.
              </p>
            )}
          </div>
        )}
      </section>

      <Modal open={editTarget !== null} onClose={() => setEditTarget(null)} title="Edit Enrollment">
        {editTarget && (
          <EnrollmentEditForm
            record={editTarget}
            sets={sets}
            academicStatuses={academicStatuses}
            onSubmit={async (input) => {
              const message = await studentService.updateEnrollment(editTarget.studentAcademicId, input);
              if (message) toast.success(message);
              setEditTarget(null);
              refreshEnrollments();
            }}
            onCancel={() => setEditTarget(null)}
          />
        )}
      </Modal>

      <ConfirmDialog
        open={deleteTarget !== null}
        onClose={() => setDeleteTarget(null)}
        title="Remove enrollment"
        confirmLabel="Remove"
        loadingLabel="Removing…"
        confirmVariant="danger"
        onConfirm={async () => {
          if (!deleteTarget) return;
          const message = await studentService.removeEnrollment(deleteTarget.studentAcademicId);
          if (message) toast.success(message);
          refreshEnrollments();
        }}
      >
        This term's enrollment ({deleteTarget?.schoolYear ?? "—"} {deleteTarget?.semester ?? ""}) and its enrolled
        subjects will be permanently removed.
      </ConfirmDialog>
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
