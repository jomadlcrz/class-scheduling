import { StatCard } from "~/components/ui/stat-card";
import type { LabAnalysisTotals } from "~/types/lab-analysis";

/** Term totals, with slot capacity treated as the binding constraint. */
export function LabAnalysisStats({ totals }: { totals: LabAnalysisTotals }) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
      <StatCard label="Laboratories" value={totals.laboratories} />
      <StatCard label="Slots used" value={`${totals.slotsUsed}/${totals.slotCapacity}`} />
      <StatCard label="Slot utilization" value={`${totals.slotUtilizationPercent}%`} />
      <StatCard label="Booked hours" value={`${totals.bookedHours}h`} />
      <StatCard
        label="Fully booked"
        value={`${totals.fullyBookedLaboratories}/${totals.laboratories}`}
      />
      <StatCard label="Conflicts" value={totals.conflicts} />
    </div>
  );
}
