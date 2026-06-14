import { useEffect, useState } from "react";
import { RoleGuard } from "../../auth/role-guard";
import { Spinner } from "../../components/ui/spinner";
import { FacilityTable } from "../../features/facilities/facility-table";
import { FacilityTypeTable } from "../../features/facilities/facility-types/facility-type-table";
import { FacilityUtilization } from "../../features/facilities/utilization/facility-utilization";
import { PageHeader } from "../../layouts/page-header";
import { buildingService } from "../../services/building.service";
import { roomService } from "../../services/room.service";
import type { Building } from "../../types/building";
import type { Room } from "../../types/room";

export function meta() {
  return [
    { title: "Facilities — GWC Class Scheduling" },
    { name: "description", content: "Overview of all rooms and their current utilization." },
  ];
}

export default function FacilitiesRoute() {
  return (
    <RoleGuard allow={["admin", "registrar"]}>
      <FacilitiesPage />
    </RoleGuard>
  );
}

function FacilitiesPage() {
  const [rooms, setRooms] = useState<Room[] | null>(null);
  const [buildings, setBuildings] = useState<Building[] | null>(null);

  useEffect(() => {
    Promise.all([roomService.list(), buildingService.list()]).then(([r, b]) => {
      setRooms(r);
      setBuildings(b);
    });
  }, []);

  const isLoading = rooms === null || buildings === null;

  return (
    <>
      <PageHeader
        title="Facilities"
        description="Room utilization and facility type overview."
      />

      {isLoading ? (
        <div
          role="status"
          aria-label="Loading facilities"
          className="mt-6 grid place-items-center py-12 text-navy-700 dark:text-slate-200"
        >
          <Spinner />
        </div>
      ) : (
        <div className="mt-6 flex flex-col gap-6">
          <FacilityUtilization rooms={rooms} />

          <section aria-labelledby="rooms-by-building-heading">
            <h2
              id="rooms-by-building-heading"
              className="mb-3 font-sans text-sm font-semibold text-navy-700 dark:text-white"
            >
              Rooms by Building
            </h2>
            <FacilityTable rooms={rooms} buildings={buildings} />
          </section>

          <section aria-labelledby="facility-types-heading">
            <h2
              id="facility-types-heading"
              className="mb-3 font-sans text-sm font-semibold text-navy-700 dark:text-white"
            >
              Facility Types
            </h2>
            <FacilityTypeTable />
          </section>
        </div>
      )}
    </>
  );
}
