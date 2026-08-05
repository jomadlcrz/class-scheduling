import { Badge } from "~/components/ui/badge";
import { EditIcon, ArchiveIcon } from "~/components/ui/icons";
import { archiveActionButtonClassName } from "~/features/archive/archive-icon-styles";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "~/components/ui/table";
import { departmentLogoSrc, onDepartmentLogoError } from "~/lib/department-logo";
import { getBuildingTone } from "~/types/building";
import { DEPARTMENT_TYPE_TONES } from "~/types/department";
import type { Department } from "~/types/department";

type DepartmentTableProps = {
  departments: Department[];
  onEdit: (department: Department) => void;
  onArchive: (department: Department) => void;
};

export const actionButtonClassName =
  "grid size-8 cursor-pointer place-items-center rounded-lg text-slate-400 transition-colors duration-150 hover:bg-slate-200/60 hover:text-navy-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-400 dark:text-slate-500 dark:hover:bg-white/10 dark:hover:text-white";

export function DepartmentTable({ departments, onEdit, onArchive }: DepartmentTableProps) {
  return (
    <Table>
      <TableHead>
        <TableHeader>Logo &amp; Abbrev</TableHeader>
        <TableHeader>Department Name</TableHeader>
        <TableHeader className="hidden sm:table-cell">Type</TableHeader>
        <TableHeader className="hidden sm:table-cell">Building</TableHeader>
        <TableHeader>
          <span className="sr-only">Actions</span>
        </TableHeader>
      </TableHead>
      <TableBody>
        {departments.map((dept) => (
          <TableRow key={dept.id}>
            <TableCell>
              <div className="flex items-center gap-3">
                <img
                  src={departmentLogoSrc(dept.logoUrl)}
                  alt={`${dept.abbrev} logo`}
                  onError={onDepartmentLogoError}
                  className="size-10 rounded-lg object-contain"
                />
                <div>
                  <span className="font-medium text-navy-700 dark:text-mist-100">{dept.abbrev}</span>
                </div>
              </div>
            </TableCell>
            <TableCell>{dept.name}</TableCell>
            <TableCell className="hidden sm:table-cell">
              <Badge tone={DEPARTMENT_TYPE_TONES[dept.departmentType] ?? "slate"}>
                {dept.departmentType}
              </Badge>
            </TableCell>
            <TableCell className="hidden sm:table-cell">
              <Badge tone={getBuildingTone(dept.buildingName)}>{dept.buildingName}</Badge>
            </TableCell>
            <TableCell>
              <div className="flex justify-end gap-1">
                <button
                  type="button"
                  onClick={() => onEdit(dept)}
                  aria-label={`Edit ${dept.abbrev}`}
                  title="Edit"
                  className={actionButtonClassName}
                >
                  <EditIcon />
                </button>
                <button
                  type="button"
                  onClick={() => onArchive(dept)}
                  aria-label={`Archive ${dept.abbrev}`}
                  title="Archive"
                  className={archiveActionButtonClassName}
                >
                  <ArchiveIcon />
                </button>
              </div>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
