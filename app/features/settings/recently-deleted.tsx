import { useEffect, useState } from "react";
import { toast } from "sonner";
import { EmptyState } from "~/components/feedback/empty-state";
import { Badge } from "~/components/ui/badge";
import { RotateIcon } from "~/components/ui/icons";
import { ConfirmDialog } from "~/components/ui/modal";
import { Spinner } from "~/components/ui/spinner";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "~/components/ui/table";
import { SettingsPageHeader } from "~/features/settings/settings-page-header";
import { SubjectTypeBadge } from "~/features/subjects/subject-type-badge";
import { Breadcrumb } from "~/layouts/breadcrumb";
import { buildingService } from "~/services/building.service";
import { departmentService } from "~/services/department.service";
import { permissionService } from "~/services/permission.service";
import { programService } from "~/services/program.service";
import { recycleBinService, type DeletedSubject } from "~/services/recycle-bin.service";
import { roomService } from "~/services/room.service";
import { schoolYearService } from "~/services/school-year.service";
import { semesterService } from "~/services/semester.service";
import { setService } from "~/services/set.service";
import { studentService } from "~/services/student.service";

/** A row shape shared by every resource whose recycle bin is just "a label + when it was deleted". */
type SimpleDeletedItem = { id: number; label: string; deactivatedAt: string | null };

type SimpleTabKey =
  | "students"
  | "programs"
  | "sets"
  | "buildings"
  | "rooms"
  | "departments"
  | "school-years"
  | "semesters"
  | "permissions";

/** Every resource here shares the new per-resource `GET .../recycle-bin` + `PATCH .../<id>/restore` shape —
 * only the field names differ per resource, so their list() results are normalized into SimpleDeletedItem
 * here rather than forcing 9 different response shapes into the service layer's return types. */
const SIMPLE_TABS: { key: SimpleTabKey; label: string; list: () => Promise<SimpleDeletedItem[]>; restore: (id: number) => Promise<string> }[] = [
  {
    key: "students",
    label: "Students",
    list: async () =>
      (await studentService.listDeleted()).map((s) => ({
        id: s.studentProfileId,
        label: `${s.lastName}, ${s.firstName}`,
        deactivatedAt: s.deactivatedAt,
      })),
    restore: (id) => studentService.restore(id),
  },
  {
    key: "programs",
    label: "Programs",
    list: async () =>
      (await programService.listDeleted()).map((p) => ({
        id: p.id,
        label: `${p.abbrev} — ${p.name}`,
        deactivatedAt: p.deactivatedAt,
      })),
    restore: (id) => programService.restore(id),
  },
  {
    key: "sets",
    label: "Sets",
    list: async () =>
      (await setService.listDeleted()).map((s) => ({ id: s.id, label: s.setCode, deactivatedAt: s.deactivatedAt })),
    restore: (id) => setService.restore(id),
  },
  {
    key: "buildings",
    label: "Buildings",
    list: async () =>
      (await buildingService.listDeleted()).map((b) => ({ id: b.id, label: b.name, deactivatedAt: b.deactivatedAt })),
    restore: (id) => buildingService.restore(id),
  },
  {
    key: "rooms",
    label: "Rooms",
    list: async () =>
      (await roomService.listDeleted()).map((r) => ({ id: r.id, label: r.name, deactivatedAt: r.deactivatedAt })),
    restore: (id) => roomService.restore(id),
  },
  {
    key: "departments",
    label: "Departments",
    list: async () =>
      (await departmentService.listDeleted()).map((d) => ({
        id: d.id,
        label: d.name,
        deactivatedAt: d.deactivatedAt,
      })),
    restore: (id) => departmentService.restore(id),
  },
  {
    key: "school-years",
    label: "School Years",
    list: async () =>
      (await schoolYearService.listDeleted()).map((sy) => ({
        id: sy.id,
        label: sy.schoolYear,
        deactivatedAt: sy.deactivatedAt,
      })),
    restore: (id) => schoolYearService.restore(id),
  },
  {
    key: "semesters",
    label: "Semesters",
    list: async () =>
      (await semesterService.listDeleted()).map((s) => ({
        id: s.id,
        label: s.semester,
        deactivatedAt: s.deactivatedAt,
      })),
    restore: (id) => semesterService.restore(id),
  },
  {
    key: "permissions",
    label: "Permissions",
    list: async () =>
      (await permissionService.listDeleted()).map((p) => ({
        id: p.id,
        label: p.slug,
        deactivatedAt: p.deactivatedAt,
      })),
    restore: (id) => permissionService.restore(id),
  },
];

type TabKey = "subjects" | SimpleTabKey;

function formatDate(value: string | null): string {
  if (!value) return "—";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "—" : date.toLocaleDateString();
}

export function RecentlyDeleted() {
  const [activeTab, setActiveTab] = useState<TabKey>("subjects");
  const [subjects, setSubjects] = useState<DeletedSubject[] | null>(null);
  const [simpleItems, setSimpleItems] = useState<SimpleDeletedItem[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [subjectRestoreTarget, setSubjectRestoreTarget] = useState<DeletedSubject | null>(null);
  const [simpleRestoreTarget, setSimpleRestoreTarget] = useState<SimpleDeletedItem | null>(null);

  const activeSimpleTab = SIMPLE_TABS.find((t) => t.key === activeTab);

  function refresh() {
    setError(null);
    if (activeTab === "subjects") {
      setSubjects(null);
      recycleBinService
        .list()
        .then(setSubjects)
        .catch((err) =>
          setError(err instanceof Error ? err.message : "Something went wrong. Please try again."),
        );
      return;
    }
    if (!activeSimpleTab) return;
    setSimpleItems(null);
    activeSimpleTab
      .list()
      .then(setSimpleItems)
      .catch((err) => setError(err instanceof Error ? err.message : "Something went wrong. Please try again."));
  }

  useEffect(refresh, [activeTab]);

  async function handleSubjectRestore() {
    if (!subjectRestoreTarget) return;
    const message = await recycleBinService.restore(subjectRestoreTarget.subjectId);
    if (message) toast.success(message);
    refresh();
  }

  async function handleSimpleRestore() {
    if (!simpleRestoreTarget || !activeSimpleTab) return;
    const message = await activeSimpleTab.restore(simpleRestoreTarget.id);
    if (message) toast.success(message);
    refresh();
  }

  const tabs: { key: TabKey; label: string }[] = [
    { key: "subjects", label: "Subjects" },
    ...SIMPLE_TABS.map((t) => ({ key: t.key, label: t.label })),
  ];

  const isLoading = activeTab === "subjects" ? subjects === null : simpleItems === null;
  const isEmpty = activeTab === "subjects" ? subjects?.length === 0 : simpleItems?.length === 0;

  return (
    <div>
      <Breadcrumb items={[{ label: "Settings", href: "/settings" }, { label: "Recently Deleted" }]} />
      <SettingsPageHeader title="Recently Deleted" />

      <div role="tablist" aria-label="Recently deleted resource" className="mt-6 flex flex-wrap gap-2">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            type="button"
            role="tab"
            aria-selected={activeTab === tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`cursor-pointer rounded-lg px-3 py-1.5 font-body text-sm font-medium transition-colors duration-150 ${
              activeTab === tab.key
                ? "bg-navy-700 text-white dark:bg-gold-400 dark:text-navy-900"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-white/5 dark:text-slate-300 dark:hover:bg-white/10"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {error ? (
        <div className="mt-6">
          <EmptyState title="Couldn't load recently deleted items">{error}</EmptyState>
        </div>
      ) : isLoading ? (
        <div
          role="status"
          aria-label="Loading recently deleted items"
          className="mt-6 grid place-items-center py-12 text-navy-700 dark:text-slate-200"
        >
          <Spinner />
        </div>
      ) : isEmpty ? (
        <div className="mt-6">
          <EmptyState title="No recently deleted items">
            Deleted items will appear here and can be restored within 30 days.
          </EmptyState>
        </div>
      ) : activeTab === "subjects" ? (
        <div className="mt-6 flex flex-col gap-3">
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
              {(subjects ?? []).map((subject) => (
                <TableRow key={subject.subjectId}>
                  <TableCell className="font-medium text-navy-700 dark:text-mist-100">
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
                      onClick={() => setSubjectRestoreTarget(subject)}
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
      ) : (
        <div className="mt-6 flex flex-col gap-3">
          <Table>
            <TableHead>
              <TableHeader>Name</TableHeader>
              <TableHeader>Deleted</TableHeader>
              <TableHeader className="text-right">Restore</TableHeader>
            </TableHead>
            <TableBody>
              {(simpleItems ?? []).map((item) => (
                <TableRow key={item.id}>
                  <TableCell className="font-medium text-navy-700 dark:text-mist-100">{item.label}</TableCell>
                  <TableCell>{formatDate(item.deactivatedAt)}</TableCell>
                  <TableCell className="text-right">
                    <button
                      type="button"
                      onClick={() => setSimpleRestoreTarget(item)}
                      aria-label={`Restore ${item.label}`}
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
        open={subjectRestoreTarget !== null}
        onClose={() => setSubjectRestoreTarget(null)}
        title="Restore subject"
        confirmLabel="Restore"
        loadingLabel="Restoring…"
        onConfirm={handleSubjectRestore}
      >
        <span className="font-medium text-navy-700 dark:text-mist-100">
          {subjectRestoreTarget?.subjectCode} — {subjectRestoreTarget?.descTitle}
        </span>{" "}
        will be restored to {subjectRestoreTarget?.program}.
      </ConfirmDialog>

      <ConfirmDialog
        open={simpleRestoreTarget !== null}
        onClose={() => setSimpleRestoreTarget(null)}
        title="Restore item"
        confirmLabel="Restore"
        loadingLabel="Restoring…"
        onConfirm={handleSimpleRestore}
      >
        <span className="font-medium text-navy-700 dark:text-mist-100">{simpleRestoreTarget?.label}</span> will be
        restored.
      </ConfirmDialog>
    </div>
  );
}
