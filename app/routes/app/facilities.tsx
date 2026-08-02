import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { toast } from "sonner";
import { RoleGuard } from "~/auth/role-guard";
import { Button } from "~/components/ui/button";
import { Spinner } from "~/components/ui/spinner";
import { EditIcon, PlusIcon } from "~/components/ui/icons";
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

  async function refresh() {
    const data = await facilityService.list().catch(() => [] as FacilityBuildingDetail[]);
    setBuildings(data);
    setSelectedBuildingId((current) => {
      if (data.length === 0) return null;
      if (current === null || !data.some((b) => b.id === current)) return data[0].id;
      return current;
    });
  }

  useEffect(() => {
    refresh();
    programService.list().then(setPrograms).catch(() => setPrograms([]));
    enumService
      .getOptions()
      .then((options) => {
        setRoomTypes(options.roomType);
        setRoomStatuses(options.classroomStatus);
      })
      .catch(() => {});
  }, []);

  const selectedBuilding =
    buildings?.find((entry) => entry.id === selectedBuildingId) ?? buildings?.[0] ?? null;

  async function handleArchiveBuilding(building: Building) {
    const message = await buildingService.archive(building.id, building.name);
    if (message) toast.success(message);
    setArchiveTarget(null);
    await refresh();
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
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

      {selectedBuilding && buildings && buildings.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-2">
          <Button
            type="button"
            variant="outline"
            block={false}
            onClick={() => navigate(`/facilities/${selectedBuilding.id}`)}
          >
            <EditIcon />
            Manage Building
          </Button>
          <Button
            type="button"
            variant="outline"
            block={false}
            onClick={() =>
              setArchiveTarget({
                id: selectedBuilding.id,
                name: selectedBuilding.name,
                floorCount: selectedBuilding.floorCount,
              })
            }
          >
            Archive Building
          </Button>
        </div>
      )}

      <div className="mt-6">
        {buildings === null ? (
          <div
            role="status"
            aria-label="Loading facilities"
            className="grid place-items-center py-12 text-navy-700 dark:text-slate-200"
          >
            <Spinner />
          </div>
        ) : (
          <FacilitiesViewWorkspace
            buildings={buildings}
            programs={programs}
            roomTypes={roomTypes}
            roomStatuses={roomStatuses}
            selectedBuildingId={selectedBuildingId}
            onBuildingChange={setSelectedBuildingId}
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
