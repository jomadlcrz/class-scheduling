import { useState } from "react";
import { FormError } from "~/components/forms/form-error";
import { Button } from "~/components/ui/button";
import { FieldChrome, Input, inputClassName } from "~/components/ui/input";
import { Select } from "~/components/ui/select";
import { programSchema } from "~/schemas/program.schema";
import type { Department } from "~/types/department";
import type { CreateProgramInput, Program } from "~/types/program";
import { PROGRAM_TYPE_YEARS, PROGRAM_TYPES } from "~/types/program";

type ProgramFormProps = {
  program?: Program;
  departments: Department[];
  onSubmit: (input: CreateProgramInput) => Promise<void>;
  onCancel: () => void;
};

export function ProgramForm({ program, departments, onSubmit, onCancel }: ProgramFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedType, setSelectedType] = useState<string>(program?.type ?? PROGRAM_TYPES[0]);
  const isEdit = Boolean(program);
  const computedYears = PROGRAM_TYPE_YEARS[selectedType] ?? program?.lengthYears ?? 4;

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    // The backend links programs to departments by name; not updatable afterwards.
    const departmentName = isEdit
      ? departments.find((d) => d.code === program!.departmentCode)?.name ?? "unchanged"
      : String(data.get("prog-department") ?? "");
    const code = String(data.get("prog-code") ?? "").trim().toUpperCase();
    const name = String(data.get("prog-name") ?? "").trim();
    const type = String(data.get("prog-type") ?? "");
    const lengthYears = PROGRAM_TYPE_YEARS[type] ?? computedYears;

    const result = programSchema.safeParse({ departmentName, code, name, type, lengthYears });
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

  const defaultDeptName =
    departments.find((d) => d.code === program?.departmentCode)?.name ??
    departments[0]?.name ??
    "";

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
      <FormError message={error} />
      <Select
        id="prog-department"
        label="Department"
        defaultValue={defaultDeptName}
        disabled={isEdit}
        hint={isEdit ? "The department can't be changed after creation." : undefined}
      >
        {departments.map((d) => (
          <option key={d.id} value={d.name}>
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
        <Select
          id="prog-type"
          label="Type"
          defaultValue={program?.type ?? PROGRAM_TYPES[0]}
          onChange={(e) => setSelectedType(e.target.value)}
        >
          {PROGRAM_TYPES.map((t) => (
            <option key={t} value={t}>
              {t}
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
      <FieldChrome id="prog-years" label="Length (Years)">
        <input
          id="prog-years"
          name="prog-years"
          type="number"
          value={computedYears}
          readOnly
          className={`${inputClassName} read-only:cursor-default read-only:bg-slate-100 read-only:dark:bg-white/10`}
        />
      </FieldChrome>
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
