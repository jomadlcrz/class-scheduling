import { Badge } from "~/components/ui/badge";
import type { Building } from "~/types/building";
import type { Room } from "~/types/room";
import { ROOM_STATUS_LABELS, ROOM_TYPE_LABELS } from "~/types/room";

type FacilityTableProps = {
  rooms: Room[];
  buildings: Building[];
};

const STATUS_TONES = {
  vacant: "emerald",
  occupied: "gold",
  maintenance: "red",
} as const;

export function FacilityTable({ rooms, buildings }: FacilityTableProps) {
  return (
    <div className="flex flex-col gap-4">
      {buildings.map((building) => {
        const buildingRooms = rooms.filter((r) => r.buildingId === building.id);
        if (buildingRooms.length === 0) return null;

        return (
          <div
            key={building.id}
            className="overflow-hidden rounded-xl border border-slate-200 bg-white dark:border-white/10 dark:bg-white/3"
          >
            <div className="flex items-center justify-between border-b border-slate-100 px-5 py-3 dark:border-white/8">
              <span className="font-body text-sm font-semibold text-navy-700 dark:text-mist-100">
                {building.name}
              </span>
              <span className="font-body text-xs text-slate-400 dark:text-slate-500">
                {building.code} · {buildingRooms.length} room{buildingRooms.length !== 1 ? "s" : ""}
              </span>
            </div>
            <table className="w-full font-body text-sm">
              <thead>
                <tr className="border-b border-slate-50 dark:border-white/5">
                  <th className="px-5 py-2.5 text-left font-medium text-slate-400 dark:text-slate-500">Room</th>
                  <th className="px-5 py-2.5 text-left font-medium text-slate-400 dark:text-slate-500">Floor</th>
                  <th className="px-5 py-2.5 text-left font-medium text-slate-400 dark:text-slate-500">Type</th>
                  <th className="px-5 py-2.5 text-right font-medium text-slate-400 dark:text-slate-500">Capacity</th>
                  <th className="px-5 py-2.5 text-left font-medium text-slate-400 dark:text-slate-500">Status</th>
                </tr>
              </thead>
              <tbody>
                {buildingRooms.map((room) => (
                  <tr
                    key={room.id}
                    className="border-b border-slate-50 last:border-0 dark:border-white/5"
                  >
                    <td className="px-5 py-2.5 font-medium text-navy-700 dark:text-slate-200">{room.name}</td>
                    <td className="px-5 py-2.5 text-slate-500 dark:text-slate-400">Floor {room.floor}</td>
                    <td className="px-5 py-2.5 text-slate-600 dark:text-slate-300">{ROOM_TYPE_LABELS[room.type]}</td>
                    <td className="px-5 py-2.5 text-right tabular-nums text-slate-500 dark:text-slate-400">{room.capacity}</td>
                    <td className="px-5 py-2.5">
                      <Badge tone={STATUS_TONES[room.status]}>
                        {ROOM_STATUS_LABELS[room.status]}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );
      })}
    </div>
  );
}
