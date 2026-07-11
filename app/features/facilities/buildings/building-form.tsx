import { useState } from "react";
import { FormError } from "~/components/forms/form-error";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { buildingSchema } from "~/schemas/building.schema";
import type { Building, CreateBuildingInput } from "~/types/building";

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
    const floorCount = Number(data.get("building-floors"));

    const result = buildingSchema.safeParse({ name, floorCount });
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
