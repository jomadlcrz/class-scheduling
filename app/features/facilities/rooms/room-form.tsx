import { useState } from "react";
import { FormError } from "~/components/forms/form-error";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Select } from "~/components/ui/select";
import { roomSchema } from "~/schemas/room.schema";
import type { Building } from "~/types/building";
import type { CreateRoomInput, Room, RoomStatus, RoomType } from "~/types/room";
import { ROOM_STATUSES, ROOM_STATUS_LABELS, ROOM_TYPES, ROOM_TYPE_LABELS } from "~/types/room";

type RoomFormProps = {
  room?: Room;
  buildings: Building[];
  onSubmit: (input: CreateRoomInput) => Promise<void>;
  onCancel: () => void;
};

export function RoomForm({ room, buildings, onSubmit, onCancel }: RoomFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const isEdit = Boolean(room);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    const buildingId = String(data.get("room-building") ?? "");
    const floor = Number(data.get("room-floor"));
    const name = String(data.get("room-name") ?? "").trim();
    const capacity = Number(data.get("room-capacity"));
    const type = String(data.get("room-type")) as RoomType;
    const status = String(data.get("room-status")) as RoomStatus;

    const result = roomSchema.safeParse({ buildingId, name, floor, capacity, type, status });
    if (!result.success) {
      setError(result.error.issues[0].message);
      return;
    }

    const building = buildings.find((b) => b.id === buildingId);
    if (!building) { setError("Select a building."); return; }

    setError(null);
    setIsLoading(true);
    try {
      await onSubmit({ ...result.data, buildingCode: building.code });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
      setIsLoading(false);
    }
  }

  const defaultBuildingId = room?.buildingId ?? buildings[0]?.id ?? "";

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
      <FormError message={error} />
      <Select id="room-building" label="Building" defaultValue={defaultBuildingId}>
        {buildings.map((b) => (
          <option key={b.id} value={b.id}>
            {b.code} — {b.name}
          </option>
        ))}
      </Select>
      <div className="grid grid-cols-2 gap-3">
        <Input
          id="room-floor"
          label="Floor"
          type="number"
          required
          min={1}
          placeholder="1"
          defaultValue={room?.floor ?? ""}
        />
        <Input
          id="room-capacity"
          label="Capacity"
          type="number"
          required
          min={1}
          placeholder="40"
          defaultValue={room?.capacity ?? ""}
        />
      </div>
      <Input
        id="room-name"
        label="Room Name"
        required
        placeholder="Room 101"
        defaultValue={room?.name ?? ""}
      />
      <Select id="room-type" label="Type" defaultValue={room?.type ?? ROOM_TYPES[0]}>
        {ROOM_TYPES.map((t) => (
          <option key={t} value={t}>
            {ROOM_TYPE_LABELS[t]}
          </option>
        ))}
      </Select>
      <Select id="room-status" label="Status" defaultValue={room?.status ?? "vacant"}>
        {ROOM_STATUSES.map((s) => (
          <option key={s} value={s}>
            {ROOM_STATUS_LABELS[s]}
          </option>
        ))}
      </Select>
      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" block={false} onClick={onCancel}>
          Cancel
        </Button>
        <Button block={false} isLoading={isLoading} loadingLabel="Saving…">
          {isEdit ? "Save Changes" : "Add Room"}
        </Button>
      </div>
    </form>
  );
}
