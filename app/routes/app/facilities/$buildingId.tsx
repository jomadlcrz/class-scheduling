import { useCallback, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router";
import { toast } from "sonner";
import { RoleGuard } from "~/auth/role-guard";
import { Spinner } from "~/components/ui/spinner";
import { EditBuildingWorkspace } from "~/features/facilities/edit-building-workspace";
import { useRefreshOnFocus } from "~/hooks/use-refresh-on-focus";
import { buildingService } from "~/services/building.service";
import { enumService } from "~/services/enum.service";
import { facilityService } from "~/services/facility.service";
import { programService } from "~/services/program.service";
import { roomService } from "~/services/room.service";
import type { AddBuildingRoomsInput, FacilityBuildingDetail } from "~/types/facility";
import type { Program } from "~/types/program";
import type { Room, UpdateRoomInput } from "~/types/room";
import type { UpdateBuildingInput } from "~/types/building";

export function meta() {
  return [
    { title: "Manage Building — GWC Class Scheduling" },
    { name: "description", content: "Add or archive rooms in a campus building." },
  ];
}

export default function EditBuildingRoute() {
  return (
    <RoleGuard allow={["admin", "registrar"]}>
      <EditBuildingPage />
    </RoleGuard>
  );
}

function EditBuildingPage() {
  const navigate = useNavigate();
  const { buildingId } = useParams();
  const id = Number(buildingId);

  const [building, setBuilding] = useState<FacilityBuildingDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [programs, setPrograms] = useState<Program[]>([]);
  const [roomTypes, setRoomTypes] = useState<string[]>([]);

  const refresh = useCallback(async () => {
    if (!Number.isFinite(id)) {
      setBuilding(null);
      return;
    }
    const data = await facilityService.getById(id);
    setBuilding(data);
  }, [id]);

  useRefreshOnFocus(refresh);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      refresh(),
      programService.list().then(setPrograms).catch(() => setPrograms([])),
      enumService
        .getOptions()
        .then((options) => setRoomTypes(options.roomType))
        .catch(() => {}),
    ])
      .catch(() => setBuilding(null))
      .finally(() => setLoading(false));
  }, [refresh]);

  useEffect(() => {
    if (!loading && !building) {
      navigate("/facilities", { replace: true });
    }
  }, [building, loading, navigate]);

  async function handleUpdateBuilding(input: UpdateBuildingInput) {
    const message = await buildingService.update(id, input);
    if (message) toast.success(message);
    await refresh();
  }

  async function handleUpdateRoom(roomId: number, input: UpdateRoomInput) {
    const { message } = await roomService.update(roomId, input);
    if (message) toast.success(message);
    await refresh();
  }

  async function handleAddRooms(input: AddBuildingRoomsInput) {
    const { message, roomCount } = await facilityService.addRooms(id, input);
    if (message) toast.success(message);
    else if (roomCount > 0) toast.success(`${roomCount} room${roomCount === 1 ? "" : "s"} added.`);
    await refresh();
  }

  async function handleArchiveRoom(room: Room) {
    const message = await roomService.archive(room.id, room.name);
    if (message) toast.success(message);
    await refresh();
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-8">
        <div role="status" aria-label="Loading building" className="grid place-items-center py-12">
          <Spinner />
        </div>
      </div>
    );
  }

  if (!building) return null;

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <EditBuildingWorkspace
        building={building}
        roomTypes={roomTypes}
        programs={programs}
        onUpdateBuilding={handleUpdateBuilding}
        onUpdateRoom={handleUpdateRoom}
        onAddRooms={handleAddRooms}
        onArchiveRoom={handleArchiveRoom}
        onCancel={() => navigate("/facilities")}
      />
    </div>
  );
}
