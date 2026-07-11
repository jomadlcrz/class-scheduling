import type { Building, CreateBuildingInput, UpdateBuildingInput } from "~/types/building";

function findBuilding(id: string): Building {
  const b = buildings.find((b) => b.id === id);
  if (!b) throw new Error("Building not found.");
  return b;
}

function codeTaken(code: string, excludeId?: string): boolean {
  return buildings.some(
    (b) => b.id !== excludeId && b.code.toLowerCase() === code.trim().toLowerCase(),
  );
}

async function list(): Promise<Building[]> {
  await delay();
  return [...buildings];
}

async function create(input: CreateBuildingInput): Promise<Building> {
  await delay(300);
  if (codeTaken(input.code))
    throw new Error(`Building code "${input.code}" is already in use.`);
  const building: Building = { id: newBuildingId(), ...input };
  buildings.push(building);
  return building;
}

async function update(id: string, input: UpdateBuildingInput): Promise<Building> {
  await delay();
  const building = findBuilding(id);
  if (input.code && codeTaken(input.code, id))
    throw new Error(`Building code "${input.code}" is already in use.`);
  Object.assign(building, input);
  return building;
}

async function remove(id: string): Promise<void> {
  await delay();
  const building = findBuilding(id);
  buildings.splice(buildings.indexOf(building), 1);
}

export const buildingService = { list, create, update, remove };
