import { IconButton } from "~/components/ui/icon-button";
import { EditIcon, ArchiveIcon } from "~/components/ui/icons";
import { archiveActionButtonClassName } from "~/features/archive/archive-icon-styles";
import { departmentLogoUrl, onDepartmentLogoError } from "~/lib/department-logo";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "~/components/ui/table";
import { type Program } from "~/types/program";
import { type ClassSet } from "~/types/set";
import { useYearLevels } from "~/hooks/use-year-levels";

type SetTableProps = {
  sets: ClassSet[];
  programs: Program[];
  onEdit: (set: ClassSet) => void;
  onArchive: (set: ClassSet) => void;
};

export function SetTable({ sets, programs, onEdit, onArchive }: SetTableProps) {
  const { yearLevelLabel } = useYearLevels();
  function getProgram(abbrev: string) {
    return programs.find((p) => p.abbrev === abbrev);
  }

  return (
    <Table>
      <TableHead>
        <TableHeader>Set</TableHeader>
        <TableHeader>Program</TableHeader>
        <TableHeader>Year Level</TableHeader>
        <TableHeader>
          <span className="sr-only">Actions</span>
        </TableHeader>
      </TableHead>
      <TableBody>
        {sets.map((set) => {
          const program = getProgram(set.program);
          return (
            <TableRow key={set.id}>
              <TableCell>
                <span className="font-medium text-navy-700 dark:text-mist-100">{set.setCode}</span>
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-2">
                  {program && (
                    <img
                      src={departmentLogoUrl(program.departmentAbbrev)}
                      alt={`${program.departmentAbbrev} logo`}
                      onError={onDepartmentLogoError}
                      className="size-8 rounded-lg object-contain"
                    />
                  )}
                  <div>
                    <span className="font-medium text-navy-700 dark:text-mist-100">
                      {set.program}
                    </span>
                    {program && (
                      <span className="ml-1.5 text-slate-500 dark:text-slate-400">
                        {program.type}
                      </span>
                    )}
                  </div>
                </div>
              </TableCell>
              <TableCell>{yearLevelLabel(set.yearLevel)}</TableCell>
              <TableCell>
                <div className="flex justify-end gap-1">
                  <IconButton
                    onClick={() => onEdit(set)}
                    label={`Edit set ${set.setCode}`}
                    title="Edit"
                  >
                    <EditIcon />
                  </IconButton>
                  <button
                    type="button"
                    onClick={() => onArchive(set)}
                    aria-label={`Archive set ${set.setCode}`}
                    title="Archive"
                    className={archiveActionButtonClassName}
                  >
                    <ArchiveIcon />
                  </button>
                </div>
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}
