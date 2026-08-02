import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Alert, AlertDescription, AlertTitle } from "~/components/ui/alert";
import { Button } from "~/components/ui/button";
import { Card } from "~/components/ui/card";
import { FilterDropdown } from "~/components/ui/dropdown-menu";
import { AuditLogIcon, FilterIcon, HelpCircleIcon, LockIcon } from "~/components/ui/icons";
import { Pagination } from "~/components/ui/pagination";
import { SearchInput } from "~/components/ui/search-input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "~/components/ui/table";
import { MOCK_TERM_CLOSURES, type MockTermClosure } from "~/features/academic-terms/mock-data";
import { closedReasonTone, StatusBadge, termStatusTone } from "~/features/academic-terms/status-badges";
import { TermClosureAuditLogModal } from "~/features/academic-terms/term-closure-audit-log-modal";
import { TermClosureDetailsModal } from "~/features/academic-terms/term-closure-details-modal";
import { PageHeader } from "~/layouts/page-header";

const actionButtonClassName =
  "inline-flex cursor-pointer items-center gap-1.5 rounded-lg border px-2.5 py-1.5 font-body text-xs font-medium transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-400 disabled:cursor-not-allowed disabled:opacity-50";

export function TermClosurePage() {
  const [search, setSearch] = useState("");
  const [schoolYear, setSchoolYear] = useState("all");
  const [semester, setSemester] = useState("all");
  const [status, setStatus] = useState("all");
  const [page, setPage] = useState(1);
  const [detailsTerm, setDetailsTerm] = useState<MockTermClosure | null>(null);
  const [auditOpen, setAuditOpen] = useState(false);
  const pageSize = 5;

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return MOCK_TERM_CLOSURES.filter((row) => {
      if (schoolYear !== "all" && row.schoolYear !== schoolYear) return false;
      if (semester !== "all" && row.semester !== semester) return false;
      if (status !== "all" && row.status !== status) return false;
      if (q && !`${row.schoolYear} ${row.semester}`.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [search, schoolYear, semester, status]);

  const pageItems = filtered.slice((page - 1) * pageSize, page * pageSize);

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <PageHeader
        title="Term Closure"
        description="Close a term after posting grades. Closed terms are protected from destructive changes."
        actions={
          <Button type="button" variant="outline" block={false} onClick={() => setAuditOpen(true)}>
            <AuditLogIcon />
            View Audit Log
          </Button>
        }
      />

      <Alert variant="default" className="mt-6 border-blue-200 bg-blue-50 text-blue-900 dark:border-blue-400/25 dark:bg-blue-400/10 dark:text-blue-200">
        <HelpCircleIcon />
        <AlertDescription>
          Only the registrar can close or reopen a term. Choose a term below to see its current status and
          available actions.
        </AlertDescription>
      </Alert>

      <div className="mt-6 flex flex-wrap items-center gap-2">
        <FilterDropdown
          label="School Year"
          allLabel="All School Years"
          options={[
            { value: "2026-2027", label: "2026-2027" },
            { value: "2025-2026", label: "2025-2026" },
            { value: "2024-2025", label: "2024-2025" },
          ]}
          value={schoolYear}
          onChange={(value) => {
            setSchoolYear(value);
            setPage(1);
          }}
        />
        <FilterDropdown
          label="Semester"
          allLabel="All Semesters"
          options={[
            { value: "1st Semester", label: "1st Semester" },
            { value: "2nd Semester", label: "2nd Semester" },
          ]}
          value={semester}
          onChange={(value) => {
            setSemester(value);
            setPage(1);
          }}
        />
        <FilterDropdown
          label="Status"
          allLabel="All Statuses"
          options={[
            { value: "Open", label: "Open" },
            { value: "Closed", label: "Closed" },
          ]}
          value={status}
          onChange={(value) => {
            setStatus(value);
            setPage(1);
          }}
        />
        <SearchInput
          value={search}
          onChange={(value) => {
            setSearch(value);
            setPage(1);
          }}
          placeholder="Search term…"
          className="min-w-40 flex-1 sm:max-w-xs"
        />
        <Button type="button" variant="outline" block={false} onClick={() => toast.info("Filters — mock only.")}>
          <FilterIcon />
          Filters
        </Button>
      </div>

      <Card className="mt-4 overflow-hidden">
        <Table>
          <TableHead>
            <TableHeader>School Year</TableHeader>
            <TableHeader>Semester</TableHeader>
            <TableHeader>Status</TableHeader>
            <TableHeader className="hidden md:table-cell">Closed Reason</TableHeader>
            <TableHeader className="hidden lg:table-cell">Closed At</TableHeader>
            <TableHeader className="hidden lg:table-cell">Closed By</TableHeader>
            <TableHeader>
              <span className="sr-only">Actions</span>
            </TableHeader>
          </TableHead>
          <TableBody>
            {pageItems.map((row) => (
              <TableRow key={row.id}>
                <TableCell>
                  <span className="font-medium text-navy-700 dark:text-mist-100">{row.schoolYear}</span>
                </TableCell>
                <TableCell>{row.semester}</TableCell>
                <TableCell>
                  <StatusBadge tone={termStatusTone(row.status)}>{row.status}</StatusBadge>
                </TableCell>
                <TableCell className="hidden md:table-cell">
                  {row.closedReason ? (
                    <StatusBadge tone={closedReasonTone(row.closedReason)}>{row.closedReason}</StatusBadge>
                  ) : (
                    "—"
                  )}
                </TableCell>
                <TableCell className="hidden lg:table-cell">{row.closedAt ?? "—"}</TableCell>
                <TableCell className="hidden lg:table-cell">{row.closedBy ?? "—"}</TableCell>
                <TableCell>
                  <div className="flex justify-end gap-2">
                    <button
                      type="button"
                      className={`${actionButtonClassName} border-blue-200 text-blue-700 hover:bg-blue-50 dark:border-blue-400/30 dark:text-blue-300 dark:hover:bg-blue-400/10`}
                      onClick={() => setDetailsTerm(row)}
                    >
                      View Details
                    </button>
                    <button
                      type="button"
                      disabled={!row.reopenable}
                      title={
                        !row.reopenable
                          ? row.status === "Open"
                            ? "Term is already open"
                            : "Terms closed due to school year end cannot be reopened"
                          : "Reopen this term"
                      }
                      className={`${actionButtonClassName} border-red-200 text-red-700 hover:bg-red-50 dark:border-red-400/30 dark:text-red-300 dark:hover:bg-red-400/10`}
                      onClick={() => toast.info("Reopen — mock only.")}
                    >
                      <LockIcon size={14} />
                      Reopen
                    </button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>

        <div className="border-t border-slate-200 px-4 py-3 dark:border-white/10">
          <Pagination page={page} totalItems={filtered.length} pageSize={pageSize} onPageChange={setPage} />
        </div>
      </Card>

      <Card className="mt-6 p-5">
        <h3 className="font-display text-sm tracking-wide text-navy-700 dark:text-mist-100">Status Guide</h3>
        <ul className="mt-3 space-y-2 font-body text-sm text-slate-600 dark:text-slate-300">
          <li>
            <StatusBadge tone="emerald">Open</StatusBadge> — Term accepts changes.
          </li>
          <li>
            <StatusBadge tone="gold">Closed</StatusBadge> — Term is protected from destructive changes.
          </li>
          <li>
            <StatusBadge tone="slate">Closed (Year Ended)</StatusBadge> — Auto-closed on June 1; not reopenable.
          </li>
        </ul>

        <Alert variant="default" className="mt-4 border-slate-200 bg-slate-50 dark:border-white/10 dark:bg-white/5">
          <AlertTitle>Notes</AlertTitle>
          <AlertDescription>
            <ul className="mt-1 list-disc space-y-1 pl-4">
              <li>Reopen is only available for terms closed by the registrar.</li>
              <li>Terms closed due to school year end cannot be reopened.</li>
            </ul>
          </AlertDescription>
        </Alert>
      </Card>

      <TermClosureDetailsModal term={detailsTerm} onClose={() => setDetailsTerm(null)} />
      <TermClosureAuditLogModal open={auditOpen} onClose={() => setAuditOpen(false)} />
    </div>
  );
}
