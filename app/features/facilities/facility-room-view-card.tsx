import { Badge } from "~/components/ui/badge";
import { Card } from "~/components/ui/card";
import { ClockIcon, DoorOpenIcon, UserSmallIcon } from "~/components/ui/icons";
import { Tooltip } from "~/components/ui/tooltip";
import type { FacilityRoomDetail } from "~/types/facility";
import { ROOM_STATUS_TONES } from "~/types/room";

type FacilityRoomViewCardProps = {
  room: FacilityRoomDetail;
};

const metricClassName =
  "min-w-0 rounded-lg border border-slate-200 bg-slate-50/70 px-3 py-2.5 dark:border-white/10 dark:bg-white/5";

export function FacilityRoomViewCard({ room }: FacilityRoomViewCardProps) {
  const isGeneralPurpose = room.programs.length === 0;

  return (
    <Card className="group flex h-full min-w-0 flex-col p-4 transition-colors duration-150 hover:border-slate-400 dark:hover:border-white/20">
      <div className="flex min-w-0 items-start gap-3">
        <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-slate-100 text-navy-700 dark:bg-white/10 dark:text-slate-300">
          <DoorOpenIcon />
        </span>
        <div className="min-w-0 flex-1">
          <h3
            title={room.name}
            className="truncate font-body text-sm font-semibold text-navy-700 dark:text-mist-100"
          >
            {room.name}
          </h3>
          <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
            <Badge tone={ROOM_STATUS_TONES[room.status] ?? "slate"}>{room.status}</Badge>
            <span className="font-body text-xs text-slate-500 dark:text-slate-400">
              Floor {room.floor}
            </span>
          </div>
        </div>
      </div>

      <dl className="mt-4 grid grid-cols-[minmax(0,1fr)_5.5rem] gap-2.5">
        <div className={metricClassName}>
          <dt className="font-body text-[0.7rem] uppercase tracking-wide text-slate-500 dark:text-slate-400">
            Room type
          </dt>
          <dd
            title={room.type}
            className="mt-1 font-body text-sm font-medium text-navy-700 dark:text-mist-100"
          >
            {room.type}
          </dd>
        </div>
        <div className={metricClassName}>
          <dt className="flex items-center gap-1.5 font-body text-[0.7rem] uppercase tracking-wide text-slate-500 dark:text-slate-400">
            <UserSmallIcon size={12} />
            Capacity
          </dt>
          <dd className="mt-1 font-body text-sm font-medium text-navy-700 dark:text-mist-100">
            {room.capacity}
          </dd>
        </div>
      </dl>

      <div className="mt-4 border-t border-slate-200 pt-3 dark:border-white/10">
        <div className="flex items-center justify-between gap-2">
          <p className="font-body text-[0.7rem] uppercase tracking-wide text-slate-500 dark:text-slate-400">
            Assigned programs
          </p>
          {room.timeRemaining && (
            <Tooltip label={room.timeRemaining} direction="top" wrap>
              <span
                aria-label={room.timeRemaining}
                className="grid size-6 shrink-0 place-items-center rounded-full text-slate-400 dark:text-slate-500"
              >
                <ClockIcon size={13} />
              </span>
            </Tooltip>
          )}
        </div>
        <div className="mt-2 flex flex-wrap gap-1.5">
          {isGeneralPurpose ? (
            <Badge tone="slate">General access</Badge>
          ) : (
            room.programs.map((program) => (
              <Tooltip key={program.programId} label={program.programName} direction="top" wrap>
                <span>
                  <Badge tone="violet">{program.programAbbrev}</Badge>
                </span>
              </Tooltip>
            ))
          )}
        </div>
      </div>
    </Card>
  );
}
