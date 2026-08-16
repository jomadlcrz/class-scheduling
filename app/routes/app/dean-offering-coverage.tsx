import { RoleGuard } from "~/auth/role-guard";
import { EmptyState } from "~/components/feedback/empty-state";
import { Badge } from "~/components/ui/badge";
import { Skeleton } from "~/components/ui/skeleton";
import { StatCard } from "~/components/ui/stat-card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "~/components/ui/table";
import { TermSelectors, useTermData } from "~/features/dashboard/dashboard-shared";
import { PageHeader } from "~/layouts/page-header";
import { deanService } from "~/services/dean.service";
import type {
  OfferingCoverage,
  OfferingCoverageDepartment,
  OfferingCoverageProgram,
} from "~/types/offering-coverage";

export function meta() {
  return [
    { title: "Subject Offering — GWC Class Scheduling" },
    {
      name: "description",
      content:
        "Coverage of offerable subjects for the term, flagging which still need an instructor.",
    },
  ];
}

export default function DeanOfferingCoverageRoute() {
  return (
    <RoleGuard allow={["dean"]}>
      <DeanOfferingCoveragePage />
    </RoleGuard>
  );
}

/** One program's subject list — the smallest coverage grouping. Worst-first
 *  ordering comes from the backend, so no client-side sort. */
function ProgramCoverage({ program }: { program: OfferingCoverageProgram }) {
  const covered = program.unassigned_count === 0;
  return (
    <section className="rounded-xl border border-slate-200 bg-white p-4 dark:border-white/10 dark:bg-navy-900">
      <header className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <div className="min-w-0">
          <h3 className="font-display text-lg tracking-wide text-navy-700 dark:text-mist-100">
            {program.program_abbrev}
          </h3>
          <p className="font-body text-xs text-slate-500 dark:text-slate-400">
            {program.program_name}
          </p>
        </div>
        <Badge tone={covered ? "emerald" : "gold"}>
          {covered
            ? "All covered"
            : `${program.unassigned_count} of ${program.total_count} without instructor`}
        </Badge>
      </header>
      <Table>
        <TableHead>
          <TableHeader>Subject</TableHeader>
          <TableHeader>Year</TableHeader>
          <TableHeader>Type</TableHeader>
          <TableHeader>Instructor(s)</TableHeader>
          <TableHeader className="text-right">Status</TableHeader>
        </TableHead>
        <TableBody>
          {program.subjects.map((subject) => (
            <TableRow key={subject.curriculum_detail_id}>
              <TableCell>
                <span className="font-semibold text-navy-700 dark:text-mist-100">
                  {subject.subject_code}
                </span>
                <span className="block text-xs text-slate-500 dark:text-slate-400">
                  {subject.descriptive_title}
                </span>
              </TableCell>
              <TableCell>Year {subject.year_level}</TableCell>
              <TableCell>{subject.subject_type ?? "—"}</TableCell>
              <TableCell>
                {subject.instructors.length > 0 ? subject.instructors.join(", ") : "—"}
              </TableCell>
              <TableCell className="text-right">
                <Badge tone={subject.assigned ? "emerald" : "gold"}>
                  {subject.assigned ? "Assigned" : "Unassigned"}
                </Badge>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </section>
  );
}

/** A department groups its programs. A dean sees one department; the same view
 *  scales to the registrar's college-wide read (many departments). */
function DepartmentCoverage({ department }: { department: OfferingCoverageDepartment }) {
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-baseline justify-between gap-2 border-b border-slate-200 pb-2 dark:border-white/10">
        <h2 className="font-display text-xl tracking-wide text-navy-800 dark:text-mist-100">
          {department.department_abbrev}
          <span className="ml-2 font-body text-sm font-normal text-slate-500 dark:text-slate-400">
            {department.department_name}
          </span>
        </h2>
        <span className="font-body text-sm text-slate-500 dark:text-slate-400">
          {department.unassigned_count} of {department.total_count} subjects need an instructor
        </span>
      </div>
      {department.programs.map((program) => (
        <ProgramCoverage key={program.program_id} program={program} />
      ))}
    </div>
  );
}

function DeanOfferingCoveragePage() {
  const {
    data,
    syId,
    semesterNumber,
    setSyId,
    setSemesterNumber,
    loading,
    error,
    years,
    sems,
  } = useTermData<OfferingCoverage>("offering-coverage", (sy, sem) =>
    deanService.getOfferingCoverage(sy, sem),
  );

  const departments = data?.departments ?? [];
  const totalUnassigned = data?.total_unassigned ?? 0;
  const totalSubjects = departments.reduce((sum, dept) => sum + dept.total_count, 0);

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-8">
      <PageHeader
        title="Subject Offering"
        actions={
          <TermSelectors
            years={years}
            sems={sems}
            syId={syId}
            semesterNumber={semesterNumber}
            onSyId={setSyId}
            onSemesterNumber={setSemesterNumber}
          />
        }
      />

      <div className="mt-6">
        {error ? (
          <EmptyState title="Couldn't load subject offering">{error}</EmptyState>
        ) : loading ? (
          <div className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-2">
              <Skeleton className="h-20 rounded-xl" />
              <Skeleton className="h-20 rounded-xl" />
            </div>
            <Skeleton className="h-64 rounded-xl" />
          </div>
        ) : departments.length === 0 ? (
          <EmptyState title="No offerable subjects">
            There are no minor or general-education subjects to cover for this term.
          </EmptyState>
        ) : (
          <div className="space-y-8">
            <div className="grid gap-3 sm:grid-cols-2">
              <StatCard
                label="Without instructor"
                value={totalUnassigned}
                hint="Offerable subjects still needing an assignment"
                valueClassName={
                  totalUnassigned > 0
                    ? "text-amber-600 dark:text-gold-300"
                    : "text-navy-700 dark:text-mist-100"
                }
              />
              <StatCard
                label="Offerable subjects"
                value={totalSubjects}
                hint="Minor and general-education subjects this term"
              />
            </div>
            {departments.map((department) => (
              <DepartmentCoverage key={department.department_id} department={department} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
