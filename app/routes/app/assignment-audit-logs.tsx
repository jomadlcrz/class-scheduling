import { useMemo, useState } from "react";
import { RoleGuard } from "~/auth/role-guard";
import { EmptyState } from "~/components/feedback/empty-state";
import { Badge } from "~/components/ui/badge";
import { inputClassName } from "~/components/ui/input";
import { Skeleton } from "~/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "~/components/ui/table";
import { useCachedData } from "~/hooks/use-cached-data";
import { PageHeader } from "~/layouts/page-header";
import { authorityWorkflowService } from "~/services/authority-workflow.service";

export function meta() {
  return [{ title: "Assignment Audit Logs — GWC Class Scheduling" }];
}

function AssignmentAuditLogsPage() {
  const [search, setSearch] = useState("");
  const { data, error } = useCachedData("assignment-audit-logs", () =>
    authorityWorkflowService.listAssignmentAuditLogs(),
  );
  const rows = useMemo(() => {
    const needle = search.trim().toLowerCase();
    if (!needle) return data ?? [];
    return (data ?? []).filter((row) =>
      [row.actionLabel, row.instructorName, row.subjectCode, row.performerName, row.departmentName, row.details]
        .some((value) => value?.toLowerCase().includes(needle)),
    );
  }, [data, search]);

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-8">
      <PageHeader title="Assignment Audit Logs" />
      <div className="mt-4 max-w-md">
        <input
          type="search"
          aria-label="Search assignment audit logs"
          placeholder="Search action, instructor, subject, or performer"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          className={inputClassName}
        />
      </div>
      <div className="mt-4">
        {error && data === null ? (
          <EmptyState title="Couldn't load assignment audit logs">{error}</EmptyState>
        ) : data === null ? (
          <Skeleton className="h-72 rounded-xl" />
        ) : rows.length === 0 ? (
          <EmptyState title={search.trim() ? "No audit logs found" : "No audit logs yet"}>
            {search.trim() ? "No assignment activity matches your search." : "No assignment activity has been recorded yet."}
          </EmptyState>
        ) : (
          <Table>
            <TableHead>
              <TableHeader>Activity</TableHeader>
              <TableHeader>Instructor</TableHeader>
              <TableHeader className="hidden sm:table-cell">Subject</TableHeader>
              <TableHeader className="hidden lg:table-cell">Term</TableHeader>
              <TableHeader className="hidden md:table-cell">Performed by</TableHeader>
              <TableHeader>Date</TableHeader>
            </TableHead>
            <TableBody>
              {rows.map((row) => (
                <TableRow key={row.id}>
                  <TableCell>
                    <Badge tone="slate">{row.actionLabel}</Badge>
                    {row.details && <p className="mt-1 max-w-lg text-xs text-slate-500 dark:text-slate-400">{row.details}</p>}
                  </TableCell>
                  <TableCell>{row.instructorName ?? "—"}</TableCell>
                  <TableCell className="hidden sm:table-cell">{row.subjectCode ?? "—"}</TableCell>
                  <TableCell className="hidden lg:table-cell">
                    {row.schoolYear ?? "—"}{row.semesterNumber ? ` · Semester ${row.semesterNumber}` : ""}
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
                    {row.performerName ?? "—"}
                    {row.role && <span className="block text-xs text-slate-400">{row.role}</span>}
                  </TableCell>
                  <TableCell className="whitespace-nowrap text-xs">
                    {row.createdAt ? new Intl.DateTimeFormat("en-PH", { dateStyle: "medium", timeStyle: "short" }).format(new Date(row.createdAt)) : "—"}
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

export default function AssignmentAuditLogsRoute() {
  return <RoleGuard allow={["dean", "registrar"]}><AssignmentAuditLogsPage /></RoleGuard>;
}
