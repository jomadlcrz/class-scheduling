import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router";
import { Pagination } from "~/components/ui/pagination";
import { usePagination } from "~/hooks/use-pagination";
import { RoleGuard } from "~/auth/role-guard";
import { Button } from "~/components/ui/button";
import { EmptyState } from "~/components/ui/empty-state";
import { PlusIcon } from "~/components/ui/icons";
import { Input } from "~/components/ui/input";
import { ConfirmDialog, Modal } from "~/components/ui/modal";
import { Select } from "~/components/ui/select";
import { Spinner } from "~/components/ui/spinner";
import { SubjectForm } from "~/features/subjects/subject-form";
import { SubjectTable } from "~/features/subjects/subject-table";
import { PageHeader } from "~/layouts/page-header";
import { enumService } from "~/services/enum.service";
import { programService } from "~/services/program.service";
import { subjectService } from "~/services/subject.service";
import type { Program } from "~/types/program";
import {
  type Subject,
  type UpdateSubjectInput,
} from "~/types/subject";
import { useYearLevels } from "~/hooks/use-year-levels";

export function meta() {
  return [
    { title: "Subjects — GWC Class Scheduling" },
    {
      name: "description",
      content: "Manage program curriculum subjects.",
    },
  ];
}

export default function Subjects() {
  return (
    <RoleGuard allow={["admin", "registrar", "dean"]}>
      <SubjectsPage />
    </RoleGuard>
  );
}

function SubjectsPage() {
  const navigate = useNavigate();
  const { yearLevelIds, yearLevelLabel } = useYearLevels();
  const [subjects, setSubjects] = useState<Subject[] | null>(null);
  const [programs, setPrograms] = useState<Program[] | null>(null);
  const [subjectTypes, setSubjectTypes] = useState<string[]>([]);
  const [search, setSearch] = useState("");
  const [program, setProgram] = useState("all");
  const [yearLevel, setYearLevel] = useState("all");

  // Creation lives on /subjects/new; the modal is for editing only.
  const [editTarget, setEditTarget] = useState<Subject | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Subject | null>(null);

  useEffect(() => {
    subjectService.list().then(setSubjects).catch(() => setSubjects([]));
    programService.list().then(setPrograms).catch(() => setPrograms([]));
    enumService
      .getOptions()
      .then((options) => setSubjectTypes(options.subjectType))
      .catch(() => {});
  }, []);

  const resetKey = `${search}|${program}|${yearLevel}`;

  const visibleSubjects = useMemo(() => {
    if (!subjects) return [];
    const query = search.trim().toLowerCase();
    return subjects
      .filter((subject) => {
        if (program !== "all" && subject.program !== program) return false;
        if (yearLevel !== "all" && subject.yearLevel !== Number(yearLevel)) return false;
        if (
          query &&
          !subject.code.toLowerCase().includes(query) &&
          !subject.title.toLowerCase().includes(query)
        ) {
          return false;
        }
        return true;
      })
      .sort(
        (a, b) =>
          (a.program ?? "").localeCompare(b.program ?? "") ||
          a.yearLevel - b.yearLevel ||
          a.semester - b.semester ||
          (a.code ?? "").localeCompare(b.code ?? ""),
      );
  }, [subjects, search, program, yearLevel]);

  const pagination = usePagination(visibleSubjects, resetKey);

  // Mutations return only a message, so the list is refetched afterwards.
  async function refresh() {
    setSubjects(await subjectService.list());
  }

  async function handleFormSubmit(input: UpdateSubjectInput) {
    if (!editTarget) return;
    await subjectService.update(editTarget.id, input);
    await refresh();
    setEditTarget(null);
  }

  async function handleDelete(target: Subject) {
    // The backend asks for the subject code as the deletion confirmation.
    await subjectService.remove(target.id, target.code);
    await refresh();
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <PageHeader
        title="Subjects"
        description="Program curriculum subjects: codes, units, hours, and prerequisites."
        actions={
          <Button type="button" block={false} onClick={() => navigate("/subjects/new")}>
            <PlusIcon />
            New Subject
          </Button>
        }
      />

      <div className="mt-6 flex flex-col gap-4">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          <div className="col-span-2 sm:col-span-1">
            <Input
              id="subject-search"
              label="Search"
              type="search"
              placeholder="Code or title…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <Select
            id="subject-program-filter"
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
            id="subject-year-filter"
            label="Year Level"
            value={yearLevel}
            onChange={(e) => setYearLevel(e.target.value)}
          >
            <option value="all">All year levels</option>
            {yearLevelIds.map((year) => (
              <option key={year} value={year}>
                {yearLevelLabel(year)}
              </option>
            ))}
          </Select>
        </div>

        {subjects === null ? (
          <div
            role="status"
            aria-label="Loading subjects"
            className="grid place-items-center py-12 text-navy-700 dark:text-slate-200"
          >
            <Spinner />
          </div>
        ) : visibleSubjects.length === 0 ? (
          <EmptyState title="No subjects found">
            No subjects match the current filters. Adjust the search or add a new subject.
          </EmptyState>
        ) : (
          <>
            <SubjectTable
              subjects={pagination.pageItems}
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

      <Modal open={editTarget !== null} onClose={() => setEditTarget(null)} title="Edit Subject">
        {editTarget && (
          <SubjectForm
            subject={editTarget}
            allSubjects={subjects ?? []}
            subjectTypes={subjectTypes}
            onSubmit={handleFormSubmit}
            onCancel={() => setEditTarget(null)}
          />
        )}
      </Modal>

      <ConfirmDialog
        open={deleteTarget !== null}
        onClose={() => setDeleteTarget(null)}
        title="Delete subject"
        confirmLabel="Delete"
        loadingLabel="Deleting…"
        confirmVariant="danger"
        onConfirm={() => handleDelete(deleteTarget!)}
      >
        <span className="font-medium text-navy-700 dark:text-white">
          {deleteTarget?.code} — {deleteTarget?.title}
        </span>{" "}
        will be removed from {deleteTarget?.program}. It can be restored from the recycle bin.
      </ConfirmDialog>
    </div>
  );
}
