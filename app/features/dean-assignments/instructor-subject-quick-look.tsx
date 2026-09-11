import { Fragment, useEffect, useMemo, useState } from "react";
import { EmptyState } from "~/components/feedback/empty-state";
import { Alert, AlertDescription } from "~/components/ui/alert";
import { AlertIcon, BookOpenIcon, SearchIcon, UsersIcon } from "~/components/ui/icons";
import { inputClassName } from "~/components/ui/input";
import { Modal } from "~/components/ui/modal";
import { Spinner } from "~/components/ui/spinner";
import { LoadClassificationBadge } from "~/features/faculty/load-classification-badge";
import type { LoadClassification, TeachingTerm } from "~/types/faculty-load";

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
  loadClassification?: LoadClassification;
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
      loadClassification: term.loadClassification ?? undefined,
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
  const headerClass = "sticky top-0 z-10 border border-slate-300 bg-slate-100 px-2.5 py-2 text-left font-body text-[10px] font-bold uppercase tracking-[0.08em] text-slate-600 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200";
  const cellClass = "border border-slate-300 px-2.5 py-2 align-middle font-body text-xs text-slate-700 dark:border-slate-600 dark:text-slate-200";

  return (
    <div className="max-h-[58vh] overflow-auto rounded-lg border border-slate-300 bg-white shadow-inner dark:border-slate-600 dark:bg-surface-raised">
      <table className="w-full min-w-[960px] table-fixed border-collapse" aria-label="Instructor subject assignments spreadsheet">
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
        <thead>
          <tr>
            <th scope="col" className={`${headerClass} left-0 z-20 text-center`}>#</th>
            <th scope="col" className={headerClass}>Instructor</th>
            <th scope="col" className={headerClass}>Department</th>
            <th scope="col" className={headerClass}>Subject Code</th>
            <th scope="col" className={headerClass}>Descriptive Title</th>
            <th scope="col" className={headerClass}>Program(s)</th>
            <th scope="col" className={`${headerClass} text-center`}>Hrs/Wk</th>
            <th scope="col" className={headerClass}>Teaching Load</th>
          </tr>
        </thead>
        <tbody>
          {instructors.map((instructor) => {
            const rows: Array<QuickLookSubject | null> = instructor.subjects.length > 0
              ? instructor.subjects
              : [null];
            const hours = assignedHours(instructor);
            return (
              <Fragment key={instructor.key}>
                {rows.map((subject, index) => {
                  rowNumber += 1;
                  return (
                    <tr key={subject?.key ?? `${instructor.key}|empty`} className="odd:bg-white even:bg-slate-50/70 hover:bg-gold-50/70 dark:odd:bg-transparent dark:even:bg-white/[0.025] dark:hover:bg-gold-400/[0.07]">
                      <th scope="row" className={`${cellClass} sticky left-0 z-[1] bg-slate-100 text-center font-normal tabular-nums text-slate-400 dark:bg-slate-800 dark:text-slate-400`}>
                        {rowNumber}
                      </th>
                      {index === 0 ? (
                        <>
                          <td rowSpan={rows.length} style={{ verticalAlign: "middle" }} className={`${cellClass} bg-navy-50/45 font-semibold text-navy-800 dark:bg-navy-300/[0.04] dark:text-mist-100`}>
                            {instructor.name}
                          </td>
                          <td rowSpan={rows.length} style={{ verticalAlign: "middle" }} className={`${cellClass} bg-navy-50/45 font-medium dark:bg-navy-300/[0.04]`}>
                            {instructor.department || "—"}
                          </td>
                        </>
                      ) : null}
                      <td className={`${cellClass} font-bold tabular-nums text-navy-700 dark:text-navy-200`}>
                            {subject?.subjectCode || "—"}
                      </td>
                      <td className={cellClass}>{subject?.descriptiveTitle || "No subjects assigned for this term"}</td>
                      <td className={cellClass}>{subject?.programAbbrevs.join(", ") || "—"}</td>
                      <td className={`${cellClass} text-center tabular-nums`}>{subject?.weeklyHours ?? "—"}</td>
                      {index === 0 ? (
                        <td rowSpan={rows.length} style={{ verticalAlign: "middle" }} className={`${cellClass} bg-navy-50/45 dark:bg-navy-300/[0.04]`}>
                          <div className="flex items-center gap-1.5 whitespace-nowrap">
                            <span className="tabular-nums text-slate-500 dark:text-slate-400">
                              {hours ?? "—"}h / {instructor.maxWeeklyHours ?? "—"}h max
                            </span>
                            {instructor.loadClassification ? (
                              <LoadClassificationBadge classification={instructor.loadClassification} />
                            ) : null}
                          </div>
                        </td>
                      ) : null}
                    </tr>
                  );
                })}
              </Fragment>
            );
          })}
        </tbody>
      </table>
    </div>
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
    () => instructors.map((instructor) => ({
      ...instructor,
      department: departmentAbbreviation(instructor.department),
    })),
    [instructors],
  );
  const departments = useMemo(
    () => [...new Set(compactInstructors.map((instructor) => instructor.department).filter((value): value is string => Boolean(value)))].sort(),
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
        : instructor.subjects.filter((subject) => [
          subject.subjectCode,
          subject.descriptiveTitle,
          ...subject.programAbbrevs,
        ].some((value) => value.toLocaleLowerCase().includes(query)));
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
            <label>
              <span className="sr-only">Filter by department</span>
              <select value={department} onChange={(event) => setDepartment(event.target.value)} className={inputClassName}>
                <option value="all">All departments</option>
                {departments.map((value) => <option key={value} value={value}>{value}</option>)}
              </select>
            </label>
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
