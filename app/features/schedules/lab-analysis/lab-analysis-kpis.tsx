import { AlertTriangleIcon, ChartIcon, ClockIconLarge, DoorOpenIcon, LayoutGridIcon } from "~/components/ui/icons";
import { ScheduleKpiCard } from "~/features/schedules/schedule-kpi-card";
import type { LabAnalysisTotals } from "~/types/lab-analysis";

/**
 * Term totals. Slot capacity is the binding constraint — hours can read
 * well under 100% while every configured window is already taken.
 */
export function LabAnalysisKpis({ totals }: { totals: LabAnalysisTotals }) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
      <ScheduleKpiCard icon={<DoorOpenIcon />} label="Laboratories" value={totals.laboratories} />
      <ScheduleKpiCard
        icon={<LayoutGridIcon />}
        label="Slots Used"
        value={`${totals.slotsUsed}/${totals.slotCapacity}`}
      />
      <ScheduleKpiCard
        icon={<ChartIcon />}
        label="Slot Utilization"
        value={`${totals.slotUtilizationPercent}%`}
      />
      <ScheduleKpiCard icon={<ClockIconLarge />} label="Booked Hours" value={`${totals.bookedHours}h`} />
      <ScheduleKpiCard
        icon={<DoorOpenIcon />}
        label="Fully Booked"
        value={`${totals.fullyBookedLaboratories}/${totals.laboratories}`}
      />
      <ScheduleKpiCard
        icon={<AlertTriangleIcon />}
        label="Conflicts"
        value={totals.conflicts}
      />
    </div>
  );
}
