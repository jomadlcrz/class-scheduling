import { useCallback, useRef, useState } from "react";
import { useNavigate } from "react-router";
import { toast } from "sonner";
import { ResultState } from "~/components/feedback/result-state";
import { Badge } from "~/components/ui/badge";
import { Breadcrumb } from "~/components/ui/breadcrumb";
import { Button } from "~/components/ui/button";
import { Card } from "~/components/ui/card";
import { CropDialog } from "~/components/ui/crop-dialog";
import { ArchiveIcon, CameraIcon, EditIcon, TrashIcon, UploadIcon } from "~/components/ui/icons";
import { ConfirmDialog, Modal } from "~/components/ui/modal";
import { Popover } from "~/components/ui/popover";
import { Skeleton } from "~/components/ui/skeleton";
import { AcademicDepartmentView } from "~/features/departments/academic-department-view";
import { DepartmentArchiveDialog } from "~/features/departments/department-archive-dialog";
import { DepartmentCoverDialog } from "~/features/departments/department-cover-dialog";
import { DepartmentForm } from "~/features/departments/department-form";
import { OfficeStaffDirectory } from "~/features/departments/office-staff-directory";
import { useCachedData } from "~/hooks/use-cached-data";
import { writeCache } from "~/lib/data-cache";
import { departmentLogoSrc, onDepartmentLogoError } from "~/lib/department-logo";
import { buildingService } from "~/services/building.service";
import { departmentService } from "~/services/department.service";
import { enumService } from "~/services/enum.service";
import type { Building } from "~/types/building";
import { getBuildingTone } from "~/types/building";
import type {
  AcademicDepartmentDetail,
  CreateDepartmentInput,
  Department,
  DepartmentOverview,
  OfficeStaffPayload,
} from "~/types/department";
import { DEPARTMENT_TYPE_TONES } from "~/types/department";

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

  const { data: overview, error, reload: refresh, setData: setOverview } = useCachedData(
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
  const [coverOpen, setCoverOpen] = useState(false);
  const [archiveTarget, setArchiveTarget] = useState<Department | null>(null);
  const [logoRemoveOpen, setLogoRemoveOpen] = useState(false);
  const logoFileRef = useRef<HTMLInputElement>(null);
  const [logoCropSrc, setLogoCropSrc] = useState("");

  const editDepartment: Department | undefined = overview
    ? {
        id: overview.id,
        abbrev: overview.abbrev,
        name: overview.name,
        buildingId: overview.buildingId,
        buildingName: overview.buildingName ?? "",
        departmentType: overview.departmentType,
        description: overview.description,
        programs: overview.programs.map((p) => ({ abbrev: p.abbrev, name: p.name })),
        logoUrl: overview.logoUrl,
        coverImageUrl: overview.coverImageUrl,
      }
    : undefined;

  const refreshAll = useCallback(async () => {
    await Promise.all([refresh(), reloadDetail()]);
  }, [refresh, reloadDetail]);

  const refreshCover = useCallback(async () => {
    const freshOverview = await departmentService.getOverview(id, true);
    setOverview(freshOverview);
    writeCache(`department:${id}:overview`, freshOverview);
  }, [id, setOverview]);

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

  function handleLogoSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setLogoCropSrc(URL.createObjectURL(file));
  }

  async function handleLogoCropSave(croppedFile: File) {
    const result = await departmentService.uploadLogo(id, croppedFile);
    if (result.message) toast.success(result.message);
    setLogoCropSrc("");
    await refresh();
  }

  async function handleLogoRemove() {
    const message = await departmentService.removeLogo(id);
    if (message) toast.success(message);
    await refresh();
  }

  if (!validId) {
    return (
      <div className="mx-auto w-full max-w-7xl px-4 py-8">
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
      <div className="mx-auto w-full max-w-7xl px-4 py-8">
        <ResultState tone="error" title="Unable to load department">
          {error}
        </ResultState>
      </div>
    );
  }

  if (overview === null) {
    return (
      <div role="status" aria-label="Loading department" className="mx-auto w-full max-w-7xl px-4 py-8">
        <DetailSkeleton />
      </div>
    );
  }

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-5 px-4 py-6 sm:py-8">
      <Breadcrumb
        items={[
          { label: "Departments", href: "/departments" },
          { label: overview.abbrev },
        ]}
      />

      <DepartmentHeader
        overview={overview}
        onEditCover={() => setCoverOpen(true)}
        onEdit={() => setEditOpen(true)}
        onArchive={() => setArchiveTarget(editDepartment ?? null)}
        onUploadLogo={() => logoFileRef.current?.click()}
        onRemoveLogo={() => setLogoRemoveOpen(true)}
      />

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
          />
        )}
      </Modal>

      <DepartmentArchiveDialog
        department={archiveTarget}
        onClose={() => setArchiveTarget(null)}
        onConfirm={handleArchive}
      />

      <DepartmentCoverDialog
        department={coverOpen && editDepartment ? editDepartment : null}
        onClose={() => setCoverOpen(false)}
        onChanged={refreshCover}
      />

      <input
        ref={logoFileRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={handleLogoSelect}
      />

      <CropDialog
        open={Boolean(logoCropSrc)}
        imageSrc={logoCropSrc}
        aspect={1}
        outputWidth={512}
        outputHeight={512}
        cropShape="round"
        showGrid={false}
        title="Adjust Department Logo"
        saveLabel="Save logo"
        hint="Drag the image to position it, then click Save logo."
        previewClassName="relative aspect-square w-48 overflow-hidden rounded-full"
        onClose={() => setLogoCropSrc("")}
        onBack={() => setLogoCropSrc("")}
        onSave={handleLogoCropSave}
      />

      <ConfirmDialog
        open={logoRemoveOpen}
        onClose={() => setLogoRemoveOpen(false)}
        title="Remove logo"
        confirmLabel="Remove"
        loadingLabel="Removing…"
        confirmVariant="danger"
        onConfirm={handleLogoRemove}
      >
        The department logo will be removed and replaced with the default placeholder.
      </ConfirmDialog>
    </div>
  );
}

function DepartmentHeader({
  overview,
  onEditCover,
  onEdit,
  onArchive,
  onUploadLogo,
  onRemoveLogo,
}: {
  overview: DepartmentOverview;
  onEditCover: () => void;
  onEdit: () => void;
  onArchive: () => void;
  onUploadLogo: () => void;
  onRemoveLogo: () => void;
}) {
  return (
    <Card className="overflow-hidden p-0">
      <div className="relative h-64 overflow-hidden bg-navy-900 sm:h-80 lg:h-88">
        {overview.coverImageUrl ? (
          <img
            src={overview.coverImageUrl}
            alt=""
            className="size-full object-cover object-center"
          />
        ) : (
          <>
            <img
              src={departmentLogoSrc(overview.logoUrl)}
              alt=""
              aria-hidden="true"
              onError={onDepartmentLogoError}
              className="size-full scale-125 object-cover object-center opacity-55 blur-3xl saturate-150"
            />
            <div className="absolute inset-0 bg-linear-to-br from-navy-950/45 via-navy-900/35 to-gwc-blue-deep/40" />
          </>
        )}
        <div className="absolute inset-0 bg-linear-to-b from-navy-950/55 via-navy-900/20 to-navy-950/65" />
        <button
          type="button"
          onClick={onEditCover}
          className="absolute right-3 bottom-3 flex cursor-pointer items-center gap-2 rounded-lg border border-white/30 bg-navy-950/85 px-3 py-2 font-body text-sm font-medium text-mist-100 shadow-lg backdrop-blur-md transition-colors duration-150 hover:border-white/45 hover:bg-navy-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-400 sm:right-5 sm:bottom-5"
        >
          <CameraIcon />
          {overview.coverImageUrl ? "Edit cover" : "Add cover"}
        </button>
        <div className="absolute inset-x-0 bottom-0 h-1 bg-gold-400" />
      </div>

      <div className="relative px-5 pb-6 pt-16 sm:px-7 sm:pt-20">
        <div className="absolute left-1/2 top-0 -translate-x-1/2 -translate-y-1/2">
          <Popover
            label="Department logo options"
            triggerClassName="size-28 sm:size-32 cursor-pointer rounded-full border-4 border-white bg-white shadow-xl dark:border-surface-raised dark:bg-surface-raised overflow-hidden focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-400"
            trigger={
              <img
                src={departmentLogoSrc(overview.logoUrl)}
                alt={`${overview.abbrev} logo`}
                onError={onDepartmentLogoError}
                className="size-full object-cover"
              />
            }
            className="w-52"
          >
            {(close) => (
              <div className="flex flex-col" role="none">
                <button
                  type="button"
                  role="menuitem"
                  onClick={() => { close(); onUploadLogo(); }}
                  className="flex items-center gap-2.5 rounded-md px-3 py-2 text-left font-body text-sm text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-white/10"
                >
                  <UploadIcon size={16} />
                  Upload a logo…
                </button>
                {overview.logoUrl && (
                  <button
                    type="button"
                    role="menuitem"
                    onClick={() => { close(); onRemoveLogo(); }}
                    className="flex items-center gap-2.5 rounded-md px-3 py-2 text-left font-body text-sm text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-500/10"
                  >
                    <TrashIcon />
                    Remove logo
                  </button>
                )}
              </div>
            )}
          </Popover>
        </div>

        <div className="flex flex-col items-center gap-5 text-center lg:flex-row lg:items-end lg:justify-between lg:text-left">
          <div className="min-w-0">
            <p className="font-display text-4xl tracking-wide text-navy-800 dark:text-mist-100">
            {overview.abbrev}
            </p>
            <h1 className="mt-0.5 font-body text-lg font-semibold text-slate-700 dark:text-slate-200">
              {overview.name}
            </h1>
            {overview.description && (
              <p className="mx-auto mt-2 max-w-3xl font-body text-sm leading-6 text-slate-500 lg:mx-0 dark:text-slate-400">
                {overview.description}
              </p>
            )}
            <div className="mt-3 flex flex-wrap justify-center gap-1.5 lg:justify-start">
              <Badge tone={DEPARTMENT_TYPE_TONES[overview.departmentType] ?? "slate"}>
                {overview.departmentType}
              </Badge>
              {overview.buildingName && (
                <Badge tone={getBuildingTone(overview.buildingName)}>{overview.buildingName}</Badge>
              )}
              {overview.departmentType === "Academic" && (
                <Badge tone="blue">
                  {overview.totalPrograms} program{overview.totalPrograms === 1 ? "" : "s"}
                </Badge>
              )}
            </div>
          </div>

          <div className="flex shrink-0 gap-2">
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
      </div>
    </Card>
  );
}

function DetailSkeleton() {
  return (
    <div className="flex flex-col gap-5" aria-hidden="true">
      <Skeleton className="h-44 rounded-xl" />
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
