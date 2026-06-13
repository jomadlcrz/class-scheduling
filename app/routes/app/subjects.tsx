import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router";
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
import { SubjectForm } from "../../features/subjects/subject-form";
import { SubjectTable } from "../../features/subjects/subject-table";
import { PageHeader } from "../../layouts/page-header";
import { programService } from "../../services/program.service";
import { subjectService } from "../../services/subject.service";
import type { Program } from "../../types/program";
import {
  YEAR_LEVEL_LABELS,
  YEAR_LEVELS,
  type CreateSubjectInput,
  type Subject,
} from "../../types/subject";

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
  const [subjects, setSubjects] = useState<Subject[] | null>(null);
  const [programs, setPrograms] = useState<Program[] | null>(null);
  const [search, setSearch] = useState("");
  const [program, setProgram] = useState("all");
  const [yearLevel, setYearLevel] = useState("all");

  // Creation lives on /subjects/new; the modal is for editing only.
  const [editTarget, setEditTarget] = useState<Subject | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Subject | null>(null);

  useEffect(() => {
    Promise.all([subjectService.list(), programService.list()]).then(([s, p]) => {
      setSubjects(s);
      setPrograms(p);
    });
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
          a.program.localeCompare(b.program) ||
          a.yearLevel - b.yearLevel ||
          a.semester - b.semester ||
          a.code.localeCompare(b.code),
      );
  }, [subjects, search, program, yearLevel]);

  const pagination = usePagination(visibleSubjects, resetKey);

  async function handleFormSubmit(input: CreateSubjectInput) {
    if (!editTarget) return;
    const updated = await subjectService.update(editTarget.id, input);
    setSubjects((current) => current!.map((s) => (s.id === updated.id ? updated : s)));
    setEditTarget(null);
  }

  async function handleDelete(target: Subject) {
    await subjectService.remove(target.id);
    setSubjects((current) => current!.filter((s) => s.id !== target.id));
  }

  return (
    <>
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
            {YEAR_LEVELS.map((year) => (
              <option key={year} value={year}>
                {YEAR_LEVEL_LABELS[year]}
              </option>
            ))}
          </Select>
        </div>

        {subjects === null || programs === null ? (
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
              allSubjects={subjects}
              programs={programs!}
              onEdit={(subject) => setEditTarget(subject)}
              onDelete={(subject) => setDeleteTarget(subject)}
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

      <Modal open={editTarget !== null} onClose={() => setEditTarget(null)} title="Edit Subject">
        {editTarget && (
          <SubjectForm
            subject={editTarget}
            allSubjects={subjects ?? []}
            programs={programs!}
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
        will be removed from {deleteTarget?.program}. Deletion is blocked while other subjects
        list it as a prerequisite.
      </ConfirmDialog>
    </>
  );
}
