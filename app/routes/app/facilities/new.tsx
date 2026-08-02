import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { toast } from "sonner";
import { RoleGuard } from "~/auth/role-guard";
import { CreateBuildingWorkspace } from "~/features/facilities/create-building-workspace";
import { PageHeader } from "~/layouts/page-header";
import { enumService } from "~/services/enum.service";
import { facilityService } from "~/services/facility.service";
import { programService } from "~/services/program.service";
import type { CreateFacilitiesInput } from "~/types/facility";
import type { Program } from "~/types/program";

export function meta() {
  return [
    { title: "Create Building — GWC Class Scheduling" },
    { name: "description", content: "Create a building with floors and rooms in one submission." },
  ];
}

export default function CreateBuilding() {
  return (
    <RoleGuard allow={["admin", "registrar"]}>
      <CreateBuildingPage />
    </RoleGuard>
  );
}

function CreateBuildingPage() {
  const navigate = useNavigate();
  const [programs, setPrograms] = useState<Program[]>([]);
  const [roomTypes, setRoomTypes] = useState<string[]>([]);

  useEffect(() => {
    programService.list().then(setPrograms).catch(() => setPrograms([]));
    enumService
      .getOptions()
      .then((options) => setRoomTypes(options.roomType))
      .catch(() => {});
  }, []);

  async function handleCreate(input: CreateFacilitiesInput) {
    const message = await facilityService.create(input);
    if (message) toast.success(message);
    navigate("/facilities");
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <PageHeader
        title="Create Building"
        description="Create a new building and define all floors and facility rooms in one submission."
      />

      <div className="mt-6">
        <CreateBuildingWorkspace
          roomTypes={roomTypes}
          programs={programs}
          onSubmit={handleCreate}
          onCancel={() => navigate("/facilities")}
        />
      </div>
    </div>
  );
}
