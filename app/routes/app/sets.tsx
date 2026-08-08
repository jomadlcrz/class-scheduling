import { useMemo, useState } from "react";
import { toast } from "sonner";
import { RoleGuard } from "~/auth/role-guard";
import { Button } from "~/components/ui/button";
import { EmptyState } from "~/components/feedback/empty-state";
import { FilterDropdown } from "~/components/ui/dropdown-menu";
import { PlusIcon, SearchIcon } from "~/components/ui/icons";
import { inputClassName } from "~/components/ui/input";
import { Modal } from "~/components/ui/modal";
import { Pagination } from "~/components/ui/pagination";
import { TableSkeleton } from "~/components/ui/skeleton";
import { SetArchiveDialog } from "~/features/sets/set-archive-dialog";
import { SetForm } from "~/features/sets/set-form";
import { SetTable } from "~/features/sets/set-table";
import { PageHeader } from "~/layouts/page-header";
import { programService } from "~/services/program.service";
import { setService } from "~/services/set.service";
import { useCachedData } from "~/hooks/use-cached-data";
import { usePagination } from "~/hooks/use-pagination";
import type { ClassSet, CreateSetInput } from "~/types/set";
import { useYearLevels } from "~/hooks/use-year-levels";

export function meta() {
  return [
    { title: "Sets — GWC Class Scheduling" },
    { name: "description", content: "Manage class sets for the current academic term." },
  ];
}

export default function Sets() {
  return (
    <RoleGuard allow={["admin", "registrar", "dean"]}>
      <SetsPage />
    </RoleGuard>
  );
}

function SetsPage() {
  const { yearLevelIds, yearLevelLabel } = useYearLevels();
  const { data: sets, error, reload } = useCachedData("sets", () => setService.list());
  const { data: programs } = useCachedData("programs", () => programService.list());

  const [search, setSearch] = useState("");
  const [program, setProgram] = useState("all");
  const [yearLevel, setYearLevel] = useState("all");

  const [createOpen, setCreateOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<ClassSet | null>(null);
  const [archiveTarget, setArchiveTarget] = useState<ClassSet | null>(null);

  const resetKey = `${search}|${program}|${yearLevel}`;

  const visibleSets = useMemo(() => {
    if (!sets) return [];
    const query = search.trim().toLowerCase();
    return sets
      .filter((set) => {
        if (program !== "all" && set.program !== program) return false;
        if (yearLevel !== "all" && set.yearLevel !== Number(yearLevel)) return false;
        if (query && !set.setCode.toLowerCase().includes(query)) return false;
        return true;
      })
      .sort(
        (a, b) =>
          (a.program ?? "").localeCompare(b.program ?? "") ||
          a.yearLevel - b.yearLevel ||
          (a.setCode ?? "").localeCompare(b.setCode ?? ""),
      );
  }, [sets, search, program, yearLevel]);

  const pagination = usePagination(visibleSets, resetKey);

  // Mutations return only a message, so the list is refetched afterwards.
  const refresh = reload;

  async function handleCreate(inputs: CreateSetInput[]) {
    const message = await setService.create(inputs);
    if (message) toast.success(message);
    await refresh();
    setCreateOpen(false);
  }

  async function handleEdit(inputs: CreateSetInput[]) {
    if (!editTarget || inputs.length === 0) return;
    const message = await setService.update(editTarget.id, inputs[0].setCode);
    if (message) toast.success(message);
    await refresh();
    setEditTarget(null);
  }

  async function handleArchive(target: ClassSet) {
    const message = await setService.remove(target.id, target.setCode);
    if (message) toast.success(message);
    await refresh();
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <PageHeader
        title="Sets"
        description="Class sets grouped by program and year level."
        actions={
          <Button type="button" block={false} onClick={() => setCreateOpen(true)}>
            <PlusIcon />
            New Set
          </Button>
        }
      />

      <div className="mt-6 flex flex-col gap-4">
        <div className="flex flex-wrap items-end gap-3">
          <div className="relative w-full sm:w-64">
            <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-slate-400">
              <SearchIcon />
            </span>
            <input
              id="set-search"
              type="search"
              placeholder="Set code…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              aria-label="Search"
              className={`${inputClassName} pl-9 pr-4`}
            />
          </div>
          <FilterDropdown
            id="set-program-filter"
            label="Program"
            allLabel="All programs"
            options={(programs ?? []).map((p) => ({ value: p.abbrev, label: `${p.abbrev} — ${p.name}` }))}
            value={program}
            onChange={setProgram}
          />
          <FilterDropdown
            id="set-year-filter"
            label="Year Level"
            allLabel="All year levels"
            options={yearLevelIds.map((year) => ({ value: String(year), label: yearLevelLabel(year) }))}
            value={yearLevel}
            onChange={(v) => setYearLevel(String(v))}
          />
        </div>

        {sets === null && !error ? (
          <TableSkeleton columns={4} rows={8} />
        ) : visibleSets.length === 0 ? (
          <EmptyState title="No sets found">
            No sets match the current filters. Adjust the search or add a new set.
          </EmptyState>
        ) : (
          <>
            <SetTable
              sets={pagination.pageItems}
              programs={programs ?? []}
              onEdit={setEditTarget}
              onArchive={setArchiveTarget}
            />
            <Pagination
              page={pagination.page}
              totalItems={pagination.totalItems}
              pageSize={pagination.pageSize}
              onPageChange={pagination.setPage}
            />
          </>
        )}
      </div>

      <Modal open={createOpen} onClose={() => setCreateOpen(false)} title="New Set">
        <SetForm programs={programs ?? []} onSubmit={handleCreate} onCancel={() => setCreateOpen(false)} />
      </Modal>

      <Modal open={editTarget !== null} onClose={() => setEditTarget(null)} title="Edit Set">
        {editTarget && (
          <SetForm
            set={editTarget}
            programs={programs ?? []}
            onSubmit={handleEdit}
            onCancel={() => setEditTarget(null)}
          />
        )}
      </Modal>

      <SetArchiveDialog
        set={archiveTarget}
        onClose={() => setArchiveTarget(null)}
        onConfirm={handleArchive}
      />
    </div>
  );
}
