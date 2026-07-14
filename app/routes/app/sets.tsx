import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { RoleGuard } from "~/auth/role-guard";
import { Button } from "~/components/ui/button";
import { EmptyState } from "~/components/feedback/empty-state";
import { PlusIcon, SearchIcon } from "~/components/ui/icons";
import { inputClassName } from "~/components/ui/input";
import { ConfirmDialog, Modal } from "~/components/ui/modal";
import { Pagination } from "~/components/ui/pagination";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "~/components/ui/select";
import { Spinner } from "~/components/ui/spinner";
import { SetForm } from "~/features/sets/set-form";
import { SetTable } from "~/features/sets/set-table";
import { PageHeader } from "~/layouts/page-header";
import { programService } from "~/services/program.service";
import { setService } from "~/services/set.service";
import { usePagination } from "~/hooks/use-pagination";
import type { Program } from "~/types/program";
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
  const [sets, setSets] = useState<ClassSet[] | null>(null);
  const [programs, setPrograms] = useState<Program[] | null>(null);

  const [search, setSearch] = useState("");
  const [program, setProgram] = useState("all");
  const [yearLevel, setYearLevel] = useState("all");

  const [createOpen, setCreateOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<ClassSet | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<ClassSet | null>(null);

  useEffect(() => {
    setService.list().then(setSets).catch(() => setSets([]));
    programService.list().then(setPrograms).catch(() => setPrograms([]));
  }, []);

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
  async function refresh() {
    setSets(await setService.list());
  }

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

  async function handleDelete(target: ClassSet) {
    const message = await setService.remove(target.id);
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
          <div className="w-36 sm:w-44">
            <Select
              items={[
                { value: "all", label: "All programs" },
                ...(programs ?? []).map((p) => ({ value: p.code, label: `${p.code} — ${p.name}` })),
              ]}
              value={program}
              onValueChange={(v) => setProgram(v as string)}
            >
              <SelectTrigger id="set-program-filter" aria-label="Program">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All programs</SelectItem>
                {(programs ?? []).map((p) => (
                  <SelectItem key={p.code} value={p.code}>
                    {p.code} — {p.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="w-36 sm:w-44">
            <Select
              items={[
                { value: "all", label: "All year levels" },
                ...yearLevelIds.map((year) => ({ value: String(year), label: yearLevelLabel(year) })),
              ]}
              value={yearLevel}
              onValueChange={(v) => setYearLevel(String(v))}
            >
              <SelectTrigger id="set-year-filter" aria-label="Year Level">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All year levels</SelectItem>
                {yearLevelIds.map((year) => (
                  <SelectItem key={year} value={String(year)}>
                    {yearLevelLabel(year)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {sets === null ? (
          <div
            role="status"
            aria-label="Loading sets"
            className="grid place-items-center py-12 text-navy-700 dark:text-slate-200"
          >
            <Spinner />
          </div>
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
              onDelete={setDeleteTarget}
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

      <ConfirmDialog
        open={deleteTarget !== null}
        onClose={() => setDeleteTarget(null)}
        title="Delete set"
        confirmLabel="Delete"
        loadingLabel="Deleting…"
        confirmVariant="danger"
        onConfirm={() => handleDelete(deleteTarget!)}
      >
        Set{" "}
        <span className="font-medium text-navy-700 dark:text-white">
          {deleteTarget?.setCode}
        </span>{" "}
        ({deleteTarget?.program}, {deleteTarget ? yearLevelLabel(deleteTarget.yearLevel) : ""}){" "}
        will be permanently removed.
      </ConfirmDialog>
    </div>
  );
}
