import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { toast } from "sonner";
import { RoleGuard } from "~/auth/role-guard";
import { EmptyState } from "~/components/feedback/empty-state";
import { Button } from "~/components/ui/button";
import { Card } from "~/components/ui/card";
import { FacilitiesSkeleton } from "~/components/ui/skeleton";
import { PlusIcon, RefreshCwIcon } from "~/components/ui/icons";
import { BuildingArchiveDialog } from "~/features/facilities/buildings/building-archive-dialog";
import { FacilitiesViewWorkspace } from "~/features/facilities/facilities-view-workspace";
import { useCachedData } from "~/hooks/use-cached-data";
import { useRefreshOnFocus } from "~/hooks/use-refresh-on-focus";
import { PageHeader } from "~/layouts/page-header";
import { buildingService } from "~/services/building.service";
import { enumService } from "~/services/enum.service";
import { facilityService } from "~/services/facility.service";
import { programService } from "~/services/program.service";
import type { Building } from "~/types/building";
import type { FacilityBuildingDetail } from "~/types/facility";
import type { Program } from "~/types/program";

export function meta() {
  return [
    { title: "Facilities — GWC Class Scheduling" },
    { name: "description", content: "View campus buildings and rooms." },
  ];
}

export default function Facilities() {
  return (
    <RoleGuard allow={["admin", "registrar"]}>
      <FacilitiesPage />
    </RoleGuard>
  );
}

function FacilitiesPage() {
  const navigate = useNavigate();
  const [selectedBuildingId, setSelectedBuildingId] = useState<number | null>(null);
  const { data: buildings, error: loadError, reload: reloadFacilities } = useCachedData(
    "facilities",
    () => facilityService.list(),
  );
  const { data: programsData } = useCachedData("programs", () => programService.list());
  const programs = programsData ?? [];
  const { data: enumOptions } = useCachedData("enums", () => enumService.getOptions());
  const roomTypes = enumOptions?.roomType ?? [];
  const roomStatuses = enumOptions?.classroomStatus ?? [];
  const [archiveTarget, setArchiveTarget] = useState<Building | null>(null);

  // Keep a valid building selected as the list loads or changes.
  useEffect(() => {
    if (!buildings) return;
    setSelectedBuildingId((current) => {
      if (buildings.length === 0) return null;
      if (current === null || !buildings.some((b) => b.id === current)) return buildings[0].id;
      return current;
    });
  }, [buildings]);

  useRefreshOnFocus(reloadFacilities);

  async function handleArchiveBuilding(building: Building) {
    const message = await buildingService.archive(building.id, building.name);
    if (message) toast.success(message);
    setArchiveTarget(null);
    await reloadFacilities();
  }

  return (
    <div className="mx-auto max-w-400 px-4 py-8 sm:px-6">
      <PageHeader
        title="Facilities"

        actions={
          <Button type="button" block={false} onClick={() => navigate("/facilities/new")}>
            <PlusIcon />
            New Facility
          </Button>
        }
      />

      <div className="mt-6">
        {buildings === null ? (
          loadError !== null ? (
            <Card className="p-2">
              <EmptyState
                title="Unable to load facilities"
                action={
                  <Button
                    type="button"
                    variant="outline"
                    block={false}
                    onClick={() => {
                      void reloadFacilities();
                    }}
                  >
                    <RefreshCwIcon />
                    Try again
                  </Button>
                }
              >
                {loadError}
              </EmptyState>
            </Card>
          ) : (
            <FacilitiesSkeleton />
          )
        ) : (
          <FacilitiesViewWorkspace
            buildings={buildings}
            programs={programs}
            roomTypes={roomTypes}
            roomStatuses={roomStatuses}
            selectedBuildingId={selectedBuildingId}
            onBuildingChange={setSelectedBuildingId}
            onManageBuilding={(building) => navigate(`/facilities/${building.id}`)}
            onArchiveBuilding={(building) =>
              setArchiveTarget({
                id: building.id,
                name: building.name,
                floorCount: building.floorCount,
              })
            }
          />
        )}
      </div>

      <BuildingArchiveDialog
        building={archiveTarget}
        onClose={() => setArchiveTarget(null)}
        onConfirm={handleArchiveBuilding}
      />
    </div>
  );
}
