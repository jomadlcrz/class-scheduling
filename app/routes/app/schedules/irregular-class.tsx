import { useEffect, useState } from "react";
import { RoleGuard } from "~/auth/role-guard";
import { EmptyState } from "~/components/feedback/empty-state";
import { Card } from "~/components/ui/card";
import { ClockIcon } from "~/components/ui/icons";
import { Spinner } from "~/components/ui/spinner";
import { IrregularStudentList } from "~/features/schedules/irregular-student-list";
import { IrregularStudentPanel } from "~/features/schedules/irregular-student-panel";
import { PageHeader } from "~/layouts/page-header";
import { irregularClassService, type IrregularStudent } from "~/services/irregular-class.service";

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

  useEffect(() => {
    irregularClassService
      .listStudents()
      .then(setStudents)
      .catch((err) =>
        setError(err instanceof Error ? err.message : "Something went wrong. Please try again."),
      );
  }, []);

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
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-[280px_320px_1fr]">
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
                View Regular Class Schedules
              </h3>
              <div className="mt-4 flex flex-col items-center gap-2 py-8 text-center">
                <ClockIcon />
                <EmptyState title="Coming soon">
                  Picking a regular class schedule and assigning it to an irregular student isn't
                  available yet — it needs a backend endpoint that doesn't exist here yet.
                </EmptyState>
              </div>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}
