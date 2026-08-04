import { ArchiveIcon, EditIcon } from "~/components/ui/icons";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "~/components/ui/table";
import { archiveActionButtonClassName } from "~/features/archive/archive-icon-styles";
import type { CurriculumGroup } from "~/types/curriculum";
import type { Subject } from "~/types/subject";

/** Catalog code, styled like a call number — the same treatment subject codes
 * and their prerequisites share, so a glance tells you which cells cross-reference the catalog. */
const codeChipClassName =
  "inline-flex items-center rounded-md border border-slate-200 bg-slate-50 px-1.5 py-0.5 font-mono text-[0.8rem] font-semibold tracking-wide text-navy-700 dark:border-white/10 dark:bg-white/5 dark:text-mist-100";

type CurriculumSubjectsProps = {
  group: CurriculumGroup;
  /** Manage mode: row-level actions render when both are supplied (omit for read-only views, e.g. the dean's). */
  onEdit?: (subject: Subject) => void;
  onArchive?: (subject: Subject) => void;
};

const actionButtonClassName =
  "grid size-8 cursor-pointer place-items-center rounded-lg text-slate-400 transition-colors duration-150 hover:bg-slate-200/60 hover:text-navy-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-400 dark:text-slate-500 dark:hover:bg-white/10 dark:hover:text-white";

export function CurriculumSubjects({ group, onEdit, onArchive }: CurriculumSubjectsProps) {
  const manageable = Boolean(onEdit || onArchive);

  if (group.subjects.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-slate-300 py-6 text-center font-body text-sm text-slate-400 dark:border-white/15 dark:text-slate-500">
        No subjects assigned.
      </div>
    );
  }

  return (
    <Table>
      <TableHead>
        <TableHeader>Subject Code</TableHeader>
        <TableHeader>Descriptive Title</TableHeader>
        <TableHeader className="text-center">Units</TableHeader>
        <TableHeader className="text-center">Pre-Requisite</TableHeader>
        {manageable && (
          <TableHeader>
            <span className="sr-only">Actions</span>
          </TableHeader>
        )}
      </TableHead>
      <TableBody>
        {group.subjects.map((subject) => (
          <TableRow key={subject.id}>
            <TableCell>
              <span className={codeChipClassName}>{subject.code}</span>
            </TableCell>
            <TableCell>{subject.title}</TableCell>
            <TableCell className="text-center tabular-nums">{subject.units}</TableCell>
            <TableCell className="text-center">
              {subject.prerequisites.length > 0 ? (
                <div className="flex flex-wrap justify-center gap-1">
                  {subject.prerequisites.map((code) => (
                    <span key={code} className={codeChipClassName}>
                      {code}
                    </span>
                  ))}
                </div>
              ) : (
                <span className="text-slate-400 dark:text-slate-500">—</span>
              )}
            </TableCell>
            {manageable && (
              <TableCell>
                <div className="flex justify-end gap-1">
                  {onEdit && (
                    <button
                      type="button"
                      onClick={() => onEdit(subject)}
                      aria-label={`Edit ${subject.code}`}
                      title="Edit"
                      className={actionButtonClassName}
                    >
                      <EditIcon />
                    </button>
                  )}
                  {onArchive && (
                    <button
                      type="button"
                      onClick={() => onArchive(subject)}
                      aria-label={`Archive ${subject.code}`}
                      title="Archive"
                      className={archiveActionButtonClassName}
                    >
                      <ArchiveIcon />
                    </button>
                  )}
                </div>
              </TableCell>
            )}
          </TableRow>
        ))}
      </TableBody>
      <tfoot>
        <tr className="border-t-2 border-slate-300 dark:border-white/10">
          <td colSpan={2} className="px-4 py-2.5 font-semibold text-slate-500 dark:text-slate-400">
            Total Units
          </td>
          <td className="px-4 py-2.5 text-center font-semibold tabular-nums text-navy-700 dark:text-mist-100">
            {group.totalUnits}
          </td>
          <td />
          {manageable && <td />}
        </tr>
      </tfoot>
    </Table>
  );
}
