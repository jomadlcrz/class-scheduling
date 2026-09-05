import { useState } from "react";
import { useNavigate } from "react-router";
import { RoleGuard } from "~/auth/role-guard";
import { EmptyState } from "~/components/feedback/empty-state";
import { Badge, type BadgeTone } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { Pagination } from "~/components/ui/pagination";
import { Spinner } from "~/components/ui/spinner";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "~/components/ui/table";
import { useTermContext } from "~/features/academic-terms/term-context-provider";
import { useCachedData } from "~/hooks/use-cached-data";
import { PageHeader } from "~/layouts/page-header";
import { enrollmentService } from "~/services/enrollment.service";

const STATE_TONES: Record<string, BadgeTone> = {
  Enrolled: "emerald",
  Dropped: "red",
  Withdrawn: "gold",
  Voided: "slate",
};

export function meta() {
  return [{ title: "Already Enrolled Students — GWC Class Scheduling" }];
}

export default function ReenrollAlreadyEnrolledRoute() {
  return (
    <RoleGuard allow={["registrar"]}>
      <AlreadyEnrolledPage />
    </RoleGuard>
  );
}

function AlreadyEnrolledPage() {
  const navigate = useNavigate();
  const [page, setPage] = useState(1);
  const { context: termContext } = useTermContext();
  const targetSyId = termContext?.selection.syId ?? null;
  const targetSemesterNumber = termContext?.selection.semesterNumber ?? null;
  const pageSize = 10;
  const { data: directory } = useCachedData(
    `reenroll-already-enrolled:${targetSyId ?? "none"}:${targetSemesterNumber ?? "none"}:p${page}`,
    () => enrollmentService.getAlreadyEnrolledDirectory(
      targetSyId, targetSemesterNumber, {}, page, pageSize,
    ),
    { cache: false },
  );

  const rows = directory?.items ?? [];
  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-8">
      <PageHeader
        title="Re-enroll Students"
        actions={
          <div className="flex gap-2">
            <Button type="button" variant="outline" block={false} onClick={() => navigate("/enrollment/re-enroll")}>
              Eligible students
            </Button>
            <Button type="button" block={false} disabled>
              Already enrolled
            </Button>
          </div>
        }
      />

      <div className="mt-6 rounded-xl border border-slate-200 bg-white p-4 dark:border-white/10 dark:bg-navy-900">
        <p className="mb-4 font-body text-sm text-slate-600 dark:text-slate-300">
          Students who already have an enrollment in the currently selected term.
        </p>
        {directory === null ? (
          <div className="flex justify-center py-10"><Spinner /></div>
        ) : rows.length === 0 ? (
          <EmptyState title="No students enrolled in this term yet" />
        ) : (
          <Table>
            <TableHead>
              <TableHeader dense>Student ID</TableHeader>
              <TableHeader dense>Name</TableHeader>
              <TableHeader dense className="hidden sm:table-cell">Program</TableHeader>
              <TableHeader dense className="hidden md:table-cell">Year</TableHeader>
              <TableHeader dense>Last state</TableHeader>
            </TableHead>
            <TableBody>
              {rows.map((row) => (
                <TableRow key={row.studentProfileId}>
                  <TableCell dense className="text-slate-600 dark:text-slate-300">{row.studentId || "No ID"}</TableCell>
                  <TableCell dense className="font-medium text-navy-700 dark:text-mist-100">{row.name}</TableCell>
                  <TableCell dense className="hidden sm:table-cell">{row.program || "—"}</TableCell>
                  <TableCell dense className="hidden md:table-cell">{row.yearLevel || "—"}</TableCell>
                  <TableCell dense>
                    <Badge tone={STATE_TONES[row.lastEnrollmentState] ?? "slate"}>{row.lastEnrollmentState || "—"}</Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
        <Pagination
          page={directory?.currentPage ?? page}
          totalItems={directory?.total ?? 0}
          pageSize={pageSize}
          onPageChange={setPage}
        />
      </div>
    </div>
  );
}
