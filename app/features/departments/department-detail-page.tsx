import { useCallback, useState } from "react";
import { useNavigate } from "react-router";
import { toast } from "sonner";
import { Badge } from "~/components/ui/badge";
import { Breadcrumb } from "~/components/ui/breadcrumb";
import { Button } from "~/components/ui/button";
import { Card } from "~/components/ui/card";
import { ResultState } from "~/components/feedback/result-state";
import { ArchiveIcon, EditIcon } from "~/components/ui/icons";
import { Modal } from "~/components/ui/modal";
import { Skeleton } from "~/components/ui/skeleton";
import { AcademicDepartmentView } from "~/features/departments/academic-department-view";
import { DepartmentArchiveDialog } from "~/features/departments/department-archive-dialog";
import { DepartmentForm } from "~/features/departments/department-form";
import { OfficeStaffDirectory } from "~/features/departments/office-staff-directory";
import { useCachedData } from "~/hooks/use-cached-data";
import { departmentLogoSrc, onDepartmentLogoError } from "~/lib/department-logo";
import { buildingService } from "~/services/building.service";
import { departmentService } from "~/services/department.service";
import { enumService } from "~/services/enum.service";
import { getBuildingTone } from "~/types/building";
import { DEPARTMENT_TYPE_TONES } from "~/types/department";
import type { Building } from "~/types/building";
import type {
  AcademicDepartmentDetail,
  CreateDepartmentInput,
  Department,
  DepartmentOverview,
  OfficeStaffPayload,
} from "~/types/department";

type DepartmentDetailPageProps = {
  departmentId: number;
};

/** Type-specific detail payload — academic hub or office-staff directory. */
type DepartmentDetailData = AcademicDepartmentDetail | OfficeStaffPayload;

function isOfficeStaff(detail: DepartmentDetailData): detail is OfficeStaffPayload {
  return "staff" in detail;
}

/** Detail page for one department — metadata header plus a type-specific body
 * (programs/students for academic, office-staff directory for administrative). */
export function DepartmentDetailPage({ departmentId }: DepartmentDetailPageProps) {
  const navigate = useNavigate();
  const id = Number.isFinite(departmentId) ? departmentId : NaN;
  const validId = Number.isFinite(id);

  const { data: overview, error, reload: refresh } = useCachedData(
    `department:${id}:overview`,
    () => departmentService.getOverview(id),
    { enabled: validId },
  );
  const { data: buildingsData } = useCachedData("buildings", () => buildingService.list());
  const buildings: Building[] = buildingsData ?? [];
  const { data: enumOptions } = useCachedData("enums", () => enumService.getOptions());
  const departmentTypes = enumOptions?.departmentType ?? [];

  const isAcademic = overview?.departmentType === "Academic";

  const fetchDetail = useCallback(
    async (): Promise<DepartmentDetailData> =>
      isAcademic ? departmentService.getAcademicDetail(id) : departmentService.getOfficeStaff(id),
    [isAcademic, id],
  );
  const { data: detail, error: detailError, reload: reloadDetail } = useCachedData(
    `department:${id}:${isAcademic ? "academic" : "office"}`,
    fetchDetail,
    { enabled: overview !== null },
  );

  const [editOpen, setEditOpen] = useState(false);
  const [archiveTarget, setArchiveTarget] = useState<Department | null>(null);

  const editDepartment: Department | undefined = overview
    ? {
        id: overview.id,
        abbrev: overview.abbrev,
        name: overview.name,
        buildingName: overview.buildingName ?? "",
        departmentType: overview.departmentType,
        programs: overview.programs.map((p) => ({ abbrev: p.abbrev, name: p.name })),
        logoUrl: overview.logoUrl,
      }
    : undefined;

  const refreshAll = useCallback(async () => {
    await Promise.all([refresh(), reloadDetail()]);
  }, [refresh, reloadDetail]);

  async function handleEdit(input: CreateDepartmentInput, logoFile?: File | null) {
    const message = await departmentService.update(id, {
      abbrev: input.abbrev,
      name: input.name,
      buildingId: input.buildingId,
      departmentType: input.departmentType,
    });
    if (message) toast.success(message);
    setEditOpen(false);
    await refreshAll();
  }

  async function handleArchive(target: Department) {
    const message = await departmentService.remove(target.id, target.abbrev);
    if (message) toast.success(message);
    setArchiveTarget(null);
    navigate("/departments");
  }

  if (!validId) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-8">
        <ResultState
          tone="error"
          title="Department not found"
          action={{ href: "/departments", label: "Back to Departments" }}
        >
          This department may have been archived or the address is invalid.
        </ResultState>
      </div>
    );
  }

  if (error && overview === null) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-8">
        <ResultState tone="error" title="Unable to load department">
          {error}
        </ResultState>
      </div>
    );
  }

  if (overview === null) {
    return (
      <div role="status" aria-label="Loading department" className="mx-auto max-w-5xl px-4 py-8">
        <DetailSkeleton />
      </div>
    );
  }

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-5 px-4 py-8">
      <Breadcrumb
        items={[
          { label: "Departments", href: "/departments" },
          { label: overview.abbrev },
        ]}
      />

      <DepartmentHeader overview={overview} onEdit={() => setEditOpen(true)} onArchive={() => setArchiveTarget(editDepartment ?? null)} />

      {detail ? (
        isOfficeStaff(detail) ? (
          <OfficeStaffDirectory staff={detail.staff} />
        ) : (
          <AcademicDepartmentView detail={detail} />
        )
      ) : detailError ? (
        <ResultState tone="error" title="Unable to load department details">
          {detailError}
        </ResultState>
      ) : (
        <DetailSkeleton />
      )}

      <Modal open={editOpen} onClose={() => setEditOpen(false)} title="Edit Department">
        {editDepartment && (
          <DepartmentForm
            department={editDepartment}
            buildings={buildings}
            departmentTypes={departmentTypes}
            onSubmit={handleEdit}
            onCancel={() => setEditOpen(false)}
            onLogoChanged={refresh}
          />
        )}
      </Modal>

      <DepartmentArchiveDialog
        department={archiveTarget}
        onClose={() => setArchiveTarget(null)}
        onConfirm={handleArchive}
      />
    </div>
  );
}

function DepartmentHeader({
  overview,
  onEdit,
  onArchive,
}: {
  overview: DepartmentOverview;
  onEdit: () => void;
  onArchive: () => void;
}) {
  return (
    <Card className="overflow-hidden">
      <div className="relative h-36 overflow-hidden bg-slate-100 dark:bg-surface-raised/60">
        <img
          src={departmentLogoSrc(overview.logoUrl)}
          alt=""
          aria-hidden="true"
          onError={onDepartmentLogoError}
          className="absolute inset-0 size-full scale-125 object-cover object-center opacity-70 blur-2xl saturate-150"
        />
        <div className="absolute inset-0 bg-white/30 dark:bg-surface/40" />
        <img
          src={departmentLogoSrc(overview.logoUrl)}
          alt={`${overview.abbrev} logo`}
          onError={onDepartmentLogoError}
          className="absolute inset-0 m-auto size-20 object-contain drop-shadow-md"
        />
      </div>
      <div className="flex flex-wrap items-start justify-between gap-4 p-5">
        <div className="min-w-0">
          <p className="font-display text-3xl tracking-wide text-navy-800 dark:text-mist-100">
            {overview.abbrev}
          </p>
          <h1 className="mt-0.5 font-body text-lg font-semibold text-slate-700 dark:text-slate-200">
            {overview.name}
          </h1>
          <div className="mt-2 flex flex-wrap gap-1.5">
            <Badge tone={DEPARTMENT_TYPE_TONES[overview.departmentType] ?? "slate"}>
              {overview.departmentType}
            </Badge>
            {overview.buildingName && (
              <Badge tone={getBuildingTone(overview.buildingName)}>{overview.buildingName}</Badge>
            )}
            <Badge tone="blue">
              {overview.totalPrograms} program{overview.totalPrograms === 1 ? "" : "s"}
            </Badge>
          </div>
        </div>
        <div className="flex gap-2">
          <Button type="button" variant="outline" block={false} onClick={onEdit}>
            <EditIcon />
            Edit
          </Button>
          <Button type="button" variant="danger" block={false} onClick={onArchive}>
            <ArchiveIcon />
            Archive
          </Button>
        </div>
      </div>
    </Card>
  );
}

function DetailSkeleton() {
  return (
    <div className="flex flex-col gap-5" aria-hidden="true">
      <Skeleton className="h-36 rounded-xl" />
      <div className="flex flex-col gap-5">
        <Skeleton className="h-5 w-44" />
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-32 rounded-xl" />
          ))}
        </div>
      </div>
    </div>
  );
}
