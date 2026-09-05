import { useState } from "react";
import { FormError } from "~/components/forms/form-error";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { ModalActions } from "~/components/ui/modal";
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
        label="Building name"
        required
        value={name}
        onChange={(e) => setName(e.target.value)}
      />
      <Input
        id="building-floors"
        label="Number of floors"
        type="number"
        inputMode="numeric"
        required
        min={1}
        value={floorCount === 0 ? "" : floorCount}
        onKeyDown={(e) => {
          if (["e", "E", "+", "-", "."].includes(e.key)) {
            e.preventDefault();
          }
        }}
        onChange={(e) => {
          const clean = e.target.value.replace(/[^0-9]/g, "");
          const num = clean === "" ? 0 : parseInt(clean, 10);
          setFloorCount(Number.isNaN(num) ? 0 : num);
        }}
        hint={
          isEdit
            ? "Cannot be reduced below the highest floor that has rooms."
            : "You can add rooms to each floor after creating the building."
        }
      />
      <ModalActions>
        <Button type="button" variant="outline" block={false} onClick={onCancel}>
          Cancel
        </Button>
        <Button block={false} isLoading={isLoading} loadingLabel="Saving…">
          {isEdit ? "Save changes" : "Create building"}
        </Button>
      </ModalActions>
    </form>
  );
}
