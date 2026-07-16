import { useEffect, useState } from "react";
import { toast } from "sonner";
import { EmptyState } from "~/components/feedback/empty-state";
import { Badge } from "~/components/ui/badge";
import { RotateIcon } from "~/components/ui/icons";
import { ConfirmDialog } from "~/components/ui/modal";
import { Spinner } from "~/components/ui/spinner";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "~/components/ui/table";
import { SubjectTypeBadge } from "~/features/subjects/subject-type-badge";
import { PageHeader } from "~/layouts/page-header";
import { recycleBinService, type DeletedSubject } from "~/services/recycle-bin.service";

export function RecentlyDeleted() {
  const [subjects, setSubjects] = useState<DeletedSubject[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [restoreTarget, setRestoreTarget] = useState<DeletedSubject | null>(null);

  function refresh() {
    recycleBinService
      .list()
      .then(setSubjects)
      .catch((err) =>
        setError(err instanceof Error ? err.message : "Something went wrong. Please try again."),
      );
  }

  useEffect(refresh, []);

  async function handleRestore() {
    if (!restoreTarget) return;
    const message = await recycleBinService.restore(restoreTarget.subjectId);
    if (message) toast.success(message);
    refresh();
  }

  return (
    <div>
      <PageHeader
        title="Recently Deleted"
        description="Restore items deleted within the last 30 days before they are permanently removed."
      />

      {error ? (
        <div className="mt-6">
          <EmptyState title="Couldn't load recently deleted items">{error}</EmptyState>
        </div>
      ) : subjects === null ? (
        <div
          role="status"
          aria-label="Loading recently deleted items"
          className="mt-6 grid place-items-center py-12 text-navy-700 dark:text-slate-200"
        >
          <Spinner />
        </div>
      ) : subjects.length === 0 ? (
        <div className="mt-6">
          <EmptyState title="No recently deleted items">
            Deleted subjects and other recoverable items will appear here for 30 days.
          </EmptyState>
        </div>
      ) : (
        <div className="mt-6 flex flex-col gap-3">
          <h2 className="font-body text-base font-semibold text-navy-700 dark:text-white">
            Deleted Subjects
          </h2>
          <Table>
            <TableHead>
              <TableHeader>Code</TableHeader>
              <TableHeader>Title</TableHeader>
              <TableHeader className="hidden sm:table-cell">Program</TableHeader>
              <TableHeader className="hidden lg:table-cell">Type</TableHeader>
              <TableHeader className="hidden lg:table-cell">Prerequisites</TableHeader>
              <TableHeader className="text-right">Restore</TableHeader>
            </TableHead>
            <TableBody>
              {subjects.map((subject) => (
                <TableRow key={subject.subjectId}>
                  <TableCell className="font-medium text-navy-700 dark:text-white">
                    {subject.subjectCode}
                  </TableCell>
                  <TableCell>{subject.descTitle}</TableCell>
                  <TableCell className="hidden sm:table-cell">{subject.program}</TableCell>
                  <TableCell className="hidden lg:table-cell">
                    <SubjectTypeBadge type={subject.subjectType} />
                  </TableCell>
                  <TableCell className="hidden lg:table-cell">
                    {subject.prerequisites.length === 0 ? (
                      "—"
                    ) : (
                      <div className="flex flex-wrap gap-1">
                        {subject.prerequisites.map((code) => (
                          <Badge key={code} tone="slate">
                            {code}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <button
                      type="button"
                      onClick={() => setRestoreTarget(subject)}
                      aria-label={`Restore ${subject.subjectCode}`}
                      className="inline-flex cursor-pointer items-center gap-1 rounded-lg px-2 py-1 font-body text-xs font-medium text-blue-700 transition-colors duration-150 hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-blue-400/10"
                    >
                      <RotateIcon size={14} />
                      Restore
                    </button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <ConfirmDialog
        open={restoreTarget !== null}
        onClose={() => setRestoreTarget(null)}
        title="Restore subject"
        confirmLabel="Restore"
        loadingLabel="Restoring…"
        onConfirm={handleRestore}
      >
        <span className="font-medium text-navy-700 dark:text-white">
          {restoreTarget?.subjectCode} — {restoreTarget?.descTitle}
        </span>{" "}
        will be restored to {restoreTarget?.program}.
      </ConfirmDialog>
    </div>
  );
}
