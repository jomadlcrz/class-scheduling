import { useState } from "react";
import { FormError } from "~/components/forms/form-error";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Select } from "~/components/ui/select";
import { deanSchema } from "~/schemas/dean.schema";
import type { Department } from "~/types/department";
import {
  DEAN_STATUS_LABELS,
  DEAN_STATUSES,
  type CreateDeanInput,
  type Dean,
  type DeanStatus,
} from "~/types/dean";

type DeanFormProps = {
  member?: Dean;
  departments: Department[];
  onSubmit: (input: CreateDeanInput) => Promise<void>;
  onCancel: () => void;
};

export function DeanForm({ member, departments, onSubmit, onCancel }: DeanFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isEdit = Boolean(member);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const data = new FormData(e.currentTarget);

    const name = String(data.get("dean-name") ?? "").trim();
    const email = String(data.get("dean-email") ?? "").trim();
    const departmentId = String(data.get("dean-department") ?? "");
    const status = String(data.get("dean-status") ?? "") as DeanStatus;

    const result = deanSchema.safeParse({ name, email, departmentId, status });
    if (!result.success) {
      setError(result.error.issues[0].message);
      return;
    }

    const dept = departments.find((d) => d.id === departmentId);
    if (!dept) { setError("Select a department."); return; }

    setError(null);
    setIsLoading(true);
    try {
      await onSubmit({ ...result.data, departmentCode: dept.code });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
      setIsLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
      <FormError message={error} />

      <Input
        id="dean-name"
        label="Name"
        type="text"
        required
        placeholder="Diego Ramos"
        defaultValue={member?.name}
      />

      <Input
        id="dean-email"
        label="Email"
        type="email"
        required
        placeholder="dean@gwc.edu.ph"
        defaultValue={member?.email}
      />

      <Select
        id="dean-department"
        label="Department"
        defaultValue={member?.departmentId ?? departments[0]?.id}
      >
        {departments.map((d) => (
          <option key={d.id} value={d.id}>
            {d.code} — {d.name}
          </option>
        ))}
      </Select>

      <Select
        id="dean-status"
        label="Status"
        defaultValue={member?.status ?? "active"}
      >
        {DEAN_STATUSES.map((s) => (
          <option key={s} value={s}>
            {DEAN_STATUS_LABELS[s]}
          </option>
        ))}
      </Select>

      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" block={false} onClick={onCancel}>
          Cancel
        </Button>
        <Button block={false} isLoading={isLoading} loadingLabel="Saving…">
          {isEdit ? "Save Changes" : "Add Dean"}
        </Button>
      </div>
    </form>
  );
}
