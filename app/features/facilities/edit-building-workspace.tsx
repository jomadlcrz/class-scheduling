import { Menu } from "@base-ui/react/menu";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { FormError } from "~/components/forms/form-error";
import { EmptyState } from "~/components/feedback/empty-state";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { Card } from "~/components/ui/card";
import { RoomProgramAccessField } from "~/features/facilities/room-program-access-field";
import {
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
import { StickyFooter } from "~/components/ui/sticky-footer";
import type { AddBuildingRoomsInput, FacilityBuildingDetail, FacilityRoomDetail } from "~/types/facility";
import type { Program } from "~/types/program";
import type { UpdateBuildingInput } from "~/types/building";
import { MANUAL_ROOM_STATUSES, type Room, type UpdateRoomInput } from "~/types/room";

type EditBuildingWorkspaceProps = {
  building: FacilityBuildingDetail;
  roomTypes: string[];
  programs: Program[];
  onUpdateBuilding: (input: UpdateBuildingInput) => Promise<void>;
  onUpdateRoom: (roomId: number, input: UpdateRoomInput) => Promise<void>;
  onAddRooms: (input: AddBuildingRoomsInput) => Promise<void>;
  onArchiveRoom: (room: Room) => Promise<void>;
  onCancel: () => void;
  onDirtyChange?: (isDirty: boolean) => void;
  onSavingChange?: (isSaving: boolean) => void;
};

type ExistingRoomDraft = {
  id: number;
  snapshot: {
    roomName: string;
    roomType: string;
    roomCapacity: number | null;
    floorLevel: number;
    programIds: number[];
    roomStatus: string;
    isCollegeRoom: boolean;
  };
  roomName: string;
  roomType: string;
  roomCapacity: number | null;
  programIds: number[];
  isCollegeRoom: boolean;
  roomStatusOverride: string | null;
};

type NewRoomDraft = {
  key: string;
  roomName: string;
  roomType: string;
  roomCapacity: number | null;
  programIds: number[];
  isCollegeRoom: boolean;
};

let draftKeyCounter = 0;

function newDraftKey(): string {
  draftKeyCounter += 1;
  return `room-${Date.now()}-${draftKeyCounter}-${Math.random().toString(36).slice(2, 9)}`;
}

function newRoomDraft(): NewRoomDraft {
  return {
    key: newDraftKey(),
    roomName: "",
    roomType: "",
    roomCapacity: null,
    programIds: [],
    isCollegeRoom: true,
  };
}

function roomToExistingDraft(room: FacilityRoomDetail): ExistingRoomDraft {
  const programIds = [...room.programIds];
  const snapshot = {
    roomName: room.name,
    roomType: room.type,
    roomCapacity: room.capacity,
    floorLevel: room.floor,
    programIds,
    roomStatus: room.status,
    isCollegeRoom: room.isCollegeRoom,
  };
  return {
    id: room.id,
    snapshot,
    roomName: room.name,
    roomType: room.type,
    roomCapacity: room.capacity,
    programIds,
    isCollegeRoom: room.isCollegeRoom,
    roomStatusOverride: null,
  };
}

function sortedProgramKey(ids: number[]): string {
  return [...ids].sort((a, b) => a - b).join(",");
}

function buildRoomUpdatePayload(draft: ExistingRoomDraft): UpdateRoomInput | null {
  const { snapshot } = draft;
  const payload: UpdateRoomInput = {};
  const name = draft.roomName.trim();
  if (name !== snapshot.roomName) payload.roomName = name;
  if (draft.roomType !== snapshot.roomType) payload.roomType = draft.roomType;
  if (draft.roomCapacity !== snapshot.roomCapacity) payload.roomCapacity = draft.roomCapacity;
  if (sortedProgramKey(draft.programIds) !== sortedProgramKey(snapshot.programIds)) {
    payload.programIds = [...draft.programIds];
  }
  if (draft.isCollegeRoom !== snapshot.isCollegeRoom) {
    payload.isCollegeRoom = draft.isCollegeRoom;
  }
  if (
    draft.roomStatusOverride !== null &&
    draft.roomStatusOverride !== snapshot.roomStatus &&
    (draft.roomStatusOverride === "Vacant" || draft.roomStatusOverride === "Maintenance")
  ) {
    payload.roomStatus = draft.roomStatusOverride;
  }
  return Object.keys(payload).length > 0 ? payload : null;
}

function buildBuildingUpdatePayload(
  original: { name: string; floorCount: number },
  current: { name: string; floorCount: number },
): UpdateBuildingInput | null {
  const payload: UpdateBuildingInput = {};
  const name = current.name.trim();
  if (name !== original.name) payload.name = name;
  if (current.floorCount !== original.floorCount) payload.floorCount = current.floorCount;
  return Object.keys(payload).length > 0 ? payload : null;
}

function buildFloors(
  building: FacilityBuildingDetail,
  existingDrafts: ExistingRoomDraft[],
) {
  const floorCount = Math.max(building.floorCount, ...existingDrafts.map((r) => r.snapshot.floorLevel), 1);
  const floors = Array.from({ length: floorCount }, (_, index) => ({
    floorLevel: index + 1,
    existingRooms: [] as ExistingRoomDraft[],
    newRooms: [] as NewRoomDraft[],
  }));

  for (const room of existingDrafts) {
    const floor = floors[room.snapshot.floorLevel - 1];
    if (floor) floor.existingRooms.push(room);
  }

  for (const floor of floors) {
    floor.existingRooms.sort((a, b) => a.roomName.localeCompare(b.roomName));
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
          isCollegeRoom: room.isCollegeRoom,
          ...(room.roomType === "Laboratory" || (room.roomType === "Lecture Room" && room.programIds.length > 0)
            ? { programIds: [...room.programIds] }
            : {}),
        })),
      })),
  };
}

function computeSummary(
  buildingName: string,
  floorCount: number,
  floors: ReturnType<typeof buildFloors>,
): EditBuildingSummaryData {
  const existingRooms = floors.flatMap((floor) => floor.existingRooms);
  const newRooms = floors.flatMap((floor) => floor.newRooms);
  const roomTypeCounts: Record<string, number> = {};
  const labProgramIds = new Set<number>();
  let modified = 0;

  for (const room of existingRooms) {
    roomTypeCounts[room.roomType] = (roomTypeCounts[room.roomType] ?? 0) + 1;
    if (room.isCollegeRoom && room.roomType === "Laboratory") {
      room.programIds.forEach((id) => labProgramIds.add(id));
    }
    if (buildRoomUpdatePayload(room) !== null) modified += 1;
  }

  for (const room of newRooms) {
    if (!room.roomType) continue;
    roomTypeCounts[room.roomType] = (roomTypeCounts[room.roomType] ?? 0) + 1;
    if (room.isCollegeRoom && room.roomType === "Laboratory") {
      room.programIds.forEach((id) => labProgramIds.add(id));
    }
  }

  return {
    buildingName,
    floorCount,
    totalRooms: existingRooms.length + newRooms.length,
    existingRoomCount: existingRooms.length,
    roomTypeCounts,
    labProgramIds: [...labProgramIds],
    changes: { added: newRooms.length, modified, deleted: 0 },
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

function roomToArchiveTarget(draft: ExistingRoomDraft, building: FacilityBuildingDetail): Room {
  const source = building.rooms.find((room) => room.id === draft.id);
  return {
    id: draft.id,
    buildingId: building.id,
    buildingName: building.name,
    floor: draft.snapshot.floorLevel,
    name: draft.roomName.trim() || draft.snapshot.roomName,
    capacity: draft.roomCapacity,
    isCollegeRoom: source?.isCollegeRoom ?? true,
    type: draft.roomType,
    status: draft.snapshot.roomStatus,
    timeRemaining: source?.timeRemaining ?? "",
    programs: source?.programs ?? [],
  };
}

export function EditBuildingWorkspace({
  building,
  roomTypes,
  programs,
  onUpdateBuilding,
  onUpdateRoom,
  onAddRooms,
  onArchiveRoom,
  onCancel,
  onDirtyChange,
  onSavingChange,
}: EditBuildingWorkspaceProps) {
  const buildingSnapshot = { name: building.name, floorCount: building.floorCount };
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [selectedFloor, setSelectedFloor] = useState(1);
  const [buildingName, setBuildingName] = useState(building.name);
  const [floorCount, setFloorCount] = useState(building.floorCount);
  const [existingDrafts, setExistingDrafts] = useState(() => building.rooms.map(roomToExistingDraft));
  const [floors, setFloors] = useState(() => buildFloors(building, building.rooms.map(roomToExistingDraft)));
  const [archiveTarget, setArchiveTarget] = useState<Room | null>(null);

  useEffect(() => {
    const drafts = building.rooms.map(roomToExistingDraft);
    setBuildingName(building.name);
    setFloorCount(building.floorCount);
    setExistingDrafts(drafts);
    setFloors(buildFloors(building, drafts));
    setSelectedFloor(1);
    setError(null);
  }, [building]);

  const buildingPayload = buildBuildingUpdatePayload(buildingSnapshot, {
    name: buildingName,
    floorCount,
  });
  const summary = useMemo(
    () => computeSummary(buildingName, floorCount, floors),
    [buildingName, floorCount, floors],
  );
  const hasChanges = buildingPayload !== null || summary.changes.added > 0 || summary.changes.modified > 0;
  const selectedFloorData = floors.find((floor) => floor.floorLevel === selectedFloor);

  useEffect(() => {
    onDirtyChange?.(hasChanges);
  }, [hasChanges, onDirtyChange]);

  useEffect(() => {
    onSavingChange?.(isSaving);
  }, [isSaving, onSavingChange]);

  function updateExistingDrafts(updater: (rooms: ExistingRoomDraft[]) => ExistingRoomDraft[]) {
    setExistingDrafts((current) => {
      const next = updater(current);
      setFloors(buildFloors({ ...building, floorCount, name: buildingName }, next));
      return next;
    });
  }

  function updateExistingRoom(roomId: number, patch: Partial<ExistingRoomDraft>) {
    updateExistingDrafts((rooms) => rooms.map((room) => (room.id === roomId ? { ...room, ...patch } : room)));
  }

  function toggleExistingProgram(roomId: number, programId: number) {
    updateExistingDrafts((rooms) =>
      rooms.map((room) => {
        if (room.id !== roomId) return room;
        const next = new Set(room.programIds);
        next.has(programId) ? next.delete(programId) : next.add(programId);
        return { ...room, programIds: [...next] };
      }),
    );
  }

  function updateNewRooms(floorLevel: number, updater: (rooms: NewRoomDraft[]) => NewRoomDraft[]) {
    setFloors((current) => {
      const next = current.map((floor) =>
        floor.floorLevel === floorLevel ? { ...floor, newRooms: updater(floor.newRooms) } : floor,
      );
      return next;
    });
  }

  useEffect(() => {
    setFloors((current) =>
      buildFloors({ ...building, floorCount, name: buildingName }, existingDrafts).map((floor) => ({
        ...floor,
        newRooms: current.find((entry) => entry.floorLevel === floor.floorLevel)?.newRooms ?? [],
      })),
    );
  }, [floorCount]);

  function addRoom(floorLevel: number) {
    updateNewRooms(floorLevel, (rooms) => [...rooms, newRoomDraft()]);
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
    const modifiedRooms = existingDrafts
      .map((draft) => ({ draft, payload: buildRoomUpdatePayload(draft) }))
      .filter((entry): entry is { draft: ExistingRoomDraft; payload: UpdateRoomInput } => entry.payload !== null);

    if (!buildingPayload && modifiedRooms.length === 0 && newRooms.length === 0) {
      toast.message("No changes to save.");
      return;
    }

    if (!buildingName.trim()) {
      setError("Building name is required.");
      return;
    }
    if (!Number.isInteger(floorCount) || floorCount < 1) {
      setError("Enter a valid floor count.");
      return;
    }

    for (const room of existingDrafts) {
      if (!room.roomName.trim()) {
        setError("Every room needs a name.");
        return;
      }
      if (!room.roomType) {
        setError("Select a type for every room.");
        return;
      }
      if (room.roomType !== "Non-Academic" && (!Number.isInteger(room.roomCapacity) || (room.roomCapacity ?? 0) < 1)) {
        setError("Enter a valid capacity for every academic room.");
        return;
      }
      if (room.isCollegeRoom && room.roomType === "Laboratory" && room.programIds.length === 0) {
        setError("Each laboratory must be assigned to at least one program.");
        return;
      }
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
      if (room.roomType !== "Non-Academic" && (!Number.isInteger(room.roomCapacity) || (room.roomCapacity ?? 0) < 1)) {
        setError("Enter a valid capacity for every new academic room.");
        return;
      }
      if (room.isCollegeRoom && room.roomType === "Laboratory" && room.programIds.length === 0) {
        setError("Each laboratory must be assigned to at least one program.");
        return;
      }
    }

    const payload = toAddRoomsPayload(floors);

    setError(null);
    setIsSaving(true);
    try {
      if (buildingPayload) await onUpdateBuilding(buildingPayload);
      for (const { draft, payload: roomPayload } of modifiedRooms) {
        await onUpdateRoom(draft.id, roomPayload);
      }
      if (payload.floors.length > 0) await onAddRooms(payload);
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
    <div className="flex flex-col gap-6">
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
          <div className={statCardClassName}>
            <Input
              id="edit-building-name"
              label="Building name"
              required
              value={buildingName}
              onChange={(e) => setBuildingName(e.target.value)}
            />
          </div>
          <div className={statCardClassName}>
            <Input
              id="edit-building-floors"
              label="Total floors"
              type="number"
              inputMode="numeric"
              required
              min={1}
              value={floorCount === 0 ? "" : floorCount}
              onKeyDown={(e) => {
                if (["e", "E", "+", "-", "."].includes(e.key)) {
                  e.preventDefault();
                }
              }}
              onChange={(e) => {
                const clean = e.target.value.replace(/[^0-9]/g, "");
                const num = clean === "" ? 0 : parseInt(clean, 10);
                setFloorCount(Number.isNaN(num) ? 0 : num);
              }}
              hint="Cannot drop below the highest floor with active rooms."
            />
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
              Add room
            </Button>
          </div>

          {!selectedFloorData ||
          (selectedFloorData.existingRooms.length === 0 && selectedFloorData.newRooms.length === 0) ? (
            <Card className="p-8">
              <EmptyState title={`No rooms on Floor ${selectedFloor}`}>
                <Button type="button" variant="outline" block={false} onClick={() => addRoom(selectedFloor)}>
                  <PlusIcon />
                  Add first room
                </Button>
              </EmptyState>
            </Card>
          ) : (
            <div className="flex flex-col gap-4">
              {selectedFloorData.existingRooms.map((room) => {
                const isDirty = buildRoomUpdatePayload(room) !== null;
                const liveStatus = room.snapshot.roomStatus;
                const canSetStatus = MANUAL_ROOM_STATUSES.includes(
                  liveStatus as (typeof MANUAL_ROOM_STATUSES)[number],
                );
                const statusValue = room.roomStatusOverride ?? liveStatus;

                return (
                <Card key={room.id} className={`p-4 ${isDirty ? "ring-1 ring-amber-300 dark:ring-gold-400/40" : ""}`}>
                  <div className="mb-3 flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="truncate font-body text-sm font-semibold text-navy-700 dark:text-mist-100">
                          {room.roomName.trim() || room.snapshot.roomName}
                        </h3>
                        <Badge tone="emerald">Existing</Badge>
                        {isDirty && <Badge tone="gold">Modified</Badge>}
                      </div>
                      <p className="mt-1 font-body text-xs text-slate-500 dark:text-slate-400">
                        Live status: {liveStatus}
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

                  <div className="grid gap-3 md:grid-cols-3">
                    <Input
                      id={`existing-room-name-${room.id}`}
                      label="Room name"
                      required
                      value={room.roomName}
                      onChange={(e) => updateExistingRoom(room.id, { roomName: e.target.value })}
                    />
                    <FieldChrome id={`existing-room-type-${room.id}`} label="Room type">
                      <Select
                        items={roomTypes.map((t) => ({ value: t, label: t }))}
                        value={room.roomType}
                        onValueChange={(value) =>
                          updateExistingRoom(room.id, {
                            roomType: value as string,
                            programIds: value === "Laboratory" ? room.programIds : [],
                          })
                        }
                      >
                        <SelectTrigger id={`existing-room-type-${room.id}`}>
                          <SelectValue placeholder="Select room type" />
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
                      id={`existing-room-capacity-${room.id}`}
                      label="Capacity"
                      type="number"
                      inputMode="numeric"
                      required={room.roomType !== "Non-Academic"}
                      min={1}
                      value={room.roomCapacity == null ? "" : room.roomCapacity}
                      onKeyDown={(e) => {
                        if (["e", "E", "+", "-", "."].includes(e.key)) {
                          e.preventDefault();
                        }
                      }}
                      onChange={(e) => {
                        const clean = e.target.value.replace(/[^0-9]/g, "");
                        const num = clean === "" ? null : parseInt(clean, 10);
                        updateExistingRoom(room.id, { roomCapacity: Number.isNaN(num) ? null : num });
                      }}
                    />
                  </div>

                  {canSetStatus ? (
                    <div className="mt-3 md:max-w-xs">
                      <FieldChrome id={`existing-room-status-${room.id}`} label="Manual status">
                        <Select
                          items={MANUAL_ROOM_STATUSES.map((s) => ({ value: s, label: s }))}
                          value={statusValue}
                          onValueChange={(value) =>
                            updateExistingRoom(room.id, { roomStatusOverride: value as string })
                          }
                        >
                          <SelectTrigger id={`existing-room-status-${room.id}`}>
                            <SelectValue placeholder="Select status" />
                          </SelectTrigger>
                          <SelectContent>
                            {MANUAL_ROOM_STATUSES.map((s) => (
                              <SelectItem key={s} value={s}>
                                {s}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </FieldChrome>
                    </div>
                  ) : liveStatus === "Occupied" || liveStatus === "Non-Schedulable" ? (
                    <div className="mt-3">
                      <Button
                        type="button"
                        variant="outline"
                        block={false}
                        onClick={() => updateExistingRoom(room.id, { roomStatusOverride: "Maintenance" })}
                      >
                        Mark under maintenance
                      </Button>
                    </div>
                  ) : null}

                  <RoomProgramAccessField
                    id={`existing-room-programs-${room.id}`}
                    roomType={room.roomType}
                    programIds={room.programIds}
                    programs={programs}
                    onChange={(programIds) =>
                      updateExistingRoom(room.id, { programIds })
                    }
                    isCollegeRoom={room.isCollegeRoom}
                    onCollegeRoomChange={(isCollegeRoom) =>
                      updateExistingRoom(room.id, { isCollegeRoom })
                    }
                  />
                </Card>
              );
              })}

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
                      label="Room name"
                      required
                      value={room.roomName}
                      onChange={(e) => updateNewRoom(selectedFloor, room.key, { roomName: e.target.value })}
                    />
                    <FieldChrome id={`new-room-type-${room.key}`} label="Room type" required>
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
                          <SelectValue placeholder="Select room type" />
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
                      inputMode="numeric"
                      required={room.roomType !== "Non-Academic"}
                      min={1}
                      value={room.roomCapacity == null ? "" : room.roomCapacity}
                      onKeyDown={(e) => {
                        if (["e", "E", "+", "-", "."].includes(e.key)) {
                          e.preventDefault();
                        }
                      }}
                      onChange={(e) => {
                        const clean = e.target.value.replace(/[^0-9]/g, "");
                        const num = clean === "" ? null : parseInt(clean, 10);
                        updateNewRoom(selectedFloor, room.key, { roomCapacity: Number.isNaN(num) ? null : num });
                      }}
                    />
                  </div>

                  <RoomProgramAccessField
                    id={`new-room-programs-${room.key}`}
                    roomType={room.roomType}
                    programIds={room.programIds}
                    programs={programs}
                    onChange={(programIds) =>
                      updateNewRoom(selectedFloor, room.key, { programIds })
                    }
                    isCollegeRoom={room.isCollegeRoom}
                    onCollegeRoomChange={(isCollegeRoom) =>
                      updateNewRoom(selectedFloor, room.key, { isCollegeRoom })
                    }
                  />
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

      <StickyFooter>
        <Button type="button" variant="outline" block={false} onClick={onCancel}>
          Back
        </Button>
        <Button type="button" block={false} onClick={handleSave} disabled={!hasChanges} isLoading={isSaving} loadingLabel="Saving…">
          Save changes
        </Button>
      </StickyFooter>
    </div>
  );
}
