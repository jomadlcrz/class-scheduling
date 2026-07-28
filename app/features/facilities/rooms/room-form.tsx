import { Menu } from "@base-ui/react/menu";
import { useState } from "react";
import { FormError } from "~/components/forms/form-error";
import { Button } from "~/components/ui/button";
import { CheckIcon, ChevronDownIcon } from "~/components/ui/icons";
import { FieldChrome, Input } from "~/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "~/components/ui/select";
import { roomSchema } from "~/schemas/room.schema";
import type { Building } from "~/types/building";
import type { CreateRoomInput, Room } from "~/types/room";
import type { Program } from "~/types/program";

type RoomFormProps = {
  room?: Room;
  buildings: Building[];
  /** Backend RoomType values (enumService). */
  roomTypes: string[];
  programs: Program[];
  onSubmit: (input: CreateRoomInput) => Promise<void>;
  onCancel: () => void;
};

export function RoomForm({ room, buildings, roomTypes, programs, onSubmit, onCancel }: RoomFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const isEdit = Boolean(room);
  const [type, setType] = useState(room?.type ?? roomTypes[0] ?? "");
  const [selectedProgramIds, setSelectedProgramIds] = useState<Set<number>>(
    () => new Set(room?.programs.map((p) => p.programId) ?? []),
  );
  const isLaboratory = type === "Laboratory";

  function toggleProgram(id: number) {
    setSelectedProgramIds((current) => {
      const next = new Set(current);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    const buildingName = String(data.get("room-building") ?? "").trim();
    const floor = Number(data.get("room-floor"));
    const name = String(data.get("room-name") ?? "").trim();
    const capacity = Number(data.get("room-capacity"));
    const programIds = isLaboratory ? [...selectedProgramIds] : [];

    const result = roomSchema.safeParse({ buildingName, name, floor, capacity, type });
    if (!result.success) {
      setError(result.error.issues[0].message);
      return;
    }

    setError(null);
    setIsLoading(true);
    try {
      await onSubmit({ ...result.data, programIds });
    } catch (err) {
      setError(err instanceof Error ? err.message : "");
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
          value={type}
          onValueChange={(v) => setType(v as string)}
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
      {isLaboratory && (
        <FieldChrome id="room-programs" label="Programs" hint="A laboratory must have at least one program.">
          <Menu.Root modal={false}>
            <Menu.Trigger
              id="room-programs"
              className="flex w-full cursor-pointer items-center justify-between gap-2 rounded-lg border border-slate-300 bg-white px-3 py-2 text-left font-body text-sm text-gray-900 outline-none transition-colors duration-150 focus-visible:border-blue-700 focus-visible:ring-2 focus-visible:ring-blue-700/20 data-popup-open:border-blue-700 data-popup-open:ring-2 data-popup-open:ring-blue-700/20 dark:border-white/15 dark:bg-white/5 dark:text-mist-100 dark:focus-visible:border-blue-400 dark:focus-visible:ring-blue-400/20 dark:data-popup-open:border-blue-400 dark:data-popup-open:ring-blue-400/20"
            >
              <span className="min-w-0 truncate">
                {selectedProgramIds.size === 0
                  ? "Select programs"
                  : programs
                      .filter((p) => selectedProgramIds.has(p.id))
                      .map((p) => p.abbrev)
                      .join(", ")}
              </span>
              <span className="shrink-0 text-slate-400 dark:text-slate-500">
                <ChevronDownIcon />
              </span>
            </Menu.Trigger>
            <Menu.Portal>
              <Menu.Positioner sideOffset={6} align="start" collisionPadding={8} className="z-50 outline-none">
                <Menu.Popup className="max-h-64 min-w-(--anchor-width) overflow-x-hidden overflow-y-auto rounded-lg border border-slate-200 bg-white p-1 shadow-lg outline-none dark:border-white/10 dark:bg-surface-raised">
                  {programs.length === 0 ? (
                    <p className="px-3 py-2 font-body text-sm text-slate-400">No programs available.</p>
                  ) : (
                    programs.map((p) => (
                      <Menu.CheckboxItem
                        key={p.id}
                        checked={selectedProgramIds.has(p.id)}
                        onCheckedChange={() => toggleProgram(p.id)}
                        closeOnClick={false}
                        className="relative flex w-full cursor-pointer select-none items-center justify-between gap-2 rounded-md px-3 py-2 font-body text-sm text-gray-900 outline-none data-highlighted:bg-slate-100 dark:text-mist-100 dark:data-highlighted:bg-white/10"
                      >
                        <span className="min-w-0 truncate">
                          {p.abbrev} — {p.name}
                        </span>
                        <Menu.CheckboxItemIndicator className="shrink-0 text-blue-700 dark:text-blue-400">
                          <CheckIcon />
                        </Menu.CheckboxItemIndicator>
                      </Menu.CheckboxItem>
                    ))
                  )}
                </Menu.Popup>
              </Menu.Positioner>
            </Menu.Portal>
          </Menu.Root>
        </FieldChrome>
      )}
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
