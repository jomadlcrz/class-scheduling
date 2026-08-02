import { useState } from "react";
import { toast } from "sonner";
import { Alert, AlertAction, AlertDescription, AlertTitle } from "~/components/ui/alert";
import { Button } from "~/components/ui/button";
import { EmptyState } from "~/components/feedback/empty-state";
import { HelpCircleIcon, PlusIcon } from "~/components/ui/icons";
import { Modal } from "~/components/ui/modal";
import { Spinner } from "~/components/ui/spinner";
import { SemesterForm, type SemesterFormValue } from "~/features/academic-term/semester-form";
import { SemesterTable } from "~/features/academic-term/semester-table";
import { useSemesters } from "~/hooks/use-semesters";
import { PageHeader } from "~/layouts/page-header";
import { semesterService } from "~/services/semester.service";
import type { Semester } from "~/types/semester";

export function SemestersPage() {
  const { semesters, loading, refresh } = useSemesters();
  const [createOpen, setCreateOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Semester | null>(null);

  async function handleAdd(value: SemesterFormValue) {
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
        description="Reference list of semesters used across all school years."
        actions={
          <Button type="button" block={false} onClick={() => setCreateOpen(true)}>
            <PlusIcon />
            Create Semester
          </Button>
        }
      />

      <Alert variant="default" className="mt-6 border-blue-200 bg-blue-50 text-blue-900 dark:border-blue-400/25 dark:bg-blue-400/10 dark:text-blue-200">
        <HelpCircleIcon />
        <AlertDescription>
          There are only two semesters in the system: 1st Semester and 2nd Semester. These are shared
          across all school years.
        </AlertDescription>
      </Alert>

      <div className="mt-6">
        <h2 className="font-display text-base tracking-wide text-navy-700 dark:text-mist-100">
          Semesters List
        </h2>
      </div>

      <div className="mt-3">
        {loading ? (
          <div role="status" aria-label="Loading semesters" className="grid place-items-center py-12">
            <Spinner />
          </div>
        ) : semesters.length === 0 ? (
          <EmptyState title="No semesters yet">Add the first semester to get started.</EmptyState>
        ) : (
          <SemesterTable semesters={semesters} onEdit={setEditTarget} />
        )}
      </div>

      <Modal open={createOpen} onClose={() => setCreateOpen(false)} title="Create Semester">
        <SemesterForm onSubmit={handleAdd} onCancel={() => setCreateOpen(false)} />
      </Modal>

      <Modal open={editTarget !== null} onClose={() => setEditTarget(null)} title="Edit Semester">
        {editTarget && (
          <SemesterForm
            initialValue={{ semester: editTarget.semester, semesterNumber: editTarget.semesterNumber }}
            onSubmit={handleEdit}
            onCancel={() => setEditTarget(null)}
          />
        )}
      </Modal>

      <Alert variant="default" className="mt-6 border-blue-200 bg-blue-50 text-blue-900 dark:border-blue-400/25 dark:bg-blue-400/10 dark:text-blue-200">
        <HelpCircleIcon />
        <AlertTitle>About Semesters</AlertTitle>
        <AlertDescription>
          <ul className="mt-1 list-disc space-y-1 pl-4">
            <li>Semester records cannot be deleted.</li>
            <li>Only the display name and description can be edited.</li>
            <li>Changes here will reflect across all school years.</li>
          </ul>
        </AlertDescription>
        <AlertAction>
          <Button type="button" variant="outline" block={false} onClick={() => toast.info("Learn more — mock only.")}>
            <HelpCircleIcon />
            Learn more
          </Button>
        </AlertAction>
      </Alert>
    </div>
  );
}
