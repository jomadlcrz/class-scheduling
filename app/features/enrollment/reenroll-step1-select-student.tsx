import { Badge, type BadgeTone } from "~/components/ui/badge";
import { Checkbox } from "~/components/ui/checkbox";
import { LockIcon } from "~/components/ui/icons";
import { Pagination } from "~/components/ui/pagination";
import { Spinner } from "~/components/ui/spinner";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "~/components/ui/table";
import { ProgramWizardFooter } from "~/features/subjects/program-wizard-footer";
import { usePagination } from "~/hooks/use-pagination";
import type { ReenrollDirectoryRow } from "~/types/enrollment";

export type { ReenrollDirectoryRow };

export type ReenrollDirectoryFilterState = {
  search: string;
  program: string;
  yearLevel: string;
  semester: string;
  enrolledStatus: string;
};

const STATE_TONES: Record<string, BadgeTone> = {
  Enrolled: "emerald",
  Dropped: "red",
  Withdrawn: "gold",
  Voided: "slate",
};

type ReenrollStep1SelectStudentProps = {
  directory: ReenrollDirectoryRow[] | null;
  selectedIds: Set<number>;
  onToggleSelect: (row: ReenrollDirectoryRow, checked: boolean) => void;
  onSelectAll: (checked: boolean, rows: ReenrollDirectoryRow[]) => void;
  filters: ReenrollDirectoryFilterState;
  onNext: () => void;
  onCancel: () => void;
};

export function ReenrollStep1SelectStudent({
  directory,
  selectedIds,
  onToggleSelect,
  onSelectAll,
  filters,
  onNext,
  onCancel,
}: ReenrollStep1SelectStudentProps) {
  const isSelectable = (row: ReenrollDirectoryRow) => row.reEnrollEligible && !row.enrolledInTargetTerm;
  const results = directory ?? [];
  const pagination = usePagination(
    results,
    `${filters.search}|${filters.program}|${filters.yearLevel}|${filters.semester}|${filters.enrolledStatus}`,
  );
  const selectableResults = pagination.pageItems.filter(isSelectable);
  const allVisibleSelected =
    selectableResults.length > 0 && selectableResults.every((s) => selectedIds.has(s.studentProfileId));

  return (
    <div className="flex flex-col gap-5">
      <div>
        {directory === null ? (
          <div className="flex justify-center py-8">
            <Spinner />
          </div>
        ) : results.length === 0 ? (
          <p className="px-2 py-6 text-center font-body text-sm text-slate-500 dark:text-slate-400">
            No students match your search and filters.
          </p>
        ) : (
          <Table>
            <TableHead>
              <TableHeader dense className="w-10">
                <Checkbox
                  id="reenroll-select-all"
                  ariaLabel="Select all eligible students"
                  inset
                  checked={allVisibleSelected}
                  onChange={(checked) => onSelectAll(checked, selectableResults)}
                />
              </TableHeader>
              <TableHeader dense>Student ID</TableHeader>
              <TableHeader dense>Name</TableHeader>
              <TableHeader dense className="hidden sm:table-cell">Program</TableHeader>
              <TableHeader dense className="hidden md:table-cell">Year</TableHeader>
              <TableHeader dense className="hidden lg:table-cell">Last term</TableHeader>
              <TableHeader dense>Last state</TableHeader>
            </TableHead>
            <TableBody>
              {pagination.pageItems.map((row) => {
                const selectable = isSelectable(row);
                const isChecked = selectedIds.has(row.studentProfileId);
                const blockReason = row.enrolledInTargetTerm
                  ? "Already enrolled this term"
                  : row.reEnrollBlockReason;
                return (
                  <TableRow key={row.studentProfileId} className={selectable ? "" : "opacity-60"}>
                    <TableCell dense>
                      {selectable ? (
                        <Checkbox
                          id={`reenroll-student-${row.studentProfileId}`}
                          ariaLabel={`Select ${row.name}`}
                          inset
                          checked={isChecked}
                          onChange={(checked) => onToggleSelect(row, checked)}
                        />
                      ) : (
                        <span
                          className="grid size-4 place-items-center text-slate-300 dark:text-slate-600"
                          title={blockReason ?? "Not eligible for re-enrollment"}
                          aria-label={blockReason ?? "Not eligible"}
                        >
                          <LockIcon />
                        </span>
                      )}
                    </TableCell>
                    <TableCell dense className="text-slate-600 dark:text-slate-300">{row.studentId || "No ID"}</TableCell>
                    <TableCell dense>
                      <span className="font-medium text-navy-700 dark:text-mist-100">{row.name}</span>
                      {!selectable && blockReason && (
                        <span className="block font-body text-[0.7rem] text-slate-400 dark:text-slate-500">
                          {blockReason}
                        </span>
                      )}
                    </TableCell>
                    <TableCell dense className="hidden sm:table-cell">{row.program || "—"}</TableCell>
                    <TableCell dense className="hidden md:table-cell">{row.yearLevel || "—"}</TableCell>
                    <TableCell dense className="hidden text-xs text-slate-500 lg:table-cell dark:text-slate-400">
                      {row.lastSchoolYear ? `${row.lastSchoolYear} · Sem ${row.semesterNumber}` : "—"}
                    </TableCell>
                    <TableCell dense>
                      <Badge tone={STATE_TONES[row.lastEnrollmentState] ?? "slate"}>
                        {row.lastEnrollmentState || "—"}
                      </Badge>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </div>

      <Pagination
        page={pagination.page}
        totalItems={pagination.totalItems}
        pageSize={pagination.pageSize}
        onPageChange={pagination.setPage}
      />

      <ProgramWizardFooter
        backLabel="Cancel"
        onBack={onCancel}
        primaryLabel="Next: Enrollment Information"
        onPrimary={onNext}
        primaryDisabled={selectedIds.size === 0}
      />
    </div>
  );
}
