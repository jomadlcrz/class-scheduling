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
  const [name, setName] = useState(building?.name ?? "");
  const [floorCount, setFloorCount] = useState(building?.floorCount ?? 1);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    const result = buildingSchema.safeParse({ name: name.trim(), floorCount });
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

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
      <FormError message={error} />
      <Input
        id="building-name"
        label="Building Name"
        required
        placeholder="Main Academic Building"
        value={name}
        onChange={(e) => setName(e.target.value)}
      />
      <Input
        id="building-floors"
        label="Number of Floors"
        type="number"
        required
        min={1}
        placeholder="3"
        value={floorCount}
        onChange={(e) => setFloorCount(Math.max(1, Number(e.target.value) || 1))}
        hint={
          isEdit
            ? "Cannot be reduced below the highest floor that has rooms."
            : "You can add rooms to each floor after creating the building."
        }
      />
      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="outline" block={false} onClick={onCancel}>
          Cancel
        </Button>
        <Button block={false} isLoading={isLoading} loadingLabel="Saving…">
          {isEdit ? "Save Changes" : "Create Building"}
        </Button>
      </div>
    </form>
  );
}
