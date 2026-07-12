import { useState } from "react";
import { FormError } from "~/components/forms/form-error";
import { Button } from "~/components/ui/button";
import { Checkbox } from "~/components/ui/checkbox";
import { Input } from "~/components/ui/input";
import { Select } from "~/components/ui/select";
import { studentSchema } from "~/schemas/student.schema";
import type { Program } from "~/types/program";
import type { ClassSet } from "~/types/set";
import type { Semester } from "~/types/semester";
import type { SchoolYearOption } from "~/services/school-year.service";
import type { CreateStudentRecordInput } from "~/types/student";
import type { Subject } from "~/types/subject";

type StudentRecordFormProps = {
  programs: Program[];
  sets: ClassSet[];
  subjects: Subject[];
  schoolYears: SchoolYearOption[];
  semesters: Semester[];
  /** Backend enum values (enumService). */
  studentTypes: string[];
  academicStatuses: string[];
  onSubmit: (input: CreateStudentRecordInput) => Promise<void>;
  onCancel: () => void;
};

/** Creates the student profile + academic record + enrolled subjects on the backend. */
export function StudentRecordForm({
  programs,
  sets,
  subjects,
  schoolYears,
  semesters,
  studentTypes,
  academicStatuses,
  onSubmit,
  onCancel,
}: StudentRecordFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Program, year level, and semester drive the set and subject choices.
  const [programId, setProgramId] = useState("");
  const [yearLevel, setYearLevel] = useState("");
  const [semId, setSemId] = useState("");

  const selectedProgram = programs.find((p) => String(p.id) === programId);
  const selectedSemester = semesters.find((s) => String(s.id) === semId);

  const yearOptions = Array.from(
    { length: selectedProgram?.lengthYears ?? 6 },
    (_, i) => i + 1,
  );

  const filteredSets = selectedProgram
    ? sets.filter(
        (s) =>
          s.program === selectedProgram.code &&
          (!yearLevel || String(s.yearLevel) === yearLevel),
      )
    : [];

  const filteredSubjects =
    selectedProgram && yearLevel && selectedSemester
      ? subjects.filter(
          (s) =>
            s.program === selectedProgram.code &&
            String(s.yearLevel) === yearLevel &&
            s.semester === selectedSemester.semesterNumber,
        )
      : [];

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const data = new FormData(e.currentTarget);

    const result = studentSchema.safeParse({
      studentId: String(data.get("student-id") ?? "").trim(),
      firstName: String(data.get("student-first-name") ?? "").trim(),
      midName: String(data.get("student-mid-name") ?? "").trim(),
      lastName: String(data.get("student-last-name") ?? "").trim(),
      mobile: String(data.get("student-mobile") ?? "").trim(),
      email: String(data.get("student-email") ?? "").trim(),
      programId,
      yearLevel,
      setId: String(data.get("student-set") ?? ""),
      studentType: String(data.get("student-type") ?? ""),
      enrolledStatus: String(data.get("student-status") ?? ""),
      syId: String(data.get("student-sy") ?? ""),
      semId,
      subjectIds: data.getAll("student-subjects").map(Number),
    });
    if (!result.success) {
      setError(result.error.issues[0].message);
      return;
    }

    setError(null);
    setIsLoading(true);
    try {
      await onSubmit({
        ...result.data,
        studentId: result.data.studentId || undefined,
        midName: result.data.midName || undefined,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
      setIsLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
      <FormError message={error} />

      <div className="grid gap-6 sm:grid-cols-2">
        <div className="flex flex-col gap-4">
          <Input
            id="student-id"
            label="Student ID"
            type="text"
            placeholder="Leave blank to auto-assign"
            maxLength={50}
          />

          <div className="grid grid-cols-2 gap-3">
            <Input id="student-first-name" label="First Name" type="text" required placeholder="Enter first name" />
            <Input id="student-mid-name" label="Middle Name" type="text" placeholder="Enter middle name" />
          </div>

          <Input id="student-last-name" label="Last Name" type="text" required placeholder="Enter last name" />

          <Input
            id="student-email"
            label="Email"
            type="email"
            required
            placeholder="Enter email address"
          />

          <Input
            id="student-mobile"
            label="Mobile Number"
            type="text"
            inputMode="tel"
            maxLength={16}
            required
            placeholder="Enter mobile number"
            onInput={(e) => {
              e.currentTarget.value = e.currentTarget.value.replace(/(?!^\+)[^0-9]/g, "").slice(0, 16);
            }}
          />

          <div className="grid grid-cols-2 gap-3">
            <Select id="student-type" label="Student Type" defaultValue="" required>
              <option value="">Select a type</option>
              {studentTypes.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </Select>
            <Select id="student-status" label="Enrolled Status" defaultValue="" required>
              <option value="">Select a status</option>
              {academicStatuses.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </Select>
          </div>
        </div>

        <div className="flex flex-col gap-4">
          <Select
            id="student-program"
            label="Program"
            value={programId}
            onChange={(e) => setProgramId(e.target.value)}
            required
          >
            <option value="">Select a program</option>
            {programs.map((p) => (
              <option key={p.id} value={p.id}>
                {p.code} — {p.name}
              </option>
            ))}
          </Select>

          <div className="grid grid-cols-2 gap-3">
            <Select
              id="student-year"
              label="Year Level"
              value={yearLevel}
              onChange={(e) => setYearLevel(e.target.value)}
              required
            >
              <option value="">Select a year</option>
              {yearOptions.map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </Select>
            <Select
              id="student-set"
              key={`${programId}|${yearLevel}`}
              label="Set"
              defaultValue=""
              required
            >
              <option value="">Select a set</option>
              {filteredSets.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.setCode}
                </option>
              ))}
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Select id="student-sy" label="School Year" defaultValue="" required>
              <option value="">Select a school year</option>
              {schoolYears.map((sy) => (
                <option key={sy.id} value={sy.id}>
                  {sy.schoolYear}
                </option>
              ))}
            </Select>
            <Select
              id="student-sem"
              label="Semester"
              value={semId}
              onChange={(e) => setSemId(e.target.value)}
              required
            >
              <option value="">Select a semester</option>
              {semesters.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.semester}
                </option>
              ))}
            </Select>
          </div>

          <div>
            <span className="font-body text-sm text-slate-600 dark:text-slate-300">
              Enrolled Subjects
            </span>
            <div
              key={`${programId}|${yearLevel}|${semId}`}
              className="mt-1 flex max-h-48 flex-col gap-2 overflow-y-auto rounded-lg border border-slate-200 p-3 dark:border-white/10"
            >
              {filteredSubjects.length === 0 ? (
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  {selectedProgram && yearLevel && semId
                    ? "No curriculum subjects found for this program, year, and semester."
                    : "Select a program, year level, and semester to list subjects."}
                </p>
              ) : (
                filteredSubjects.map((s) => (
                  <Checkbox
                    key={s.id}
                    id={`student-subject-${s.id}`}
                    name="student-subjects"
                    value={String(s.id)}
                    label={`${s.code} — ${s.title} (${s.units} units)`}
                  />
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" block={false} onClick={onCancel}>
          Cancel
        </Button>
        <Button block={false} isLoading={isLoading} loadingLabel="Saving…">
          Add Student
        </Button>
      </div>
    </form>
  );
}
