import { useEffect, useMemo, useState } from "react";
import { RoleGuard } from "~/auth/role-guard";
import { Button } from "~/components/ui/button";
import { EmptyState } from "~/components/ui/empty-state";
import { PlusIcon } from "~/components/ui/icons";
import { Input } from "~/components/ui/input";
import { ConfirmDialog, Modal } from "~/components/ui/modal";
import { Pagination } from "~/components/ui/pagination";
import { Select } from "~/components/ui/select";
import { Spinner } from "~/components/ui/spinner";
import { SetForm } from "~/features/sets/set-form";
import { SetTable } from "~/features/sets/set-table";
import { PageHeader } from "~/layouts/page-header";
import { programService } from "~/services/program.service";
import { setService } from "~/services/set.service";
import { usePagination } from "~/hooks/use-pagination";
import type { Program } from "~/types/program";
import type { ClassSet, CreateSetInput } from "~/types/set";
import { YEAR_LEVEL_LABELS, YEAR_LEVELS } from "~/types/subject";

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
    await setService.create(inputs);
    await refresh();
    setCreateOpen(false);
  }

  async function handleEdit(inputs: CreateSetInput[]) {
    if (!editTarget || inputs.length === 0) return;
    await setService.update(editTarget.id, inputs[0].setCode);
    await refresh();
    setEditTarget(null);
  }

  async function handleDelete(target: ClassSet) {
    await setService.remove(target.id);
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
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          <div className="col-span-2 sm:col-span-1">
            <Input
              id="set-search"
              label="Search"
              type="search"
              placeholder="Set code…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <Select
            id="set-program-filter"
            label="Program"
            value={program}
            onChange={(e) => setProgram(e.target.value)}
          >
            <option value="all">All programs</option>
            {(programs ?? []).map((p) => (
              <option key={p.code} value={p.code}>
                {p.code} — {p.name}
              </option>
            ))}
          </Select>
          <Select
            id="set-year-filter"
            label="Year Level"
            value={yearLevel}
            onChange={(e) => setYearLevel(e.target.value)}
          >
            <option value="all">All year levels</option>
            {YEAR_LEVELS.map((year) => (
              <option key={year} value={year}>
                {YEAR_LEVEL_LABELS[year]}
              </option>
            ))}
          </Select>
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
        ({deleteTarget?.program}, {deleteTarget ? YEAR_LEVEL_LABELS[deleteTarget.yearLevel] : ""}){" "}
        will be permanently removed.
      </ConfirmDialog>
    </div>
  );
}
