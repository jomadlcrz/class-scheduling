import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { useAuth } from "~/hooks/use-auth";
import { EmptyState } from "~/components/feedback/empty-state";
import { Badge } from "~/components/ui/badge";
import { RotateIcon } from "~/components/ui/icons";
import { ConfirmDialog } from "~/components/ui/modal";
import { Spinner } from "~/components/ui/spinner";
import { TabList } from "~/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "~/components/ui/table";
import { SettingsPageHeader } from "~/features/settings/settings-page-header";
import { SubjectTypeBadge } from "~/features/subjects/subject-type-badge";
import { buildingService, type DeletedBuilding } from "~/services/building.service";
import { departmentService, type DeletedDepartment } from "~/services/department.service";
import { permissionService } from "~/services/permission.service";
import type { DeletedPermission } from "~/types/permission";
import { programService, type DeletedProgram } from "~/services/program.service";
import { recycleBinService, type DeletedSubject } from "~/services/recycle-bin.service";
import { roomService, type DeletedRoom } from "~/services/room.service";
import { schoolYearService, type DeletedSchoolYear } from "~/services/school-year.service";
import { semesterService, type DeletedSemester } from "~/services/semester.service";
import { setService, type DeletedSet } from "~/services/set.service";

type TabKey =
  | "subjects"
  | "programs"
  | "sets"
  | "buildings"
  | "rooms"
  | "departments"
  | "school-years"
  | "semesters"
  | "permissions";

type TabConfig = {
  key: TabKey;
  label: string;
  roles: ("admin" | "registrar")[];
};

const TABS: TabConfig[] = [
  { key: "subjects", label: "Subjects", roles: ["registrar"] },
  { key: "programs", label: "Programs", roles: ["registrar"] },
  { key: "sets", label: "Sets", roles: ["registrar"] },
  { key: "buildings", label: "Buildings", roles: ["registrar"] },
  { key: "rooms", label: "Rooms", roles: ["registrar"] },
  { key: "departments", label: "Departments", roles: ["registrar"] },
  { key: "school-years", label: "School Years", roles: ["registrar"] },
  { key: "semesters", label: "Semesters", roles: ["registrar"] },
  { key: "permissions", label: "Permissions", roles: ["admin"] },
];

function formatDateTime(value: string | null): string {
  if (!value) return "—";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "—" : date.toLocaleString();
}

const restoreButtonClassName =
  "inline-flex cursor-pointer items-center gap-1 rounded-lg px-2 py-1 font-body text-xs font-medium text-blue-700 transition-colors duration-150 hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-blue-400/10";

function RestoreButton({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} aria-label={`Restore ${label}`} className={restoreButtonClassName}>
      <RotateIcon size={14} />
      Restore
    </button>
  );
}

export function RecentlyDeleted() {
  const { user } = useAuth();
  const role = user?.role === "admin" ? "admin" : "registrar";

  const visibleTabs = useMemo(() => TABS.filter((tab) => tab.roles.includes(role)), [role]);
  const tabOptions = useMemo(
    () => visibleTabs.map((tab) => ({ value: tab.key, label: tab.label })),
    [visibleTabs],
  );
  const [activeTab, setActiveTab] = useState<TabKey>(() => visibleTabs[0]?.key ?? "subjects");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [subjects, setSubjects] = useState<DeletedSubject[]>([]);
  const [programs, setPrograms] = useState<DeletedProgram[]>([]);
  const [sets, setSets] = useState<DeletedSet[]>([]);
  const [buildings, setBuildings] = useState<DeletedBuilding[]>([]);
  const [rooms, setRooms] = useState<DeletedRoom[]>([]);
  const [departments, setDepartments] = useState<DeletedDepartment[]>([]);
  const [schoolYears, setSchoolYears] = useState<DeletedSchoolYear[]>([]);
  const [semesters, setSemesters] = useState<DeletedSemester[]>([]);
  const [permissions, setPermissions] = useState<DeletedPermission[]>([]);

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmLabel, setConfirmLabel] = useState("");
  const [pendingRestore, setPendingRestore] = useState<(() => Promise<string>) | null>(null);

  useEffect(() => {
    if (!visibleTabs.some((tab) => tab.key === activeTab)) {
      setActiveTab(visibleTabs[0]?.key ?? "subjects");
    }
  }, [activeTab, visibleTabs]);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      switch (activeTab) {
        case "subjects":
          setSubjects(await recycleBinService.list());
          break;
        case "programs":
          setPrograms(await programService.listDeleted());
          break;
        case "sets":
          setSets(await setService.listDeleted());
          break;
        case "buildings":
          setBuildings(await buildingService.listDeleted());
          break;
        case "rooms":
          setRooms(await roomService.listDeleted());
          break;
        case "departments":
          setDepartments(await departmentService.listDeleted());
          break;
        case "school-years":
          setSchoolYears(await schoolYearService.listDeleted());
          break;
        case "semesters":
          setSemesters(await semesterService.listDeleted());
          break;
        case "permissions":
          setPermissions(await permissionService.listDeleted());
          break;
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "");
    } finally {
      setLoading(false);
    }
  }, [activeTab]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  function askRestore(label: string, action: () => Promise<string>) {
    setConfirmLabel(label);
    setPendingRestore(() => action);
    setConfirmOpen(true);
  }

  async function handleConfirm() {
    if (!pendingRestore) return;
    const message = await pendingRestore();
    if (message) toast.success(message);
    await refresh();
  }

  const isEmpty = useMemo(() => {
    switch (activeTab) {
      case "subjects":
        return subjects.length === 0;
      case "programs":
        return programs.length === 0;
      case "sets":
        return sets.length === 0;
      case "buildings":
        return buildings.length === 0;
      case "rooms":
        return rooms.length === 0;
      case "departments":
        return departments.length === 0;
      case "school-years":
        return schoolYears.length === 0;
      case "semesters":
        return semesters.length === 0;
      case "permissions":
        return permissions.length === 0;
      default:
        return true;
    }
  }, [
    activeTab,
    subjects,
    programs,
    sets,
    buildings,
    rooms,
    departments,
    schoolYears,
    semesters,
    permissions,
  ]);

  function renderTable() {
    switch (activeTab) {
      case "subjects":
        return (
          <Table>
            <TableHead>
              <TableHeader>Code</TableHeader>
              <TableHeader>Title</TableHeader>
              <TableHeader className="hidden sm:table-cell text-center">Units</TableHeader>
              <TableHeader className="hidden md:table-cell">Type</TableHeader>
              <TableHeader className="hidden lg:table-cell text-center">Prereq Links</TableHeader>
              <TableHeader>Deleted</TableHeader>
              <TableHeader className="text-right">Restore</TableHeader>
            </TableHead>
            <TableBody>
              {subjects.map((subject) => (
                <TableRow key={subject.subjectId}>
                  <TableCell className="font-medium text-navy-700 dark:text-mist-100">
                    {subject.subjectCode}
                  </TableCell>
                  <TableCell>{subject.descTitle}</TableCell>
                  <TableCell className="hidden sm:table-cell text-center">{subject.units}</TableCell>
                  <TableCell className="hidden md:table-cell">
                    {subject.subjectType ? <SubjectTypeBadge type={subject.subjectType} /> : "—"}
                  </TableCell>
                  <TableCell className="hidden lg:table-cell text-center">{subject.prerequisiteLinks}</TableCell>
                  <TableCell>{formatDateTime(subject.deactivatedAt)}</TableCell>
                  <TableCell className="text-right">
                    <RestoreButton
                      label={subject.subjectCode}
                      onClick={() =>
                        askRestore(`${subject.subjectCode} — ${subject.descTitle}`, async () =>
                          recycleBinService.restore(subject.subjectId),
                        )
                      }
                    />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        );

      case "programs":
        return (
          <Table>
            <TableHead>
              <TableHeader>Program</TableHeader>
              <TableHeader className="hidden md:table-cell">Cascade</TableHeader>
              <TableHeader>Deleted</TableHeader>
              <TableHeader className="text-right">Restore</TableHeader>
            </TableHead>
            <TableBody>
              {programs.map((program) => (
                <TableRow key={program.id}>
                  <TableCell className="font-medium text-navy-700 dark:text-mist-100">
                    {program.abbrev} — {program.name}
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
                    {program.cascadeArchived ? (
                      <span className="font-body text-sm text-slate-600 dark:text-slate-300">
                        {program.cascadeArchived.sets} sets, {program.cascadeArchived.subjects} subjects
                      </span>
                    ) : (
                      "—"
                    )}
                  </TableCell>
                  <TableCell>{formatDateTime(program.deactivatedAt)}</TableCell>
                  <TableCell className="text-right">
                    <RestoreButton
                      label={program.abbrev}
                      onClick={() =>
                        askRestore(`${program.abbrev} — ${program.name}`, async () => programService.restore(program.id))
                      }
                    />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        );

      case "sets":
        return (
          <Table>
            <TableHead>
              <TableHeader>Set</TableHeader>
              <TableHeader className="hidden sm:table-cell text-center">Students</TableHeader>
              <TableHeader>Deleted</TableHeader>
              <TableHeader className="text-right">Restore</TableHeader>
            </TableHead>
            <TableBody>
              {sets.map((set) => (
                <TableRow key={set.id}>
                  <TableCell className="font-medium text-navy-700 dark:text-mist-100">
                    {set.setCode}
                    {set.setName ? ` — ${set.setName}` : ""}
                  </TableCell>
                  <TableCell className="hidden sm:table-cell text-center">{set.studentsAffected}</TableCell>
                  <TableCell>{formatDateTime(set.deactivatedAt)}</TableCell>
                  <TableCell className="text-right">
                    <RestoreButton
                      label={set.setCode}
                      onClick={() =>
                        askRestore(set.setCode, async () => setService.restore(set.id))
                      }
                    />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        );

      case "buildings":
        return (
          <Table>
            <TableHead>
              <TableHeader>Building</TableHeader>
              <TableHeader className="hidden md:table-cell">Cascade</TableHeader>
              <TableHeader>Deleted</TableHeader>
              <TableHeader className="text-right">Restore</TableHeader>
            </TableHead>
            <TableBody>
              {buildings.map((building) => (
                <TableRow key={building.id}>
                  <TableCell className="font-medium text-navy-700 dark:text-mist-100">{building.name}</TableCell>
                  <TableCell className="hidden md:table-cell">
                    {building.cascadeArchived ? (
                      <span className="font-body text-sm text-slate-600 dark:text-slate-300">
                        {building.cascadeArchived.rooms} rooms, {building.cascadeArchived.departments} depts,{" "}
                        {building.cascadeArchived.programs} programs
                      </span>
                    ) : (
                      "—"
                    )}
                  </TableCell>
                  <TableCell>{formatDateTime(building.deactivatedAt)}</TableCell>
                  <TableCell className="text-right">
                    <RestoreButton
                      label={building.name}
                      onClick={() =>
                        askRestore(building.name, async () => buildingService.restore(building.id))
                      }
                    />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        );

      case "rooms":
        return (
          <Table>
            <TableHead>
              <TableHeader>Room</TableHeader>
              <TableHeader>Deleted</TableHeader>
              <TableHeader className="text-right">Restore</TableHeader>
            </TableHead>
            <TableBody>
              {rooms.map((room) => (
                <TableRow key={room.id}>
                  <TableCell className="font-medium text-navy-700 dark:text-mist-100">{room.name}</TableCell>
                  <TableCell>{formatDateTime(room.deactivatedAt)}</TableCell>
                  <TableCell className="text-right">
                    <RestoreButton
                      label={room.name}
                      onClick={() => askRestore(room.name, async () => roomService.restore(room.id))}
                    />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        );

      case "departments":
        return (
          <Table>
            <TableHead>
              <TableHeader>Department</TableHeader>
              <TableHeader className="hidden md:table-cell">Cascade</TableHeader>
              <TableHeader>Deleted</TableHeader>
              <TableHeader className="text-right">Restore</TableHeader>
            </TableHead>
            <TableBody>
              {departments.map((department) => (
                <TableRow key={department.id}>
                  <TableCell className="font-medium text-navy-700 dark:text-mist-100">
                    {department.abbrev} — {department.name}
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
                    {department.cascadeArchived
                      ? `${department.cascadeArchived.programs} programs`
                      : "—"}
                  </TableCell>
                  <TableCell>{formatDateTime(department.deactivatedAt)}</TableCell>
                  <TableCell className="text-right">
                    <RestoreButton
                      label={department.abbrev}
                      onClick={() =>
                        askRestore(`${department.abbrev} — ${department.name}`, async () =>
                          departmentService.restore(department.id),
                        )
                      }
                    />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        );

      case "school-years":
        return (
          <Table>
            <TableHead>
              <TableHeader>School Year</TableHeader>
              <TableHeader className="hidden sm:table-cell">Created</TableHeader>
              <TableHeader>Deleted</TableHeader>
              <TableHeader className="text-right">Restore</TableHeader>
            </TableHead>
            <TableBody>
              {schoolYears.map((year) => (
                <TableRow key={year.id}>
                  <TableCell className="font-medium text-navy-700 dark:text-mist-100">{year.schoolYear}</TableCell>
                  <TableCell className="hidden sm:table-cell">{formatDateTime(year.createdAt ?? null)}</TableCell>
                  <TableCell>{formatDateTime(year.deactivatedAt)}</TableCell>
                  <TableCell className="text-right">
                    <RestoreButton
                      label={year.schoolYear}
                      onClick={() =>
                        askRestore(year.schoolYear, async () => schoolYearService.restore(year.id))
                      }
                    />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        );

      case "semesters":
        return (
          <Table>
            <TableHead>
              <TableHeader>Semester</TableHeader>
              <TableHeader className="hidden sm:table-cell text-center">Number</TableHeader>
              <TableHeader>Deleted</TableHeader>
              <TableHeader className="text-right">Restore</TableHeader>
            </TableHead>
            <TableBody>
              {semesters.map((semester) => {
                const label = semester.displayName ?? semester.semester ?? `Semester ${semester.semesterNumber}`;
                return (
                  <TableRow key={semester.id}>
                    <TableCell className="font-medium text-navy-700 dark:text-mist-100">{label}</TableCell>
                    <TableCell className="hidden sm:table-cell text-center">{semester.semesterNumber}</TableCell>
                    <TableCell>{formatDateTime(semester.deactivatedAt)}</TableCell>
                    <TableCell className="text-right">
                      <RestoreButton
                        label={label}
                        onClick={() => askRestore(label, async () => semesterService.restore(semester.id))}
                      />
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        );

      case "permissions":
        return (
          <Table>
            <TableHead>
              <TableHeader>Permission</TableHeader>
              <TableHeader>Deleted</TableHeader>
              <TableHeader className="text-right">Restore</TableHeader>
            </TableHead>
            <TableBody>
              {permissions.map((permission) => (
                <TableRow key={permission.id}>
                  <TableCell className="font-medium text-navy-700 dark:text-mist-100">
                    <Badge tone="violet">{permission.slug}</Badge>
                  </TableCell>
                  <TableCell>{formatDateTime(permission.deactivatedAt)}</TableCell>
                  <TableCell className="text-right">
                    <RestoreButton
                      label={permission.slug}
                      onClick={() =>
                        askRestore(permission.slug, async () => permissionService.restore(permission.id))
                      }
                    />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        );

      default:
        return null;
    }
  }

  return (
    <div>
      <SettingsPageHeader title="Recently Deleted" />

      <p className="mt-2 font-body text-sm text-slate-500 dark:text-slate-400">
        Restore archived items within the 30-day window before they are permanently removed.
      </p>

      <TabList
        ariaLabel="Recently deleted resource"
        tabs={tabOptions}
        value={activeTab}
        onChange={setActiveTab}
        className="mt-6"
      />

      {error ? (
        <div className="mt-6">
          <EmptyState title="Couldn't load recently deleted items">{error}</EmptyState>
        </div>
      ) : loading ? (
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
      ) : (
        <div className="mt-6 flex flex-col gap-3">{renderTable()}</div>
      )}

      <ConfirmDialog
        open={confirmOpen}
        onClose={() => {
          setConfirmOpen(false);
          setPendingRestore(null);
        }}
        title="Restore item"
        confirmLabel="Restore"
        loadingLabel="Restoring…"
        onConfirm={handleConfirm}
      >
        <span className="font-medium text-navy-700 dark:text-mist-100">{confirmLabel}</span> will be restored.
      </ConfirmDialog>
    </div>
  );
}
