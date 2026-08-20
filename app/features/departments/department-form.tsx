import { useEffect, useState } from "react";
import { FormError } from "~/components/forms/form-error";
import { Button } from "~/components/ui/button";
import { CropDialog } from "~/components/ui/crop-dialog";
import { ModalActions } from "~/components/ui/modal";
import { FileChooser } from "~/components/ui/file-chooser";
import { FieldChrome, Input } from "~/components/ui/input";
import { Textarea } from "~/components/ui/textarea";
import { Label } from "~/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "~/components/ui/select";
import { departmentSchema } from "~/schemas/department.schema";
import type { Building } from "~/types/building";
import type { CreateDepartmentInput, Department } from "~/types/department";

type DepartmentFormProps = {
  department?: Department;
  buildings: Building[];
  /** Backend DepartmentType values (enumService). */
  departmentTypes: string[];
  onSubmit: (input: CreateDepartmentInput, logoFile?: File | null, logoRemoved?: boolean) => Promise<void>;
  onCancel: () => void;
};

export function DepartmentForm({
  department,
  buildings,
  departmentTypes,
  onSubmit,
  onCancel,
}: DepartmentFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const isEdit = Boolean(department);
  const [type, setType] = useState(department?.departmentType ?? departmentTypes[0] ?? "");

  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(department?.logoUrl ?? null);
  const [logoRemoved, setLogoRemoved] = useState(false);
  const [logoCropSrc, setLogoCropSrc] = useState("");

  useEffect(() => {
    setLogoFile(null);
    setLogoPreview(department?.logoUrl ?? null);
    setLogoRemoved(false);
    setLogoCropSrc("");
  }, [department?.id, department?.logoUrl]);

  useEffect(() => {
    return () => {
      if (logoPreview && logoPreview.startsWith("blob:")) URL.revokeObjectURL(logoPreview);
    };
  }, [logoPreview]);

  useEffect(() => {
    return () => {
      if (logoCropSrc) URL.revokeObjectURL(logoCropSrc);
    };
  }, [logoCropSrc]);

  function handleLogoSelect(file: File) {
    if (file.type.startsWith("image/")) {
      if (logoCropSrc) URL.revokeObjectURL(logoCropSrc);
      setLogoCropSrc(URL.createObjectURL(file));
    } else {
      setLogoFile(file);
      if (logoPreview && logoPreview.startsWith("blob:")) URL.revokeObjectURL(logoPreview);
      setLogoPreview(URL.createObjectURL(file));
      setLogoRemoved(false);
    }
  }

  async function handleLogoCropSave(croppedFile: File) {
    setLogoFile(croppedFile);
    if (logoPreview && logoPreview.startsWith("blob:")) URL.revokeObjectURL(logoPreview);
    setLogoPreview(URL.createObjectURL(croppedFile));
    setLogoRemoved(false);
    if (logoCropSrc) URL.revokeObjectURL(logoCropSrc);
    setLogoCropSrc("");
  }

  function handleLogoClear() {
    setLogoFile(null);
    if (logoPreview && logoPreview.startsWith("blob:")) URL.revokeObjectURL(logoPreview);
    setLogoPreview(null);
    setLogoRemoved(true);
    if (logoCropSrc) URL.revokeObjectURL(logoCropSrc);
    setLogoCropSrc("");
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
      await onSubmit(result.data, logoFile, logoRemoved);
    } catch (err) {
      setError(err instanceof Error ? err.message : "");
      setIsLoading(false);
    }
  }

  const defaultBuildingId = department?.buildingId ? String(department.buildingId) : "";

  const displayFileName =
    logoFile?.name ?? (logoPreview && !logoRemoved ? (department?.logoUrl ? "Current logo" : null) : null);

  return (
    <>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
      <FormError message={error} />

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="dept-logo-file">Logo (optional)</Label>
        <FileChooser
          id="dept-logo-file"
          accept="image/jpeg,image/png,image/webp"
          fileName={displayFileName}
          previewUrl={logoPreview}
          onChange={handleLogoSelect}
          onClear={handleLogoClear}
        />
        <p className="font-body text-xs text-slate-400 dark:text-slate-500">
          JPG, PNG, or WEBP, up to 5 MB.
        </p>
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
            <SelectValue placeholder="No building" />
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
            <SelectValue placeholder="Select department type…" />
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

      <CropDialog
        open={Boolean(logoCropSrc)}
        imageSrc={logoCropSrc}
        aspect={1}
        outputWidth={512}
        outputHeight={512}
        cropShape="round"
        showGrid={false}
        previewClassName="relative aspect-square w-80 overflow-hidden rounded-full"
        title="Adjust Department Logo"
        saveLabel="Save logo"
        hint="Drag the image to position it, then click Save logo."
        onClose={() => setLogoCropSrc("")}
        onBack={() => setLogoCropSrc("")}
        onSave={handleLogoCropSave}
      />
    </>
  );
}
