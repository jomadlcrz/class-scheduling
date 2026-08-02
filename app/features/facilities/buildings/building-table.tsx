import { ArchiveIcon } from "~/components/ui/icons";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "~/components/ui/table";
import type { Building } from "~/types/building";

type BuildingTableProps = {
  buildings: Building[];
  onArchive: (building: Building) => void;
};

const actionButtonClassName =
  "grid size-8 cursor-pointer place-items-center rounded-lg text-slate-400 transition-colors duration-150 hover:bg-slate-200/60 hover:text-navy-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-400 dark:text-slate-500 dark:hover:bg-white/10 dark:hover:text-white";

export function BuildingTable({ buildings, onArchive }: BuildingTableProps) {
  return (
    <Table>
      <TableHead>
        <TableHeader>Building Name</TableHeader>
        <TableHeader className="hidden sm:table-cell text-center">Floors</TableHeader>
        <TableHeader>
          <span className="sr-only">Actions</span>
        </TableHeader>
      </TableHead>
      <TableBody>
        {buildings.map((building) => (
          <TableRow key={building.id}>
            <TableCell>
              <span className="font-medium text-navy-700 dark:text-mist-100">{building.name}</span>
            </TableCell>
            <TableCell className="hidden sm:table-cell text-center">{building.floorCount}</TableCell>
            <TableCell>
              <div className="flex justify-end gap-1">
                <button
                  type="button"
                  onClick={() => onArchive(building)}
                  aria-label={`Archive ${building.name}`}
                  title="Archive"
                  className={actionButtonClassName}
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
