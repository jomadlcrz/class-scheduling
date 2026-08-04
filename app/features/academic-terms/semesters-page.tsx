import { useState } from "react";
import { toast } from "sonner";
import { Button } from "~/components/ui/button";
import { EmptyState } from "~/components/feedback/empty-state";
import { HelpCircleIcon, PlusIcon } from "~/components/ui/icons";
import { Modal } from "~/components/ui/modal";
import { Spinner } from "~/components/ui/spinner";
import { SemesterForm, suggestedSemesterNumber, type SemesterFormValue } from "~/features/academic-term/semester-form";
import { SemesterTable } from "~/features/academic-term/semester-table";
import { useSemesters } from "~/hooks/use-semesters";
import { PageHeader } from "~/layouts/page-header";
import { semesterService } from "~/services/semester.service";
import type { Semester } from "~/types/semester";

export function SemestersPage() {
  const { semesters, loading, refresh } = useSemesters();
  const [createOpen, setCreateOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Semester | null>(null);
  const [helpOpen, setHelpOpen] = useState(false);

  const existingNumbers = semesters.map((row) => row.semesterNumber);
  const createDefaultNumber = suggestedSemesterNumber(existingNumbers);

  async function handleCreate(value: SemesterFormValue) {
    const message = await semesterService.create(value);
    if (message) toast.success(message);
    setCreateOpen(false);
    await refresh();
  }

  async function handleEdit(value: SemesterFormValue) {
    if (!editTarget) return;
    const message = await semesterService.update(editTarget.id, value);
    if (message) toast.success(message);
    setEditTarget(null);
    await refresh();
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <PageHeader
        title="Semesters"
        actions={
          <>
            <Button type="button" variant="outline" block={false} onClick={() => setHelpOpen(true)}>
              <HelpCircleIcon />
              Help
            </Button>
            <Button type="button" block={false} onClick={() => setCreateOpen(true)}>
              <PlusIcon />
              Create
            </Button>
          </>
        }
      />

      <div className="mt-6">
        {loading ? (
          <div role="status" aria-label="Loading semesters" className="grid place-items-center py-12">
            <Spinner />
          </div>
        ) : semesters.length === 0 ? (
          <EmptyState
            title="No semesters yet"
            action={
              <Button type="button" block={false} onClick={() => setCreateOpen(true)}>
                <PlusIcon />
                Create semester
              </Button>
            }
          >
            Add the two global semesters — 1st and 2nd — to get started.
          </EmptyState>
        ) : (
          <SemesterTable semesters={semesters} onEdit={setEditTarget} />
        )}
      </div>

      <Modal open={createOpen} onClose={() => setCreateOpen(false)} title="Create Semester">
        <SemesterForm
          key={createDefaultNumber}
          mode="create"
          defaultNumber={createDefaultNumber}
          onSubmit={handleCreate}
          onCancel={() => setCreateOpen(false)}
        />
      </Modal>

      <Modal open={editTarget !== null} onClose={() => setEditTarget(null)} title="Edit Semester">
        {editTarget && (
          <SemesterForm
            mode="edit"
            initialValue={{
              semesterNumber: editTarget.semesterNumber as 1 | 2,
              semesterName: editTarget.semester,
            }}
            onSubmit={handleEdit}
            onCancel={() => setEditTarget(null)}
          />
        )}
      </Modal>

      <Modal open={helpOpen} onClose={() => setHelpOpen(false)} title="Semesters reference" wide>
        <div className="space-y-4 font-body text-sm text-slate-600 dark:text-slate-300">
          <p>
            There are only two semesters — 1st and 2nd — shared across every school year. Create them
            once if they are missing; you do not add semesters per school year.
          </p>
          <p>
            Use semester numbers <strong>1</strong> and <strong>2</strong> in API calls and the global
            term selector. Display names can be edited after creation.
          </p>
        </div>
      </Modal>
    </div>
  );
}
