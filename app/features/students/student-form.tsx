import { useState } from "react";
import { FormError } from "../../components/forms/form-error";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Select } from "../../components/ui/select";
import { studentSchema } from "../../schemas/student.schema";
import type { CreateStudentInput, Student } from "../../types/student";
import { STUDENT_STATUSES, STUDENT_STATUS_LABELS } from "../../types/student";
import type { Program } from "../../types/program";
import { YEAR_LEVELS, YEAR_LEVEL_LABELS } from "../../types/subject";

type StudentFormProps = {
  student?: Student;
  programs: Program[];
  onSubmit: (input: CreateStudentInput) => Promise<void>;
  onCancel: () => void;
};

export function StudentForm({ student, programs, onSubmit, onCancel }: StudentFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const data = new FormData(e.currentTarget);

    const input: CreateStudentInput = {
      studentNumber: String(data.get("studentNumber") ?? "").trim(),
      firstName: String(data.get("firstName") ?? "").trim(),
      lastName: String(data.get("lastName") ?? "").trim(),
      email: String(data.get("email") ?? "").trim(),
      program: String(data.get("program") ?? ""),
      yearLevel: Number(data.get("yearLevel")) as CreateStudentInput["yearLevel"],
      setCode: String(data.get("setCode") ?? "").trim().toUpperCase(),
      status: String(data.get("status") ?? "enrolled") as CreateStudentInput["status"],
    };

    const result = studentSchema.safeParse(input);
    if (!result.success) {
      setError(result.error.issues[0].message);
      return;
    }

    setError(null);
    setIsLoading(true);
    try {
      await onSubmit(result.data as CreateStudentInput);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <FormError message={error} />

      <div className="grid grid-cols-2 gap-3">
        <Input
          id="firstName"
          label="First Name"
          placeholder="e.g. Maria"
          defaultValue={student?.firstName}
          required
        />
        <Input
          id="lastName"
          label="Last Name"
          placeholder="e.g. Santos"
          defaultValue={student?.lastName}
          required
        />
      </div>

      <Input
        id="studentNumber"
        label="Student Number"
        placeholder="e.g. 2024-001"
        defaultValue={student?.studentNumber}
        required
      />

      <Input
        id="email"
        label="Email"
        type="email"
        placeholder="e.g. m.santos@gwc.edu.ph"
        defaultValue={student?.email}
        required
      />

      <Select id="program" label="Program" defaultValue={student?.program ?? ""}>
        <option value="">Select a program…</option>
        {programs.map((p) => (
          <option key={p.id} value={p.code}>
            {p.code} — {p.name}
          </option>
        ))}
      </Select>

      <div className="grid grid-cols-2 gap-3">
        <Select id="yearLevel" label="Year Level" defaultValue={student?.yearLevel ?? 1}>
          {YEAR_LEVELS.map((y) => (
            <option key={y} value={y}>
              {YEAR_LEVEL_LABELS[y]}
            </option>
          ))}
        </Select>
        <Input
          id="setCode"
          label="Section"
          placeholder="e.g. A"
          defaultValue={student?.setCode}
          required
        />
      </div>

      <Select id="status" label="Status" defaultValue={student?.status ?? "enrolled"}>
        {STUDENT_STATUSES.map((s) => (
          <option key={s} value={s}>
            {STUDENT_STATUS_LABELS[s]}
          </option>
        ))}
      </Select>

      <div className="flex gap-2 pt-1">
        <Button type="submit" block={false} isLoading={isLoading} loadingLabel="Saving…">
          {student ? "Save Changes" : "Add Student"}
        </Button>
        <Button type="button" block={false} variant="outline" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </form>
  );
}
