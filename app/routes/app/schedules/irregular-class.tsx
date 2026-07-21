import { useEffect, useState } from "react";
import { toast } from "sonner";
import { RoleGuard } from "~/auth/role-guard";
import { EmptyState } from "~/components/feedback/empty-state";
import { Card } from "~/components/ui/card";
import { FieldChrome } from "~/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "~/components/ui/select";
import { Spinner } from "~/components/ui/spinner";
import { AssignSchedulePanel } from "~/features/schedules/assign-schedule-panel";
import { IrregularStudentList } from "~/features/schedules/irregular-student-list";
import { IrregularStudentPanel } from "~/features/schedules/irregular-student-panel";
import { useSchoolYears } from "~/hooks/use-school-years";
import { useSemesters } from "~/hooks/use-semesters";
import { PageHeader } from "~/layouts/page-header";
import {
  irregularClassService,
  type IrregularStudent,
  type StudentPendingSchedule,
} from "~/services/irregular-class.service";

export function meta() {
  return [
    { title: "Irregular Class — GWC Class Scheduling" },
    { name: "description", content: "Review irregular students and their enrolled subjects for the current academic term." },
  ];
}

export default function IrregularClassRoute() {
  return (
    <RoleGuard allow={["admin", "registrar", "dean"]}>
      <IrregularClassPage />
    </RoleGuard>
  );
}

type Tab = "students" | "assigned";

function IrregularClassPage() {
  const [students, setStudents] = useState<IrregularStudent[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selectedStudent, setSelectedStudent] = useState<IrregularStudent | null>(null);
  const [activeTab, setActiveTab] = useState<Tab>("students");

  const { schoolYears, defaultSchoolYear } = useSchoolYears();
  const { semesters } = useSemesters();
  const [schoolYear, setSchoolYear] = useState("");
  const [semId, setSemId] = useState("");
  const [pending, setPending] = useState<StudentPendingSchedule[] | null>(null);

  useEffect(() => {
    irregularClassService
      .listStudents()
      .then(setStudents)
      .catch((err) =>
        setError(err instanceof Error ? err.message : "Something went wrong. Please try again."),
      );
  }, []);

  useEffect(() => {
    if (schoolYear || schoolYears.length === 0) return;
    setSchoolYear(defaultSchoolYear);
  }, [schoolYear, schoolYears, defaultSchoolYear]);

  const matchedSy = schoolYears.find((sy) => sy.schoolYear === schoolYear);
  const matchedSem = semesters.find((s) => String(s.id) === semId);

  useEffect(() => {
    if (!matchedSy || !matchedSem) {
      setPending(null);
      return;
    }
    irregularClassService
      .listPendingSchedule(matchedSy.id, matchedSem.id)
      .then(setPending)
      .catch(() => setPending([]));
  }, [matchedSy?.id, matchedSem?.id]);

  const selectedPending = !matchedSy || !matchedSem
    ? undefined
    : pending?.find((p) => p.studentProfileId === selectedStudent?.studentProfileId) ?? null;

  async function handleAssign(studentAcademicId: number, regularSchedId: number) {
    const message = await irregularClassService.assign({
      studentAcademicId,
      regularSchedIds: [regularSchedId],
    });
    if (message) toast.success(message);
    if (matchedSy && matchedSem) {
      irregularClassService.listPendingSchedule(matchedSy.id, matchedSem.id).then(setPending).catch(() => {});
    }
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <PageHeader
        title="Irregular Class"
        description="Review irregular students and the subjects they're currently enrolled in."
      />

      <div className="mt-6 flex gap-2 border-b border-slate-200 dark:border-white/10">
        {(["students", "assigned"] as const).map((tab) => (
          <button
            key={tab}
            type="button"
            onClick={() => setActiveTab(tab)}
            className={`-mb-px border-b-2 px-4 py-2 font-body text-sm font-medium transition-colors duration-150 ${
              activeTab === tab
                ? "border-navy-800 text-navy-800 dark:border-white dark:text-mist-100"
                : "border-transparent text-slate-500 hover:text-navy-700 dark:text-slate-400 dark:hover:text-slate-200"
            }`}
          >
            {tab === "students" ? "Irregular Students" : "Assigned Schedules"}
          </button>
        ))}
      </div>

      {activeTab === "assigned" ? (
        <div className="mt-6">
          <EmptyState title="No assignments yet">
            Assigned schedules will appear here after assignments are made this session.
          </EmptyState>
        </div>
      ) : error ? (
        <div className="mt-6">
          <EmptyState title="Couldn't load irregular students">{error}</EmptyState>
        </div>
      ) : students === null ? (
        <div
          role="status"
          aria-label="Loading irregular students"
          className="grid place-items-center py-12 text-navy-700 dark:text-slate-200"
        >
          <Spinner />
        </div>
      ) : students.length === 0 ? (
        <div className="mt-6">
          <EmptyState title="No irregular students">
            No students are currently flagged as irregular.
          </EmptyState>
        </div>
      ) : (
        <div className="mt-6 flex flex-col gap-6">
          <Card className="grid grid-cols-2 gap-3 p-4 sm:max-w-md">
            <FieldChrome id="ic-school-year" label="School Year">
              <Select
                items={[
                  { value: "", label: "Select a school year" },
                  ...schoolYears.map((sy) => ({ value: sy.schoolYear, label: sy.schoolYear })),
                ]}
                value={schoolYear}
                onValueChange={(v) => setSchoolYear(v as string)}
              >
                <SelectTrigger id="ic-school-year">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Select a school year</SelectItem>
                  {schoolYears.map((sy) => (
                    <SelectItem key={sy.id} value={sy.schoolYear}>
                      {sy.schoolYear}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FieldChrome>
            <FieldChrome id="ic-semester" label="Semester">
              <Select
                items={[
                  { value: "", label: "Select a semester" },
                  ...semesters.map((s) => ({ value: String(s.id), label: s.semester })),
                ]}
                value={semId}
                onValueChange={(v) => setSemId(v as string)}
              >
                <SelectTrigger id="ic-semester">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Select a semester</SelectItem>
                  {semesters.map((s) => (
                    <SelectItem key={s.id} value={String(s.id)}>
                      {s.semester}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FieldChrome>
          </Card>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-[280px_320px_minmax(0,1fr)]">
            <Card className="p-4">
              <IrregularStudentList
                students={students}
                selectedStudentProfileId={selectedStudent?.studentProfileId ?? null}
                onSelect={setSelectedStudent}
              />
            </Card>

            <Card className="p-4">
              <IrregularStudentPanel student={selectedStudent} />
            </Card>

            <Card className="p-4">
              <h3 className="font-display text-sm tracking-wide text-navy-700 dark:text-mist-100">
                Assign Regular Class Schedule
              </h3>
              {!selectedStudent ? (
                <p className="mt-4 font-body text-sm text-slate-400 dark:text-slate-500">
                  Select a student to view assignable schedules.
                </p>
              ) : (
                <AssignSchedulePanel pending={selectedPending} onAssign={handleAssign} />
              )}
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}
