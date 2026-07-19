import { useEffect, useState } from "react";
import { FormError } from "~/components/forms/form-error";
import { Button } from "~/components/ui/button";
import { Checkbox } from "~/components/ui/checkbox";
import { FieldChrome, Input } from "~/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "~/components/ui/select";
import { useYearLevels } from "~/hooks/use-year-levels";
import { studentSchema } from "~/schemas/student.schema";
import type { SchoolYearOption } from "~/services/school-year.service";
import type { Program } from "~/types/program";
import type { Semester } from "~/types/semester";
import type { ClassSet } from "~/types/set";
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
  const { yearLevelIds, yearLevelLabel } = useYearLevels();

  // Program, year level, and semester drive the set and subject choices.
  const [programId, setProgramId] = useState("");
  const [yearLevel, setYearLevel] = useState("");
  const [semId, setSemId] = useState("");
  const [enrolledStatus, setEnrolledStatus] = useState("");
  const [selectedSubjectIds, setSelectedSubjectIds] = useState<Set<number>>(new Set());

  const selectedProgram = programs.find((p) => String(p.id) === programId);
  const selectedSemester = semesters.find((s) => String(s.id) === semId);
  const isIrregular = enrolledStatus === "Irregular";

  const yearOptions = yearLevelIds.filter(
    (y) => y <= (selectedProgram?.lengthYears ?? 6),
  );

  const filteredSets = selectedProgram
    ? sets.filter(
        (s) =>
          s.program === selectedProgram.code &&
          (!yearLevel || String(s.yearLevel) === yearLevel),
      )
    : [];

  // Irregular students can take subjects from multiple year levels within
  // the same semester (a semester is still one fixed academic term), so the
  // picker drops the year-level filter but keeps the semester one.
  const filteredSubjects = !selectedProgram || !selectedSemester
    ? []
    : isIrregular
      ? subjects.filter(
          (s) =>
            s.program === selectedProgram.code &&
            s.semester === selectedSemester.semesterNumber,
        )
      : yearLevel
        ? subjects.filter(
            (s) =>
              s.program === selectedProgram.code &&
              String(s.yearLevel) === yearLevel &&
              s.semester === selectedSemester.semesterNumber,
          )
        : [];

  // Subject choices change with program/year/semester/status; drop stale selections.
  useEffect(() => {
    setSelectedSubjectIds(new Set());
  }, [programId, yearLevel, semId, enrolledStatus]);

  const allSubjectsSelected =
    filteredSubjects.length > 0 && filteredSubjects.every((s) => selectedSubjectIds.has(s.id));

  function toggleSubject(subjectId: number, checked: boolean) {
    setSelectedSubjectIds((prev) => {
      const next = new Set(prev);
      if (checked) next.add(subjectId);
      else next.delete(subjectId);
      return next;
    });
  }

  function toggleSelectAll(checked: boolean) {
    setSelectedSubjectIds(checked ? new Set(filteredSubjects.map((s) => s.id)) : new Set());
  }

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
      enrolledStatus,
      syId: String(data.get("student-sy") ?? ""),
      semId,
      subjectIds: Array.from(selectedSubjectIds),
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
            placeholder="Leave blank if not available"
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
            <FieldChrome id="student-type" label="Student Type" required>
              <Select
                items={[{ value: "", label: "Select a type" }, ...studentTypes.map((t) => ({ value: t, label: t }))]}
                name="student-type"
                defaultValue=""
              >
                <SelectTrigger id="student-type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Select a type</SelectItem>
                  {studentTypes.map((t) => (
                    <SelectItem key={t} value={t}>
                      {t}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FieldChrome>
            <FieldChrome id="student-status" label="Enrolled Status" required>
              <Select
                items={[
                  { value: "", label: "Select a status" },
                  ...academicStatuses.map((s) => ({ value: s, label: s })),
                ]}
                name="student-status"
                value={enrolledStatus}
                onValueChange={(v) => setEnrolledStatus(v as string)}
              >
                <SelectTrigger id="student-status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Select a status</SelectItem>
                  {academicStatuses.map((s) => (
                    <SelectItem key={s} value={s}>
                      {s}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FieldChrome>
          </div>
        </div>

        <div className="flex flex-col gap-4">
          <FieldChrome id="student-program" label="Program" required>
            <Select
              items={[
                { value: "", label: "Select a program" },
                ...programs.map((p) => ({ value: String(p.id), label: `${p.code} — ${p.name}` })),
              ]}
              name="student-program"
              value={programId}
              onValueChange={(v) => setProgramId(v as string)}
            >
              <SelectTrigger id="student-program">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Select a program</SelectItem>
                {programs.map((p) => (
                  <SelectItem key={p.id} value={String(p.id)}>
                    {p.code} — {p.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FieldChrome>

          <div className="grid grid-cols-2 gap-3">
            <FieldChrome id="student-year" label="Year Level" required>
              <Select
                items={[
                  { value: "", label: "Select a year" },
                  ...yearOptions.map((y) => ({ value: String(y), label: yearLevelLabel(y) })),
                ]}
                name="student-year"
                value={yearLevel}
                onValueChange={(v) => setYearLevel(v as string)}
              >
                <SelectTrigger id="student-year">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Select a year</SelectItem>
                  {yearOptions.map((y) => (
                    <SelectItem key={y} value={String(y)}>
                      {yearLevelLabel(y)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FieldChrome>
            <FieldChrome id="student-set" label="Set" required>
              <Select
                items={[
                  { value: "", label: "Select a set" },
                  ...filteredSets.map((s) => ({ value: String(s.id), label: s.setCode })),
                ]}
                name="student-set"
                key={`${programId}|${yearLevel}`}
                defaultValue=""
              >
                <SelectTrigger id="student-set">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Select a set</SelectItem>
                  {filteredSets.map((s) => (
                    <SelectItem key={s.id} value={String(s.id)}>
                      {s.setCode}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FieldChrome>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <FieldChrome id="student-sy" label="School Year" required>
              <Select
                items={[
                  { value: "", label: "Select a school year" },
                  ...schoolYears.map((sy) => ({ value: String(sy.id), label: sy.schoolYear })),
                ]}
                name="student-sy"
                defaultValue=""
              >
                <SelectTrigger id="student-sy">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Select a school year</SelectItem>
                  {schoolYears.map((sy) => (
                    <SelectItem key={sy.id} value={String(sy.id)}>
                      {sy.schoolYear}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FieldChrome>
            <FieldChrome id="student-sem" label="Semester" required>
              <Select
                items={[
                  { value: "", label: "Select a semester" },
                  ...semesters.map((s) => ({ value: String(s.id), label: s.semester })),
                ]}
                name="student-sem"
                value={semId}
                onValueChange={(v) => setSemId(v as string)}
              >
                <SelectTrigger id="student-sem">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Select a semester</SelectItem>
                  {semesters.map((s) => (
                    <SelectItem key={s.id} value={String(s.id)}>
                      {s.semester}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FieldChrome>
          </div>

          <div>
            <div className="flex items-center justify-between">
              <span className="font-body text-sm text-slate-600 dark:text-slate-300">
                Enrolled Subjects
              </span>
              {filteredSubjects.length > 0 && (
                <Checkbox
                  id="student-subjects-select-all"
                  label="Select All"
                  checked={allSubjectsSelected}
                  onChange={toggleSelectAll}
                />
              )}
            </div>
            <div className="mt-1 flex max-h-48 flex-col gap-2 overflow-y-auto rounded-lg border border-slate-200 p-3 dark:border-white/10">
              {filteredSubjects.length === 0 ? (
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  {selectedProgram && semId && (isIrregular || yearLevel)
                    ? isIrregular
                      ? "No curriculum subjects found for this program and semester."
                      : "No curriculum subjects found for this program, year, and semester."
                    : "Select a program, year level, and semester to list subjects."}
                </p>
              ) : (
                filteredSubjects.map((s) => (
                  <Checkbox
                    key={s.id}
                    id={`student-subject-${s.id}`}
                    label={`${s.code} — ${s.title} (${s.units} units)`}
                    checked={selectedSubjectIds.has(s.id)}
                    onChange={(checked) => toggleSubject(s.id, checked)}
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
