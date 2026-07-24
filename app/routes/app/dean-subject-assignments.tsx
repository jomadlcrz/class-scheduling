import { useState } from "react";
import { RoleGuard } from "~/auth/role-guard";
import { EmptyState } from "~/components/feedback/empty-state";
import { ResultState } from "~/components/feedback/result-state";
import { Button } from "~/components/ui/button";
import { Spinner } from "~/components/ui/spinner";
import { PlusIcon } from "~/components/ui/icons";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "~/components/ui/select";
import { DeanSubjectAssignmentForm } from "~/features/dean-assignments/dean-subject-assignment-form";
import { DeanSubjectAssignmentList } from "~/features/dean-assignments/dean-subject-assignment-list";
import { useDeanSubjectAssignments } from "~/features/dean-assignments/use-dean-subject-assignments";

export function meta() {
  return [
    { title: "Subject Assignments — GWC Class Scheduling" },
    { name: "description", content: "Assign subjects to instructors for a school year and semester." },
  ];
}

export default function DeanSubjectAssignmentsRoute() {
  return (
    <RoleGuard allow={["dean"]}>
      <DeanSubjectAssignmentsPage />
    </RoleGuard>
  );
}

function DeanSubjectAssignmentsPage() {
  const {
    termsLoading,
    semestersLoading,
    loadError,
    mutating,
    schoolYearLabel,
    schoolYears,
    selectedSchoolYearId,
    setSelectedSchoolYearId,
    semesterName,
    semesters,
    semesterLabel,
    selectedSemesterId,
    setSelectedSemesterId,
    instructors,
    subjects,
    entries,
    createAssignments,
  } = useDeanSubjectAssignments();

  const [formOpen, setFormOpen] = useState(false);
  const contextReady = Boolean(selectedSchoolYearId && selectedSemesterId);
  const dataLoading = instructors === null || subjects === null;

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-2xl tracking-wide text-navy-800 dark:text-mist-50">
            Subject Assignments
          </h1>
          <p className="mt-0.5 font-body text-sm text-slate-500 dark:text-slate-400">
            Assign subjects to instructors for a school year and semester.
          </p>
        </div>
        {contextReady && !dataLoading && (
          <Button
            type="button"
            block={false}
            onClick={() => setFormOpen(true)}
          >
            <PlusIcon /> Assign Subjects
          </Button>
        )}
      </div>

      {/* Term selectors */}
      <div className="mt-6 flex flex-wrap items-end gap-3">
        <div className="flex flex-col gap-1.5">
          <label htmlFor="sy-select" className="font-body text-xs font-medium text-slate-500 dark:text-slate-400">
            School Year
          </label>
          <Select
            items={schoolYears.map((y) => ({ value: String(y.id), label: y.schoolYear }))}
            value={selectedSchoolYearId}
            onValueChange={(v) => setSelectedSchoolYearId(v as string)}
          >
            <SelectTrigger id="sy-select" className="w-44">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {schoolYears.map((y) => (
                <SelectItem key={y.id} value={String(y.id)}>
                  {y.schoolYear}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex flex-col gap-1.5">
          <label htmlFor="sem-select" className="font-body text-xs font-medium text-slate-500 dark:text-slate-400">
            Semester
          </label>
          <Select
            items={semesters
              .filter((s) => s.semesterNumber !== 3)
              .map((s) => ({ value: String(s.id), label: semesterLabel(s.semesterNumber) }))}
            value={selectedSemesterId}
            onValueChange={(v) => setSelectedSemesterId(v as string)}
          >
            <SelectTrigger id="sem-select" className="w-44">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {semesters
                .filter((s) => s.semesterNumber !== 3)
                .map((s) => (
                  <SelectItem key={s.id} value={String(s.id)}>
                    {semesterLabel(s.semesterNumber)}
                  </SelectItem>
                ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Content */}
      <div className="mt-6 flex flex-col gap-4">
        {loadError ? (
          <ResultState tone="error" title="Unable to load">
            {loadError}
          </ResultState>
        ) : termsLoading || semestersLoading || dataLoading ? (
          <div
            role="status"
            aria-label="Loading subject assignments"
            className="grid place-items-center py-12 text-navy-700 dark:text-slate-200"
          >
            <Spinner />
          </div>
        ) : !contextReady ? (
          <EmptyState title="Select a term">
            Choose a school year and semester to view subject assignments.
          </EmptyState>
        ) : entries === null || entries.length === 0 ? (
          <EmptyState title="No assignments yet">
            No subjects have been assigned for {schoolYearLabel} — {semesterName}.
          </EmptyState>
        ) : (
          <DeanSubjectAssignmentList entries={entries} />
        )}
      </div>

      {/* Assignment form */}
      {instructors && subjects && (
        <DeanSubjectAssignmentForm
          open={formOpen}
          onClose={() => setFormOpen(false)}
          instructors={instructors}
          programs={subjects}
          onSubmit={createAssignments}
          mutating={mutating}
        />
      )}
    </div>
  );
}
