import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router";
import { RoleGuard } from "~/auth/role-guard";
import { EmptyState } from "~/components/feedback/empty-state";
import { Button } from "~/components/ui/button";
import { PlusIcon, SearchIcon } from "~/components/ui/icons";
import { inputClassName } from "~/components/ui/input";
import { Spinner } from "~/components/ui/spinner";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "~/components/ui/table";
import { useTermContext } from "~/features/academic-terms/term-context-provider";
import { PageHeader } from "~/layouts/page-header";
import { regularClassService } from "~/services/regular-class.service";
import type { RegularStudentRow } from "~/types/student";

export function meta() {
  return [
    { title: "Regular Students — Enrollment — GWC Class Scheduling" },
    { name: "description", content: "Students enrolled as Regular for the selected term." },
  ];
}

export default function EnrollmentRegularStudentsRoute() {
  return (
    <RoleGuard allow={["registrar"]}>
      <EnrollmentRegularStudentsPage />
    </RoleGuard>
  );
}

function EnrollmentRegularStudentsPage() {
  const navigate = useNavigate();
  const { context: termContext } = useTermContext();
  const syId = termContext?.selection.syId ?? null;
  const semesterNumber = termContext?.selection.semesterNumber ?? null;

  const [students, setStudents] = useState<RegularStudentRow[] | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  useEffect(() => {
    if (syId == null || semesterNumber == null) return;
    let cancelled = false;
    setStudents(null);
    setLoadError(null);
    regularClassService
      .listStudents(syId, semesterNumber)
      .then((data) => {
        if (!cancelled) setStudents(data);
      })
      .catch((err) => {
        if (cancelled) return;
        setLoadError(err instanceof Error ? err.message : "Unable to load regular students.");
        setStudents([]);
      });
    return () => {
      cancelled = true;
    };
  }, [syId, semesterNumber]);

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query || !students) return students ?? [];
    return students.filter(
      (s) =>
        s.studentName.toLowerCase().includes(query) || (s.studentId ?? "").toLowerCase().includes(query),
    );
  }, [students, search]);

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <PageHeader
        title="Regular Students"
        description="Students enrolled as Regular for the selected term."
        actions={
          <Button type="button" block={false} onClick={() => navigate("/enrollment/new")}>
            <PlusIcon />
            Add New Student
          </Button>
        }
      />

      <div className="mt-6 flex flex-wrap items-end gap-3">
        <div className="relative ml-auto w-full sm:w-64">
          <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-slate-400">
            <SearchIcon />
          </span>
          <input
            type="search"
            placeholder="Search by name or ID…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            aria-label="Search regular students"
            className={`${inputClassName} pl-9 pr-4`}
          />
        </div>
      </div>

      <div className="mt-4">
        {students === null ? (
          <div className="flex justify-center py-12">
            <Spinner />
          </div>
        ) : loadError ? (
          <EmptyState title="Unable to load students">{loadError}</EmptyState>
        ) : filtered.length === 0 ? (
          <EmptyState title="No regular students found">
            {search ? "No students match your search." : "No regular student enrollments for this term yet."}
          </EmptyState>
        ) : (
          <Table>
            <TableHead>
              <TableHeader>Student ID</TableHeader>
              <TableHeader>Name</TableHeader>
              <TableHeader className="hidden sm:table-cell">Program</TableHeader>
              <TableHeader className="hidden md:table-cell">Set</TableHeader>
              <TableHeader className="hidden lg:table-cell">Contact</TableHeader>
            </TableHead>
            <TableBody>
              {filtered.map((s) => {
                const academic = s.academics[0];
                return (
                  <TableRow key={s.studentProfileId}>
                    <TableCell className="text-slate-600 dark:text-slate-300">{s.studentId ?? "—"}</TableCell>
                    <TableCell>
                      <span className="font-medium text-navy-700 dark:text-mist-100">{s.studentName}</span>
                    </TableCell>
                    <TableCell className="hidden sm:table-cell">{academic?.program ?? "—"}</TableCell>
                    <TableCell className="hidden md:table-cell">{academic?.set ?? "—"}</TableCell>
                    <TableCell className="hidden lg:table-cell">{s.mobile ?? s.email ?? "—"}</TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </div>
    </div>
  );
}
