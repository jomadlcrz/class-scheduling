import { useState } from "react";
import { Link } from "react-router";
import { toast } from "sonner";
import { Alert, AlertAction, AlertDescription, AlertTitle } from "~/components/ui/alert";
import { Button } from "~/components/ui/button";
import { Card } from "~/components/ui/card";
import { CalendarIcon, EditIcon, HelpCircleIcon, PlusIcon } from "~/components/ui/icons";
import { Modal } from "~/components/ui/modal";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "~/components/ui/table";
import { MOCK_SEMESTERS, type MockSemester } from "~/features/academic-terms/mock-data";
import { StatusBadge } from "~/features/academic-terms/status-badges";
import { PageHeader } from "~/layouts/page-header";

const actionButtonClassName =
  "inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-blue-200 px-2.5 py-1.5 font-body text-xs font-medium text-blue-700 transition-colors duration-150 hover:bg-blue-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-400 dark:border-blue-400/30 dark:text-blue-300 dark:hover:bg-blue-400/10";

export function SemestersPage() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <PageHeader
        title="Semesters"
        description="Reference list of semesters used across all school years."
        actions={
          <Link
            to="/academic-terms/term-closure"
            className="inline-flex items-center gap-2 rounded-lg border border-slate-300 px-3 py-1.5 font-body text-sm font-medium text-navy-700 transition-colors hover:bg-slate-100 dark:border-white/15 dark:text-slate-200 dark:hover:bg-white/10"
          >
            <CalendarIcon />
            View Term Closure
          </Link>
        }
      />

      <Alert variant="default" className="mt-6 border-blue-200 bg-blue-50 text-blue-900 dark:border-blue-400/25 dark:bg-blue-400/10 dark:text-blue-200">
        <HelpCircleIcon />
        <AlertDescription>
          There are only two semesters in the system: 1st Semester and 2nd Semester. These are shared
          across all school years.
        </AlertDescription>
      </Alert>

      <Card className="mt-6 overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 px-4 py-3 dark:border-white/10">
          <h2 className="font-display text-base tracking-wide text-navy-700 dark:text-mist-100">
            Semesters List
          </h2>
          <span title="Only two global semesters exist">
            <Button type="button" variant="outline" block={false} disabled>
              <PlusIcon />
              Add Semester
            </Button>
          </span>
        </div>

        <SemestersTable semesters={MOCK_SEMESTERS} />
        <p className="border-t border-slate-200 px-4 py-3 font-body text-sm text-slate-500 dark:border-white/10 dark:text-slate-400">
          Showing 1 to 2 of 2 entries
        </p>
      </Card>

      <Alert variant="default" className="mt-6 border-blue-200 bg-blue-50 text-blue-900 dark:border-blue-400/25 dark:bg-blue-400/10 dark:text-blue-200">
        <HelpCircleIcon />
        <AlertTitle>About Semesters</AlertTitle>
        <AlertDescription>
          <ul className="mt-1 list-disc space-y-1 pl-4">
            <li>Semester records cannot be deleted.</li>
            <li>Only the display name and description can be edited.</li>
            <li>Changes here will reflect across all school years.</li>
          </ul>
        </AlertDescription>
        <AlertAction>
          <Button type="button" variant="outline" block={false} onClick={() => toast.info("Learn more — mock only.")}>
            <HelpCircleIcon />
            Learn more
          </Button>
        </AlertAction>
      </Alert>
    </div>
  );
}

function SemestersTable({ semesters }: { semesters: MockSemester[] }) {
  return (
    <Table>
      <TableHead>
        <TableHeader>Semester Number</TableHeader>
        <TableHeader>Display Name</TableHeader>
        <TableHeader className="hidden sm:table-cell">Description</TableHeader>
        <TableHeader>Status</TableHeader>
        <TableHeader>
          <span className="sr-only">Actions</span>
        </TableHeader>
      </TableHead>
      <TableBody>
        {semesters.map((row) => (
          <TableRow key={row.id}>
            <TableCell>{row.semesterNumber}</TableCell>
            <TableCell>
              <span className="font-medium text-navy-700 dark:text-mist-100">{row.displayName}</span>
            </TableCell>
            <TableCell className="hidden sm:table-cell">{row.description}</TableCell>
            <TableCell>
              <StatusBadge tone="emerald">{row.status}</StatusBadge>
            </TableCell>
            <TableCell>
              <div className="flex justify-end">
                <SemesterEditButton semester={row} />
              </div>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

function SemesterEditButton({ semester }: { semester: MockSemester }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button type="button" className={actionButtonClassName} onClick={() => setOpen(true)}>
        <EditIcon />
        Edit
      </button>
      <Modal open={open} onClose={() => setOpen(false)} title={`Edit ${semester.displayName}`}>
        <p className="font-body text-sm text-slate-600 dark:text-slate-300">
          Mock form — will connect to <code className="text-xs">PUT /semesters/{semester.id}</code> when wired.
        </p>
        <div className="mt-4 flex justify-end gap-2">
          <Button type="button" variant="outline" block={false} onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button
            type="button"
            block={false}
            onClick={() => {
              toast.success("Mock semester updated.");
              setOpen(false);
            }}
          >
            Save
          </Button>
        </div>
      </Modal>
    </>
  );
}
