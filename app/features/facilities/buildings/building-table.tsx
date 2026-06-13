import { Badge } from "../../../components/ui/badge";
import { EditIcon, TrashIcon } from "../../../components/ui/icons";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../../../components/ui/table";
import { getBuildingTone, type Building } from "../../../types/building";

type BuildingTableProps = {
  buildings: Building[];
  onEdit: (building: Building) => void;
  onDelete: (building: Building) => void;
};

const actionButtonClassName =
  "grid size-8 cursor-pointer place-items-center rounded-lg text-slate-400 transition-colors duration-150 hover:bg-slate-200/60 hover:text-navy-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-400 dark:text-slate-500 dark:hover:bg-white/10 dark:hover:text-white";

export function BuildingTable({ buildings, onEdit, onDelete }: BuildingTableProps) {
  return (
    <Table>
      <TableHead>
        <TableHeader>Name</TableHeader>
        <TableHeader>Code</TableHeader>
        <TableHeader className="hidden sm:table-cell">Floors</TableHeader>
        <TableHeader>
          <span className="sr-only">Actions</span>
        </TableHeader>
      </TableHead>
      <TableBody>
        {buildings.map((building) => (
          <TableRow key={building.id}>
            <TableCell>
              <span className="font-medium text-navy-700 dark:text-white">{building.name}</span>
            </TableCell>
            <TableCell>
              <Badge tone={getBuildingTone(building.code)}>{building.code}</Badge>
            </TableCell>
            <TableCell className="hidden sm:table-cell">{building.floorCount}</TableCell>
            <TableCell>
              <div className="flex justify-end gap-1">
                <button
                  type="button"
                  onClick={() => onEdit(building)}
                  aria-label={`Edit ${building.name}`}
                  title="Edit"
                  className={actionButtonClassName}
                >
                  <EditIcon />
                </button>
                <button
                  type="button"
                  onClick={() => onDelete(building)}
                  aria-label={`Delete ${building.name}`}
                  title="Delete"
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
