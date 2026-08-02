import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Alert, AlertAction, AlertDescription, AlertTitle } from "~/components/ui/alert";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { Card } from "~/components/ui/card";
import {
  ArchiveIcon,
  EditIcon,
  HelpCircleIcon,
  PlusIcon,
  RefreshCwIcon,
} from "~/components/ui/icons";
import { Modal } from "~/components/ui/modal";
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
import { MOCK_SCHOOL_YEARS } from "~/features/academic-terms/mock-data";
import { calendarStatusTone, StatusBadge } from "~/features/academic-terms/status-badges";
import { PageHeader } from "~/layouts/page-header";

const actionButtonClassName =
  "inline-flex cursor-pointer items-center gap-1.5 rounded-lg border px-2.5 py-1.5 font-body text-xs font-medium transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-400";

export function SchoolYearsPage() {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [createOpen, setCreateOpen] = useState(false);
  const pageSize = 5;

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return MOCK_SCHOOL_YEARS;
    return MOCK_SCHOOL_YEARS.filter((row) => row.schoolYear.toLowerCase().includes(q));
  }, [search]);

  const pageItems = filtered.slice((page - 1) * pageSize, page * pageSize);

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <PageHeader
        title="School Years"
        description="Create, manage, and archive school years."
        actions={
          <Button type="button" block={false} onClick={() => setCreateOpen(true)}>
            <PlusIcon />
            Create School Year
          </Button>
        }
      />

      <Alert variant="default" className="mt-6 border-blue-200 bg-blue-50 text-blue-900 dark:border-blue-400/25 dark:bg-blue-400/10 dark:text-blue-200">
        <HelpCircleIcon />
        <AlertDescription>
          The current school year is used as the default in the global term selector. Make sure a school
          year exists for the current academic calendar.
        </AlertDescription>
        <AlertAction>
          <Button
            type="button"
            variant="outline"
            block={false}
            onClick={() => toast.info("Mock only — wiring coming soon.")}
          >
            <RefreshCwIcon />
            Check Current Year
          </Button>
        </AlertAction>
      </Alert>

      <Card className="mt-6 overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 px-4 py-3 dark:border-white/10">
          <h2 className="font-display text-base tracking-wide text-navy-700 dark:text-mist-100">
            School Years List
          </h2>
          <SearchInput
            value={search}
            onChange={(value) => {
              setSearch(value);
              setPage(1);
            }}
            placeholder="Search school year…"
            className="w-full sm:w-56"
          />
        </div>

        <Table>
          <TableHead>
            <TableHeader>School Year</TableHeader>
            <TableHeader>Calendar Status</TableHeader>
            <TableHeader>Current</TableHeader>
            <TableHeader className="hidden md:table-cell">Created At</TableHeader>
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
                <TableCell>
                  <StatusBadge tone={calendarStatusTone(row.calendarStatus)}>{row.calendarStatus}</StatusBadge>
                </TableCell>
                <TableCell>
                  {row.isCurrent ? (
                    <Badge tone="sky">
                      <span className="inline-flex items-center gap-1">
                        <span aria-hidden="true">★</span>
                        Current
                      </span>
                    </Badge>
                  ) : (
                    <span className="text-slate-400">—</span>
                  )}
                </TableCell>
                <TableCell className="hidden md:table-cell">{row.createdAt}</TableCell>
                <TableCell>
                  <div className="flex justify-end gap-2">
                    <button
                      type="button"
                      className={`${actionButtonClassName} border-blue-200 text-blue-700 hover:bg-blue-50 dark:border-blue-400/30 dark:text-blue-300 dark:hover:bg-blue-400/10`}
                      onClick={() => toast.info("Mock only — edit wiring coming soon.")}
                    >
                      <EditIcon />
                      Edit
                    </button>
                    <button
                      type="button"
                      className={`${actionButtonClassName} border-red-200 text-red-700 hover:bg-red-50 dark:border-red-400/30 dark:text-red-300 dark:hover:bg-red-400/10`}
                      onClick={() => toast.info("Mock only — archive wiring coming soon.")}
                    >
                      <ArchiveIcon />
                      Archive
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

      <Alert variant="warning" className="mt-6">
        <HelpCircleIcon />
        <AlertTitle>Archiving a school year</AlertTitle>
        <AlertDescription>
          Archiving will hide the school year from active dropdowns and reports. All historical data will
          be preserved and remain accessible.
        </AlertDescription>
        <AlertAction>
          <Button type="button" variant="outline" block={false} onClick={() => toast.info("Learn more — mock only.")}>
            <HelpCircleIcon />
            Learn more
          </Button>
        </AlertAction>
      </Alert>

      <Modal open={createOpen} onClose={() => setCreateOpen(false)} title="Create School Year">
        <p className="font-body text-sm text-slate-600 dark:text-slate-300">
          Mock form — will connect to <code className="text-xs">POST /school-years</code> when wired.
        </p>
        <div className="mt-4 flex justify-end gap-2">
          <Button type="button" variant="outline" block={false} onClick={() => setCreateOpen(false)}>
            Cancel
          </Button>
          <Button
            type="button"
            block={false}
            onClick={() => {
              toast.success("Mock school year created.");
              setCreateOpen(false);
            }}
          >
            Create
          </Button>
        </div>
      </Modal>
    </div>
  );
}
