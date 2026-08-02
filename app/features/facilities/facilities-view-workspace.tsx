import { useEffect, useMemo, useRef, useState } from "react";
import { useReducedMotion } from "motion/react";
import { EmptyState } from "~/components/feedback/empty-state";
import { SearchInput } from "~/components/ui/search-input";
import { Accordion, AccordionItem } from "~/components/ui/accordion";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { Card } from "~/components/ui/card";
import { FilterDropdown } from "~/components/ui/dropdown-menu";
import {
  ArchiveIcon,
  Building2Icon,
  EditIcon,
  FilterIcon,
  LayersIcon,
  RotateIcon,
} from "~/components/ui/icons";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import { BuildingSummaryPanel } from "~/features/facilities/building-summary-panel";
import { FacilityRoomViewCard } from "~/features/facilities/facility-room-view-card";
import {
  buildFloorBuckets,
  computeBuildingSummary,
} from "~/features/facilities/facility-view-utils";
import type { FacilityBuildingDetail } from "~/types/facility";
import type { Program } from "~/types/program";

type FacilitiesViewWorkspaceProps = {
  buildings: FacilityBuildingDetail[];
  programs: Program[];
  roomTypes: string[];
  roomStatuses: string[];
  selectedBuildingId: number | null;
  onBuildingChange: (buildingId: number) => void;
  onManageBuilding: (building: FacilityBuildingDetail) => void;
  onArchiveBuilding: (building: FacilityBuildingDetail) => void;
};

function pluralizeRooms(count: number) {
  return `${count} room${count === 1 ? "" : "s"}`;
}

function OverviewStat({ label, value }: { label: string; value: string | number }) {
  return (
    <Card className="px-4 py-3">
      <p className="font-body text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">
        {label}
      </p>
      <p className="mt-1 font-display text-2xl tracking-wide text-navy-700 dark:text-mist-100">
        {value}
      </p>
    </Card>
  );
}

export function FacilitiesViewWorkspace({
  buildings,
  programs,
  roomTypes,
  roomStatuses,
  selectedBuildingId,
  onBuildingChange,
  onManageBuilding,
  onArchiveBuilding,
}: FacilitiesViewWorkspaceProps) {
  const building =
    buildings.find((entry) => entry.id === selectedBuildingId) ?? buildings[0] ?? null;
  const reduceMotion = useReducedMotion();
  const floorRefs = useRef<Record<number, HTMLDivElement | null>>({});
  const [openFloors, setOpenFloors] = useState<number[]>([1]);
  const [activeFloor, setActiveFloor] = useState(1);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  const floors = useMemo(() => (building ? buildFloorBuckets(building) : []), [building]);
  const firstFloor = floors[0]?.floorLevel ?? 1;
  const hasActiveFilters =
    search.trim() !== "" || typeFilter !== "all" || statusFilter !== "all";

  const filteredFloors = useMemo(() => {
    const query = search.trim().toLowerCase();
    return floors.map((floor) => ({
      ...floor,
      rooms: floor.rooms.filter((room) => {
        if (typeFilter !== "all" && room.type !== typeFilter) return false;
        if (statusFilter !== "all" && room.status !== statusFilter) return false;
        if (query && !room.name.toLowerCase().includes(query)) return false;
        return true;
      }),
    }));
  }, [floors, search, statusFilter, typeFilter]);

  const filteredRooms = useMemo(
    () => filteredFloors.flatMap((floor) => floor.rooms),
    [filteredFloors],
  );
  const summary = useMemo(() => (building ? computeBuildingSummary(building) : null), [building]);
  const totalCapacity = useMemo(
    () => building?.rooms.reduce((total, room) => total + room.capacity, 0) ?? 0,
    [building],
  );

  useEffect(() => {
    setOpenFloors([firstFloor]);
    setActiveFloor(firstFloor);
    setSearch("");
    setTypeFilter("all");
    setStatusFilter("all");
  }, [building?.id, firstFloor]);

  useEffect(() => {
    if (!hasActiveFilters) return;
    const matchingFloors = filteredFloors
      .filter((floor) => floor.rooms.length > 0)
      .map((floor) => floor.floorLevel);
    setOpenFloors(matchingFloors);
    if (matchingFloors[0] !== undefined) setActiveFloor(matchingFloors[0]);
  }, [filteredFloors, hasActiveFilters]);

  if (buildings.length === 0) {
    return (
      <EmptyState title="No facilities found">
        Create a facility to start managing campus buildings and rooms.
      </EmptyState>
    );
  }

  if (!building || !summary) return null;

  function setFloorOpen(floorLevel: number, open: boolean) {
    setOpenFloors((current) =>
      open
        ? current.includes(floorLevel)
          ? current
          : [...current, floorLevel]
        : current.filter((level) => level !== floorLevel),
    );
    if (open) setActiveFloor(floorLevel);
  }

  function revealFloor(floorLevel: number) {
    setFloorOpen(floorLevel, true);
    requestAnimationFrame(() => {
      floorRefs.current[floorLevel]?.scrollIntoView({
        behavior: reduceMotion ? "auto" : "smooth",
        block: "start",
      });
    });
  }

  function clearFilters() {
    setSearch("");
    setTypeFilter("all");
    setStatusFilter("all");
    setOpenFloors([activeFloor]);
  }

  function floorCountLabel(floorLevel: number, matchingCount: number) {
    const total = floors.find((floor) => floor.floorLevel === floorLevel)?.rooms.length ?? 0;
    return hasActiveFilters ? `${matchingCount} of ${total} rooms` : pluralizeRooms(total);
  }

  return (
    <div className="flex flex-col gap-5">
      <Card className="overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 bg-slate-50/70 px-5 py-4 dark:border-white/10 dark:bg-white/5">
          <div className="flex min-w-0 items-center gap-3">
            <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-slate-100 text-navy-700 dark:bg-white/10 dark:text-slate-300">
              <Building2Icon />
            </span>
            <div className="min-w-0">
              <p className="font-body text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">
                Selected building
              </p>
              <h2 className="truncate font-body text-base font-semibold text-navy-700 dark:text-mist-100">
                {building.name}
              </h2>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button
              type="button"
              variant="outline"
              block={false}
              onClick={() => onManageBuilding(building)}
            >
              <EditIcon />
              Manage
            </Button>
            <Button
              type="button"
              variant="outline"
              block={false}
              onClick={() => onArchiveBuilding(building)}
            >
              <ArchiveIcon />
              Archive
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 p-4 xl:grid-cols-[minmax(180px,1.3fr)_repeat(4,minmax(0,1fr))]">
          <Card className="col-span-2 flex flex-col justify-center px-4 py-3 xl:col-span-1">
            <p className="font-body text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">
              Browse building
            </p>
            <div className="mt-2">
              <Select
                items={buildings.map((entry) => ({ value: String(entry.id), label: entry.name }))}
                value={String(building.id)}
                onValueChange={(value) => {
                  if (value) onBuildingChange(Number(value));
                }}
              >
                <SelectTrigger id="facilities-building-select" aria-label="Building">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {buildings.map((entry) => (
                    <SelectItem key={entry.id} value={String(entry.id)}>
                      {entry.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </Card>
          <OverviewStat label="Total floors" value={building.floorCount} />
          <OverviewStat label="Total rooms" value={building.rooms.length} />
          <OverviewStat label="Total capacity" value={totalCapacity.toLocaleString()} />
          <OverviewStat label="Room types" value={Object.keys(summary.roomTypeCounts).length} />
        </div>
      </Card>

      <Card className="p-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex min-w-0 items-center gap-3">
            <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-slate-100 text-slate-500 dark:bg-white/10 dark:text-slate-300">
              <FilterIcon />
            </span>
            <div>
              <h2 className="font-body text-sm font-semibold text-navy-700 dark:text-mist-100">
                Find a room
              </h2>
              <p aria-live="polite" className="font-body text-xs text-slate-500 dark:text-slate-400">
                {hasActiveFilters
                  ? `Showing ${filteredRooms.length} of ${building.rooms.length} rooms`
                  : `${pluralizeRooms(building.rooms.length)} across ${building.floorCount} floors`}
              </p>
            </div>
          </div>

          <div className="flex w-full flex-wrap items-center gap-2 lg:w-auto">
            <SearchInput
              id="facilities-room-search"
              placeholder="Search room names…"
              value={search}
              onChange={setSearch}
              ariaLabel="Search rooms"
              className="min-w-52 flex-1 lg:w-64 lg:flex-none"
            />
            <FilterDropdown
              id="facilities-type-filter"
              label="Type"
              allLabel="All types"
              options={roomTypes.map((type) => ({ value: type, label: type }))}
              value={typeFilter}
              onChange={setTypeFilter}
            />
            <FilterDropdown
              id="facilities-status-filter"
              label="Status"
              allLabel="All statuses"
              options={roomStatuses.map((status) => ({ value: status, label: status }))}
              value={statusFilter}
              onChange={setStatusFilter}
            />
            {hasActiveFilters && (
              <Button type="button" variant="outline" block={false} onClick={clearFilters}>
                <RotateIcon />
                Reset
              </Button>
            )}
          </div>
        </div>
      </Card>

      <nav aria-label="Building floors" className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1 xl:hidden">
        {filteredFloors.map((floor) => {
          const isActive = activeFloor === floor.floorLevel;
          return (
            <button
              key={floor.floorLevel}
              type="button"
              aria-current={isActive ? "true" : undefined}
              onClick={() => revealFloor(floor.floorLevel)}
              className={`flex shrink-0 cursor-pointer items-center gap-2 rounded-lg border px-3 py-2 font-body text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-400 ${
                isActive
                  ? "border-slate-400 bg-slate-100 font-semibold text-navy-700 dark:border-white/20 dark:bg-white/10 dark:text-mist-100"
                  : "border-slate-300 bg-white text-slate-600 hover:bg-slate-50 dark:border-white/15 dark:bg-white/5 dark:text-slate-300 dark:hover:bg-white/10"
              }`}
            >
              Floor {floor.floorLevel}
              <span className="text-xs opacity-70">{floor.rooms.length}</span>
            </button>
          );
        })}
      </nav>

      <div className="grid items-start gap-5 xl:grid-cols-[190px_minmax(0,1fr)_280px]">
        <Card className="sticky top-6 hidden h-fit overflow-hidden xl:block">
          <div className="border-b border-slate-200 px-4 py-3.5 dark:border-white/10">
            <div className="flex items-center gap-2">
              <LayersIcon />
              <h2 className="font-body text-sm font-semibold text-navy-700 dark:text-mist-100">
                Floors
              </h2>
            </div>
            <p className="mt-1 font-body text-xs text-slate-500 dark:text-slate-400">
              Jump to a floor
            </p>
          </div>
          <nav aria-label="Floor index">
            <ul className="py-2">
              {filteredFloors.map((floor) => {
                const isActive = activeFloor === floor.floorLevel;
                return (
                  <li key={floor.floorLevel}>
                    <button
                      type="button"
                      aria-current={isActive ? "true" : undefined}
                      onClick={() => revealFloor(floor.floorLevel)}
                      className={`relative flex w-full cursor-pointer items-center gap-3 px-4 py-3 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-gold-400 ${
                        isActive
                          ? "bg-slate-100 text-navy-700 dark:bg-white/10 dark:text-mist-100"
                          : "text-navy-700 hover:bg-slate-50 dark:text-mist-100 dark:hover:bg-white/5"
                      }`}
                    >
                      {isActive && (
                        <span className="absolute inset-y-0 left-0 w-0.5 bg-navy-700 dark:bg-slate-300" />
                      )}
                      <span
                        className={`grid size-8 shrink-0 place-items-center rounded-lg ${
                          isActive
                            ? "bg-white text-navy-700 dark:bg-white/10 dark:text-mist-100"
                            : "bg-slate-100 text-slate-500 dark:bg-white/10 dark:text-slate-400"
                        }`}
                      >
                        <Building2Icon />
                      </span>
                      <span className="min-w-0">
                        <span className="block truncate font-body text-sm font-semibold">
                          Floor {floor.floorLevel}
                        </span>
                        <span
                          className={`block font-body text-xs ${
                            isActive
                              ? "text-slate-600 dark:text-slate-300"
                              : "text-slate-500 dark:text-slate-400"
                          }`}
                        >
                          {floorCountLabel(floor.floorLevel, floor.rooms.length)}
                        </span>
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </nav>
        </Card>

        <section aria-labelledby="floor-directory-title" className="min-w-0">
          <div className="mb-3 flex flex-wrap items-end justify-between gap-2">
            <div>
              <h2
                id="floor-directory-title"
                className="font-display text-lg tracking-wide text-navy-700 dark:text-mist-100"
              >
                Floors & Rooms
              </h2>
              <p className="font-body text-sm text-slate-500 dark:text-slate-400">
                Expand a floor to view its rooms and facilities.
              </p>
            </div>
            <p className="font-body text-xs text-slate-500 dark:text-slate-400">
              {openFloors.length} expanded
            </p>
          </div>

          <Accordion>
            {filteredFloors.map((floor) => {
              const totalRoomCount =
                floors.find((entry) => entry.floorLevel === floor.floorLevel)?.rooms.length ?? 0;
              return (
                <div
                  key={floor.floorLevel}
                  ref={(node) => {
                    floorRefs.current[floor.floorLevel] = node;
                  }}
                  className="scroll-mt-6"
                >
                  <AccordionItem
                    title={
                      <span className="flex min-w-0 items-center gap-3">
                        <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-slate-100 text-navy-700 dark:bg-white/10 dark:text-slate-300">
                          <Building2Icon />
                        </span>
                        <span className="truncate font-body text-sm font-semibold">
                          Floor {floor.floorLevel}
                        </span>
                        <Badge tone="slate">
                          {hasActiveFilters
                            ? `${floor.rooms.length} of ${totalRoomCount}`
                            : pluralizeRooms(totalRoomCount)}
                        </Badge>
                      </span>
                    }
                    open={openFloors.includes(floor.floorLevel)}
                    onOpenChange={(open) => setFloorOpen(floor.floorLevel, open)}
                  >
                    {floor.rooms.length === 0 ? (
                      <div className="px-5 py-8 text-center">
                        <p className="font-body text-sm font-semibold text-navy-700 dark:text-mist-100">
                          {hasActiveFilters ? "No matching rooms on this floor" : "No rooms on this floor"}
                        </p>
                        <p className="mt-1 font-body text-xs text-slate-500 dark:text-slate-400">
                          {hasActiveFilters
                            ? "Try changing or resetting the current filters."
                            : "Rooms have not been assigned to this floor yet."}
                        </p>
                      </div>
                    ) : (
                      <div className="grid gap-3 bg-slate-50/40 p-4 dark:bg-navy-950/20 md:grid-cols-2 min-[1400px]:grid-cols-3 2xl:grid-cols-4">
                        {floor.rooms.map((room) => (
                          <FacilityRoomViewCard key={room.id} room={room} />
                        ))}
                      </div>
                    )}
                  </AccordionItem>
                </div>
              );
            })}
          </Accordion>

          {hasActiveFilters && filteredRooms.length === 0 && (
            <Card className="mt-3 p-2">
              <EmptyState
                title="No rooms match your filters"
                action={
                  <Button type="button" variant="outline" block={false} onClick={clearFilters}>
                    <RotateIcon />
                    Reset filters
                  </Button>
                }
              >
                Try a different room name, type, or status.
              </EmptyState>
            </Card>
          )}
        </section>

        <BuildingSummaryPanel summary={summary} programs={programs} />
      </div>
    </div>
  );
}
