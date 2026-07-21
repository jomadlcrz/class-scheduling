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
  onSubmit: (input: CreateDepartmentInput) => Promise<void>;
  onCancel: () => void;
};

export function DepartmentForm({ department, buildings, onSubmit, onCancel }: DepartmentFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const isEdit = Boolean(department);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    const abbrev = String(data.get("dept-abbrev") ?? "").trim();
    const name = String(data.get("dept-name") ?? "").trim();
    const buildingName = isEdit
      ? department!.buildingName
      : String(data.get("dept-building") ?? "");

    const result = departmentSchema.safeParse({ abbrev, name, buildingName });
    if (!result.success) {
      setError(result.error.issues[0].message);
      return;
    }

    setError(null);
    setIsLoading(true);
    try {
      await onSubmit(result.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
      setIsLoading(false);
    }
  }

  const defaultBuildingName = department?.buildingName ?? buildings[0]?.name ?? "";

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
      <FieldChrome
        id="dept-building"
        label="Building"
        hint={isEdit ? "The building can't be changed after creation." : undefined}
      >
        <Select
          items={buildings.map((b) => ({ value: b.name, label: b.name }))}
          name="dept-building"
          defaultValue={defaultBuildingName}
          disabled={isEdit}
        >
          <SelectTrigger id="dept-building">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {buildings.map((b) => (
              <SelectItem key={b.id} value={b.name}>
                {b.name}
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
