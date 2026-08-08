import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Card } from "~/components/ui/card";
import { IconButton } from "~/components/ui/icon-button";
import { EditIcon, TrashIcon } from "~/components/ui/icons";
import { Label } from "~/components/ui/label";
import { ConfirmDialog, Modal } from "~/components/ui/modal";
import { SectionHeading } from "~/components/ui/section-heading";
import { Spinner } from "~/components/ui/spinner";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "~/components/ui/table";
import { EnrollmentEditForm } from "~/features/students/enrollment-edit-form";
import { StudentProfileForm } from "~/features/students/student-profile-form";
import { useYearLevels } from "~/hooks/use-year-levels";
import { studentService } from "~/services/student.service";
import type { ClassSet } from "~/types/set";
import type {
  StudentAcademicRecord,
  StudentAccountRow,
  StudentProfileDetail,
} from "~/types/student";

type StudentDetailsModalProps = {
  student: StudentAccountRow;
  sets: ClassSet[];
  enrollmentStates: string[];
  nameSuffixes: string[];
};

export function StudentDetailsModal({
  student,
  sets,
  enrollmentStates,
  nameSuffixes,
}: StudentDetailsModalProps) {
  const { yearLevelLabel } = useYearLevels();
  // Fetched fresh via GET /students/{id}/enrollments rather than reused from the
  // bulk list, so a just-completed enrollment shows up without a full page reload.
  const [academics, setAcademics] = useState<StudentAcademicRecord[] | null>(null);
  const [profile, setProfile] = useState<StudentProfileDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [profileEditOpen, setProfileEditOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<StudentAcademicRecord | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<StudentAcademicRecord | null>(null);

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
    setProfileEditOpen(false);
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
          <div className="flex items-start justify-between gap-3">
            <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field label="Student ID" value={profile?.studentId || student.studentId || "—"} />
              <Field label="Name" value={displayName} />
              <Field label="Email" value={profile?.email ?? student.email ?? "—"} />
              <Field label="Mobile" value={profile?.mobile ?? student.mobile ?? "—"} />
              {profile && <Field label="Account Status" value={profile.accountStatus} />}
            </dl>
            <IconButton
              onClick={() => setProfileEditOpen(true)}
              label="Edit profile"
              title="Edit profile"
              disabled={!profile}
            >
              <EditIcon />
            </IconButton>
          </div>
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
                  <div className="flex items-start justify-between gap-3">
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                      <Field label="Program" value={a.program} />
                      <Field label="Year Level" value={yearLevelLabel(a.yearLevel)} />
                      <Field label="Set" value={a.set ?? "—"} />
                      <Field label="Academic Status" value={a.enrolledStatus} />
                      {a.enrollmentState && <Field label="Enrollment State" value={a.enrollmentState} />}
                      <Field label="Student Type" value={a.studentType ?? "—"} />
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
      </section>

      {records.length > 0 && (
        <section>
          <SectionHeading>Enrolled Subjects</SectionHeading>
          <div className="mt-2">
            {records.some((a) => a.enrolledSubjects.length > 0) ? (
              <Table>
                <TableHead>
                  <TableHeader>Code</TableHeader>
                  <TableHeader>Descriptive Title</TableHeader>
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

      <Modal open={profileEditOpen} onClose={() => setProfileEditOpen(false)} title="Edit Student Profile">
        {profile && (
          <StudentProfileForm
            profile={profile}
            nameSuffixes={nameSuffixes}
            onSubmit={async (input) => {
              const message = await studentService.updateProfile(student.studentProfileId, input);
              if (message) toast.success(message);
              setProfileEditOpen(false);
              await refreshProfile();
            }}
            onCancel={() => setProfileEditOpen(false)}
          />
        )}
      </Modal>

      <Modal open={editTarget !== null} onClose={() => setEditTarget(null)} title="Edit Enrollment">
        {editTarget && (
          <EnrollmentEditForm
            record={editTarget}
            sets={sets}
            enrollmentStates={enrollmentStates}
            onSubmit={async (input) => {
              if (
                input.enrollmentState != null &&
                input.enrollmentState !== editTarget.enrollmentState
              ) {
                const message = await studentService.setEnrollmentState(
                  editTarget.studentAcademicId,
                  input.enrollmentState,
                );
                if (message) toast.success(message);
              }

              if (input.setId != null) {
                const message = await studentService.updateEnrollment(editTarget.studentAcademicId, {
                  setId: input.setId,
                });
                if (message) toast.success(message);
              }
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
