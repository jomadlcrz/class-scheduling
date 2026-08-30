import { useState } from "react";
import { Button } from "~/components/ui/button";
import { InfoCircleIcon, XIcon } from "~/components/ui/icons";
import type { WeeklyHourAllocation } from "~/types/weekly-hour-allocation";

export function InstructorProposalRulesDrawer({
  allocations = [],
  labTimeSlots = [],
}: {
  allocations?: WeeklyHourAllocation[];
  labTimeSlots?: string[];
}) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button
        type="button"
        variant="outline"
        block={false}
        onClick={() => setOpen(true)}
      >
        <InfoCircleIcon size={14} />
        Rules Reference
      </Button>

      {open && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/40 backdrop-blur-xs">
          <div className="flex h-full w-full max-w-md flex-col border-l border-slate-300 bg-white p-6 shadow-2xl dark:border-white/10 dark:bg-navy-900">
            <div className="flex items-center justify-between border-b border-slate-200 pb-4 dark:border-white/10">
              <h2 className="font-display text-lg tracking-wide text-navy-800 dark:text-mist-100">
                Shift Request Rules
              </h2>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="cursor-pointer rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-white/5 dark:hover:text-slate-200"
              >
                <XIcon size={18} />
              </button>
            </div>

            <div className="mt-4 flex-1 space-y-6 overflow-y-auto font-body text-xs text-slate-600 dark:text-slate-300">
              <section className="space-y-2">
                <h3 className="font-semibold text-navy-800 dark:text-mist-100">1. Placement & Dragging</h3>
                <p>
                  Click and drag over empty timetable cells (Monday through Saturday, 7:00 AM to 9:00 PM) to select a new time slot for a class.
                </p>
                <p>
                  Sessions cannot overlap with your other placed classes or protected schedules.
                </p>
              </section>

              <section className="space-y-2">
                <h3 className="font-semibold text-navy-800 dark:text-mist-100">2. Classrooms & Mode</h3>
                <p>
                  Face-to-Face and Hybrid classes require selecting a valid room preference. Online and Asynchronous classes do not require a room.
                </p>
              </section>

              <section className="space-y-2">
                <h3 className="font-semibold text-navy-800 dark:text-mist-100">3. Review & Submission</h3>
                <p>
                  After editing, review your changes and provide a clear justification. Once submitted, your shift request will be routed to your Dean and Registrar for approval.
                </p>
              </section>
            </div>

            <div className="border-t border-slate-200 pt-4 dark:border-white/10">
              <Button type="button" variant="primary" block onClick={() => setOpen(false)}>
                Got it
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
