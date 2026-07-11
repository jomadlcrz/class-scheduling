import { useEffect, useState } from "react";
import { RoleGuard } from "~/auth/role-guard";
import { Button } from "~/components/ui/button";
import { PlusIcon } from "~/components/ui/icons";
import { Modal } from "~/components/ui/modal";
import { ResultState } from "~/components/feedback/result-state";
import { FacultyAccountForm } from "~/features/faculty/faculty-account-form";
import { PageHeader } from "~/layouts/page-header";
import { enumService, type EnumOptions } from "~/services/enum.service";
import { facultyService } from "~/services/faculty.service";
import type { DepartmentOption } from "~/types/department";
import type { CreateFacultyAccountInput } from "~/types/faculty";

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
  const [departmentOptions, setDepartmentOptions] = useState<DepartmentOption[]>([]);
  const [enumOptions, setEnumOptions] = useState<EnumOptions | null>(null);

  const [createOpen, setCreateOpen] = useState(false);
  const [createdEmail, setCreatedEmail] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([
      facultyService.listDepartmentOptions().catch(() => []),
      enumService.getOptions().catch(() => null),
    ]).then(([depts, enums]) => {
      setDepartmentOptions(depts);
      setEnumOptions(enums);
    });
  }, []);

  async function handleCreate(input: CreateFacultyAccountInput) {
    await facultyService.create(input);
    setCreatedEmail(input.email);
  }

  function closeCreate() {
    setCreateOpen(false);
    setCreatedEmail(null);
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

      <div className="mt-6">
        <ResultState tone="error" title="Faculty list not available">
          The faculty listing endpoint is not connected to the backend yet. You can still create
          new faculty accounts using the button above.
        </ResultState>
      </div>

      <Modal open={createOpen} onClose={closeCreate} title="New Faculty">
        {createdEmail ? (
          <div className="flex flex-col items-center gap-4">
            <ResultState tone="success" title="Faculty registered">
              Login credentials with a temporary password were emailed to {createdEmail}.
            </ResultState>
            <Button type="button" block={false} onClick={closeCreate}>
              <span className="px-4">Done</span>
            </Button>
          </div>
        ) : (
          <FacultyAccountForm
            departments={departmentOptions}
            genders={enumOptions?.gender ?? []}
            civilStatuses={enumOptions?.civilStatus ?? []}
            onSubmit={handleCreate}
            onCancel={closeCreate}
          />
        )}
      </Modal>
    </div>
  );
}
