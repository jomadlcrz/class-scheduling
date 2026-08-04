import { Menu } from "@base-ui/react/menu";
import { useEffect, useMemo, useState } from "react";
import { FormError } from "~/components/forms/form-error";
import { EmptyState } from "~/components/feedback/empty-state";
import { Button } from "~/components/ui/button";
import { Card } from "~/components/ui/card";
import { Accordion, AccordionItem } from "~/components/ui/accordion";
import {
  BuildingSummaryPanel,
  type BuildingSummaryData,
} from "~/features/facilities/building-summary-panel";
import { CheckIcon, ChevronDownIcon, CopyIcon, PlusIcon, TrashIcon } from "~/components/ui/icons";
import { FieldChrome, Input } from "~/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "~/components/ui/select";
import { buildingSchema } from "~/schemas/building.schema";
import type { CreateFacilitiesInput } from "~/types/facility";
import type { FacilityFloorDraft, FacilityRoomDraft } from "~/types/facility";
import type { Program } from "~/types/program";

type CreateBuildingWorkspaceProps = {
  roomTypes: string[];
  programs: Program[];
  onSubmit: (input: CreateFacilitiesInput) => Promise<void>;
  onCancel: () => void;
  onDirtyChange?: (isDirty: boolean) => void;
};

let draftKeyCounter = 0;

function newDraftKey(): string {
  draftKeyCounter += 1;
  return `room-${Date.now()}-${draftKeyCounter}-${Math.random().toString(36).slice(2, 9)}`;
}

function newRoomDraft(roomType = ""): FacilityRoomDraft {
  return {
    key: newDraftKey(),
    roomName: "",
    roomType,
    roomCapacity: 30,
    programIds: [],
  };
}

function emptyFloors(count: number): FacilityFloorDraft[] {
  return Array.from({ length: count }, (_, index) => ({
    floorLevel: index + 1,
    rooms: [],
  }));
}

function syncFloorCount(floors: FacilityFloorDraft[], count: number): FacilityFloorDraft[] {
  const next = floors.slice(0, count);
  while (next.length < count) {
    next.push({ floorLevel: next.length + 1, rooms: [] });
  }
  return next.map((floor, index) => ({ ...floor, floorLevel: index + 1 }));
}

function toPayload(
  buildingName: string,
  floorCount: number,
  floors: FacilityFloorDraft[],
): CreateFacilitiesInput {
  return {
    buildingName,
    floorCount,
    floors: floors
      .filter((floor) => floor.rooms.length > 0)
      .map((floor) => ({
        floorLevel: floor.floorLevel,
        rooms: floor.rooms.map((room) => ({
          roomName: room.roomName.trim(),
          roomType: room.roomType,
          roomCapacity: room.roomCapacity,
          ...(room.roomType === "Laboratory" ? { programIds: [...room.programIds] } : {}),
        })),
      })),
  };
}

function computeSummary(
  buildingName: string,
  floorCount: number,
  floors: FacilityFloorDraft[],
): BuildingSummaryData {
  const allRooms = floors.flatMap((floor) => floor.rooms);
  const roomTypeCounts: Record<string, number> = {};
  const labProgramIds = new Set<number>();

  for (const room of allRooms) {
    if (!room.roomType) continue;
    roomTypeCounts[room.roomType] = (roomTypeCounts[room.roomType] ?? 0) + 1;
    if (room.roomType === "Laboratory") {
      room.programIds.forEach((id) => labProgramIds.add(id));
    }
  }

  return {
    buildingName,
    floorCount,
    totalRooms: allRooms.length,
    roomTypeCounts,
    labProgramIds: [...labProgramIds],
  };
}

export function CreateBuildingWorkspace({
  roomTypes,
  programs,
  onSubmit,
  onCancel,
  onDirtyChange,
}: CreateBuildingWorkspaceProps) {
  const defaultRoomType = roomTypes[0] ?? "";
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [buildingName, setBuildingName] = useState("");
  const [floorCount, setFloorCount] = useState(1);
  const [floors, setFloors] = useState<FacilityFloorDraft[]>(() => emptyFloors(1));
  const [openFloors, setOpenFloors] = useState<number[]>([1]);

  useEffect(() => {
    setFloors((current) => syncFloorCount(current, floorCount));
    setOpenFloors((current) => current.filter((level) => level <= floorCount));
  }, [floorCount, defaultRoomType]);

  const summary = useMemo(
    () => computeSummary(buildingName, floorCount, floors),
    [buildingName, floorCount, floors],
  );

  const isDirty =
    buildingName.trim() !== "" ||
    floorCount !== 1 ||
    floors.some((floor) => floor.rooms.length > 0);

  useEffect(() => {
    onDirtyChange?.(isDirty);
  }, [isDirty, onDirtyChange]);

  function updateFloorRooms(floorLevel: number, updater: (rooms: FacilityRoomDraft[]) => FacilityRoomDraft[]) {
    setFloors((current) =>
      current.map((floor) =>
        floor.floorLevel === floorLevel ? { ...floor, rooms: updater(floor.rooms) } : floor,
      ),
    );
  }

  function addRoom(floorLevel: number) {
    updateFloorRooms(floorLevel, (rooms) => [...rooms, newRoomDraft(defaultRoomType)]);
    setOpenFloors((current) => (current.includes(floorLevel) ? current : [...current, floorLevel]));
  }

  function duplicateRoom(floorLevel: number, room: FacilityRoomDraft) {
    updateFloorRooms(floorLevel, (rooms) => [
      ...rooms,
      {
        ...room,
        key: newDraftKey(),
        roomName: room.roomName ? `${room.roomName} (copy)` : "",
      },
    ]);
  }

  function removeRoom(floorLevel: number, key: string) {
    updateFloorRooms(floorLevel, (rooms) => rooms.filter((room) => room.key !== key));
  }

  function updateRoom(floorLevel: number, key: string, patch: Partial<FacilityRoomDraft>) {
    updateFloorRooms(floorLevel, (rooms) =>
      rooms.map((room) => (room.key === key ? { ...room, ...patch } : room)),
    );
  }

  function toggleProgram(floorLevel: number, roomKey: string, programId: number) {
    updateFloorRooms(floorLevel, (rooms) =>
      rooms.map((room) => {
        if (room.key !== roomKey) return room;
        const next = new Set(room.programIds);
        next.has(programId) ? next.delete(programId) : next.add(programId);
        return { ...room, programIds: [...next] };
      }),
    );
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const buildingResult = buildingSchema.safeParse({ name: buildingName.trim(), floorCount });
    if (!buildingResult.success) {
      setError(buildingResult.error.issues[0].message);
      return;
    }

    const roomsWithFloors = floors.flatMap((floor) => floor.rooms.map((room) => ({ floor, room })));
    if (roomsWithFloors.length === 0) {
      setError("Add at least one room before saving.");
      return;
    }

    for (const { room } of roomsWithFloors) {
      if (!room.roomName.trim()) {
        setError("Every room needs a name.");
        return;
      }
      if (!room.roomType) {
        setError("Select a type for every room.");
        return;
      }
      if (!Number.isInteger(room.roomCapacity) || room.roomCapacity < 1) {
        setError("Enter a valid capacity for every room.");
        return;
      }
      if (room.roomType === "Laboratory" && room.programIds.length === 0) {
        setError("Each laboratory must be assigned to at least one program.");
        return;
      }
    }

    const payload = toPayload(buildingResult.data.name, buildingResult.data.floorCount, floors);
    if (payload.floors.length === 0) {
      setError("Add at least one room before saving.");
      return;
    }

    setError(null);
    setIsLoading(true);
    try {
      await onSubmit(payload);
    } catch (err) {
      setError(err instanceof Error ? err.message : "");
      setIsLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6" noValidate>
      <FormError message={error} />

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
        <div className="flex flex-col gap-6">
          <Card className="p-5">
            <h2 className="font-display text-lg tracking-wide text-navy-700 dark:text-mist-100">
              Building Information
            </h2>
            <p className="mt-1 font-body text-sm text-slate-500 dark:text-slate-400">
              Name the building and set how many floors it has.
            </p>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <Input
                id="create-building-name"
                label="Building Name"
                required
                placeholder="Main Academic Building"
                value={buildingName}
                onChange={(e) => setBuildingName(e.target.value)}
              />
              <Input
                id="create-building-floors"
                label="Number of Floors"
                type="number"
                required
                min={1}
                placeholder="3"
                value={floorCount}
                onChange={(e) => setFloorCount(Math.max(1, Number(e.target.value) || 1))}
              />
            </div>
          </Card>

          <Card className="p-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h2 className="font-display text-lg tracking-wide text-navy-700 dark:text-mist-100">
                  Floors and Rooms
                </h2>
                <p className="mt-1 font-body text-sm text-slate-500 dark:text-slate-400">
                  Add rooms per floor. Each floor can hold multiple rooms.
                </p>
              </div>
            </div>

            <div className="mt-4">
              <Accordion>
                {floors.map((floor) => (
                  <AccordionItem
                    key={floor.floorLevel}
                    title={`Floor ${floor.floorLevel}`}
                    open={openFloors.includes(floor.floorLevel)}
                    onOpenChange={(open) =>
                      setOpenFloors((current) =>
                        open
                          ? [...current, floor.floorLevel]
                          : current.filter((level) => level !== floor.floorLevel),
                      )
                    }
                    adornment={
                      <span
                        onClick={(event) => event.stopPropagation()}
                        onKeyDown={(event) => event.stopPropagation()}
                      >
                        <Button
                          type="button"
                          variant="outline"
                          block={false}
                          onClick={() => addRoom(floor.floorLevel)}
                        >
                          <PlusIcon />
                          Add Room
                        </Button>
                      </span>
                    }
                  >
                    {floor.rooms.length === 0 ? (
                      <div className="px-5 py-6">
                        <EmptyState title="No rooms on this floor yet">
                          <Button
                            type="button"
                            variant="outline"
                            block={false}
                            onClick={() => addRoom(floor.floorLevel)}
                          >
                            <PlusIcon />
                            Add First Room
                          </Button>
                        </EmptyState>
                      </div>
                    ) : (
                      <div className="flex flex-col gap-4 px-5 py-5">
                        {floor.rooms.map((room, index) => (
                          <div
                            key={room.key}
                            className="rounded-xl border border-slate-200 bg-slate-50/70 p-4 dark:border-white/10 dark:bg-white/5"
                          >
                            <div className="mb-3 flex items-center justify-between gap-3">
                              <span className="font-body text-sm font-medium text-navy-700 dark:text-mist-100">
                                Room {index + 1}
                              </span>
                              <div className="flex gap-1">
                                <button
                                  type="button"
                                  onClick={() => duplicateRoom(floor.floorLevel, room)}
                                  aria-label={`Duplicate room ${index + 1}`}
                                  className="grid size-8 cursor-pointer place-items-center rounded-lg text-slate-400 transition-colors duration-150 hover:bg-slate-200/60 hover:text-navy-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-400 dark:hover:bg-white/10"
                                >
                                  <CopyIcon />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => removeRoom(floor.floorLevel, room.key)}
                                  aria-label={`Remove room ${index + 1}`}
                                  className="grid size-8 cursor-pointer place-items-center rounded-lg text-slate-400 transition-colors duration-150 hover:bg-slate-200/60 hover:text-red-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-400 dark:hover:bg-white/10"
                                >
                                  <TrashIcon />
                                </button>
                              </div>
                            </div>

                            <div className="grid gap-3 md:grid-cols-3">
                              <Input
                                id={`room-name-${room.key}`}
                                label="Room Name"
                                required
                                placeholder="Room 101"
                                value={room.roomName}
                                onChange={(e) =>
                                  updateRoom(floor.floorLevel, room.key, { roomName: e.target.value })
                                }
                              />
                              <FieldChrome id={`room-type-${room.key}`} label="Room Type">
                                <Select
                                  items={roomTypes.map((t) => ({ value: t, label: t }))}
                                  value={room.roomType}
                                  onValueChange={(value) =>
                                    updateRoom(floor.floorLevel, room.key, {
                                      roomType: value as string,
                                      programIds: value === "Laboratory" ? room.programIds : [],
                                    })
                                  }
                                >
                                  <SelectTrigger id={`room-type-${room.key}`}>
                                    <SelectValue placeholder="Select type" />
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
                              <Input
                                id={`room-capacity-${room.key}`}
                                label="Room Capacity"
                                type="number"
                                required
                                min={1}
                                value={room.roomCapacity}
                                onChange={(e) =>
                                  updateRoom(floor.floorLevel, room.key, {
                                    roomCapacity: Number(e.target.value),
                                  })
                                }
                              />
                            </div>

                            {room.roomType === "Laboratory" && (
                              <div className="mt-3">
                                <FieldChrome
                                  id={`room-programs-${room.key}`}
                                  label="Assigned Programs"
                                  hint="A laboratory must have at least one program."
                                >
                                  <Menu.Root modal={false}>
                                    <Menu.Trigger
                                      id={`room-programs-${room.key}`}
                                      className="flex w-full cursor-pointer items-center justify-between gap-2 rounded-lg border border-slate-300 bg-white px-3 py-2 text-left font-body text-sm text-gray-900 outline-none transition-colors duration-150 focus-visible:border-blue-700 focus-visible:ring-2 focus-visible:ring-blue-700/20 data-popup-open:border-blue-700 data-popup-open:ring-2 data-popup-open:ring-blue-700/20 dark:border-white/15 dark:bg-white/5 dark:text-mist-100 dark:focus-visible:border-blue-400 dark:focus-visible:ring-blue-400/20 dark:data-popup-open:border-blue-400 dark:data-popup-open:ring-blue-400/20"
                                    >
                                      <span className="min-w-0 truncate">
                                        {room.programIds.length === 0
                                          ? "Select programs"
                                          : programs
                                              .filter((p) => room.programIds.includes(p.id))
                                              .map((p) => p.abbrev)
                                              .join(", ")}
                                      </span>
                                      <span className="shrink-0 text-slate-400 dark:text-slate-500">
                                        <ChevronDownIcon />
                                      </span>
                                    </Menu.Trigger>
                                    <Menu.Portal>
                                      <Menu.Positioner
                                        sideOffset={6}
                                        align="start"
                                        collisionPadding={8}
                                        className="z-50 outline-none"
                                      >
                                        <Menu.Popup className="max-h-64 min-w-(--anchor-width) overflow-x-hidden overflow-y-auto rounded-lg border border-slate-200 bg-white p-1 shadow-lg outline-none dark:border-white/10 dark:bg-surface-raised">
                                          {programs.length === 0 ? (
                                            <p className="px-3 py-2 font-body text-sm text-slate-400">
                                              No programs available.
                                            </p>
                                          ) : (
                                            programs.map((p) => (
                                              <Menu.CheckboxItem
                                                key={p.id}
                                                checked={room.programIds.includes(p.id)}
                                                onCheckedChange={() =>
                                                  toggleProgram(floor.floorLevel, room.key, p.id)
                                                }
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
                              </div>
                            )}
                          </div>
                        ))}
                        <Button
                          type="button"
                          variant="outline"
                          block={false}
                          onClick={() => addRoom(floor.floorLevel)}
                        >
                          <PlusIcon />
                          Add Another Room
                        </Button>
                      </div>
                    )}
                  </AccordionItem>
                ))}
              </Accordion>
            </div>
          </Card>
        </div>

        <BuildingSummaryPanel summary={summary} programs={programs} />
      </div>

      <div className="sticky bottom-0 z-10 -mx-4 flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 bg-white/95 px-4 py-4 backdrop-blur dark:border-white/10 dark:bg-surface/95">
        <p className="font-body text-sm text-slate-600 dark:text-mist-100">
          Total Rooms Created:{" "}
          <span className="font-semibold text-navy-700 dark:text-mist-100">{summary.totalRooms}</span>
        </p>
        <div className="flex gap-2">
          <Button type="button" variant="outline" block={false} onClick={onCancel}>
            Cancel
          </Button>
          <Button block={false} isLoading={isLoading} loadingLabel="Saving…">
            Save Facility
          </Button>
        </div>
      </div>
    </form>
  );
}
