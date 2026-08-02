import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Alert, AlertAction, AlertDescription } from "~/components/ui/alert";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { FilterDropdown } from "~/components/ui/dropdown-menu";
import { HelpCircleIcon, LockIcon } from "~/components/ui/icons";
import { Modal } from "~/components/ui/modal";
import { Pagination } from "~/components/ui/pagination";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "~/components/ui/table";
import { MOCK_AUDIT_LOG, type AuditAction } from "~/features/academic-terms/mock-data";

type TermClosureAuditLogModalProps = {
  open: boolean;
  onClose: () => void;
};

function auditActionTone(action: AuditAction) {
  switch (action) {
    case "Closed":
      return "gold" as const;
    case "Reopened":
      return "emerald" as const;
    case "Auto-Closed":
      return "slate" as const;
  }
}

export function TermClosureAuditLogModal({ open, onClose }: TermClosureAuditLogModalProps) {
  const [schoolYear, setSchoolYear] = useState("all");
  const [semester, setSemester] = useState("all");
  const [action, setAction] = useState("all");
  const [performedBy, setPerformedBy] = useState("all");
  const [page, setPage] = useState(1);
  const pageSize = 10;

  const filtered = useMemo(() => {
    return MOCK_AUDIT_LOG.filter((entry) => {
      if (schoolYear !== "all" && entry.schoolYear !== schoolYear) return false;
      if (semester !== "all" && entry.semester !== semester) return false;
      if (action !== "all" && entry.action !== action) return false;
      if (performedBy !== "all" && entry.performedBy !== performedBy) return false;
      return true;
    });
  }, [schoolYear, semester, action, performedBy]);

  const pageItems = filtered.slice((page - 1) * pageSize, page * pageSize);

  function resetFilters() {
    setSchoolYear("all");
    setSemester("all");
    setAction("all");
    setPerformedBy("all");
    setPage(1);
  }

  return (
    <Modal open={open} onClose={onClose} title="Term Closure Audit Log" xl>
      <p className="font-body text-sm text-slate-500 dark:text-slate-400">
        Complete history of actions performed on term closures.
      </p>

      <div className="mt-4 flex flex-wrap items-center gap-2">
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
          label="Action"
          allLabel="All Actions"
          options={[
            { value: "Closed", label: "Closed" },
            { value: "Reopened", label: "Reopened" },
            { value: "Auto-Closed", label: "Auto-Closed" },
          ]}
          value={action}
          onChange={(value) => {
            setAction(value);
            setPage(1);
          }}
        />
        <FilterDropdown
          label="Performed By"
          allLabel="All Users"
          options={[
            { value: "Maria Santos", label: "Maria Santos" },
            { value: "System (Auto)", label: "System (Auto)" },
          ]}
          value={performedBy}
          onChange={(value) => {
            setPerformedBy(value);
            setPage(1);
          }}
        />
        <button
          type="button"
          className="rounded-lg border border-slate-300 px-3 py-2 font-body text-sm text-slate-500 dark:border-white/15 dark:text-slate-400"
          disabled
          title="Mock only"
        >
          Select date range
        </button>
        <Button type="button" variant="outline" block={false} onClick={resetFilters}>
          Reset
        </Button>
      </div>

      <Alert variant="default" className="mt-4 border-blue-200 bg-blue-50 text-blue-900 dark:border-blue-400/25 dark:bg-blue-400/10 dark:text-blue-200">
        <HelpCircleIcon />
        <AlertDescription>
          Showing {Math.min((page - 1) * pageSize + 1, filtered.length)} to{" "}
          {Math.min(page * pageSize, filtered.length)} of {filtered.length} audit log entries
        </AlertDescription>
        <AlertAction>
          <Button type="button" variant="outline" block={false} onClick={() => toast.info("Export CSV — mock only.")}>
            Export CSV
          </Button>
        </AlertAction>
      </Alert>

      <div className="mt-4 overflow-x-auto">
        <Table>
          <TableHead>
            <TableHeader>Date &amp; Time</TableHeader>
            <TableHeader>Action</TableHeader>
            <TableHeader>Term (School Year / Semester)</TableHeader>
            <TableHeader>Performed By</TableHeader>
            <TableHeader className="hidden lg:table-cell">Role</TableHeader>
            <TableHeader className="hidden md:table-cell">IP Address</TableHeader>
            <TableHeader>Details</TableHeader>
          </TableHead>
          <TableBody>
            {pageItems.map((entry) => (
              <TableRow key={entry.id}>
                <TableCell className="whitespace-nowrap">{entry.dateTime}</TableCell>
                <TableCell>
                  <Badge tone={auditActionTone(entry.action)}>
                    <span className="inline-flex items-center gap-1">
                      {entry.action === "Closed" || entry.action === "Auto-Closed" ? (
                        <LockIcon size={14} />
                      ) : null}
                      {entry.action}
                    </span>
                  </Badge>
                </TableCell>
                <TableCell>
                  {entry.schoolYear} / {entry.semester}
                </TableCell>
                <TableCell>{entry.performedBy}</TableCell>
                <TableCell className="hidden lg:table-cell">{entry.role}</TableCell>
                <TableCell className="hidden md:table-cell">{entry.ipAddress ?? "—"}</TableCell>
                <TableCell>
                  <span className="inline-flex items-center gap-1">
                    {entry.details}
                    <HelpCircleIcon />
                  </span>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <Pagination page={page} totalItems={filtered.length} pageSize={pageSize} onPageChange={setPage} />

      <div className="mt-4 flex justify-end border-t border-slate-200 pt-4 dark:border-white/10">
        <Button type="button" variant="outline" block={false} onClick={onClose}>
          Close
        </Button>
      </div>
    </Modal>
  );
}
