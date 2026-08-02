import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { toast } from "sonner";
import { RoleGuard } from "~/auth/role-guard";
import { EmptyState } from "~/components/feedback/empty-state";
import { Button } from "~/components/ui/button";
import { Card } from "~/components/ui/card";
import { Spinner } from "~/components/ui/spinner";
import { PlusIcon, RefreshCwIcon } from "~/components/ui/icons";
import { BuildingArchiveDialog } from "~/features/facilities/buildings/building-archive-dialog";
import { FacilitiesViewWorkspace } from "~/features/facilities/facilities-view-workspace";
import { PageHeader } from "~/layouts/page-header";
import { buildingService } from "~/services/building.service";
import { enumService } from "~/services/enum.service";
import { facilityService } from "~/services/facility.service";
import { programService } from "~/services/program.service";
import type { FacilityBuildingDetail } from "~/types/facility";
import type { Building } from "~/types/building";
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
  const [buildings, setBuildings] = useState<FacilityBuildingDetail[] | null>(null);
  const [programs, setPrograms] = useState<Program[]>([]);
  const [roomTypes, setRoomTypes] = useState<string[]>([]);
  const [roomStatuses, setRoomStatuses] = useState<string[]>([]);
  const [archiveTarget, setArchiveTarget] = useState<Building | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  async function refresh() {
    setLoadError(null);
    let data: FacilityBuildingDetail[];
    try {
      data = await facilityService.list();
    } catch (error) {
      setBuildings([]);
      setLoadError(error instanceof Error ? error.message : "");
      return;
    }
    setBuildings(data);
    setSelectedBuildingId((current) => {
      if (data.length === 0) return null;
      if (current === null || !data.some((b) => b.id === current)) return data[0].id;
      return current;
    });
  }

  useEffect(() => {
    void refresh();
    programService.list().then(setPrograms).catch(() => setPrograms([]));
    enumService
      .getOptions()
      .then((options) => {
        setRoomTypes(options.roomType);
        setRoomStatuses(options.classroomStatus);
      })
      .catch(() => {});
  }, []);

  async function handleArchiveBuilding(building: Building) {
    const message = await buildingService.archive(building.id, building.name);
    if (message) toast.success(message);
    setArchiveTarget(null);
    await refresh();
  }

  return (
    <div className="mx-auto max-w-[1600px] px-4 py-8 sm:px-6">
      <PageHeader
        title="Facilities"
        description="Browse campus buildings and rooms by floor."
        actions={
          <Button type="button" block={false} onClick={() => navigate("/facilities/new")}>
            <PlusIcon />
            New Facility
          </Button>
        }
      />

      <div className="mt-6">
        {buildings === null ? (
          <div
            role="status"
            aria-label="Loading facilities"
            className="grid place-items-center py-12 text-navy-700 dark:text-slate-200"
          >
            <Spinner />
          </div>
        ) : loadError !== null ? (
          <Card className="p-2">
            <EmptyState
              title="Unable to load facilities"
              action={
                <Button
                  type="button"
                  variant="outline"
                  block={false}
                  onClick={() => {
                    setBuildings(null);
                    void refresh();
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
