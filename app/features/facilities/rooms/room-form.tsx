import { useState } from "react";
import { FormError } from "~/components/forms/form-error";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Select } from "~/components/ui/select";
import { roomSchema } from "~/schemas/room.schema";
import type { Building } from "~/types/building";
import type { CreateRoomInput, Room } from "~/types/room";

type RoomFormProps = {
  room?: Room;
  buildings: Building[];
  /** Backend RoomType values (enumService). */
  roomTypes: string[];
  onSubmit: (input: CreateRoomInput) => Promise<void>;
  onCancel: () => void;
};

export function RoomForm({ room, buildings, roomTypes, onSubmit, onCancel }: RoomFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const isEdit = Boolean(room);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    const buildingName = String(data.get("room-building") ?? "").trim();
    const floor = Number(data.get("room-floor"));
    const name = String(data.get("room-name") ?? "").trim();
    const capacity = Number(data.get("room-capacity"));
    const type = String(data.get("room-type") ?? "").trim();

    const result = roomSchema.safeParse({ buildingName, name, floor, capacity, type });
    if (!result.success) {
      setError(result.error.issues[0].message);
      return;
    }

    setError(null);
    setIsLoading(true);
    try {
      await onSubmit(result.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
      setIsLoading(false);
    }
  }

  const defaultBuildingName = room?.buildingName ?? buildings[0]?.name ?? "";

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
      <FormError message={error} />
      <Select
        id="room-building"
        label="Building"
        defaultValue={defaultBuildingName}
        disabled={isEdit}
        hint={isEdit ? "The building can't be changed after creation." : undefined}
      >
        {buildings.map((b) => (
          <option key={b.id} value={b.name}>
            {b.name}
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
      <Select
        id="room-type"
        label="Type"
        defaultValue={room?.type ?? roomTypes[0] ?? ""}
        disabled={isEdit}
        hint={isEdit ? "The room type can't be changed after creation." : undefined}
      >
        {roomTypes.map((t) => (
          <option key={t} value={t}>
            {t}
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
