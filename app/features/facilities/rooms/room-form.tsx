import { useState } from "react";
import { FormError } from "~/components/forms/form-error";
import { Button } from "~/components/ui/button";
import { FieldChrome, Input } from "~/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "~/components/ui/select";
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
      <FieldChrome
        id="room-building"
        label="Building"
        hint={isEdit ? "The building can't be changed after creation." : undefined}
      >
        <Select
          items={buildings.map((b) => ({ value: b.name, label: b.name }))}
          name="room-building"
          defaultValue={defaultBuildingName}
          disabled={isEdit}
        >
          <SelectTrigger id="room-building">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {buildings.map((b) => (
              <SelectItem key={b.id} value={b.name}>
                {b.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </FieldChrome>
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
      <FieldChrome
        id="room-type"
        label="Type"
        hint={isEdit ? "The room type can't be changed after creation." : undefined}
      >
        <Select
          items={roomTypes.map((t) => ({ value: t, label: t }))}
          name="room-type"
          defaultValue={room?.type ?? roomTypes[0] ?? ""}
          disabled={isEdit}
        >
          <SelectTrigger id="room-type">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {roomTypes.map((t) => (
              <SelectItem key={t} value={t}>
                {t}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </FieldChrome>
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
