import { useEffect, useMemo, useState } from "react";
import { RoleGuard } from "~/auth/role-guard";
import { Button } from "~/components/ui/button";
import { EmptyState } from "~/components/feedback/empty-state";
import { PlusIcon } from "~/components/ui/icons";
import { FieldChrome, Input } from "~/components/ui/input";
import { Modal } from "~/components/ui/modal";
import { Pagination } from "~/components/ui/pagination";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "~/components/ui/select";
import { Spinner } from "~/components/ui/spinner";
import { ResultState } from "~/components/feedback/result-state";
import { ActivateDeanDialog } from "~/features/deans/activate-dean-dialog";
import { DeactivateDeanDialog } from "~/features/deans/deactivate-dean-dialog";
import { DeanForm } from "~/features/deans/dean-form";
import { DeanTable } from "~/features/deans/dean-table";
import { usePagination } from "~/hooks/use-pagination";
import { PageHeader } from "~/layouts/page-header";
import { deanService } from "~/services/dean.service";
import { departmentService } from "~/services/department.service";
import type { CreateDeanInput, Dean, DeanStatus } from "~/types/dean";
import type { Department } from "~/types/department";

export function meta() {
  return [
    { title: "Deans — GWC Class Scheduling" },
    { name: "description", content: "Manage dean assignments and department oversight." },
  ];
}

export default function DeansRoute() {
  return (
    <RoleGuard allow={["admin", "registrar"]}>
      <DeansPage />
    </RoleGuard>
  );
}

function DeansPage() {
  const [deanList, setDeanList] = useState<Dean[] | null>(null);
  const [departments, setDepartments] = useState<Department[] | null>(null);

  const [search, setSearch] = useState("");
  const [department, setDepartment] = useState("all");
  const [status, setStatus] = useState("all");

  const [createOpen, setCreateOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Dean | null>(null);
  const [activateTarget, setActivateTarget] = useState<Dean | null>(null);
  const [deactivateTarget, setDeactivateTarget] = useState<Dean | null>(null);

  // useEffect(() => {
  //   Promise.all([deanService.list(), departmentService.list()]).then(([d, dept]) => {
  //     setDeanList(d);
  //     setDepartments(dept);
  //   });
  // }, []);

  const resetKey = `${search}|${department}|${status}`;

  const visibleDeans = useMemo(() => {
    if (!deanList) return [];
    const query = search.trim().toLowerCase();
    return deanList
      .filter((member) => {
        if (department !== "all" && member.departmentCode !== department) return false;
        if (status !== "all" && member.status !== status) return false;
        if (
          query &&
          !member.name.toLowerCase().includes(query) &&
          !member.email.toLowerCase().includes(query)
        ) {
          return false;
        }
        return true;
      })
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [deanList, search, department, status]);

  const pagination = usePagination(visibleDeans, resetKey);

  // async function handleCreate(input: CreateDeanInput) {
  //   const created = await deanService.create(input);
  //   setDeanList((current) => [...(current ?? []), created]);
  //   setCreateOpen(false);
  // }

  // async function handleEdit(input: CreateDeanInput) {
  //   if (!editTarget) return;
  //   const updated = await deanService.update(editTarget.id, input);
  //   setDeanList((current) => current!.map((d) => (d.id === updated.id ? updated : d)));
  //   setEditTarget(null);
  // }

  // async function handleSetStatus(target: Dean, status: DeanStatus) {
  //   const updated = await deanService.setStatus(target.id, status);
  //   setDeanList((current) => current!.map((d) => (d.id === updated.id ? updated : d)));
  // }

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <PageHeader
        title="Deans"
        description="Dean assignments and department oversight."
        actions={
          <Button type="button" block={false} onClick={() => setCreateOpen(true)}>
            <PlusIcon />
            New Dean
          </Button>
        }
      />

      <div className="mt-6 flex flex-col gap-4">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          <div className="col-span-2 sm:col-span-1">
            <Input
              id="dean-search"
              label="Search"
              type="search"
              placeholder="Name or email…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <FieldChrome id="dean-dept-filter" label="Department">
            <Select
              items={[
                { value: "all", label: "All departments" },
                ...(departments ?? []).map((d) => ({ value: d.code, label: `${d.code} — ${d.name}` })),
              ]}
              value={department}
              onValueChange={(v) => setDepartment(v as string)}
            >
              <SelectTrigger id="dean-dept-filter">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All departments</SelectItem>
                {(departments ?? []).map((d) => (
                  <SelectItem key={d.id} value={d.code}>
                    {d.code} — {d.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FieldChrome>
          <FieldChrome id="dean-status-filter" label="Status">
            <Select
              items={[
                { value: "all", label: "All statuses" },
                { value: "active", label: "Active" },
                { value: "inactive", label: "Inactive" },
              ]}
              value={status}
              onValueChange={(v) => setStatus(v as string)}
            >
              <SelectTrigger id="dean-status-filter">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All statuses</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
          </FieldChrome>
        </div>

        <ResultState tone="error" title="Not available">This feature is not connected to the backend yet.</ResultState>
      </div>

      {/* <Modal open={createOpen} onClose={() => setCreateOpen(false)} title="New Dean">
        <DeanForm
          departments={departments ?? []}
          onSubmit={handleCreate}
          onCancel={() => setCreateOpen(false)}
        />
      </Modal>

      <Modal open={editTarget !== null} onClose={() => setEditTarget(null)} title="Edit Dean">
        {editTarget && (
          <DeanForm
            member={editTarget}
            departments={departments ?? []}
            onSubmit={handleEdit}
            onCancel={() => setEditTarget(null)}
          />
        )}
      </Modal>

      <DeactivateDeanDialog
        dean={deactivateTarget}
        onClose={() => setDeactivateTarget(null)}
        onConfirm={(dean) => handleSetStatus(dean, "inactive")}
      />
      <ActivateDeanDialog
        dean={activateTarget}
        onClose={() => setActivateTarget(null)}
        onConfirm={(dean) => handleSetStatus(dean, "active")}
      /> */}
    </div>
  );
}
