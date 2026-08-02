import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router";
import { RoleGuard } from "~/auth/role-guard";
import { Button } from "~/components/ui/button";
import { Spinner } from "~/components/ui/spinner";
import { TabList } from "~/components/ui/tabs";
import { BuildingViewWorkspace } from "~/features/facilities/building-view-workspace";
import { RoomsViewWorkspace } from "~/features/facilities/rooms-view-workspace";
import { PlusIcon } from "~/components/ui/icons";
import { PageHeader } from "~/layouts/page-header";
import { enumService } from "~/services/enum.service";
import { facilityService } from "~/services/facility.service";
import { programService } from "~/services/program.service";
import type { FacilityBuildingDetail } from "~/types/facility";
import type { Program } from "~/types/program";

type FacilitiesTab = "buildings" | "rooms";

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
  const [searchParams, setSearchParams] = useSearchParams();
  const tab: FacilitiesTab = searchParams.get("tab") === "rooms" ? "rooms" : "buildings";

  const [buildings, setBuildings] = useState<FacilityBuildingDetail[] | null>(null);
  const [programs, setPrograms] = useState<Program[]>([]);
  const [roomTypes, setRoomTypes] = useState<string[]>([]);
  const [roomStatuses, setRoomStatuses] = useState<string[]>([]);

  const selectedBuildingId = useMemo(() => {
    const raw = searchParams.get("buildingId");
    const parsed = raw ? Number(raw) : NaN;
    return Number.isFinite(parsed) ? parsed : null;
  }, [searchParams]);

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
    if (!buildings?.length || selectedBuildingId) return;
    setSearchParams(
      (current) => {
        const next = new URLSearchParams(current);
        next.set("buildingId", String(buildings[0].id));
        return next;
      },
      { replace: true },
    );
  }, [buildings, selectedBuildingId, setSearchParams]);

  function setTab(nextTab: FacilitiesTab) {
    setSearchParams(
      (current) => {
        const next = new URLSearchParams(current);
        if (nextTab === "buildings") next.delete("tab");
        else next.set("tab", nextTab);
        return next;
      },
      { replace: true },
    );
  }

  function setSelectedBuildingId(buildingId: number) {
    setSearchParams(
      (current) => {
        const next = new URLSearchParams(current);
        next.set("buildingId", String(buildingId));
        return next;
      },
      { replace: true },
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <PageHeader
        title="Facilities"
        description="Browse campus buildings and rooms by floor."
        actions={
          tab === "buildings" ? (
            <Button type="button" block={false} onClick={() => navigate("/facilities/new")}>
              <PlusIcon />
              New Building
            </Button>
          ) : undefined
        }
      />

      <div className="mt-6 flex flex-col gap-6">
        <TabList
          ariaLabel="Facilities views"
          tabs={[
            { value: "buildings", label: "Buildings" },
            { value: "rooms", label: "Rooms" },
          ]}
          value={tab}
          onChange={setTab}
        />

        {buildings === null ? (
          <div
            role="status"
            aria-label="Loading facilities"
            className="grid place-items-center py-12 text-navy-700 dark:text-slate-200"
          >
            <Spinner />
          </div>
        ) : tab === "buildings" ? (
          <BuildingViewWorkspace
            buildings={buildings}
            programs={programs}
            selectedBuildingId={selectedBuildingId}
            onBuildingChange={setSelectedBuildingId}
          />
        ) : (
          <RoomsViewWorkspace
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
