import type { Room, CreateRoomInput, UpdateRoomInput } from "../types/room";
import { rooms, delay, newRoomId } from "./mock-data";

function findRoom(id: string): Room {
  const r = rooms.find((r) => r.id === id);
  if (!r) throw new Error("Room not found.");
  return r;
}

function nameTaken(buildingId: string, floor: number, name: string, excludeId?: string): boolean {
  return rooms.some(
    (r) =>
      r.id !== excludeId &&
      r.buildingId === buildingId &&
      r.floor === floor &&
      r.name.toLowerCase() === name.trim().toLowerCase(),
  );
}

async function list(): Promise<Room[]> {
  await delay();
  return [...rooms];
}

async function create(input: CreateRoomInput): Promise<Room> {
  await delay(300);
  if (nameTaken(input.buildingId, input.floor, input.name))
    throw new Error(
      `Room "${input.name}" already exists on floor ${input.floor} of this building.`,
    );
  const room: Room = { id: newRoomId(), ...input };
  rooms.push(room);
  return room;
}

async function update(id: string, input: UpdateRoomInput): Promise<Room> {
  await delay();
  const room = findRoom(id);
  const buildingId = input.buildingId ?? room.buildingId;
  const floor = input.floor ?? room.floor;
  const name = input.name ?? room.name;
  if (nameTaken(buildingId, floor, name, id))
    throw new Error(`Room "${name}" already exists on floor ${floor} of this building.`);
  Object.assign(room, input);
  return room;
}

async function remove(id: string): Promise<void> {
  await delay();
  const room = findRoom(id);
  rooms.splice(rooms.indexOf(room), 1);
}

export const roomService = { list, create, update, remove };
