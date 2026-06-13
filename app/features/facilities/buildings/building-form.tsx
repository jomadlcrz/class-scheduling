import { useState } from "react";
import { FormError } from "../../../components/forms/form-error";
import { Button } from "../../../components/ui/button";
import { Input } from "../../../components/ui/input";
import type { Building, CreateBuildingInput } from "../../../types/building";

type BuildingFormProps = {
  building?: Building;
  onSubmit: (input: CreateBuildingInput) => Promise<void>;
  onCancel: () => void;
};

export function BuildingForm({ building, onSubmit, onCancel }: BuildingFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const isEdit = Boolean(building);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    const name = String(data.get("building-name") ?? "").trim();
    const code = String(data.get("building-code") ?? "").trim().toUpperCase();
    const floorCount = Number(data.get("building-floors"));

    if (!name) { setError("Enter a building name."); return; }
    if (!code) { setError("Enter a building code."); return; }
    if (!floorCount || floorCount < 1) { setError("Enter a valid floor count."); return; }

    setError(null);
    setIsLoading(true);
    try {
      await onSubmit({ name, code, floorCount });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
      setIsLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
      <FormError message={error} />
      <Input
        id="building-name"
        label="Building Name"
        required
        placeholder="Main Building"
        defaultValue={building?.name ?? ""}
      />
      <Input
        id="building-code"
        label="Building Code"
        required
        placeholder="MB"
        defaultValue={building?.code ?? ""}
        hint="Short code used for room references, e.g. MB, STB, BAB."
      />
      <Input
        id="building-floors"
        label="Floor Count"
        type="number"
        required
        min={1}
        placeholder="3"
        defaultValue={building?.floorCount ?? ""}
      />
      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" block={false} onClick={onCancel}>
          Cancel
        </Button>
        <Button block={false} isLoading={isLoading} loadingLabel="Saving…">
          {isEdit ? "Save Changes" : "Add Building"}
        </Button>
      </div>
    </form>
  );
}
