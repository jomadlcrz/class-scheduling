import type { Room } from "~/types/room";
import { ROOM_STATUS_LABELS } from "~/types/room";

type FacilityUtilizationProps = {
  rooms: Room[];
};

type StatusCount = { status: string; count: number; color: string };

export function FacilityUtilization({ rooms }: FacilityUtilizationProps) {
  const counts: StatusCount[] = [
    { status: ROOM_STATUS_LABELS.vacant, count: rooms.filter((r) => r.status === "vacant").length, color: "bg-emerald-500" },
    { status: ROOM_STATUS_LABELS.occupied, count: rooms.filter((r) => r.status === "occupied").length, color: "bg-gold-400" },
    { status: ROOM_STATUS_LABELS.maintenance, count: rooms.filter((r) => r.status === "maintenance").length, color: "bg-red-400" },
  ];

  const total = rooms.length;

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 dark:border-white/10 dark:bg-white/3">
      <h2 className="font-body text-sm font-semibold text-navy-700 dark:text-white">
        Room Status Overview
      </h2>
      <p className="mt-0.5 font-body text-xs text-slate-400 dark:text-slate-500">
        {total} room{total !== 1 ? "s" : ""} across all buildings
      </p>

      <div className="mt-4 flex gap-1 overflow-hidden rounded-full">
        {counts.map((c) =>
          c.count > 0 ? (
            <div
              key={c.status}
              role="presentation"
              title={`${c.status}: ${c.count}`}
              className={`h-3 ${c.color}`}
              style={{ width: `${(c.count / total) * 100}%` }}
            />
          ) : null,
        )}
      </div>

      <div className="mt-3 flex flex-wrap gap-4">
        {counts.map((c) => (
          <div key={c.status} className="flex items-center gap-1.5">
            <span className={`inline-block size-2.5 rounded-full ${c.color}`} aria-hidden="true" />
            <span className="font-body text-xs text-slate-600 dark:text-slate-300">
              {c.status}
            </span>
            <span className="font-body text-xs font-semibold text-navy-700 dark:text-white">
              {c.count}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
