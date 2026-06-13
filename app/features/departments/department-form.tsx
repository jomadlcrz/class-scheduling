import { useState } from "react";
import { FormError } from "../../components/forms/form-error";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Select } from "../../components/ui/select";
import type { Building } from "../../types/building";
import type { CreateDepartmentInput, Department } from "../../types/department";

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
    const code = String(data.get("dept-code") ?? "").trim();
    const name = String(data.get("dept-name") ?? "").trim();
    const buildingId = String(data.get("dept-building") ?? "");

    if (!code) { setError("Enter a department code."); return; }
    if (!name) { setError("Enter a department name."); return; }
    const building = buildings.find((b) => b.id === buildingId);
    if (!building) { setError("Select a building."); return; }

    setError(null);
    setIsLoading(true);
    try {
      await onSubmit({ code, name, buildingId: building.id, buildingCode: building.code });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
      setIsLoading(false);
    }
  }

  const defaultBuildingId = department?.buildingId ?? buildings[0]?.id ?? "";

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
      <FormError message={error} />
      <Input
        id="dept-code"
        label="Department Code"
        required
        placeholder="CITE"
        defaultValue={department?.code ?? ""}
        hint="Short code, e.g. CITE, CBA, COEd."
      />
      <Input
        id="dept-name"
        label="Department Name"
        required
        placeholder="College of Information Technology Education"
        defaultValue={department?.name ?? ""}
      />
      <Select id="dept-building" label="Building" defaultValue={defaultBuildingId}>
        {buildings.map((b) => (
          <option key={b.id} value={b.id}>
            {b.code} — {b.name}
          </option>
        ))}
      </Select>
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
