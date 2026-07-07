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
import { FacultyForm } from "~/features/faculty/faculty-form";
import { FacultyTable } from "~/features/faculty/faculty-table";
import { PageHeader } from "~/layouts/page-header";
import { departmentService } from "~/services/department.service";
import { facultyService } from "~/services/faculty.service";
import { usePagination } from "~/hooks/use-pagination";
import type { Department } from "~/types/department";
import type { CreateFacultyInput, Faculty } from "~/types/faculty";

export function meta() {
  return [
    { title: "Faculty — GWC Class Scheduling" },
    { name: "description", content: "Manage faculty members and their department assignments." },
  ];
}

export default function FacultyRoute() {
  return (
    <RoleGuard allow={["admin", "registrar", "dean"]}>
      <FacultyPage />
    </RoleGuard>
  );
}

function FacultyPage() {
  const [facultyList, setFacultyList] = useState<Faculty[] | null>(null);
  const [departments, setDepartments] = useState<Department[] | null>(null);

  const [search, setSearch] = useState("");
  const [department, setDepartment] = useState("all");
  const [status, setStatus] = useState("all");

  const [createOpen, setCreateOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Faculty | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Faculty | null>(null);

  useEffect(() => {
    Promise.all([facultyService.list(), departmentService.list()]).then(([f, d]) => {
      setFacultyList(f);
      setDepartments(d);
    });
  }, []);

  const resetKey = `${search}|${department}|${status}`;

  const visibleFaculty = useMemo(() => {
    if (!facultyList) return [];
    const query = search.trim().toLowerCase();
    return facultyList
      .filter((member) => {
        if (department !== "all" && member.departmentCode !== department) return false;
        if (status !== "all" && member.status !== status) return false;
        if (
          query &&
          !member.firstName.toLowerCase().includes(query) &&
          !member.lastName.toLowerCase().includes(query) &&
          !member.email.toLowerCase().includes(query) &&
          !member.specialization.toLowerCase().includes(query)
        ) {
          return false;
        }
        return true;
      })
      .sort((a, b) => a.lastName.localeCompare(b.lastName) || a.firstName.localeCompare(b.firstName));
  }, [facultyList, search, department, status]);

  const pagination = usePagination(visibleFaculty, resetKey);

  async function handleCreate(input: CreateFacultyInput) {
    const created = await facultyService.create(input);
    setFacultyList((current) => [...(current ?? []), created]);
    setCreateOpen(false);
  }

  async function handleEdit(input: CreateFacultyInput) {
    if (!editTarget) return;
    const updated = await facultyService.update(editTarget.id, input);
    setFacultyList((current) => current!.map((f) => (f.id === updated.id ? updated : f)));
    setEditTarget(null);
  }

  async function handleDelete(target: Faculty) {
    await facultyService.remove(target.id);
    setFacultyList((current) => current!.filter((f) => f.id !== target.id));
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <PageHeader
        title="Faculty"
        description="Faculty members and their department assignments."
        actions={
          <Button type="button" block={false} onClick={() => setCreateOpen(true)}>
            <PlusIcon />
            New Faculty
          </Button>
        }
      />

      <div className="mt-6 flex flex-col gap-4">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          <div className="col-span-2 sm:col-span-1">
            <Input
              id="faculty-search"
              label="Search"
              type="search"
              placeholder="Name, email, or specialization…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <Select
            id="faculty-dept-filter"
            label="Department"
            value={department}
            onChange={(e) => setDepartment(e.target.value)}
          >
            <option value="all">All departments</option>
            {(departments ?? []).map((d) => (
              <option key={d.id} value={d.code}>
                {d.code} — {d.name}
              </option>
            ))}
          </Select>
          <Select
            id="faculty-status-filter"
            label="Status"
            value={status}
            onChange={(e) => setStatus(e.target.value)}
          >
            <option value="all">All statuses</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </Select>
        </div>

        {facultyList === null || departments === null ? (
          <div
            role="status"
            aria-label="Loading faculty"
            className="grid place-items-center py-12 text-navy-700 dark:text-slate-200"
          >
            <Spinner />
          </div>
        ) : visibleFaculty.length === 0 ? (
          <EmptyState title="No faculty found">
            No faculty match the current filters. Adjust the search or add a new faculty member.
          </EmptyState>
        ) : (
          <>
            <FacultyTable
              faculty={pagination.pageItems}
              onEdit={(member) => setEditTarget(member)}
              onDelete={(member) => setDeleteTarget(member)}
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

      <Modal open={createOpen} onClose={() => setCreateOpen(false)} title="New Faculty">
        <FacultyForm
          departments={departments ?? []}
          onSubmit={handleCreate}
          onCancel={() => setCreateOpen(false)}
        />
      </Modal>

      <Modal open={editTarget !== null} onClose={() => setEditTarget(null)} title="Edit Faculty">
        {editTarget && (
          <FacultyForm
            member={editTarget}
            departments={departments ?? []}
            onSubmit={handleEdit}
            onCancel={() => setEditTarget(null)}
          />
        )}
      </Modal>

      <ConfirmDialog
        open={deleteTarget !== null}
        onClose={() => setDeleteTarget(null)}
        title="Delete faculty member"
        confirmLabel="Delete"
        loadingLabel="Deleting…"
        confirmVariant="danger"
        onConfirm={() => handleDelete(deleteTarget!)}
      >
        <span className="font-medium text-navy-700 dark:text-white">
          {deleteTarget?.firstName} {deleteTarget?.lastName}
        </span>{" "}
        will be permanently removed.
      </ConfirmDialog>
    </div>
  );
}
