import { useState } from "react";
import { RoleGuard } from "~/auth/role-guard";
import { EmptyState } from "~/components/feedback/empty-state";
import { Pagination } from "~/components/ui/pagination";
import { TableSkeleton } from "~/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "~/components/ui/table";
import { useCachedData } from "~/hooks/use-cached-data";
import { PageHeader } from "~/layouts/page-header";
import { subjectService } from "~/services/subject.service";

export function meta() { return [{ title: "Subjects — GWC Class Scheduling" }]; }

export default function SubjectsRoute() {
  return <RoleGuard allow={["registrar"]}><SubjectsPage /></RoleGuard>;
}

function SubjectsPage() {
  const [page, setPage] = useState(1);
  const pageSize = 20;
  const { data, error } = useCachedData(`subject-page:${page}`, () => subjectService.listPaginated(page, pageSize), { keepPreviousData: true });
  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <PageHeader title="Subjects" />
      <div className="mt-6 flex flex-col gap-4">
        {error && data === null ? <EmptyState title="Unable to load subjects">{error}</EmptyState> : data === null ? <TableSkeleton columns={5} rows={8} /> : data.items.length === 0 ? <EmptyState title="No subjects found" /> : <>
          <Table>
            <TableHead><TableHeader>Code</TableHeader><TableHeader>Title</TableHeader><TableHeader>Program</TableHeader><TableHeader>Type</TableHeader><TableHeader>Prerequisites</TableHeader></TableHead>
            <TableBody>{data.items.map((row) => <TableRow key={row.curriculumId}>
              <TableCell>{row.subject?.code ?? "—"}</TableCell><TableCell>{row.subject?.title ?? "—"}</TableCell><TableCell>{row.program?.name ?? "—"}</TableCell><TableCell>{row.subject?.subjectType ?? "—"}</TableCell><TableCell>{[...(row.subject?.prerequisites.map((p) => p.code).filter(Boolean) ?? []), ...(row.subject?.textPrerequisites ?? [])].join(", ") || "—"}</TableCell>
            </TableRow>)}</TableBody>
          </Table>
          <Pagination page={data.page} totalItems={data.totalSubjects} pageSize={data.perPage} onPageChange={setPage} />
        </>}
      </div>
    </div>
  );
}
