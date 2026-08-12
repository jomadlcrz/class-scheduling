import { useEffect, useState } from "react";
import { toast } from "sonner";
import { FormError } from "~/components/forms/form-error";
import { Button } from "~/components/ui/button";
import { ConfirmDialog, ModalActions } from "~/components/ui/modal";
import { FileChooser } from "~/components/ui/file-chooser";
import { FieldChrome, Input } from "~/components/ui/input";
import { Textarea } from "~/components/ui/textarea";
import { Label } from "~/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "~/components/ui/select";
import { departmentLogoSrc, onDepartmentLogoError } from "~/lib/department-logo";
import { departmentSchema } from "~/schemas/department.schema";
import { departmentService } from "~/services/department.service";
import type { Building } from "~/types/building";
import type { CreateDepartmentInput, Department } from "~/types/department";

type DepartmentFormProps = {
  department?: Department;
  buildings: Building[];
  /** Backend DepartmentType values (enumService). */
  departmentTypes: string[];
  onSubmit: (input: CreateDepartmentInput, logoFile?: File | null) => Promise<void>;
  onCancel: () => void;
  /** Edit mode only — the logo has its own endpoints, so it saves immediately rather than
   * waiting for the rest of the form to submit. Called after a successful upload/remove so
   * the caller can refresh its list. */
  onLogoChanged?: () => void;
};

const logoThumbClassName =
  "size-14 shrink-0 rounded-lg border border-slate-200 bg-white object-contain p-1 dark:border-white/10 dark:bg-white/5";

export function DepartmentForm({
  department,
  buildings,
  departmentTypes,
  onSubmit,
  onCancel,
  onLogoChanged,
}: DepartmentFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const isEdit = Boolean(department);
  const [type, setType] = useState(department?.departmentType ?? departmentTypes[0] ?? "");

  // Create mode: the logo file rides along with the create submission.
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);

  // Edit mode: the logo has its own endpoints and saves immediately.
  const [logoUrl, setLogoUrl] = useState<string | null>(department?.logoUrl ?? null);
  const [logoSaving, setLogoSaving] = useState(false);
  const [logoError, setLogoError] = useState<string | null>(null);
  const [logoRemoveOpen, setLogoRemoveOpen] = useState(false);

  useEffect(() => {
    if (!logoPreview) return;
    return () => URL.revokeObjectURL(logoPreview);
  }, [logoPreview]);

  function handleLogoSelect(file: File) {
    setLogoFile(file);
    setLogoPreview(URL.createObjectURL(file));
  }

  async function handleLogoUpload(file: File) {
    if (!department) return;
    setLogoError(null);
    setLogoSaving(true);
    try {
      const result = await departmentService.uploadLogo(department.id, file);
      setLogoUrl(result.url);
      if (result.message) toast.success(result.message);
      onLogoChanged?.();
    } catch (err) {
      setLogoError(err instanceof Error ? err.message : "");
    } finally {
      setLogoSaving(false);
    }
  }

  async function handleLogoRemove() {
    if (!department) return;
    const message = await departmentService.removeLogo(department.id);
    setLogoUrl(null);
    if (message) toast.success(message);
    onLogoChanged?.();
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    const abbrev = String(data.get("dept-abbrev") ?? "").trim();
    const name = String(data.get("dept-name") ?? "").trim();
    const buildingIdRaw = Number(data.get("dept-building"));
    const buildingId = Number.isFinite(buildingIdRaw) && buildingIdRaw > 0 ? buildingIdRaw : undefined;
    const description = String(data.get("dept-description") ?? "").trim() || undefined;

    const result = departmentSchema.safeParse({ abbrev, name, buildingId, departmentType: type, description });
    if (!result.success) {
      setError(result.error.issues[0].message);
      return;
    }

    setError(null);
    setIsLoading(true);
    try {
      await onSubmit(result.data, logoFile);
    } catch (err) {
      setError(err instanceof Error ? err.message : "");
      setIsLoading(false);
    }
  }

  const defaultBuildingId = String(department?.buildingId ?? buildings[0]?.id ?? "");

  return (
    <>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
      <FormError message={error} />

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="dept-logo-file">Logo{!isEdit && " (optional)"}</Label>
        <div className="flex items-center gap-3">
          <img
            src={isEdit ? departmentLogoSrc(logoUrl) : departmentLogoSrc(logoPreview)}
            alt=""
            onError={onDepartmentLogoError}
            className={logoThumbClassName}
          />
          <div className="min-w-0 flex-1">
            <FileChooser
              id="dept-logo-file"
              accept="image/jpeg,image/png,image/webp"
              onChange={isEdit ? handleLogoUpload : handleLogoSelect}
            />
          </div>
        </div>
        <p className="font-body text-xs text-slate-400 dark:text-slate-500">
          {logoSaving ? "Uploading…" : "JPG, PNG, or WEBP, up to 5 MB."}
        </p>
        {logoError && <p className="font-body text-xs text-red-600 dark:text-red-400">{logoError}</p>}
        {isEdit && logoUrl && (
          <Button
            type="button"
            variant="danger"
            block={false}
            onClick={() => setLogoRemoveOpen(true)}
          >
            Remove logo
          </Button>
        )}
      </div>

      <Input
        id="dept-abbrev"
        label="Department Abbrev"
        required
        defaultValue={department?.abbrev ?? ""}
        hint="Short abbreviation, e.g. CITE, CBA, COEd."
      />
      <Input
        id="dept-name"
        label="Department Name"
        required
        defaultValue={department?.name ?? ""}
      />
      <FieldChrome id="dept-building" label="Building" hint="Optional — leave unset if no building is assigned.">
        <Select
          items={[{ value: "", label: "No building" }, ...buildings.map((b) => ({ value: String(b.id), label: b.name }))]}
          name="dept-building"
          defaultValue={defaultBuildingId}
        >
          <SelectTrigger id="dept-building">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">No building</SelectItem>
            {buildings.map((b) => (
              <SelectItem key={b.id} value={String(b.id)}>
                {b.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </FieldChrome>
      <FieldChrome id="dept-type" label="Department Type" hint="Administrative offices own no programs.">
        <Select
          items={departmentTypes.map((t) => ({ value: t, label: t }))}
          name="dept-type"
          value={type}
          onValueChange={(v) => setType(v as string)}
        >
          <SelectTrigger id="dept-type">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {departmentTypes.map((t) => (
              <SelectItem key={t} value={t}>
                {t}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </FieldChrome>
      <Textarea
        id="dept-description"
        label="Description"
        hint="Optional"
        defaultValue={department?.description ?? ""}
        rows={3}
      />
      <ModalActions>
        <Button type="button" variant="outline" block={false} onClick={onCancel}>
          Cancel
        </Button>
        <Button block={false} isLoading={isLoading} loadingLabel="Saving…">
          {isEdit ? "Save Changes" : "Add Department"}
        </Button>
      </ModalActions>
      </form>
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
    </>
  );
}
