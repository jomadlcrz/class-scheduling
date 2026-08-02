import { Badge } from "~/components/ui/badge";
import { Card } from "~/components/ui/card";
import { ClockIcon } from "~/components/ui/icons";
import { Tooltip } from "~/components/ui/tooltip";
import type { FacilityRoomDetail } from "~/types/facility";
import type { Program } from "~/types/program";
import { ROOM_STATUS_TONES } from "~/types/room";

type FacilityRoomViewCardProps = {
  room: FacilityRoomDetail;
  programs: Program[];
};

const fieldClassName =
  "rounded-lg border border-slate-200 bg-slate-50/80 px-3 py-2 dark:border-white/10 dark:bg-white/5";

export function FacilityRoomViewCard({ room, programs }: FacilityRoomViewCardProps) {
  const assignedPrograms =
    room.programIds.length === 0
      ? [{ abbrev: "General", name: "Open to all programs in this building" }]
      : programs.filter((p) => room.programIds.includes(p.id)).map((p) => ({ abbrev: p.abbrev, name: p.name }));

  return (
    <Card className="flex h-full flex-col p-4">
      <div className="mb-3 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="truncate font-body text-sm font-semibold text-navy-700 dark:text-mist-100">
            {room.name}
          </h3>
          <p className="mt-0.5 font-body text-xs text-slate-500 dark:text-slate-400">Floor {room.floor}</p>
        </div>
        <div className="flex items-center gap-1.5">
          <Badge tone={ROOM_STATUS_TONES[room.status] ?? "slate"}>{room.status}</Badge>
          {room.timeRemaining && (
            <Tooltip label={room.timeRemaining} direction="top" wrap>
              <span
                aria-label={room.timeRemaining}
                className="grid size-5 shrink-0 place-items-center rounded-full text-slate-400 dark:text-slate-500"
              >
                <ClockIcon size={13} />
              </span>
            </Tooltip>
          )}
        </div>
      </div>

      <dl className="flex flex-1 flex-col gap-3">
        <div>
          <dt className="font-body text-xs font-medium text-slate-500 dark:text-slate-400">Room Type</dt>
          <dd className={`${fieldClassName} mt-1 font-body text-sm text-navy-700 dark:text-mist-100`}>
            {room.type}
          </dd>
        </div>
        <div>
          <dt className="font-body text-xs font-medium text-slate-500 dark:text-slate-400">Capacity</dt>
          <dd className={`${fieldClassName} mt-1 font-body text-sm text-navy-700 dark:text-mist-100`}>
            {room.capacity}
          </dd>
        </div>
        <div>
          <dt className="font-body text-xs font-medium text-slate-500 dark:text-slate-400">
            Assigned Programs
          </dt>
          <dd className={`${fieldClassName} mt-1`}>
            <div className="flex flex-wrap gap-1.5">
              {assignedPrograms.map((program) => (
                <Badge key={program.abbrev} tone={program.abbrev === "General" ? "slate" : "violet"}>
                  {program.abbrev}
                </Badge>
              ))}
            </div>
          </dd>
        </div>
      </dl>
    </Card>
  );
}
