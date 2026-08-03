import { Menu } from "@base-ui/react/menu";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { FormError } from "~/components/forms/form-error";
import { EmptyState } from "~/components/feedback/empty-state";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { Card } from "~/components/ui/card";
import {
  ArrowLeftIcon,
  CheckIcon,
  ChevronDownIcon,
  CopyIcon,
  PlusIcon,
  TrashIcon,
} from "~/components/ui/icons";
import { FieldChrome, Input } from "~/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "~/components/ui/select";
import { RoomArchiveDialog } from "~/features/facilities/rooms/room-archive-dialog";
import {
  EditBuildingSummaryPanel,
  type EditBuildingSummaryData,
} from "~/features/facilities/edit-building-summary-panel";
import type { AddBuildingRoomsInput, FacilityBuildingDetail, FacilityRoomDetail } from "~/types/facility";
import type { Program } from "~/types/program";
import type { Room } from "~/types/room";

type EditBuildingWorkspaceProps = {
  building: FacilityBuildingDetail;
  roomTypes: string[];
  programs: Program[];
  onAddRooms: (input: AddBuildingRoomsInput) => Promise<void>;
  onArchiveRoom: (room: Room) => Promise<void>;
  onCancel: () => void;
};

type NewRoomDraft = {
  key: string;
  roomName: string;
  roomType: string;
  roomCapacity: number;
  programIds: number[];
};

let draftKeyCounter = 0;

function newDraftKey(): string {
  draftKeyCounter += 1;
  return `room-${Date.now()}-${draftKeyCounter}-${Math.random().toString(36).slice(2, 9)}`;
}

function newRoomDraft(roomType = ""): NewRoomDraft {
  return {
    key: newDraftKey(),
    roomName: "",
    roomType,
    roomCapacity: 30,
    programIds: [],
  };
}

function buildFloors(building: FacilityBuildingDetail) {
  const floors = Array.from({ length: building.floorCount }, (_, index) => ({
    floorLevel: index + 1,
    existingRooms: [] as FacilityRoomDetail[],
    newRooms: [] as NewRoomDraft[],
  }));

  for (const room of building.rooms) {
    const floor = floors[room.floor - 1];
    if (floor) floor.existingRooms.push(room);
  }

  for (const floor of floors) {
    floor.existingRooms.sort((a, b) => a.name.localeCompare(b.name));
  }

  return floors;
}

function toAddRoomsPayload(floors: ReturnType<typeof buildFloors>): AddBuildingRoomsInput {
  return {
    floors: floors
      .filter((floor) => floor.newRooms.length > 0)
      .map((floor) => ({
        floorLevel: floor.floorLevel,
        rooms: floor.newRooms.map((room) => ({
          roomName: room.roomName.trim(),
          roomType: room.roomType,
          roomCapacity: room.roomCapacity,
          ...(room.roomType === "Laboratory" ? { programIds: [...room.programIds] } : {}),
        })),
      })),
  };
}

function computeSummary(
  building: FacilityBuildingDetail,
  floors: ReturnType<typeof buildFloors>,
): EditBuildingSummaryData {
  const existingRooms = floors.flatMap((floor) => floor.existingRooms);
  const newRooms = floors.flatMap((floor) => floor.newRooms);
  const roomTypeCounts: Record<string, number> = {};
  const labProgramIds = new Set<number>();

  for (const room of existingRooms) {
    roomTypeCounts[room.type] = (roomTypeCounts[room.type] ?? 0) + 1;
    if (room.type === "Laboratory") {
      room.programIds.forEach((id) => labProgramIds.add(id));
    }
  }

  for (const room of newRooms) {
    if (!room.roomType) continue;
    roomTypeCounts[room.roomType] = (roomTypeCounts[room.roomType] ?? 0) + 1;
    if (room.roomType === "Laboratory") {
      room.programIds.forEach((id) => labProgramIds.add(id));
    }
  }

  return {
    buildingName: building.name,
    floorCount: building.floorCount,
    totalRooms: existingRooms.length + newRooms.length,
    existingRoomCount: existingRooms.length,
    roomTypeCounts,
    labProgramIds: [...labProgramIds],
    changes: { added: newRooms.length, modified: 0, deleted: 0 },
  };
}

const floorButtonClassName = (active: boolean) =>
  `flex w-full items-center justify-between rounded-lg border px-3 py-2.5 text-left font-body text-sm transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-400 ${
    active
      ? "border-gwc-blue-bright bg-gwc-blue-bright/10 font-semibold text-gwc-blue-bright dark:border-blue-400 dark:bg-blue-400/10 dark:text-blue-300"
      : "border-slate-200 bg-white text-navy-700 hover:bg-slate-50 dark:border-white/10 dark:bg-white/5 dark:text-mist-100 dark:hover:bg-white/10"
  }`;

const statCardClassName =
  "rounded-lg border border-slate-200 bg-white px-4 py-3 dark:border-white/10 dark:bg-white/5";

function roomToArchiveTarget(room: FacilityRoomDetail, building: FacilityBuildingDetail): Room {
  return {
    id: room.id,
    buildingId: building.id,
    buildingName: building.name,
    floor: room.floor,
    name: room.name,
    capacity: room.capacity,
    type: room.type,
    status: room.status,
    timeRemaining: room.timeRemaining,
    programs: room.programs,
  };
}

export function EditBuildingWorkspace({
  building,
  roomTypes,
  programs,
  onAddRooms,
  onArchiveRoom,
  onCancel,
}: EditBuildingWorkspaceProps) {
  const defaultRoomType = roomTypes[0] ?? "";
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [selectedFloor, setSelectedFloor] = useState(1);
  const [floors, setFloors] = useState(() => buildFloors(building));
  const [archiveTarget, setArchiveTarget] = useState<Room | null>(null);

  useEffect(() => {
    setFloors(buildFloors(building));
    setSelectedFloor(1);
    setError(null);
  }, [building]);

  const summary = useMemo(() => computeSummary(building, floors), [building, floors]);
  const hasNewRooms = summary.changes.added > 0;
  const selectedFloorData = floors.find((floor) => floor.floorLevel === selectedFloor);

  function updateNewRooms(floorLevel: number, updater: (rooms: NewRoomDraft[]) => NewRoomDraft[]) {
    setFloors((current) =>
      current.map((floor) =>
        floor.floorLevel === floorLevel ? { ...floor, newRooms: updater(floor.newRooms) } : floor,
      ),
    );
  }

  function addRoom(floorLevel: number) {
    updateNewRooms(floorLevel, (rooms) => [...rooms, newRoomDraft(defaultRoomType)]);
    setSelectedFloor(floorLevel);
  }

  function duplicateRoom(floorLevel: number, room: NewRoomDraft) {
    updateNewRooms(floorLevel, (rooms) => [
      ...rooms,
      {
        ...room,
        key: newDraftKey(),
        roomName: room.roomName ? `${room.roomName} (copy)` : "",
      },
    ]);
  }

  function removeNewRoom(floorLevel: number, key: string) {
    updateNewRooms(floorLevel, (rooms) => rooms.filter((room) => room.key !== key));
  }

  function updateNewRoom(floorLevel: number, key: string, patch: Partial<NewRoomDraft>) {
    updateNewRooms(floorLevel, (rooms) =>
      rooms.map((room) => (room.key === key ? { ...room, ...patch } : room)),
    );
  }

  function toggleProgram(floorLevel: number, roomKey: string, programId: number) {
    updateNewRooms(floorLevel, (rooms) =>
      rooms.map((room) => {
        if (room.key !== roomKey) return room;
        const next = new Set(room.programIds);
        next.has(programId) ? next.delete(programId) : next.add(programId);
        return { ...room, programIds: [...next] };
      }),
    );
  }

  async function handleSave() {
    const newRooms = floors.flatMap((floor) => floor.newRooms);
    if (newRooms.length === 0) {
      toast.message("No new rooms to save.");
      return;
    }

    for (const room of newRooms) {
      if (!room.roomName.trim()) {
        setError("Every new room needs a name.");
        return;
      }
      if (!room.roomType) {
        setError("Select a type for every new room.");
        return;
      }
      if (!Number.isInteger(room.roomCapacity) || room.roomCapacity < 1) {
        setError("Enter a valid capacity for every new room.");
        return;
      }
      if (room.roomType === "Laboratory" && room.programIds.length === 0) {
        setError("Each laboratory must be assigned to at least one program.");
        return;
      }
    }

    const payload = toAddRoomsPayload(floors);
    if (payload.floors.length === 0) {
      setError("Add at least one room before saving.");
      return;
    }

    setError(null);
    setIsSaving(true);
    try {
      await onAddRooms(payload);
    } catch (err) {
      setError(err instanceof Error ? err.message : "");
    } finally {
      setIsSaving(false);
    }
  }

  async function handleArchiveRoom(room: Room) {
    await onArchiveRoom(room);
  }

  return (
    <div className="flex flex-col gap-6 pb-28">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl tracking-wide text-navy-700 dark:text-mist-100">
            Manage Building
          </h1>
          <p className="mt-1 font-body text-sm text-slate-500 dark:text-slate-400">
            Add rooms to this building or archive existing ones. Room details cannot be edited after creation.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button type="button" variant="outline" block={false} onClick={onCancel}>
            <ArrowLeftIcon />
            Back
          </Button>
          <Button type="button" block={false} onClick={handleSave} disabled={!hasNewRooms} isLoading={isSaving} loadingLabel="Saving…">
            Save New Rooms
          </Button>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
          <div className={statCardClassName}>
            <p className="font-body text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">
              Building Name
            </p>
            <p className="mt-1 font-medium text-navy-700 dark:text-mist-100">{building.name}</p>
          </div>
          <div className={statCardClassName}>
            <p className="font-body text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">
              Total Floors
            </p>
            <p className="mt-1 font-medium text-navy-700 dark:text-mist-100">{building.floorCount}</p>
          </div>
          <div className={statCardClassName}>
            <p className="font-body text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">
              Existing Rooms
            </p>
            <p className="mt-1 font-medium text-navy-700 dark:text-mist-100">{summary.existingRoomCount}</p>
          </div>
          <div className={statCardClassName}>
            <p className="font-body text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">
              New (unsaved)
            </p>
            <p className="mt-1 font-medium text-navy-700 dark:text-mist-100">{summary.changes.added}</p>
          </div>
          <div className={statCardClassName}>
            <p className="font-body text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">
              Lecture / Lab
            </p>
            <p className="mt-1 font-medium text-navy-700 dark:text-mist-100">
              {summary.roomTypeCounts["Lecture Room"] ?? 0} / {summary.roomTypeCounts.Laboratory ?? 0}
            </p>
          </div>
      </div>

      <FormError message={error} />

      <div className="grid gap-6 xl:grid-cols-[220px_minmax(0,1fr)_320px]">
        <Card className="h-fit p-4">
          <h2 className="font-display text-base tracking-wide text-navy-700 dark:text-mist-100">Floors</h2>
          <ul className="mt-3 flex flex-col gap-2">
            {floors.map((floor) => {
              const roomCount = floor.existingRooms.length + floor.newRooms.length;
              return (
                <li key={floor.floorLevel}>
                  <button
                    type="button"
                    className={floorButtonClassName(selectedFloor === floor.floorLevel)}
                    onClick={() => setSelectedFloor(floor.floorLevel)}
                  >
                    <span>Floor {floor.floorLevel}</span>
                    <span className="text-xs text-slate-500 dark:text-slate-400">{roomCount} rooms</span>
                  </button>
                </li>
              );
            })}
          </ul>
        </Card>

        <div className="flex flex-col gap-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="font-display text-lg tracking-wide text-navy-700 dark:text-mist-100">
                Floor {selectedFloor}
              </h2>
              <p className="font-body text-sm text-slate-500 dark:text-slate-400">
                {(selectedFloorData?.existingRooms.length ?? 0) + (selectedFloorData?.newRooms.length ?? 0)} rooms
              </p>
            </div>
            <Button type="button" variant="outline" block={false} onClick={() => addRoom(selectedFloor)}>
              <PlusIcon />
              Add Room
            </Button>
          </div>

          {!selectedFloorData ||
          (selectedFloorData.existingRooms.length === 0 && selectedFloorData.newRooms.length === 0) ? (
            <Card className="p-8">
              <EmptyState title={`No rooms on Floor ${selectedFloor}`}>
                <Button type="button" variant="outline" block={false} onClick={() => addRoom(selectedFloor)}>
                  <PlusIcon />
                  Add First Room
                </Button>
              </EmptyState>
            </Card>
          ) : (
            <div className="flex flex-col gap-4">
              {selectedFloorData.existingRooms.map((room) => (
                <Card key={room.id} className="p-4">
                  <div className="mb-3 flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="truncate font-body text-sm font-semibold text-navy-700 dark:text-mist-100">
                          {room.name}
                        </h3>
                        <Badge tone="emerald">Existing</Badge>
                      </div>
                      <p className="mt-1 font-body text-xs text-slate-500 dark:text-slate-400">
                        {room.type} · Capacity {room.capacity} · {room.status}
                      </p>
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      block={false}
                      onClick={() => setArchiveTarget(roomToArchiveTarget(room, building))}
                    >
                      <TrashIcon />
                      Archive
                    </Button>
                  </div>
                  {room.type === "Laboratory" && room.programIds.length > 0 && (
                    <p className="font-body text-xs text-slate-500 dark:text-slate-400">
                      Programs:{" "}
                      {programs
                        .filter((p) => room.programIds.includes(p.id))
                        .map((p) => p.abbrev)
                        .join(", ")}
                    </p>
                  )}
                </Card>
              ))}

              {selectedFloorData.newRooms.map((room, index) => (
                <div
                  key={room.key}
                  className="rounded-xl border border-blue-200 bg-blue-50/40 p-4 dark:border-blue-400/25 dark:bg-blue-400/5"
                >
                  <div className="mb-3 flex items-center justify-between gap-3">
                    <span className="font-body text-sm font-medium text-navy-700 dark:text-mist-100">
                      New Room {index + 1}
                    </span>
                    <div className="flex gap-1">
                      <button
                        type="button"
                        onClick={() => duplicateRoom(selectedFloor, room)}
                        aria-label={`Duplicate new room ${index + 1}`}
                        className="grid size-8 cursor-pointer place-items-center rounded-lg text-slate-400 transition-colors duration-150 hover:bg-slate-200/60 hover:text-navy-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-400 dark:hover:bg-white/10"
                      >
                        <CopyIcon />
                      </button>
                      <button
                        type="button"
                        onClick={() => removeNewRoom(selectedFloor, room.key)}
                        aria-label={`Remove new room ${index + 1}`}
                        className="grid size-8 cursor-pointer place-items-center rounded-lg text-slate-400 transition-colors duration-150 hover:bg-slate-200/60 hover:text-red-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-400 dark:hover:bg-white/10"
                      >
                        <TrashIcon />
                      </button>
                    </div>
                  </div>

                  <div className="grid gap-3 md:grid-cols-3">
                    <Input
                      id={`new-room-name-${room.key}`}
                      label="Room Name"
                      required
                      placeholder="Room 201"
                      value={room.roomName}
                      onChange={(e) => updateNewRoom(selectedFloor, room.key, { roomName: e.target.value })}
                    />
                    <FieldChrome id={`new-room-type-${room.key}`} label="Room Type">
                      <Select
                        items={roomTypes.map((t) => ({ value: t, label: t }))}
                        value={room.roomType}
                        onValueChange={(value) =>
                          updateNewRoom(selectedFloor, room.key, {
                            roomType: value as string,
                            programIds: value === "Laboratory" ? room.programIds : [],
                          })
                        }
                      >
                        <SelectTrigger id={`new-room-type-${room.key}`}>
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
                      id={`new-room-capacity-${room.key}`}
                      label="Capacity"
                      type="number"
                      required
                      min={1}
                      value={room.roomCapacity}
                      onChange={(e) =>
                        updateNewRoom(selectedFloor, room.key, { roomCapacity: Number(e.target.value) })
                      }
                    />
                  </div>

                  {room.roomType === "Laboratory" && (
                    <div className="mt-3">
                      <FieldChrome
                        id={`new-room-programs-${room.key}`}
                        label="Assigned Programs"
                        hint="A laboratory must have at least one program."
                      >
                        <Menu.Root modal={false}>
                          <Menu.Trigger
                            id={`new-room-programs-${room.key}`}
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
                                {programs.map((p) => (
                                  <Menu.CheckboxItem
                                    key={p.id}
                                    checked={room.programIds.includes(p.id)}
                                    onCheckedChange={() => toggleProgram(selectedFloor, room.key, p.id)}
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
                                ))}
                              </Menu.Popup>
                            </Menu.Positioner>
                          </Menu.Portal>
                        </Menu.Root>
                      </FieldChrome>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        <EditBuildingSummaryPanel summary={summary} programs={programs} />
      </div>

      <RoomArchiveDialog
        room={archiveTarget}
        onClose={() => setArchiveTarget(null)}
        onConfirm={handleArchiveRoom}
      />
    </div>
  );
}
