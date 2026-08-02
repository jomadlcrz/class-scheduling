import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { RoleGuard } from "~/auth/role-guard";
import { Button } from "~/components/ui/button";
import { Spinner } from "~/components/ui/spinner";
import { PlusIcon } from "~/components/ui/icons";
import { FacilitiesViewWorkspace } from "~/features/facilities/facilities-view-workspace";
import { PageHeader } from "~/layouts/page-header";
import { enumService } from "~/services/enum.service";
import { facilityService } from "~/services/facility.service";
import { programService } from "~/services/program.service";
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
  const [buildings, setBuildings] = useState<FacilityBuildingDetail[] | null>(null);
  const [programs, setPrograms] = useState<Program[]>([]);
  const [roomTypes, setRoomTypes] = useState<string[]>([]);
  const [roomStatuses, setRoomStatuses] = useState<string[]>([]);

  useEffect(() => {
    facilityService.list().then(setBuildings).catch(() => setBuildings([]));
    programService.list().then(setPrograms).catch(() => setPrograms([]));
    enumService
      .getOptions()
      .then((options) => {
        setRoomTypes(options.roomType);
        setRoomStatuses(options.classroomStatus);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!buildings?.length || selectedBuildingId !== null) return;
    setSelectedBuildingId(buildings[0].id);
  }, [buildings, selectedBuildingId]);

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
    </div>
  );
}
