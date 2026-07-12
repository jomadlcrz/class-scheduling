import { useState } from "react";
import { FormError } from "~/components/forms/form-error";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { studentAccountSchema } from "~/schemas/student.schema";
import type { CreateStudentAccountInput, StudentAccountRow } from "~/types/student";

type StudentAccountFormProps = {
  student: StudentAccountRow;
  onSubmit: (input: CreateStudentAccountInput) => Promise<void>;
  onCancel: () => void;
};

/** Creates the student login account on the backend (temp password emailed). */
export function StudentAccountForm({ student, onSubmit, onCancel }: StudentAccountFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const data = new FormData(e.currentTarget);

    const result = studentAccountSchema.safeParse({
      email: String(data.get("student-account-email") ?? "").trim(),
    });
    if (!result.success) {
      setError(result.error.issues[0].message);
      return;
    }

    setError(null);
    setIsLoading(true);
    try {
      await onSubmit({ email: result.data.email, roleName: "Student" });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
      setIsLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
      <FormError message={error} />

      <p className="text-sm text-slate-600 dark:text-slate-300">
        Create a login account for{" "}
        <span className="font-medium text-navy-700 dark:text-white">
          {student.lastName}, {student.firstName}
        </span>{" "}
        ({student.studentId}). A temporary password will be emailed.
      </p>

      <Input
        id="student-account-email"
        label="Email"
        type="email"
        required
        placeholder="Enter email address"
        defaultValue={student.email ?? ""}
      />

      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" block={false} onClick={onCancel}>
          Cancel
        </Button>
        <Button block={false} isLoading={isLoading} loadingLabel="Creating…">
          Create Account
        </Button>
      </div>
    </form>
  );
}
