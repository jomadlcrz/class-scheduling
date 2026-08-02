import { Menu } from "@base-ui/react/menu";
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router";
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
  MoreVerticalIcon,
  PlusIcon,
  TrashIcon,
} from "~/components/ui/icons";
import { FieldChrome, Input } from "~/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "~/components/ui/select";
import {
  EditBuildingSummaryPanel,
  type EditBuildingSummaryData,
} from "~/features/facilities/edit-building-summary-panel";
import type {
  EditFacilityFloorDraft,
  EditFacilityRoomDraft,
  FacilityBuildingDetail,
} from "~/types/facility";
import type { Program } from "~/types/program";

type EditBuildingWorkspaceProps = {
  building: FacilityBuildingDetail;
  roomTypes: string[];
  programs: Program[];
  onCancel: () => void;
};

type OriginalRoomSnapshot = {
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

function newRoomDraft(roomType = ""): EditFacilityRoomDraft {
  return {
    key: newDraftKey(),
    roomName: "",
    roomType,
    roomCapacity: 30,
    programIds: [],
    status: "Vacant",
    isNew: true,
    isDeleted: false,
  };
}

function buildFloors(building: FacilityBuildingDetail): EditFacilityFloorDraft[] {
  const floors: EditFacilityFloorDraft[] = Array.from({ length: building.floorCount }, (_, index) => ({
    floorLevel: index + 1,
    rooms: [],
  }));

  for (const room of building.rooms) {
    const floor = floors[room.floor - 1];
    if (!floor) continue;
    floor.rooms.push({
      key: `existing-${room.id}`,
      roomId: room.id,
      roomName: room.name,
      roomType: room.type,
      roomCapacity: room.capacity,
      programIds: [...room.programIds],
      status: room.status,
      isNew: false,
      isDeleted: false,
    });
  }

  return floors;
}

function buildOriginalSnapshots(building: FacilityBuildingDetail): Map<number, OriginalRoomSnapshot> {
  const snapshots = new Map<number, OriginalRoomSnapshot>();
  for (const room of building.rooms) {
    snapshots.set(room.id, {
      roomName: room.name,
      roomType: room.type,
      roomCapacity: room.capacity,
      programIds: [...room.programIds].sort((a, b) => a - b),
    });
  }
  return snapshots;
}

function sameProgramIds(a: number[], b: number[]): boolean {
  if (a.length !== b.length) return false;
  const left = [...a].sort((x, y) => x - y);
  const right = [...b].sort((x, y) => x - y);
  return left.every((value, index) => value === right[index]);
}

function isRoomModified(room: EditFacilityRoomDraft, original?: OriginalRoomSnapshot): boolean {
  if (room.isNew || room.isDeleted || !original) return false;
  return (
    room.roomName.trim() !== original.roomName ||
    room.roomType !== original.roomType ||
    room.roomCapacity !== original.roomCapacity ||
    !sameProgramIds(room.programIds, original.programIds)
  );
}

function computeSummary(
  buildingName: string,
  floorCount: number,
  floors: EditFacilityFloorDraft[],
  originalSnapshots: Map<number, OriginalRoomSnapshot>,
): EditBuildingSummaryData {
  const activeRooms = floors.flatMap((floor) => floor.rooms.filter((room) => !room.isDeleted));
  const roomTypeCounts: Record<string, number> = {};
  const labProgramIds = new Set<number>();
  let added = 0;
  let modified = 0;
  let deleted = 0;

  for (const room of floors.flatMap((floor) => floor.rooms)) {
    if (room.isDeleted && room.roomId) deleted += 1;
    if (room.isNew && !room.isDeleted) added += 1;
    if (isRoomModified(room, room.roomId ? originalSnapshots.get(room.roomId) : undefined)) modified += 1;
  }

  for (const room of activeRooms) {
    if (!room.roomType) continue;
    roomTypeCounts[room.roomType] = (roomTypeCounts[room.roomType] ?? 0) + 1;
    if (room.roomType === "Laboratory") {
      room.programIds.forEach((id) => labProgramIds.add(id));
    }
  }

  return {
    buildingName,
    floorCount,
    totalRooms: activeRooms.length,
    existingRoomCount: activeRooms.filter((room) => !room.isNew).length,
    roomTypeCounts,
    labProgramIds: [...labProgramIds],
    changes: { added, modified, deleted },
  };
}

function getRoomBadge(room: EditFacilityRoomDraft, original?: OriginalRoomSnapshot) {
  if (room.isNew) return { label: "NEW", tone: "blue" as const };
  if (isRoomModified(room, original)) return { label: "Modified", tone: "gold" as const };
  return { label: "Existing", tone: "emerald" as const };
}

function getRoomValidation(room: EditFacilityRoomDraft) {
  const errors: string[] = [];
  if (!room.roomName.trim()) errors.push("Room name is required.");
  if (!Number.isInteger(room.roomCapacity) || room.roomCapacity < 1) {
    errors.push("Room capacity must be greater than zero.");
  }
  if (room.roomType === "Laboratory" && room.programIds.length === 0) {
    errors.push("Assign at least one program to a laboratory.");
  }
  return errors;
}

const floorButtonClassName = (active: boolean) =>
  `flex w-full items-center justify-between rounded-lg border px-3 py-2.5 text-left font-body text-sm transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-400 ${
    active
      ? "border-gwc-blue-bright bg-gwc-blue-bright/10 font-semibold text-gwc-blue-bright dark:border-blue-400 dark:bg-blue-400/10 dark:text-blue-300"
      : "border-slate-200 bg-white text-navy-700 hover:bg-slate-50 dark:border-white/10 dark:bg-white/5 dark:text-mist-100 dark:hover:bg-white/10"
  }`;

const statCardClassName =
  "rounded-lg border border-slate-200 bg-slate-50/80 px-4 py-3 dark:border-white/10 dark:bg-white/5";

export function EditBuildingWorkspace({
  building,
  roomTypes,
  programs,
  onCancel,
}: EditBuildingWorkspaceProps) {
  const defaultRoomType = roomTypes[0] ?? "";
  const [error, setError] = useState<string | null>(null);
  const [selectedFloor, setSelectedFloor] = useState(1);
  const [floors, setFloors] = useState<EditFacilityFloorDraft[]>(() => buildFloors(building));
  const [originalSnapshots] = useState(() => buildOriginalSnapshots(building));

  useEffect(() => {
    setFloors(buildFloors(building));
    setSelectedFloor(1);
  }, [building]);

  const summary = useMemo(
    () => computeSummary(building.name, building.floorCount, floors, originalSnapshots),
    [building.name, building.floorCount, floors, originalSnapshots],
  );

  const hasPendingChanges =
    summary.changes.added > 0 || summary.changes.modified > 0 || summary.changes.deleted > 0;

  const selectedFloorData = floors.find((floor) => floor.floorLevel === selectedFloor);
  const visibleRooms = selectedFloorData?.rooms.filter((room) => !room.isDeleted) ?? [];

  function updateFloorRooms(
    floorLevel: number,
    updater: (rooms: EditFacilityRoomDraft[]) => EditFacilityRoomDraft[],
  ) {
    setFloors((current) =>
      current.map((floor) =>
        floor.floorLevel === floorLevel ? { ...floor, rooms: updater(floor.rooms) } : floor,
      ),
    );
  }

  function addRoom(floorLevel: number) {
    updateFloorRooms(floorLevel, (rooms) => [...rooms, newRoomDraft(defaultRoomType)]);
    setSelectedFloor(floorLevel);
  }

  function duplicateRoom(floorLevel: number, room: EditFacilityRoomDraft) {
    updateFloorRooms(floorLevel, (rooms) => [
      ...rooms,
      {
        ...room,
        key: newDraftKey(),
        roomId: undefined,
        roomName: room.roomName ? `${room.roomName} (copy)` : "",
        status: "Vacant",
        isNew: true,
        isDeleted: false,
      },
    ]);
  }

  function removeRoom(floorLevel: number, room: EditFacilityRoomDraft) {
    if (room.isNew) {
      updateFloorRooms(floorLevel, (rooms) => rooms.filter((entry) => entry.key !== room.key));
      return;
    }
    updateFloorRooms(floorLevel, (rooms) =>
      rooms.map((entry) => (entry.key === room.key ? { ...entry, isDeleted: true } : entry)),
    );
  }

  function updateRoom(floorLevel: number, key: string, patch: Partial<EditFacilityRoomDraft>) {
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

  function handleSave() {
    const activeRooms = floors.flatMap((floor) => floor.rooms.filter((room) => !room.isDeleted));

    for (const room of activeRooms) {
      const validationErrors = getRoomValidation(room);
      if (validationErrors.length > 0) {
        setError(validationErrors[0]);
        return;
      }
      if (!room.roomType) {
        setError("Select a type for every room.");
        return;
      }
    }

    if (!hasPendingChanges) {
      toast.message("No changes to save.");
      return;
    }

    setError(null);
    toast.error("Building updates are not available yet. Save will be enabled once the update API is ready.");
  }

  function handleDiscard() {
    setFloors(buildFloors(building));
    setError(null);
    toast.message("Changes discarded.");
  }

  return (
    <div className="flex flex-col gap-6 pb-28">
      <nav aria-label="Breadcrumb" className="font-body text-sm text-slate-500 dark:text-slate-400">
        <ol className="flex flex-wrap items-center gap-1.5">
          <li>
            <Link to="/facilities" className="transition-colors hover:text-navy-700 dark:hover:text-mist-100">
              Facilities
            </Link>
          </li>
          <li aria-hidden="true">/</li>
          <li>
            <Link to="/facilities" className="transition-colors hover:text-navy-700 dark:hover:text-mist-100">
              Buildings
            </Link>
          </li>
          <li aria-hidden="true">/</li>
          <li className="font-medium text-navy-700 dark:text-mist-100">Edit Building</li>
        </ol>
      </nav>

      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl tracking-wide text-navy-700 dark:text-mist-100">
            Edit Building
          </h1>
          <p className="mt-1 font-body text-sm text-slate-500 dark:text-slate-400">
            Manage rooms and facilities assigned to this building.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button type="button" variant="outline" block={false} onClick={onCancel}>
            <ArrowLeftIcon />
            Back
          </Button>
          <Button type="button" block={false} onClick={handleSave} disabled={!hasPendingChanges}>
            Save Changes
          </Button>
        </div>
      </div>

      <Card className="p-4">
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-6">
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
              Total Rooms
            </p>
            <p className="mt-1 font-medium text-navy-700 dark:text-mist-100">{summary.totalRooms}</p>
          </div>
          <div className={statCardClassName}>
            <p className="font-body text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">
              Lecture Rooms
            </p>
            <p className="mt-1 font-medium text-navy-700 dark:text-mist-100">
              {summary.roomTypeCounts["Lecture Room"] ?? 0}
            </p>
          </div>
          <div className={statCardClassName}>
            <p className="font-body text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">
              Laboratory Rooms
            </p>
            <p className="mt-1 font-medium text-navy-700 dark:text-mist-100">
              {summary.roomTypeCounts.Laboratory ?? 0}
            </p>
          </div>
          <div className={statCardClassName}>
            <p className="font-body text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">
              Last Updated
            </p>
            <p className="mt-1 font-medium text-navy-700 dark:text-mist-100">—</p>
          </div>
        </div>
      </Card>

      <FormError message={error} />

      <div className="grid gap-6 xl:grid-cols-[220px_minmax(0,1fr)_320px]">
        <Card className="h-fit p-4">
          <h2 className="font-display text-base tracking-wide text-navy-700 dark:text-mist-100">Floors</h2>
          <ul className="mt-3 flex flex-col gap-2">
            {floors.map((floor) => {
              const roomCount = floor.rooms.filter((room) => !room.isDeleted).length;
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
                {visibleRooms.length} room{visibleRooms.length === 1 ? "" : "s"}
              </p>
            </div>
            <Button type="button" variant="outline" block={false} onClick={() => addRoom(selectedFloor)}>
              <PlusIcon />
              Add Room
            </Button>
          </div>

          {visibleRooms.length === 0 ? (
            <Card className="p-8">
              <EmptyState title={`No rooms on Floor ${selectedFloor}`}>
                <Button type="button" variant="outline" block={false} onClick={() => addRoom(selectedFloor)}>
                  <PlusIcon />
                  Add First Room
                </Button>
              </EmptyState>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 2xl:grid-cols-3">
              {visibleRooms.map((room) => {
                const original = room.roomId ? originalSnapshots.get(room.roomId) : undefined;
                const badge = getRoomBadge(room, original);
                const validationErrors = room.isNew ? getRoomValidation(room) : [];
                const hasErrors = validationErrors.length > 0;

                return (
                  <Card
                    key={room.key}
                    className={`p-4 ${hasErrors ? "border-red-300 dark:border-red-400/40" : ""}`}
                  >
                    <div className="mb-3 flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="truncate font-body text-sm font-semibold text-navy-700 dark:text-mist-100">
                            {room.roomName.trim() || "Untitled Room"}
                          </h3>
                          <Badge tone={badge.tone}>{badge.label}</Badge>
                        </div>
                        {!room.isNew && (
                          <p className="mt-1 font-body text-xs text-slate-500 dark:text-slate-400">
                            Status: {room.status}
                          </p>
                        )}
                      </div>
                      <Menu.Root modal={false}>
                        <Menu.Trigger
                          aria-label={`Room actions for ${room.roomName || "room"}`}
                          className="grid size-8 shrink-0 cursor-pointer place-items-center rounded-lg text-slate-400 transition-colors duration-150 hover:bg-slate-200/60 hover:text-navy-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-400 dark:hover:bg-white/10"
                        >
                          <MoreVerticalIcon />
                        </Menu.Trigger>
                        <Menu.Portal>
                          <Menu.Positioner sideOffset={6} align="end" collisionPadding={8} className="z-50 outline-none">
                            <Menu.Popup className="min-w-40 rounded-lg border border-slate-200 bg-white p-1 shadow-lg outline-none dark:border-white/10 dark:bg-surface-raised">
                              <Menu.Item
                                onClick={() => duplicateRoom(selectedFloor, room)}
                                className="flex w-full cursor-pointer items-center gap-2 rounded-md px-3 py-2 font-body text-sm text-gray-900 outline-none data-highlighted:bg-slate-100 dark:text-mist-100 dark:data-highlighted:bg-white/10"
                              >
                                <CopyIcon />
                                Duplicate
                              </Menu.Item>
                              <Menu.Item
                                onClick={() => removeRoom(selectedFloor, room)}
                                className="flex w-full cursor-pointer items-center gap-2 rounded-md px-3 py-2 font-body text-sm text-red-600 outline-none data-highlighted:bg-red-50 dark:text-red-300 dark:data-highlighted:bg-red-400/10"
                              >
                                <TrashIcon />
                                {room.isNew ? "Remove" : "Delete"}
                              </Menu.Item>
                            </Menu.Popup>
                          </Menu.Positioner>
                        </Menu.Portal>
                      </Menu.Root>
                    </div>

                    <div className="flex flex-col gap-3">
                      <Input
                        id={`edit-room-name-${room.key}`}
                        label="Room Name"
                        required
                        placeholder="Room 201"
                        value={room.roomName}
                        onChange={(e) =>
                          updateRoom(selectedFloor, room.key, { roomName: e.target.value })
                        }
                      />
                      <FieldChrome id={`edit-room-type-${room.key}`} label="Room Type">
                        <Select
                          items={roomTypes.map((t) => ({ value: t, label: t }))}
                          value={room.roomType}
                          onValueChange={(value) =>
                            updateRoom(selectedFloor, room.key, {
                              roomType: value as string,
                              programIds: value === "Laboratory" ? room.programIds : [],
                            })
                          }
                        >
                          <SelectTrigger id={`edit-room-type-${room.key}`}>
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
                        id={`edit-room-capacity-${room.key}`}
                        label="Capacity"
                        type="number"
                        required
                        min={1}
                        value={room.roomCapacity}
                        onChange={(e) =>
                          updateRoom(selectedFloor, room.key, {
                            roomCapacity: Number(e.target.value),
                          })
                        }
                      />
                      {room.roomType === "Laboratory" && (
                        <FieldChrome
                          id={`edit-room-programs-${room.key}`}
                          label="Assigned Programs"
                          hint="A laboratory must have at least one program."
                        >
                          <Menu.Root modal={false}>
                            <Menu.Trigger
                              id={`edit-room-programs-${room.key}`}
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
                                          toggleProgram(selectedFloor, room.key, p.id)
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
                      )}
                    </div>

                    {hasErrors && (
                      <ul className="mt-3 space-y-1 font-body text-xs text-red-600 dark:text-red-300">
                        {validationErrors.map((message) => (
                          <li key={message}>{message}</li>
                        ))}
                      </ul>
                    )}
                  </Card>
                );
              })}
            </div>
          )}
        </div>

        <EditBuildingSummaryPanel summary={summary} programs={programs} />
      </div>

      {hasPendingChanges && (
        <div className="fixed inset-x-0 bottom-0 z-40 border-t border-amber-200 bg-amber-50/95 px-4 py-3 backdrop-blur dark:border-gold-400/20 dark:bg-amber-950/90">
          <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3">
            <div>
              <p className="font-body text-sm font-semibold text-amber-900 dark:text-gold-300">
                Pending Changes
              </p>
              <p className="font-body text-sm text-amber-800 dark:text-gold-200/90">
                {summary.changes.added} added, {summary.changes.modified} modified, {summary.changes.deleted}{" "}
                deleted
              </p>
            </div>
            <div className="flex gap-2">
              <Button type="button" variant="outline" block={false} onClick={handleDiscard}>
                Cancel
              </Button>
              <Button type="button" block={false} onClick={handleSave}>
                Save Changes
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
