import { useEffect, useState } from "react";
import { toast } from "sonner";
import { FormError } from "~/components/forms/form-error";
import { Button } from "~/components/ui/button";
import { FileChooser } from "~/components/ui/file-chooser";
import { FieldChrome, Input } from "~/components/ui/input";
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
  const [logoRemoving, setLogoRemoving] = useState(false);
  const [logoError, setLogoError] = useState<string | null>(null);

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
    setLogoError(null);
    setLogoRemoving(true);
    try {
      const message = await departmentService.removeLogo(department.id);
      setLogoUrl(null);
      if (message) toast.success(message);
      onLogoChanged?.();
    } catch (err) {
      setLogoError(err instanceof Error ? err.message : "");
    } finally {
      setLogoRemoving(false);
    }
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    const abbrev = String(data.get("dept-abbrev") ?? "").trim();
    const name = String(data.get("dept-name") ?? "").trim();
    const buildingId = Number(data.get("dept-building"));

    const result = departmentSchema.safeParse({ abbrev, name, buildingId, departmentType: type });
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

  const defaultBuildingId =
    (department && buildings.find((b) => b.name === department.buildingName)?.id) ??
    buildings[0]?.id ??
    0;

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
      <FormError message={error} />

      <div className="flex flex-col gap-1.5">
        <span className="font-body text-sm font-medium text-navy-700 dark:text-mist-100">
          Logo{!isEdit && " (optional)"}
        </span>
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
              hint={
                logoSaving
                  ? "Uploading…"
                  : "JPG, PNG, or WEBP, up to 5 MB."
              }
              onChange={isEdit ? handleLogoUpload : handleLogoSelect}
            />
          </div>
        </div>
        {logoError && <p className="font-body text-xs text-red-600 dark:text-red-400">{logoError}</p>}
        {isEdit && logoUrl && (
          <Button
            type="button"
            variant="danger"
            block={false}
            isLoading={logoRemoving}
            loadingLabel="Removing…"
            onClick={handleLogoRemove}
          >
            Remove logo
          </Button>
        )}
      </div>

      <Input
        id="dept-abbrev"
        label="Department Abbrev"
        required
        placeholder="CITE"
        defaultValue={department?.abbrev ?? ""}
        hint="Short abbreviation, e.g. CITE, CBA, COEd."
      />
      <Input
        id="dept-name"
        label="Department Name"
        required
        placeholder="College of Information Technology Education"
        defaultValue={department?.name ?? ""}
      />
      <FieldChrome id="dept-building" label="Building">
        <Select
          items={buildings.map((b) => ({ value: String(b.id), label: b.name }))}
          name="dept-building"
          defaultValue={String(defaultBuildingId)}
        >
          <SelectTrigger id="dept-building">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
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
      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" block={false} onClick={onCancel}>
          Cancel
        </Button>
        <Button block={false} isLoading={isLoading} loadingLabel="Saving…">
          {isEdit ? "Save Changes" : "Add Department"}
        </Button>
      </div>
    </form>
  );
}
