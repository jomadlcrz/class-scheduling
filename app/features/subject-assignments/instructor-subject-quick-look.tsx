import { Fragment, useEffect, useMemo, useState } from "react";
import { EmptyState } from "~/components/feedback/empty-state";
import { Alert, AlertDescription } from "~/components/ui/alert";
import { AlertIcon, BookOpenIcon, SearchIcon, UsersIcon } from "~/components/ui/icons";
import { inputClassName } from "~/components/ui/input";
import { Modal } from "~/components/ui/modal";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import { Spinner } from "~/components/ui/spinner";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "~/components/ui/table";
import { LoadClassificationBadge } from "~/features/faculty/load-classification-badge";
import type { InstructorLoadClassification, TeachingTerm } from "~/types/faculty-load";

export type QuickLookSubject = {
  key: string;
  subjectCode: string;
  descriptiveTitle: string;
  programAbbrevs: string[];
  weeklyHours?: number;
};

export type QuickLookInstructor = {
  key: string;
  name: string;
  employeeId?: string | null;
  department?: string | null;
  avatarUrl?: string;
  loadClassification?: InstructorLoadClassification | null;
  normalLoadHours?: number;
  maxWeeklyHours?: number | null;
  subjects: QuickLookSubject[];
};

/** Turn the Registrar's college-wide teaching terms into an instructor-first view. */
export function quickLookInstructorsFromTeachingTerms(data: TeachingTerm[] | undefined): QuickLookInstructor[] {
  return (data ?? []).map((term) => {
    const subjects = new Map<string, QuickLookSubject>();
    for (const subject of term.subjectAssignments ?? []) {
      const existing = subjects.get(subject.subjectCode);
      if (existing) {
        if (subject.programAbbrev && !existing.programAbbrevs.includes(subject.programAbbrev)) {
          existing.programAbbrevs.push(subject.programAbbrev);
        }
        continue;
      }
      subjects.set(subject.subjectCode, {
        key: `${term.id}|${subject.subjectCode}`,
        subjectCode: subject.subjectCode,
        descriptiveTitle: subject.descriptiveTitle,
        programAbbrevs: subject.programAbbrev ? [subject.programAbbrev] : [],
        weeklyHours: subject.lecHours + subject.labHours,
      });
    }
    return {
      key: String(term.id),
      name: term.instructorName,
      employeeId: term.employeeId,
      department: term.departmentAbbrev || term.department,
      loadClassification: term.loadClassification,
      normalLoadHours: term.normalLoadHours,
      maxWeeklyHours: term.maxWeeklyHours,
      subjects: [...subjects.values()]
        .map((subject) => ({ ...subject, programAbbrevs: subject.programAbbrevs.sort() }))
        .sort((a, b) => a.subjectCode.localeCompare(b.subjectCode)),
    };
  }).sort((a, b) => a.name.localeCompare(b.name));
}

function assignedHours(instructor: QuickLookInstructor): number | null {
  const withHours = instructor.subjects.filter((subject) => subject.weeklyHours != null);
  if (withHours.length === 0) return null;
  return withHours.reduce((sum, subject) => sum + (subject.weeklyHours ?? 0), 0);
}

function departmentAbbreviation(value: string | null | undefined): string | null {
  const department = value?.trim();
  if (!department) return null;
  if (!department.includes(" ")) return department.toUpperCase();
  const initials = department
    .split(/\s+/)
    .filter((word) => !["of", "the", "and"].includes(word.toLocaleLowerCase()))
    .map((word) => word[0])
    .join("")
    .toUpperCase();
  return initials || department;
}

function InstructorQuickLookSpreadsheet({ instructors }: { instructors: QuickLookInstructor[] }) {
  let rowNumber = 0;

  return (
    <Table
      verticalBorders
      striped
      hoverable={false}
      className="max-h-[58vh]"
      tableClassName="min-w-[960px] table-fixed border-separate border-spacing-0"
    >
      <colgroup>
        <col className="w-11" />
        <col className="w-48" />
        <col className="w-28" />
        <col className="w-28" />
        <col className="w-64" />
        <col className="w-32" />
        <col className="w-20" />
        <col className="w-48" />
      </colgroup>
      <TableHead className="sticky top-0 z-10">
        <TableHeader scope="col" className="text-center" dense>
          #
        </TableHeader>
        <TableHeader scope="col" dense>
          Instructor
        </TableHeader>
        <TableHeader scope="col" dense>
          Department
        </TableHeader>
        <TableHeader scope="col" dense>
          Subject Code
        </TableHeader>
        <TableHeader scope="col" dense>
          Descriptive Title
        </TableHeader>
        <TableHeader scope="col" dense>
          Program(s)
        </TableHeader>
        <TableHeader scope="col" className="text-center" dense>
          Hrs/Wk
        </TableHeader>
        <TableHeader scope="col" verticalBorder={false} dense>
          Teaching Load
        </TableHeader>
      </TableHead>
      <TableBody>
        {instructors.map((instructor) => {
          const rows: Array<QuickLookSubject | null> =
            instructor.subjects.length > 0 ? instructor.subjects : [null];
          const hours = assignedHours(instructor);
          return (
            <Fragment key={instructor.key}>
              {rows.map((subject, index) => {
                rowNumber += 1;
                return (
                  <TableRow key={subject?.key ?? `${instructor.key}|empty`}>
                    <TableCell
                      className="text-center font-normal tabular-nums text-slate-400 dark:text-slate-500"
                      dense
                    >
                      {rowNumber}
                    </TableCell>
                    {index === 0 ? (
                      <>
                        <TableCell
                          rowSpan={rows.length}
                          style={{ verticalAlign: "middle" }}
                          className="bg-navy-50/40 font-semibold text-navy-800 dark:bg-white/[0.02] dark:text-mist-100"
                          dense
                        >
                          {instructor.name}
                        </TableCell>
                        <TableCell
                          rowSpan={rows.length}
                          style={{ verticalAlign: "middle" }}
                          className="bg-navy-50/40 font-medium dark:bg-white/[0.02]"
                          dense
                        >
                          {instructor.department || "—"}
                        </TableCell>
                      </>
                    ) : null}
                    <TableCell className="font-bold tabular-nums text-navy-700 dark:text-navy-200" dense>
                      {subject?.subjectCode || "—"}
                    </TableCell>
                    <TableCell dense>
                      {subject?.descriptiveTitle || "No subjects assigned for this term"}
                    </TableCell>
                    <TableCell dense>
                      {subject?.programAbbrevs.join(", ") || "—"}
                    </TableCell>
                    <TableCell className="text-center tabular-nums" dense>
                      {subject?.weeklyHours ?? "—"}
                    </TableCell>
                    {index === 0 ? (
                      <TableCell
                        rowSpan={rows.length}
                        verticalBorder={false}
                        style={{ verticalAlign: "middle" }}
                        className="bg-navy-50/40 dark:bg-white/[0.02]"
                        dense
                      >
                        <div className="flex items-center gap-1.5 whitespace-nowrap">
                          <span className="tabular-nums text-slate-500 dark:text-slate-400">
                            {hours ?? "—"}h / {instructor.maxWeeklyHours ?? "—"}h max
                          </span>
                          {instructor.loadClassification ? (
                            <LoadClassificationBadge classification={instructor.loadClassification} />
                          ) : null}
                        </div>
                      </TableCell>
                    ) : null}
                  </TableRow>
                );
              })}
            </Fragment>
          );
        })}
      </TableBody>
    </Table>
  );
}

export function InstructorSubjectQuickLook({
  open,
  onClose,
  instructors,
  loading = false,
  error = null,
  scopeLabel,
  termLabel,
}: {
  open: boolean;
  onClose: () => void;
  instructors: QuickLookInstructor[];
  loading?: boolean;
  error?: string | null;
  scopeLabel?: string;
  termLabel?: string;
}) {
  const [search, setSearch] = useState("");
  const [department, setDepartment] = useState("all");

  useEffect(() => {
    if (!open) {
      setSearch("");
      setDepartment("all");
    }
  }, [open]);

  const compactInstructors = useMemo(
    () =>
      instructors.map((instructor) => ({
        ...instructor,
        department: departmentAbbreviation(instructor.department),
      })),
    [instructors],
  );
  const departments = useMemo(
    () => [
      ...new Set(
        compactInstructors
          .map((instructor) => instructor.department)
          .filter((value): value is string => Boolean(value)),
      ),
    ].sort(),
    [compactInstructors],
  );
  const filtered = useMemo(() => {
    const query = search.trim().toLocaleLowerCase();
    return compactInstructors.flatMap((instructor) => {
      if (department !== "all" && instructor.department !== department) return [];
      if (!query) return [instructor];
      const instructorMatches = [
        instructor.name,
        instructor.employeeId ?? "",
        instructor.department ?? "",
      ].some((value) => value.toLocaleLowerCase().includes(query));
      const matchingSubjects = instructorMatches
        ? instructor.subjects
        : instructor.subjects.filter((subject) =>
            [
              subject.subjectCode,
              subject.descriptiveTitle,
              ...subject.programAbbrevs,
            ].some((value) => value.toLocaleLowerCase().includes(query)),
          );
      if (!instructorMatches && matchingSubjects.length === 0) return [];
      return [{ ...instructor, subjects: matchingSubjects }];
    });
  }, [compactInstructors, department, search]);

  const assignmentCount = filtered.reduce((sum, instructor) => sum + instructor.subjects.length, 0);

  return (
    <Modal open={open} onClose={onClose} title="Quick Look" full preventOverscroll>
      <div className="space-y-4">
        <div className="flex flex-col gap-2 rounded-lg border border-navy-100 bg-navy-50/60 px-3 py-2.5 dark:border-white/10 dark:bg-white/[0.035] sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <p className="font-body text-xs font-semibold leading-tight text-navy-800 dark:text-mist-100">
              Instructor subject assignments
            </p>
            <p className="mt-0.5 truncate font-body text-[11px] leading-tight text-slate-500 dark:text-slate-400">
              {[scopeLabel, termLabel].filter(Boolean).join(" · ") || "A read-only summary for the selected term"}
            </p>
          </div>
          <div className="flex shrink-0 flex-wrap items-center gap-1.5">
            <span className="inline-flex items-center gap-1.5 rounded-md border border-white bg-white/80 px-2 py-1 font-body text-[11px] text-slate-500 dark:border-white/10 dark:bg-white/5 dark:text-slate-300">
              <UsersIcon />
              <strong className="tabular-nums text-navy-800 dark:text-mist-100">{filtered.length}</strong>
              instructors
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-md border border-white bg-white/80 px-2 py-1 font-body text-[11px] text-slate-500 dark:border-white/10 dark:bg-white/5 dark:text-slate-300">
              <BookOpenIcon size={16} />
              <strong className="tabular-nums text-navy-800 dark:text-mist-100">{assignmentCount}</strong>
              assignments
            </span>
          </div>
        </div>

        <div className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_12rem]">
          <label className="relative block">
            <span className="pointer-events-none absolute inset-y-0 left-3 grid place-items-center text-slate-400">
              <SearchIcon />
            </span>
            <span className="sr-only">Search Quick Look</span>
            <input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search instructor or subject…"
              className={`${inputClassName} pl-9`}
            />
          </label>
          {departments.length > 1 ? (
            <div>
              <label htmlFor="quick-look-department" className="sr-only">
                Filter by department
              </label>
              <Select
                items={[
                  { value: "all", label: "All departments" },
                  ...departments.map((value) => ({ value, label: value })),
                ]}
                value={department}
                onValueChange={(value) => setDepartment(value as string)}
              >
                <SelectTrigger id="quick-look-department">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All departments</SelectItem>
                  {departments.map((value) => (
                    <SelectItem key={value} value={value}>
                      {value}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          ) : null}
        </div>

        {error ? (
          <Alert variant="destructive">
            <AlertIcon />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        ) : loading ? (
          <div className="grid place-items-center py-16" role="status" aria-label="Loading instructor assignments">
            <Spinner />
          </div>
        ) : filtered.length === 0 ? (
          <EmptyState title={instructors.length === 0 ? "No assigned instructors" : "No matches found"}>
            {instructors.length === 0
              ? "There are no instructor subject assignments for the selected term."
              : "Try a different instructor, subject, program, or department."}
          </EmptyState>
        ) : (
          <div aria-live="polite">
            <InstructorQuickLookSpreadsheet instructors={filtered} />
          </div>
        )}
      </div>
    </Modal>
  );
}
