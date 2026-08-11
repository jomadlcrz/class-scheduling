import { Link } from "react-router";
import { useState } from "react";
import { Badge, type BadgeTone } from "~/components/ui/badge";
import { Card } from "~/components/ui/card";
import { EmptyState } from "~/components/feedback/empty-state";
import { ChevronRightIcon, LayersIcon, MailIcon, UserIcon } from "~/components/ui/icons";
import { ImageViewer } from "~/components/ui/image-viewer";
import { Pagination } from "~/components/ui/pagination";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "~/components/ui/table";
import { usePagination } from "~/hooks/use-pagination";
import type { AcademicDepartmentDetail } from "~/types/department";

const ENROLLED_STATUS_TONES: Record<string, BadgeTone> = {
  Enrolled: "emerald",
  Dropped: "gold",
  Withdrawn: "slate",
  Voided: "red",
};

const contactRowClassName = "flex items-center gap-2 font-body text-sm text-slate-600 dark:text-slate-300";

/** Academic-department hub — dean, program cards with set counts, and the student table. */
export function AcademicDepartmentView({ detail }: { detail: AcademicDepartmentDetail }) {
  const pagination = usePagination(detail.students, "students");
  const [viewerSrc, setViewerSrc] = useState<string | null>(null);

  return (
    <div className="flex flex-col gap-6">
      <section aria-labelledby="dean-heading">
        <h2 id="dean-heading" className="font-display text-xl tracking-wide text-navy-700 dark:text-mist-100">
          Leadership
        </h2>
        <Card className="mt-2 flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
          {detail.dean ? (
            <>
              <div className="flex items-center gap-3">
                {detail.dean.profilePhotoUrl ? (
                  <img
                    src={detail.dean.profilePhotoUrl}
                    alt={detail.dean.fullName}
                    className="size-11 shrink-0 cursor-pointer rounded-full object-cover"
                    onClick={() => setViewerSrc(detail.dean!.profilePhotoUrl)}
                  />
                ) : (
                  <span className="grid size-11 shrink-0 place-items-center rounded-full bg-navy-800 text-mist-100 dark:bg-white dark:text-navy-800">
                    <UserIcon />
                  </span>
                )}
                <div className="min-w-0">
                  <p className="font-body text-sm font-semibold text-navy-800 dark:text-mist-100">
                    {detail.dean.fullName}
                  </p>
                  <p className="font-body text-xs text-slate-500 dark:text-slate-400">Dean</p>
                </div>
              </div>
              <div className="flex flex-col gap-1.5">
                {detail.dean.email && (
                  <span className={contactRowClassName}>
                    <MailIcon />
                    {detail.dean.email}
                  </span>
                )}
              </div>
            </>
          ) : (
            <p className="font-body text-sm text-slate-500 dark:text-slate-400">
              No dean is assigned to this department yet.
            </p>
          )}
        </Card>
      </section>

      <section aria-labelledby="programs-heading">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 id="programs-heading" className="font-display text-xl tracking-wide text-navy-700 dark:text-mist-100">
            Programs
          </h2>
          <div className="flex items-center gap-3">
            <span className="font-body text-xs text-slate-500 dark:text-slate-400">
              {detail.totalPrograms} program{detail.totalPrograms === 1 ? "" : "s"}
            </span>
            <Link
              to="/program-curricula"
              className="inline-flex items-center gap-1 rounded-lg border border-slate-300 px-3 py-1.5 font-body text-sm font-medium text-navy-700 transition-colors duration-150 hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-400 dark:border-white/15 dark:text-slate-200 dark:hover:bg-white/10"
            >
              View Curriculum
              <ChevronRightIcon />
            </Link>
          </div>
        </div>
        {detail.programs.length === 0 ? (
          <Card className="mt-2">
            <EmptyState title="No programs yet">
              No academic programs are attached to this department.
            </EmptyState>
          </Card>
        ) : (
          <div className="mt-2 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {detail.programs.map((program) => (
              <Card key={program.id} className="flex flex-col gap-2 p-4">
                <Badge tone="slate">{program.programType}</Badge>
                <div>
                  <p className="font-display text-lg tracking-wide text-navy-800 dark:text-mist-100">
                    {program.abbrev}
                  </p>
                  <p className="mt-0.5 line-clamp-2 font-body text-sm text-slate-600 dark:text-slate-300">
                    {program.name}
                  </p>
                </div>
                <span className="mt-auto inline-flex items-center gap-1.5 font-body text-xs text-slate-500 dark:text-slate-400">
                  <LayersIcon />
                  {program.totalSets} set{program.totalSets === 1 ? "" : "s"}
                </span>
              </Card>
            ))}
          </div>
        )}
      </section>

      <section aria-labelledby="students-heading">
        <div className="flex items-baseline justify-between gap-3">
          <h2 id="students-heading" className="font-display text-xl tracking-wide text-navy-700 dark:text-mist-100">
            Students
          </h2>
          <span className="font-body text-xs text-slate-500 dark:text-slate-400">
            {detail.totalStudents} enrolled
          </span>
        </div>
        {detail.students.length === 0 ? (
          <Card className="mt-2">
            <EmptyState title="No enrolled students">
              No students are currently enrolled in this department's programs.
            </EmptyState>
          </Card>
        ) : (
          <div className="mt-2">
            <Table>
              <TableHead>
                <TableHeader>Name</TableHeader>
                <TableHeader className="hidden sm:table-cell">Student ID</TableHeader>
                <TableHeader>Program</TableHeader>
                <TableHeader className="hidden md:table-cell">Year / Set</TableHeader>
                <TableHeader>Status</TableHeader>
              </TableHead>
              <TableBody>
                {pagination.pageItems.map((student) => (
                  <TableRow key={student.studentProfileId}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {student.profilePhotoUrl ? (
                          <img
                            src={student.profilePhotoUrl}
                            alt={student.fullName}
                            className="size-6 shrink-0 cursor-pointer rounded-full object-cover"
                            onClick={() => setViewerSrc(student.profilePhotoUrl!)}
                          />
                        ) : (
                          <span className="grid size-6 shrink-0 place-items-center rounded-full bg-slate-100 text-slate-400 dark:bg-white/10 dark:text-slate-500">
                            <UserIcon />
                          </span>
                        )}
                        <span className="font-medium text-navy-700 dark:text-mist-100">
                          {student.fullName}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="hidden font-body text-xs text-slate-500 dark:text-slate-400 sm:table-cell">
                      {student.studentId}
                    </TableCell>
                    <TableCell className="text-slate-600 dark:text-slate-300">
                      {student.programAbbrev}
                    </TableCell>
                    <TableCell className="hidden text-slate-600 dark:text-slate-300 md:table-cell">
                      Year {student.yearLevel}
                      {student.set ? ` · ${student.set}` : ""}
                    </TableCell>
                    <TableCell>
                      <Badge tone={ENROLLED_STATUS_TONES[student.enrolledStatus] ?? "slate"}>
                        {student.enrolledStatus}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            {pagination.totalPages > 1 && (
              <div className="mt-4">
                <Pagination
                  page={pagination.page}
                  totalItems={pagination.totalItems}
                  pageSize={pagination.pageSize}
                  onPageChange={pagination.setPage}
                />
              </div>
            )}
          </div>
        )}
      </section>
      {viewerSrc && (
        <ImageViewer
          open={viewerSrc !== null}
          onClose={() => setViewerSrc(null)}
          src={viewerSrc}
          alt="Profile photo"
        />
      )}
    </div>
  );
}
