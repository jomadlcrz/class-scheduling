import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { toast } from "sonner";
import { RoleGuard } from "~/auth/role-guard";
import { EmptyState } from "~/components/feedback/empty-state";
import { Button } from "~/components/ui/button";
import { ConfirmDialog } from "~/components/ui/modal";
import { Spinner } from "~/components/ui/spinner";
import type { ReenrollDirectoryRow } from "~/features/enrollment/reenroll-step1-select-student";
import { ReenrollWizard } from "~/features/enrollment/reenroll-wizard";
import { useUnsavedChangesGuard } from "~/hooks/use-unsaved-changes-guard";
import { PageHeader } from "~/layouts/page-header";
import { enumService, type EnumOptions } from "~/services/enum.service";
import { irregularClassService } from "~/services/irregular-class.service";
import { programService } from "~/services/program.service";
import { regularClassService } from "~/services/regular-class.service";
import { schoolYearService, type SchoolYearOption } from "~/services/school-year.service";
import { semesterService } from "~/services/semester.service";
import { setService } from "~/services/set.service";
import { subjectService } from "~/services/subject.service";
import type { Program } from "~/types/program";
import type { Semester } from "~/types/semester";
import type { ClassSet } from "~/types/set";
import type { Subject } from "~/types/subject";

export function meta() {
  return [
    { title: "Re-enroll Existing Student — Enrollment — GWC Class Scheduling" },
    { name: "description", content: "Enroll a returning student profile into a new term." },
  ];
}

export default function EnrollmentReenrollRoute() {
  return (
    <RoleGuard allow={["registrar"]}>
      <EnrollmentReenrollPage />
    </RoleGuard>
  );
}

function EnrollmentReenrollPage() {
  const navigate = useNavigate();
  const [programs, setPrograms] = useState<Program[] | null>(null);
  const [sets, setSets] = useState<ClassSet[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [schoolYears, setSchoolYears] = useState<SchoolYearOption[] | null>(null);
  const [semesters, setSemesters] = useState<Semester[]>([]);
  const [enumOptions, setEnumOptions] = useState<EnumOptions | null>(null);
  const [directory, setDirectory] = useState<ReenrollDirectoryRow[] | null>(null);
  const [isDirty, setIsDirty] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    programService.list().then(setPrograms).catch(() => setPrograms([]));
    setService.list().then(setSets).catch(() => setSets([]));
    subjectService.list().then(setSubjects).catch(() => setSubjects([]));
    schoolYearService.list().then(setSchoolYears).catch(() => setSchoolYears([]));
    semesterService.list().then(setSemesters).catch(() => setSemesters([]));
    enumService.getOptions().then(setEnumOptions).catch(() => setEnumOptions(null));
  }, []);

  // Build a searchable directory across every term — a returning student to re-enroll
  // is, by definition, likely absent from the currently selected term's own lists.
  useEffect(() => {
    if (schoolYears === null || semesters.length === 0) return;
    let cancelled = false;
    // Oldest-to-newest so the last write per student below reflects their most recent term —
    // that's what the Year Level/Semester/Enrolled Status filters and table columns show.
    const orderedSchoolYears = [...schoolYears].sort((a, b) => a.schoolYear.localeCompare(b.schoolYear));
    const orderedSemesters = [...semesters].sort((a, b) => a.semesterNumber - b.semesterNumber);
    Promise.all(
      orderedSchoolYears.flatMap((sy) =>
        orderedSemesters.map((sem) =>
          Promise.all([
            regularClassService.listStudents(sy.id, sem.semesterNumber).catch(() => []),
            irregularClassService.listStudents(sy.id, sem.semesterNumber).catch(() => []),
          ]).then(([regular, irregular]) => ({ semesterNumber: sem.semesterNumber, regular, irregular })),
        ),
      ),
    ).then((termResults) => {
      if (cancelled) return;
      const byId = new Map<number, ReenrollDirectoryRow>();
      for (const { semesterNumber, regular, irregular } of termResults) {
        for (const s of regular) {
          const academic = s.academics[0];
          byId.set(s.studentProfileId, {
            studentProfileId: s.studentProfileId,
            studentId: s.studentId,
            name: s.studentName,
            program: academic?.program ?? "",
            yearLevel: academic?.yearLevel ?? 0,
            semesterNumber,
            enrolledStatus: academic?.enrolledStatus ?? "",
            accountStatus: s.accountStatus,
          });
        }
        for (const s of irregular) {
          byId.set(s.studentProfileId, {
            studentProfileId: s.studentProfileId,
            studentId: s.studentId,
            name: s.studentName,
            program: s.programTaken,
            yearLevel: s.yearLevel,
            semesterNumber,
            enrolledStatus: s.enrolledStatus,
            accountStatus: s.accountStatus,
          });
        }
      }
      setDirectory([...byId.values()].sort((a, b) => a.name.localeCompare(b.name)));
    });
    return () => {
      cancelled = true;
    };
  }, [schoolYears, semesters]);

  const { blocker, reloadPromptOpen, setReloadPromptOpen, confirmReload } =
    useUnsavedChangesGuard(isDirty, !isSaving);

  const isLoading = programs === null || schoolYears === null;
  const noAcademicTerm = schoolYears !== null && schoolYears.length === 0;

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <PageHeader
        title="Re-enroll Existing Student"
        description="Enroll a returning student profile into a new term."
      />

      {noAcademicTerm ? (
        <div className="mt-6">
          <EmptyState
            title="No school years yet"
            action={
              <Button type="button" block={false} onClick={() => navigate("/academic-term")}>
                Create academic term
              </Button>
            }
          >
            Create the first academic term before enrolling students.
          </EmptyState>
        </div>
      ) : isLoading ? (
        <div
          role="status"
          aria-label="Loading re-enrollment form"
          className="mt-6 grid place-items-center py-12 text-navy-700 dark:text-slate-200"
        >
          <Spinner />
        </div>
      ) : (
        <div className="mt-6">
          <ReenrollWizard
            directory={directory}
            programs={programs}
            sets={sets}
            subjects={subjects}
            schoolYears={schoolYears}
            semesters={semesters}
            studentTypes={enumOptions?.studentType ?? []}
            academicStatuses={enumOptions?.academicStatus ?? []}
            isSaving={isSaving}
            onSavingChange={setIsSaving}
            onDirtyChange={setIsDirty}
            onCancel={() => navigate("/enrollment/regular-students")}
            onSaved={(message) => {
              if (message) toast.success(message);
              navigate("/enrollment/regular-students");
            }}
          />
        </div>
      )}

      <ConfirmDialog
        open={blocker.state === "blocked"}
        onClose={() => blocker.reset?.()}
        title="Discard unsaved changes?"
        confirmLabel="Discard"
        loadingLabel="Discarding…"
        confirmVariant="danger"
        onConfirm={async () => blocker.proceed?.()}
      >
        You have unsaved enrollment details. Leaving this page will discard them.
      </ConfirmDialog>

      <ConfirmDialog
        open={reloadPromptOpen}
        onClose={() => setReloadPromptOpen(false)}
        title="Discard unsaved changes?"
        confirmLabel="Reload"
        loadingLabel="Reloading…"
        confirmVariant="danger"
        onConfirm={async () => confirmReload()}
      >
        You have unsaved enrollment details. Reloading will discard them.
      </ConfirmDialog>
    </div>
  );
}
