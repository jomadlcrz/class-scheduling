import { Badge } from "~/components/ui/badge";
import { EditIcon, TrashIcon } from "~/components/ui/icons";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "~/components/ui/table";
import { getBuildingTone } from "~/types/building";
import type { Room } from "~/types/room";
import { ROOM_STATUS_TONES } from "~/types/room";

type RoomTableProps = {
  rooms: Room[];
  onEdit: (room: Room) => void;
  onDelete: (room: Room) => void;
};

const actionButtonClassName =
  "grid size-8 cursor-pointer place-items-center rounded-lg text-slate-400 transition-colors duration-150 hover:bg-slate-200/60 hover:text-navy-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-400 dark:text-slate-500 dark:hover:bg-white/10 dark:hover:text-white";

export function RoomTable({ rooms, onEdit, onDelete }: RoomTableProps) {
  return (
    <Table>
      <TableHead>
        <TableHeader>Room</TableHeader>
        <TableHeader>Building</TableHeader>
        <TableHeader className="hidden sm:table-cell text-center">Floor</TableHeader>
        <TableHeader className="hidden md:table-cell text-center">Capacity</TableHeader>
        <TableHeader className="hidden sm:table-cell">Type</TableHeader>
        <TableHeader>Status</TableHeader>
        <TableHeader>
          <span className="sr-only">Actions</span>
        </TableHeader>
      </TableHead>
      <TableBody>
        {rooms.map((room) => (
          <TableRow key={room.id}>
            <TableCell>
              <span className="font-medium text-navy-700 dark:text-white">{room.name}</span>
            </TableCell>
            <TableCell>
              <Badge tone={getBuildingTone(room.buildingName)}>{room.buildingName}</Badge>
            </TableCell>
            <TableCell className="hidden sm:table-cell text-center">{room.floor}</TableCell>
            <TableCell className="hidden md:table-cell text-center">{room.capacity}</TableCell>
            <TableCell className="hidden sm:table-cell">{room.type}</TableCell>
            <TableCell>
              <Badge tone={ROOM_STATUS_TONES[room.status] ?? "slate"}>{room.status}</Badge>
            </TableCell>
            <TableCell>
              <div className="flex justify-end gap-1">
                <button
                  type="button"
                  onClick={() => onEdit(room)}
                  aria-label={`Edit ${room.name}`}
                  title="Edit"
                  className={actionButtonClassName}
                >
                  <EditIcon />
                </button>
                <button
                  type="button"
                  onClick={() => onDelete(room)}
                  aria-label={`Delete ${room.name}`}
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
