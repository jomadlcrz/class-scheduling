import { Badge } from "~/components/ui/badge";
import { Checkbox } from "~/components/ui/checkbox";
import { IconButton } from "~/components/ui/icon-button";
import { FileSearchIcon, UserCheckIcon, UserOffIcon } from "~/components/ui/icons";
import { ImageViewer } from "~/components/ui/image-viewer";
import { ProfileAvatar } from "~/components/ui/profile-avatar";
import { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "~/components/ui/table";
import type { StudentAccountRow } from "~/types/student";

function displayName(s: StudentAccountRow) {
  if (s.studentName) return s.studentName;
  const parts = [s.firstName, s.midName].filter(Boolean).join(" ");
  return parts ? `${s.lastName}, ${parts}` : s.lastName;
}

type StudentAccountTableProps = {
  students: StudentAccountRow[];
  /** Per-row login status fetched from GET /super-admin/student-accounts/<id> (the list endpoint doesn't include it); undefined while still loading. */
  accountActiveById: Record<number, boolean | undefined>;
  onView: ((student: StudentAccountRow) => void) | null;
  onDeactivateAccount: ((student: StudentAccountRow) => void) | null;
  onReactivateAccount: ((student: StudentAccountRow) => void) | null;
  /**
   * Bulk "Create Account" selection — pass all three to render a checkbox column
   * (only for students that don't already have an account). Omit to hide it entirely.
   */
  selectedIds?: Set<number>;
  onToggleSelect?: (student: StudentAccountRow, checked: boolean) => void;
  onSelectAll?: (checked: boolean, students: StudentAccountRow[]) => void;
};

export function StudentAccountTable({
  students,
  accountActiveById,
  onView,
  onDeactivateAccount,
  onReactivateAccount,
  selectedIds,
  onToggleSelect,
  onSelectAll,
}: StudentAccountTableProps) {
  const canBulkSelect = Boolean(selectedIds && onToggleSelect && onSelectAll);
  const [viewerSrc, setViewerSrc] = useState<string | null>(null);
  const selectableStudents = students.filter((s) => !s.hasAccount);
  const allSelectableSelected =
    selectableStudents.length > 0 && selectableStudents.every((s) => selectedIds?.has(s.studentProfileId));

  return (
    <>
    <Table>
      <TableHead>
        {canBulkSelect && (
          <TableHeader className="w-10">
            <Checkbox
              id="student-account-select-all"
              ariaLabel="Select all students without an account"
              inset
              checked={allSelectableSelected}
              onChange={(checked) => onSelectAll?.(checked, selectableStudents)}
            />
          </TableHeader>
        )}
        <TableHeader>Student</TableHeader>
        <TableHeader className="hidden sm:table-cell">Program</TableHeader>
        <TableHeader>Status</TableHeader>
        <TableHeader>
          <span className="sr-only">Actions</span>
        </TableHeader>
      </TableHead>
      <TableBody>
        {students.map((student) => {
          const isActive = accountActiveById[student.studentProfileId] ?? student.accountActive ?? (student.hasAccount ? true : null);
          return (
          <TableRow key={student.studentProfileId} className="group">
            {canBulkSelect && (
              <TableCell>
                {!student.hasAccount && (
                  <Checkbox
                    id={`student-account-select-${student.studentProfileId}`}
                    ariaLabel={`Select ${displayName(student)}`}
                    inset
                    checked={selectedIds?.has(student.studentProfileId) ?? false}
                    onChange={(checked) => onToggleSelect?.(student, checked)}
                  />
                )}
              </TableCell>
            )}
            <TableCell>
              <div className="flex items-center gap-3">
                {student.profilePhotoUrl ? (
                  <img
                    src={student.profilePhotoUrl}
                    alt=""
                    className="size-8 shrink-0 cursor-pointer rounded-full object-cover"
                    onClick={() => setViewerSrc(student.profilePhotoUrl!)}
                  />
                  ) : <ProfileAvatar className="size-8" />}
                <div className="min-w-0">
                  <span className="block truncate font-medium text-navy-700 dark:text-mist-100">
                    {displayName(student)}
                  </span>
                  <span className="block truncate text-xs text-slate-400 dark:text-slate-500">
                    {student.studentId || "No ID"}
                  </span>
                </div>
              </div>
            </TableCell>
            <TableCell className="hidden sm:table-cell text-slate-500 dark:text-slate-400">
              {student.academics[student.academics.length - 1]?.program ?? "—"}
            </TableCell>
            <TableCell>
              {!student.hasAccount ? (
                <Badge tone="slate">No account</Badge>
              ) : isActive === undefined ? (
                <span className="text-xs text-slate-400 dark:text-slate-500">…</span>
              ) : isActive ? (
                <Badge tone="emerald">Active</Badge>
              ) : (
                <Badge tone="red">Deactivated</Badge>
              )}
            </TableCell>
            <TableCell>
              <div className="flex justify-end gap-1 lg:opacity-0 lg:transition-opacity lg:duration-150 lg:group-hover:opacity-100 lg:focus-within:opacity-100">
                {onView && (
                  <IconButton
                    onClick={() => onView(student)}
                    label={`View ${displayName(student)}`}
                    title="View details"
                  >
                    <FileSearchIcon />
                  </IconButton>
                )}
                {onDeactivateAccount && onReactivateAccount && student.hasAccount && (
                  isActive === undefined ? (
                    <span className="grid size-8 place-items-center text-slate-300 dark:text-slate-600">…</span>
                  ) : isActive ? (
                    <IconButton
                      variant="dangerSoft"
                      onClick={() => onDeactivateAccount(student)}
                      label={`Deactivate account for ${displayName(student)}`}
                      title="Deactivate account"
                    >
                      <UserOffIcon />
                    </IconButton>
                  ) : (
                    <IconButton
                      variant="emerald"
                      onClick={() => onReactivateAccount(student)}
                      label={`Reactivate account for ${displayName(student)}`}
                      title="Reactivate account"
                    >
                      <UserCheckIcon />
                    </IconButton>
                  )
                )}
              </div>
            </TableCell>
          </TableRow>
          );
        })}
      </TableBody>
    </Table>
    {viewerSrc && (
      <ImageViewer
        open={viewerSrc !== null}
        onClose={() => setViewerSrc(null)}
        src={viewerSrc}
        alt="Profile photo"
      />
    )}
    </>
  );
}
