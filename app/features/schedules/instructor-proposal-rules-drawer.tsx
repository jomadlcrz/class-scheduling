import { useState } from "react";
import { Button } from "~/components/ui/button";
import { Drawer } from "~/components/ui/drawer";
import { InfoCircleIcon } from "~/components/ui/icons";
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

      <Drawer
        open={open}
        onClose={() => setOpen(false)}
        title="Shift Request Rules"
        zIndex={70}
        footer={
          <Button
            type="button"
            variant="primary"
            block={false}
            onClick={() => setOpen(false)}
          >
            Got it
          </Button>
        }
      >
        <div className="space-y-6 font-body text-xs text-slate-600 dark:text-slate-300">
          <section className="space-y-2">
            <h3 className="font-semibold text-navy-800 dark:text-mist-100">1. Placement &amp; Dragging</h3>
            <p>
              Click and drag over empty timetable cells (Monday through Saturday, 7:00 AM to 9:00 PM) to select a new time slot for a class.
            </p>
            <p>
              Sessions cannot overlap with your other placed classes or protected schedules.
            </p>
          </section>

          <section className="space-y-2">
            <h3 className="font-semibold text-navy-800 dark:text-mist-100">2. Classrooms &amp; Mode</h3>
            <p>
              Face-to-Face and Hybrid classes require selecting a valid room preference. Online and Asynchronous classes do not require a room.
            </p>
          </section>

          <section className="space-y-2">
            <h3 className="font-semibold text-navy-800 dark:text-mist-100">3. Review &amp; Submission</h3>
            <p>
              After editing, review your changes and provide a clear justification. Once submitted, your shift request will be routed to your Dean and Registrar for approval.
            </p>
          </section>
        </div>
      </Drawer>
    </>
  );
}
