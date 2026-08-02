import { useState } from "react";
import { FormError } from "~/components/forms/form-error";
import { Button } from "~/components/ui/button";
import { FieldChrome, Input } from "~/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "~/components/ui/select";
import { departmentSchema } from "~/schemas/department.schema";
import type { Building } from "~/types/building";
import type { CreateDepartmentInput, Department } from "~/types/department";

type DepartmentFormProps = {
  department?: Department;
  buildings: Building[];
  /** Backend DepartmentType values (enumService). */
  departmentTypes: string[];
  onSubmit: (input: CreateDepartmentInput) => Promise<void>;
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
      await onSubmit(result.data);
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
