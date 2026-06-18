import { TrashIcon } from "../../components/ui/icons";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../../components/ui/table";
import { YEAR_LEVEL_LABELS } from "../../types/subject";
import type { SubjectOffering } from "../../types/subject-offering";

type OfferingTableProps = {
  offerings: SubjectOffering[];
  onDelete: (offering: SubjectOffering) => void;
};

const actionButtonClassName =
  "grid size-8 cursor-pointer place-items-center rounded-lg text-slate-400 transition-colors duration-150 hover:bg-slate-200/60 hover:text-navy-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-400 dark:text-slate-500 dark:hover:bg-white/10 dark:hover:text-white";

export function OfferingTable({ offerings, onDelete }: OfferingTableProps) {
  return (
    <Table>
      <TableHead>
        <TableHeader>Code</TableHeader>
        <TableHeader>Subject</TableHeader>
        <TableHeader className="hidden sm:table-cell">Program</TableHeader>
        <TableHeader className="hidden md:table-cell">Year Level</TableHeader>
        <TableHeader className="hidden md:table-cell">Units</TableHeader>
        <TableHeader>
          <span className="sr-only">Actions</span>
        </TableHeader>
      </TableHead>
      <TableBody>
        {offerings.map((off) => (
          <TableRow key={off.id}>
            <TableCell>
              <span className="font-mono text-sm font-medium text-navy-700 dark:text-white">
                {off.subjectCode}
              </span>
            </TableCell>
            <TableCell>{off.subjectTitle}</TableCell>
            <TableCell className="hidden sm:table-cell">{off.program}</TableCell>
            <TableCell className="hidden md:table-cell">
              {YEAR_LEVEL_LABELS[off.yearLevel]}
            </TableCell>
            <TableCell className="hidden md:table-cell">{off.units}</TableCell>
            <TableCell>
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={() => onDelete(off)}
                  aria-label={`Remove ${off.subjectCode}`}
                  title="Remove"
                  className={actionButtonClassName}
                >
                  <TrashIcon />
                </button>
              </div>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
