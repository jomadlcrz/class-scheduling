import { useEffect, useMemo, useState } from "react";
import { RoleGuard } from "~/auth/role-guard";
import { EmptyState } from "~/components/feedback/empty-state";
import { ResultState } from "~/components/feedback/result-state";
import { SearchIcon } from "~/components/ui/icons";
import { inputClassName } from "~/components/ui/input";
import { Spinner } from "~/components/ui/spinner";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "~/components/ui/table";
import { PageHeader } from "~/layouts/page-header";
import { deanService, type DepartmentInstructor } from "~/services/dean.service";

export function meta() {
  return [
    { title: "Department Instructors — GWC Class Scheduling" },
    { name: "description", content: "View instructors in your department." },
  ];
}

export default function DeanInstructorsRoute() {
  return (
    <RoleGuard allow={["dean"]}>
      <DeanInstructorsPage />
    </RoleGuard>
  );
}

function DeanInstructorsPage() {
  const [instructors, setInstructors] = useState<DepartmentInstructor[] | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  useEffect(() => {
    deanService
      .listDepartmentInstructors()
      .then(setInstructors)
      .catch((err) => {
        setLoadError(err instanceof Error ? err.message : "Unable to load instructors.");
        setInstructors([]);
      });
  }, []);

  const visible = useMemo(() => {
    if (!instructors) return [];
    const query = search.trim().toLowerCase();
    if (!query) return instructors;
    return instructors.filter(
      (i) =>
        i.firstName.toLowerCase().includes(query) ||
        i.lastName.toLowerCase().includes(query) ||
        (i.email ?? "").toLowerCase().includes(query),
    );
  }, [instructors, search]);

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <PageHeader
        title="Department Instructors"
        description="Faculty members in your department."
      />

      <div className="mt-6 flex flex-col gap-4">
        <div className="relative w-full sm:w-64">
          <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-slate-400">
            <SearchIcon />
          </span>
          <input
            id="dean-instructor-search"
            type="search"
            placeholder="Name or email…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            aria-label="Search instructors"
            className={`${inputClassName} pl-9 pr-4`}
          />
        </div>

        {loadError ? (
          <ResultState tone="error" title="Unable to load">
            {loadError}
          </ResultState>
        ) : instructors === null ? (
          <div
            role="status"
            aria-label="Loading instructors"
            className="grid place-items-center py-12 text-navy-700 dark:text-slate-200"
          >
            <Spinner />
          </div>
        ) : visible.length === 0 ? (
          <EmptyState title="No instructors found">
            {instructors.length === 0
              ? "Your department has no instructors yet."
              : "No instructors match your search."}
          </EmptyState>
        ) : (
          <Table>
            <TableHead>
              <TableHeader>Name</TableHeader>
              <TableHeader className="hidden sm:table-cell">Email</TableHeader>
              <TableHeader className="hidden sm:table-cell">Mobile</TableHeader>
              <TableHeader className="hidden md:table-cell">Gender</TableHeader>
              <TableHeader className="hidden md:table-cell">Civil Status</TableHeader>
              <TableHeader className="hidden lg:table-cell">Roles</TableHeader>
            </TableHead>
            <TableBody>
              {visible.map((instructor) => (
                <TableRow key={`${instructor.firstName}-${instructor.lastName}`}>
                  <TableCell>
                    <span className="font-medium text-navy-700 dark:text-mist-100">
                      {instructor.lastName}, {instructor.firstName}
                    </span>
                  </TableCell>
                  <TableCell className="hidden sm:table-cell text-slate-500 dark:text-slate-400">
                    {instructor.email ?? "—"}
                  </TableCell>
                  <TableCell className="hidden sm:table-cell text-slate-500 dark:text-slate-400">
                    {instructor.mobile ?? "—"}
                  </TableCell>
                  <TableCell className="hidden md:table-cell text-slate-500 dark:text-slate-400">
                    {instructor.gender}
                  </TableCell>
                  <TableCell className="hidden md:table-cell text-slate-500 dark:text-slate-400">
                    {instructor.civilStatus}
                  </TableCell>
                  <TableCell className="hidden lg:table-cell">
                    <div className="flex flex-wrap gap-1">
                      {instructor.roles.map((role) => (
                        <span
                          key={role}
                          className="inline-block rounded-full bg-slate-100 px-2 py-0.5 font-body text-xs text-slate-600 dark:bg-white/10 dark:text-slate-300"
                        >
                          {role}
                        </span>
                      ))}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>
    </div>
  );
}
