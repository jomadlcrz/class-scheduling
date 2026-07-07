import { useState } from "react";
import { FormError } from "~/components/forms/form-error";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Select } from "~/components/ui/select";
import { programSchema } from "~/schemas/program.schema";
import type { Department } from "~/types/department";
import type { CreateProgramInput, Program, ProgramType } from "~/types/program";
import { PROGRAM_TYPE_LABELS, PROGRAM_TYPE_YEARS, PROGRAM_TYPES } from "~/types/program";

type ProgramFormProps = {
  program?: Program;
  departments: Department[];
  onSubmit: (input: CreateProgramInput) => Promise<void>;
  onCancel: () => void;
};

export function ProgramForm({ program, departments, onSubmit, onCancel }: ProgramFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const isEdit = Boolean(program);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    const departmentId = String(data.get("prog-department") ?? "");
    const code = String(data.get("prog-code") ?? "").trim().toUpperCase();
    const name = String(data.get("prog-name") ?? "").trim();
    const type = String(data.get("prog-type")) as ProgramType;
    const lengthYears = Number(data.get("prog-years"));

    const result = programSchema.safeParse({ departmentId, code, name, type, lengthYears });
    if (!result.success) {
      setError(result.error.issues[0].message);
      return;
    }

    const department = departments.find((d) => d.id === departmentId);
    if (!department) { setError("Select a department."); return; }

    setError(null);
    setIsLoading(true);
    try {
      await onSubmit({ ...result.data, departmentCode: department.code });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
      setIsLoading(false);
    }
  }

  const defaultDeptId = program?.departmentId ?? departments[0]?.id ?? "";

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
      <FormError message={error} />
      <Select id="prog-department" label="Department" defaultValue={defaultDeptId}>
        {departments.map((d) => (
          <option key={d.id} value={d.id}>
            {d.code} — {d.name}
          </option>
        ))}
      </Select>
      <div className="grid grid-cols-2 gap-3">
        <Input
          id="prog-code"
          label="Program Code"
          required
          placeholder="BSIS"
          defaultValue={program?.code ?? ""}
        />
        <Select id="prog-type" label="Type" defaultValue={program?.type ?? PROGRAM_TYPES[0]}>
          {PROGRAM_TYPES.map((t) => (
            <option key={t} value={t}>
              {PROGRAM_TYPE_LABELS[t]}
            </option>
          ))}
        </Select>
      </div>
      <Input
        id="prog-name"
        label="Program Name"
        required
        placeholder="Bachelor of Science in Information Systems"
        defaultValue={program?.name ?? ""}
      />
      <Input
        id="prog-years"
        label="Length (Years)"
        type="number"
        required
        min={1}
        max={6}
        defaultValue={program?.lengthYears ?? PROGRAM_TYPE_YEARS["bachelor"]}
      />
      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" block={false} onClick={onCancel}>
          Cancel
        </Button>
        <Button block={false} isLoading={isLoading} loadingLabel="Saving…">
          {isEdit ? "Save Changes" : "Add Program"}
        </Button>
      </div>
    </form>
  );
}
