import { Card } from "~/components/ui/card";
import { Badge } from "~/components/ui/badge";
import type { LabProgramAccessRow } from "~/types/lab-analysis";

export function LabProgramAccessCards({ programs }: { programs: LabProgramAccessRow[] }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {programs.map((program) => (
        <Card key={program.programId} className="flex flex-col gap-2 p-4">
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="font-body text-sm font-semibold tracking-wide text-navy-700 dark:text-mist-100">
                {program.programAbbrev ?? "—"}
              </p>
              <p className="font-body text-xs text-slate-500 dark:text-slate-400">{program.programName}</p>
            </div>
            <Badge tone={program.canScheduleALabClass ? "emerald" : "red"}>
              {program.canScheduleALabClass ? "Can schedule" : "No slot free"}
            </Badge>
          </div>

          <p className="font-display text-2xl tracking-wide text-navy-700 dark:text-mist-100">
            {program.slotsFree}
            <span className="ml-1 font-body text-sm font-normal text-slate-400 dark:text-slate-500">
              / {program.slotCapacity} windows free
            </span>
          </p>

          <p className="font-body text-xs text-slate-500 dark:text-slate-400">{program.summary}</p>

          {program.laboratories.length > 0 && (
            <ul className="mt-1 flex flex-col gap-1 border-t border-slate-200 pt-2 dark:border-white/10">
              {program.laboratories.map((lab) => (
                <li
                  key={lab.roomId}
                  className="flex items-center justify-between font-body text-xs text-slate-600 dark:text-slate-300"
                >
                  <span>{lab.roomName}</span>
                  <span className={lab.slotsFree === 0 ? "text-red-600 dark:text-red-400" : "text-green-700 dark:text-emerald-400"}>
                    {lab.slotsFree === 0 ? "Full" : `${lab.slotsFree} free`}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Card>
      ))}
    </div>
  );
}
