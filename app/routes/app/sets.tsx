import { useEffect, useMemo, useState } from "react";
import { Pagination } from "../../components/ui/pagination";
import { usePagination } from "../../hooks/use-pagination";
import { RoleGuard } from "../../auth/role-guard";
import { Button } from "../../components/ui/button";
import { EmptyState } from "../../components/ui/empty-state";
import { PlusIcon } from "../../components/ui/icons";
import { Input } from "../../components/ui/input";
import { ConfirmDialog, Modal } from "../../components/ui/modal";
import { Select } from "../../components/ui/select";
import { Spinner } from "../../components/ui/spinner";
import { SetForm } from "../../features/sets/set-form";
import { SetTable } from "../../features/sets/set-table";
import { PageHeader } from "../../layouts/page-header";
import { PROGRAMS } from "../../services/mock-data";
import { setService } from "../../services/set.service";
import { subjectService } from "../../services/subject.service";
import type { ClassSet, CreateSetInput } from "../../types/set";
import { SEMESTER_LABELS, SEMESTERS, type Subject } from "../../types/subject";

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
  const [allSubjects, setAllSubjects] = useState<Subject[]>([]);

  const [search, setSearch] = useState("");
  const [program, setProgram] = useState("all");
  const [semester, setSemester] = useState("all");

  const [createOpen, setCreateOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<ClassSet | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<ClassSet | null>(null);

  useEffect(() => {
    Promise.all([setService.list(), subjectService.list()]).then(([s, sub]) => {
      setSets(s);
      setAllSubjects(sub);
    });
  }, []);

  const subjectById = useMemo(
    () => new Map(allSubjects.map((s) => [s.id, s])),
    [allSubjects],
  );

  const resetKey = `${search}|${program}|${semester}`;

  const visibleSets = useMemo(() => {
    if (!sets) return [];
    const query = search.trim().toLowerCase();
    return sets
      .filter((set) => {
        const subject = subjectById.get(set.subjectId);
        if (program !== "all" && subject?.program !== program) return false;
        if (semester !== "all" && set.semester !== Number(semester)) return false;
        if (
          query &&
          !set.setCode.toLowerCase().includes(query) &&
          !subject?.code.toLowerCase().includes(query) &&
          !subject?.title.toLowerCase().includes(query)
        ) {
          return false;
        }
        return true;
      })
      .sort((a, b) => {
        const sa = subjectById.get(a.subjectId);
        const sb = subjectById.get(b.subjectId);
        return (
          (sa?.program ?? "").localeCompare(sb?.program ?? "") ||
          (sa?.yearLevel ?? 0) - (sb?.yearLevel ?? 0) ||
          a.semester - b.semester ||
          (sa?.code ?? "").localeCompare(sb?.code ?? "") ||
          a.setCode.localeCompare(b.setCode)
        );
      });
  }, [sets, subjectById, search, program, semester]);

  const pagination = usePagination(visibleSets, resetKey);

  async function handleCreate(input: CreateSetInput) {
    const created = await setService.create(input);
    setSets((current) => [...(current ?? []), created]);
    setCreateOpen(false);
  }

  async function handleEdit(input: CreateSetInput) {
    if (!editTarget) return;
    const updated = await setService.update(editTarget.id, input);
    setSets((current) => current!.map((s) => (s.id === updated.id ? updated : s)));
    setEditTarget(null);
  }

  async function handleDelete(target: ClassSet) {
    await setService.remove(target.id);
    setSets((current) => current!.filter((s) => s.id !== target.id));
  }

  const deleteSubject = deleteTarget ? subjectById.get(deleteTarget.subjectId) : null;

  return (
    <>
      <PageHeader
        title="Sets"
        description="Class sets grouped by subject, program, and academic term."
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
              placeholder="Set code or subject…"
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
            {PROGRAMS.map((p) => (
              <option key={p.code} value={p.code}>
                {p.code} — {p.name}
              </option>
            ))}
          </Select>
          <Select
            id="set-semester-filter"
            label="Semester"
            value={semester}
            onChange={(e) => setSemester(e.target.value)}
          >
            <option value="all">All semesters</option>
            {SEMESTERS.map((sem) => (
              <option key={sem} value={sem}>
                {SEMESTER_LABELS[sem]}
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
              allSubjects={allSubjects}
              onEdit={(set) => setEditTarget(set)}
              onDelete={(set) => setDeleteTarget(set)}
            />
            <Pagination
              page={pagination.page}
              totalPages={pagination.totalPages}
              totalItems={pagination.totalItems}
              rangeStart={pagination.rangeStart}
              rangeEnd={pagination.rangeEnd}
              pageSize={pagination.pageSize}
              onPageChange={pagination.setPage}
              onPageSizeChange={pagination.setPageSize}
            />
          </>
        )}
      </div>

      <Modal open={createOpen} onClose={() => setCreateOpen(false)} title="New Set">
        <SetForm
          allSubjects={allSubjects}
          onSubmit={handleCreate}
          onCancel={() => setCreateOpen(false)}
        />
      </Modal>

      <Modal open={editTarget !== null} onClose={() => setEditTarget(null)} title="Edit Set">
        {editTarget && (
          <SetForm
            set={editTarget}
            allSubjects={allSubjects}
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
        for{" "}
        <span className="font-medium text-navy-700 dark:text-white">
          {deleteSubject?.code ?? "this subject"}
        </span>{" "}
        will be permanently removed.
      </ConfirmDialog>
    </>
  );
}
